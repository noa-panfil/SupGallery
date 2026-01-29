import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { writeFile } from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return new NextResponse('Non autorisé', { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const password = formData.get('password') as string;
        const userId = parseInt(session.user.id);

        const updates = [];
        const values = [];

        // 1. Handle Password Update
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        // 2. Handle Image Upload
        if (file) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const imageUrl = `/api/media/users/${userId}`;

            updates.push('image = ?');
            values.push(imageUrl);
            updates.push('imageData = ?');
            values.push(buffer);
        }

        if (updates.length === 0) {
            return new NextResponse('Aucune modification détectée', { status: 400 });
        }

        // Add userId to values
        values.push(userId);

        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await pool.execute(query, values);

        return NextResponse.json({ message: 'Profil mis à jour' });

    } catch (error) {
        console.error(error);
        return new NextResponse('Erreur Interne', { status: 500 });
    }
}
