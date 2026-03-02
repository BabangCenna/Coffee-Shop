// app/api/admin/loyalty/adjust/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager"].includes(user.role_key))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { customer_id, type, points, note } = await req.json();

    if (!customer_id || points === 0 || points == null)
      return NextResponse.json(
        { error: "Customer and non-zero points are required." },
        { status: 400 },
      );

    const custCheck = await db.execute({
      sql: `SELECT id FROM customers WHERE id = ?`,
      args: [customer_id],
    });
    if (!custCheck.rows[0])
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 },
      );

    await db.execute({
      sql: `INSERT INTO point_transactions (customer_id, type, points, note, created_by) VALUES (?, ?, ?, ?, ?)`,
      args: [
        customer_id,
        type ?? "adjust",
        points,
        note?.trim() || null,
        user.id,
      ],
    });

    // Upsert balance
    await db.execute({
      sql: `
        INSERT INTO loyalty_points (customer_id, balance, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(customer_id) DO UPDATE SET
          balance = balance + excluded.balance,
          updated_at = datetime('now')
      `,
      args: [customer_id, points],
    });

    return NextResponse.json({ message: "Points adjusted." });
  } catch (err) {
    console.error("[loyalty/adjust/POST]", err);
    return NextResponse.json(
      { error: "Failed to adjust points." },
      { status: 500 },
    );
  }
}
