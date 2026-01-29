import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { writeFile } from 'fs/promises';
import path from 'path';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort'); // 'latest' (default) or 'top'
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;

    try {
        let orderBy = 'p.createdAt DESC';
        if (sort === 'top') {
            orderBy = 'likeCount DESC, p.createdAt DESC';
        }

        // Query to get posts along with comment counts AND like counts
        // Also checking if the current user liked the post
        const query = `
        SELECT 
            p.id, p.title, p.description, p.mediaUrl, p.mediaType, p.createdAt,
            u.name as userName, u.image as userImage,
            COUNT(DISTINCT c.id) as commentCount,
            COUNT(DISTINCT l.userId) as likeCount,
            ${currentUserId ? `MAX(CASE WHEN l.userId = ${currentUserId} THEN 1 ELSE 0 END) as isLiked` : '0 as isLiked'}
        FROM posts p
        JOIN users u ON p.userId = u.id
        LEFT JOIN comments c ON p.id = c.postId
        LEFT JOIN likes l ON p.id = l.postId
        GROUP BY p.id
        ORDER BY ${orderBy}
      `;

        const [rows] = await pool.execute<RowDataPacket[]>(query);

        const postsWithTags = await Promise.all(rows.map(async (post) => {
            const [tags] = await pool.execute<RowDataPacket[]>(
                'SELECT t.name FROM tags t JOIN post_tags pt ON t.id = pt.tagId WHERE pt.postId = ?',
                [post.id]
            );

            return {
                id: post.id,
                title: post.title,
                description: post.description,
                mediaUrl: post.mediaUrl,
                mediaType: post.mediaType,
                createdAt: post.createdAt,
                user: {
                    name: post.userName,
                    image: post.userImage
                },
                _count: {
                    comments: post.commentCount,
                    likes: post.likeCount
                },
                isLiked: !!post.isLiked,
                tags: tags.map(t => ({ name: t.name }))
            };
        }));

        return NextResponse.json(postsWithTags);
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tagsInput = formData.get('tags') as string;

        if (!file) {
            return new NextResponse('No file uploaded', { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const mediaType = file.type.startsWith('video') ? 'VIDEO' : 'IMAGE';
        const userId = parseInt(session.user.id);

        // Insert into database with mediaData
        const [postResult] = await pool.execute<ResultSetHeader>(
            'INSERT INTO posts (title, description, mediaUrl, mediaType, userId, mediaData) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, '', mediaType, userId, buffer]
        );

        const postId = postResult.insertId;
        const mediaUrl = `/api/media/posts/${postId}`;

        // Update with the virtual URL
        await pool.execute('UPDATE posts SET mediaUrl = ? WHERE id = ?', [mediaUrl, postId]);

        // Handle Tags
        const tagsList = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

        for (const tagName of tagsList) {
            let tagId;
            const [existingTags] = await pool.execute<RowDataPacket[]>('SELECT id FROM tags WHERE name = ?', [tagName]);

            if (existingTags.length > 0) {
                tagId = existingTags[0].id;
            } else {
                const [tagResult] = await pool.execute<ResultSetHeader>('INSERT INTO tags (name) VALUES (?)', [tagName]);
                tagId = tagResult.insertId;
            }
            await pool.execute('INSERT IGNORE INTO post_tags (postId, tagId) VALUES (?, ?)', [postId, tagId]);
        }

        return NextResponse.json({ id: postId, message: 'Created' });

    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
