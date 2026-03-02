// ============================================================
// app/api/admin/customers/route.js
// ============================================================

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
          c.id, c.name, c.phone, c.tier, c.total_spent, c.notes, c.created_at,
          COALESCE(lp.balance, 0) AS points_balance
        FROM customers c
        LEFT JOIN loyalty_points lp ON lp.customer_id = c.id
        ORDER BY c.name ASC
      `,
      args: [],
    });
    return NextResponse.json({ customers: result.rows });
  } catch (err) {
    console.error("[customers/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch customers." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager", "cashier"].includes(user.role_key))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { name, phone, tier, notes } = await req.json();
    if (!name?.trim() || !phone?.trim())
      return NextResponse.json(
        { error: "Name and phone are required." },
        { status: 400 },
      );

    const phoneCheck = await db.execute({
      sql: `SELECT id FROM customers WHERE phone = ?`,
      args: [phone.trim()],
    });
    if (phoneCheck.rows.length > 0)
      return NextResponse.json(
        { error: "Phone number already registered." },
        { status: 409 },
      );

    const insert = await db.execute({
      sql: `INSERT INTO customers (name, phone, tier, notes) VALUES (?, ?, ?, ?)`,
      args: [
        name.trim(),
        phone.trim(),
        tier ?? "member",
        notes?.trim() || null,
      ],
    });
    const cid = Number(insert.lastInsertRowid);
    await db.execute({
      sql: `INSERT INTO loyalty_points (customer_id, balance) VALUES (?, 0)`,
      args: [cid],
    });
    return NextResponse.json(
      { message: "Customer registered.", id: cid },
      { status: 201 },
    );
  } catch (err) {
    console.error("[customers/POST]", err);
    return NextResponse.json(
      { error: "Failed to register customer." },
      { status: 500 },
    );
  }
}
