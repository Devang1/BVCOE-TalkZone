// app/api/check-nickname/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { classname, year, nickname } = body;
    console.log("Check nickname request:", classname, year, nickname);
    if (!nickname || typeof nickname !== 'string') {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    if (!classname || !year) {
      return NextResponse.json(
        { error: 'Classname and year are required' },
        { status: 400 }
      );
    }

    // 🔹 Step 1: Get class id
    const classResult = await pool.query(
      `SELECT id FROM class_passwords WHERE class_name=$1 AND year=$2 LIMIT 1`,
      [classname, year]
    );

    if (!classResult.rows.length) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    const classId = classResult.rows[0].id;

    // 🔹 Step 2: Check nickname existence
    const nickResult = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM messages 
        WHERE class_id=$1 AND sender=$2
      ) AS exists`,
      [classId, nickname.trim()]
    );

    const exists = nickResult.rows[0].exists;

    return NextResponse.json({
      success: true,
      exists,
      message: exists ? 'Nickname already taken' : 'Nickname available',
    });

  } catch (error) {
    console.error("Check nickname error:", error);
    return NextResponse.json(
      { error: 'Server error checking nickname' },
      { status: 500 }
    );
  }
}
