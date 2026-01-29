import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
        return new NextResponse('Champs manquants', { status: 400 });
    }

    // Domain Validation
    if (!email.endsWith('@supinfo.com')) {
        return new NextResponse('L\'email doit finir par @supinfo.com', { status: 400 });
    }

    // Pseudo Validation checks (optional but good practice)
    if (name.length < 3) {
        return new NextResponse('Le pseudo doit faire au moins 3 caractères', { status: 400 });
    }

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );

        if (rows.length > 0) {
            return NextResponse.json({ message: 'Cet email existe déjà' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Auto-Admin Logic REMOVED based on user request.
        // All new users are NOT admin and NOT approved by default.
        const isAdmin = false;
        const isApproved = false;

        const [insertResult] = await pool.execute<ResultSetHeader>(
            'INSERT INTO users (name, email, password, isAdmin, isApproved) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, isAdmin, isApproved]
        );

        return NextResponse.json({
            id: insertResult.insertId,
            name,
            email,
            isAdmin,
            isApproved
        });

    } catch (error) {
        console.error(error);
        return new NextResponse('Erreur Interne', { status: 500 });
    }
}
