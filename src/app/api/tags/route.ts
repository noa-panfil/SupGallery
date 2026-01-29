import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [tags] = await pool.execute<RowDataPacket[]>(`
      SELECT t.name, COUNT(pt.postId) as count 
      FROM tags t 
      LEFT JOIN post_tags pt ON t.id = pt.tagId 
      GROUP BY t.id 
      ORDER BY count DESC 
      LIMIT 20
    `);

        return NextResponse.json(tags);
    } catch (error) {
        console.error(error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
