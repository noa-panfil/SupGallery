import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { RowDataPacket } from 'mysql2';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const postId = parseInt(id);
    const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;

    try {
        const query = `
            SELECT 
                p.id, p.title, p.description, p.mediaUrl, p.mediaType, p.createdAt,
                u.name as userName, u.image as userImage,
                COUNT(DISTINCT l.userId) as likeCount,
                ${currentUserId ? `MAX(CASE WHEN l.userId = ${currentUserId} THEN 1 ELSE 0 END) as isLiked` : '0 as isLiked'}
            FROM posts p
            JOIN users u ON p.userId = u.id
            LEFT JOIN likes l ON p.id = l.postId
            WHERE p.id = ?
            GROUP BY p.id
        `;

        const [rows] = await pool.execute<RowDataPacket[]>(query, [postId]);

        if (rows.length === 0) {
            return new NextResponse('Post not found', { status: 404 });
        }

        const post = rows[0];

        // Fetch tags
        const [tags] = await pool.execute<RowDataPacket[]>(
            'SELECT t.name FROM tags t JOIN post_tags pt ON t.id = pt.tagId WHERE pt.postId = ?',
            [postId]
        );

        const postData = {
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
                likes: post.likeCount
            },
            isLiked: !!post.isLiked,
            tags: tags.map(t => ({ name: t.name }))
        };

        return NextResponse.json(postData);

    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id);

    try {
        // Check if user is admin or owner
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT userId FROM posts WHERE id = ?',
            [postId]
        );

        if (rows.length === 0) {
            return new NextResponse('Post not found', { status: 404 });
        }

        const isOwner = rows[0].userId === parseInt(session.user.id);
        const isAdmin = session.user.isAdmin;

        if (!isOwner && !isAdmin) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Delete post (comments and likes will be deleted automatically due to CASCADE in DB)
        await pool.execute('DELETE FROM posts WHERE id = ?', [postId]);

        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
