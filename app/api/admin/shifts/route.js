// app/api/admin/shifts/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const result = await db.execute({
      sql: `
        SELECT
          s.id, s.clock_in, s.clock_out, s.opening_cash, s.closing_cash, s.notes, s.created_at,
          u.full_name AS user_name,
          r.display_name AS user_role
        FROM shifts s
        JOIN users u ON u.id = s.user_id
        JOIN roles r ON r.id = u.role_id
        ORDER BY s.clock_in DESC
        LIMIT 200
      `,
      args: [],
    });
    return NextResponse.json({ shifts: result.rows });
  } catch (err) {
    console.error("[shifts/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch shifts." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { opening_cash, notes } = await req.json();
    const insert = await db.execute({
      sql: `INSERT INTO shifts (user_id, opening_cash, notes) VALUES (?, ?, ?)`,
      args: [user.id, opening_cash ?? 0, notes?.trim() || null],
    });
    return NextResponse.json(
      { message: "Shift started.", id: Number(insert.lastInsertRowid) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[shifts/POST]", err);
    return NextResponse.json(
      { error: "Failed to start shift." },
      { status: 500 },
    );
  }
}
