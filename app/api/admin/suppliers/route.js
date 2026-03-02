import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── GET /api/admin/suppliers ─────────────────────────────────────────────────
export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const result = await db.execute({
      sql: `
        SELECT
          s.id, s.name, s.contact_name, s.phone, s.address,
          s.product_type, s.notes, s.is_active, s.created_at,
          COUNT(po.id) AS total_orders
        FROM suppliers s
        LEFT JOIN purchase_orders po ON po.supplier_id = s.id
        GROUP BY s.id
        ORDER BY s.name ASC
      `,
      args: [],
    });
    return NextResponse.json({ suppliers: result.rows });
  } catch (err) {
    console.error("[suppliers/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch suppliers." },
      { status: 500 },
    );
  }
}

// ─── POST /api/admin/suppliers ────────────────────────────────────────────────
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager"].includes(user.role_key)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, contact_name, phone, address, product_type, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Supplier name is required." },
        { status: 400 },
      );
    }

    const insert = await db.execute({
      sql: `
        INSERT INTO suppliers (name, contact_name, phone, address, product_type, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        name.trim(),
        contact_name?.trim() || null,
        phone?.trim() || null,
        address?.trim() || null,
        product_type?.trim() || null,
        notes?.trim() || null,
      ],
    });

    return NextResponse.json(
      { message: "Supplier created.", id: Number(insert.lastInsertRowid) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[suppliers/POST]", err);
    return NextResponse.json(
      { error: "Failed to create supplier." },
      { status: 500 },
    );
  }
}
