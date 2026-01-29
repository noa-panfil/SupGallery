import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse('Non autorisé', { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id);
    const userId = parseInt(session.user.id);

    try {
        // Check if already liked
        const [existing] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM likes WHERE userId = ? AND postId = ?',
            [userId, postId]
        );

        let liked = false;

        if (existing.length > 0) {
            // Unlike
            await pool.execute('DELETE FROM likes WHERE userId = ? AND postId = ?', [userId, postId]);
            liked = false;
        } else {
            // Like
            await pool.execute('INSERT INTO likes (userId, postId) VALUES (?, ?)', [userId, postId]);
            liked = true;
        }

        return NextResponse.json({ liked });

    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
