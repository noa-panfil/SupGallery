import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const postId = parseInt(id);

    try {
        const [comments] = await pool.execute<RowDataPacket[]>(
            `SELECT c.id, c.content, c.mediaUrl, c.mediaType, c.createdAt, u.name as userName, u.image as userImage 
         FROM comments c
         JOIN users u ON c.userId = u.id
         WHERE c.postId = ?
         ORDER BY c.createdAt ASC`,
            [postId]
        );

        const formattedComments = comments.map(c => ({
            id: c.id,
            content: c.content,
            mediaUrl: c.mediaUrl,
            mediaType: c.mediaType,
            createdAt: c.createdAt,
            user: {
                name: c.userName,
                image: c.userImage
            }
        }));

        return NextResponse.json(formattedComments);

    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id);
    const userId = parseInt(session.user.id);

    try {
        const contentType = request.headers.get('content-type') || '';
        let content = '';
        let mediaUrl: string | null = null;
        let mediaType = 'TEXT';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            content = formData.get('content') as string || '';
            const file = formData.get('file') as File | null;
            const gifUrl = formData.get('gifUrl') as string | null;

            if (file) {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                mediaType = 'IMAGE';

                // Insert first to get ID
                const [result] = await pool.execute<ResultSetHeader>(
                    'INSERT INTO comments (content, mediaUrl, mediaType, postId, userId, mediaData) VALUES (?, ?, ?, ?, ?, ?)',
                    [content, '', mediaType, postId, userId, buffer]
                );

                const commentId = result.insertId;
                mediaUrl = `/api/media/comments/${commentId}`;

                // Update with virtual URL
                await pool.execute('UPDATE comments SET mediaUrl = ? WHERE id = ?', [mediaUrl, commentId]);

                return NextResponse.json({
                    id: commentId,
                    content,
                    mediaUrl,
                    mediaType,
                    user: {
                        name: session.user.name,
                        image: session.user.image
                    }
                });

            } else if (gifUrl) {
                mediaUrl = gifUrl;
                mediaType = 'GIF';
            }

        } else { // JSON fallback
            const json = await request.json();
            content = json.content || '';
        }

        if (!content && !mediaUrl) {
            return new NextResponse('Empty comment', { status: 400 });
        }

        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO comments (content, mediaUrl, mediaType, postId, userId) VALUES (?, ?, ?, ?, ?)',
            [content, mediaUrl, mediaType, postId, userId]
        );

        return NextResponse.json({
            id: result.insertId,
            content,
            mediaUrl,
            mediaType,
            user: {
                name: session.user.name,
                image: session.user.image
            }
        });

    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
