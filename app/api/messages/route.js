export async function POST(request) {
  try {
    const body = await request.json();
    const { classId, text, imageUrl } = body;

    if (!classId) {
      return NextResponse.json({ error: 'classId required' }, { status: 400 });
    }

    let croppedText = null;
    if (text) {
      // Simple approach: split by words and rejoin with original whitespace
      const words = text.split(/\b/); // Split at word boundaries to preserve whitespace
      
      if (words.length > 500) {
        // Take first 500 words and join them back
        croppedText = words.slice(0, 500).join('');
      } else {
        croppedText = text; // Keep original if under limit
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
