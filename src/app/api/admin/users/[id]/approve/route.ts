import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    try {
        await pool.execute('UPDATE users SET isApproved = 1 WHERE id = ?', [userId]);
        return NextResponse.json({ message: 'User approved' });
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return new NextResponse('Use DELETE on /api/admin/users/[id]', { status: 405 });
}
