import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const commentId = parseInt(id);

    try {
        // Check if user is admin or owner of the comment
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT userId FROM comments WHERE id = ?',
            [commentId]
        );

        if (rows.length === 0) {
            return new NextResponse('Comment not found', { status: 404 });
        }

        const isOwner = rows[0].userId === parseInt(session.user.id);
        const isAdmin = session.user.isAdmin;

        if (!isOwner && !isAdmin) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        await pool.execute('DELETE FROM comments WHERE id = ?', [commentId]);

        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
