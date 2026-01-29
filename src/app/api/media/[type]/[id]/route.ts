import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ type: string; id: string }> }
) {
    const { type, id } = await params;

    try {
        let query = '';
        if (type === 'posts') {
            query = 'SELECT mediaData as data, mediaType FROM posts WHERE id = ?';
        } else if (type === 'comments') {
            query = 'SELECT mediaData as data, mediaType FROM comments WHERE id = ?';
        } else if (type === 'users') {
            query = 'SELECT imageData as data, "IMAGE" as mediaType FROM users WHERE id = ?';
        } else {
            return new NextResponse('Invalid Type', { status: 400 });
        }

        const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);

        if (rows.length === 0 || !rows[0].data) {
            return new NextResponse('Not Found', { status: 404 });
        }

        const data = rows[0].data;
        const mediaType = rows[0].mediaType;

        let contentType = 'image/jpeg';
        if (mediaType === 'VIDEO') contentType = 'video/mp4';
        if (mediaType === 'GIF') contentType = 'image/gif';

        return new Response(data, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving media:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
