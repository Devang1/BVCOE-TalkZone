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

    // Crop message text to 500 words (but don't modify spaces/newlines at all)
    let croppedText = null;
    if (text) {
      const tokens = text.split(/(\s+)/); // split but preserve whitespace & newlines
      let wordCount = 0;
      let limitedTokens = [];

      for (let token of tokens) {
        if (/\s+/.test(token)) {
          // whitespace/newline → always keep
          limitedTokens.push(token);
        } else if (token.length > 0) {
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

      // Optional: add ellipsis if truncated
      if (wordCount >= 500) {
        croppedText += "...";
      }
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
