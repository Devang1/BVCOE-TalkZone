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

      // Split into words while keeping newlines
      const tokens = cleaned.split(/(\s+)/); // keeps whitespace (\n, spaces, tabs) as tokens
      let wordCount = 0;
      let limitedTokens = [];

      for (let token of tokens) {
        if (/\s+/.test(token)) {
          // whitespace or newline → always keep
          limitedTokens.push(token);
        } else {
          // it's a word
          if (wordCount < 500) {
            limitedTokens.push(token);
            wordCount++;
          } else {
            break;
          }
        }
      }

      croppedText = limitedTokens.join("");
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
