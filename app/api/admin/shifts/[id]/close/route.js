// app/api/admin/shifts/[id]/close/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  try {
    const { closing_cash, notes } = await req.json();

    const existing = await db.execute({
      sql: `SELECT id, clock_out FROM shifts WHERE id = ?`,
      args: [id],
    });
    if (!existing.rows[0])
      return NextResponse.json({ error: "Shift not found." }, { status: 404 });
    if (existing.rows[0].clock_out)
      return NextResponse.json(
        { error: "Shift already closed." },
        { status: 400 },
      );

    await db.execute({
      sql: `UPDATE shifts SET clock_out = datetime('now'), closing_cash = ?, notes = COALESCE(?, notes) WHERE id = ?`,
      args: [closing_cash ?? 0, notes?.trim() || null, id],
    });
    return NextResponse.json({ message: "Shift closed." });
  } catch (err) {
    console.error("[shifts/close/PUT]", err);
    return NextResponse.json(
      { error: "Failed to close shift." },
      { status: 500 },
    );
  }
}
