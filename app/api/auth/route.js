// app/api/auth/route.js
import { NextResponse } from 'next/server';
import {pool} from '@/lib/db'; // ensure this points to your PostgreSQL pool

export async function POST(request) {
  try {
    const { year, className, password } = await request.json();

    if (!year || !className || !password) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT password FROM class_passwords WHERE year = $1 AND class_name = $2',
      [year, className]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    const storedPassword = result.rows[0].password;

    if (storedPassword === password) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'Incorrect password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const className = searchParams.get('className');

    if (!year || !className) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT id FROM class_passwords WHERE year = $1 AND class_name = $2',
      [year, className]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: 'Class not found' }, { status: 404 });
    }

    const classId = result.rows[0].id;

    return NextResponse.json({ success: true, classId });
  } catch (error) {
    console.error('Get Class ID Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
