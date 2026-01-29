import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Check if user is trying to delete themselves
    if (session.user.id == id) {
        return new NextResponse('Cannot delete yourself', { status: 400 });
    }

    try {
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        return NextResponse.json({ message: 'User deleted' });
    } catch (error) {
        console.error(error);
        return new NextResponse('Error deleting user', { status: 500 });
    }
}
