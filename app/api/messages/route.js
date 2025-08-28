// app/api/messages/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

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
  try {
    const body = await request.json();
    const { classId, text, imageUrl } = body;

    if (!classId) {
      return NextResponse.json({ error: 'classId required' }, { status: 400 });
    }

    // Crop message text to 500 words (preserve newlines)
    let croppedText = null;
    if (text) {
      // Normalize spaces but keep \n intact
      const cleaned = text
        .replace(/[ \t]+/g, " ")     // collapse spaces/tabs
        .replace(/ *\n */g, "\n");   // trim spaces around newlines

      // Count words ignoring newlines
      let words = cleaned.split(/\s+/).filter(Boolean);
      if (words.length > 500) {
        words = words.slice(0, 500);
      }

      // Reconstruct text with preserved newlines
      const regex = new RegExp(
        words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
        "g"
      );
      croppedText = cleaned.match(regex)?.join(" ") || cleaned;
    }

    const result = await pool.query(
      `INSERT INTO messages (class_id, text, image_url, sender, timestamp)
       VALUES ($1, $2, $3, 'user', NOW()) RETURNING *`,
      [classId, croppedText, imageUrl || null]
    );

    return NextResponse.json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error("POST /api/messages Error:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
