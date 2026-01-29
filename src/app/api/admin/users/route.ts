import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.isAdmin) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const [users] = await pool.execute<RowDataPacket[]>(
            'SELECT id, name, email, isApproved, createdAt FROM users ORDER BY createdAt DESC'
        );

        // Ensure booleans are correct type for frontend
        const formatedUsers = users.map(u => ({
            ...u,
            isApproved: Boolean(u.isApproved)
        }));

        return NextResponse.json(formatedUsers);
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
