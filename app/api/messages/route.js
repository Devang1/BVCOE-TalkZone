// app/api/messages/route.js
import { NextResponse } from 'next/server';
import {pool} from '@/lib/db';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  if (!classId) {
    return NextResponse.json({ error: 'classId required' }, { status: 400 });
  }

  const result = await pool.query(
    'SELECT * FROM messages WHERE class_id = $1 ORDER BY timestamp ASC',
    [classId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(request) {
  const body = await request.json();
  const { classId, text, imageUrl } = body;

  const result = await pool.query(
    `INSERT INTO messages (class_id, text, image_url, sender, timestamp)
     VALUES ($1, $2, $3, 'user', NOW()) RETURNING *`,
    [classId, text || null, imageUrl || null]
  );
  return NextResponse.json({ success: true, message: result.rows[0] });
}
