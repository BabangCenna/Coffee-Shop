// app/api/admin/menu/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const [itemsRes, productsRes, unitsRes] = await Promise.all([
      db.execute({
        sql: `
          SELECT
            m.id, m.name, m.category, m.price, m.is_active, m.notes, m.created_at,
            (SELECT COUNT(*) FROM recipes r WHERE r.menu_item_id = m.id) AS recipe_count
          FROM menu_items m
          ORDER BY m.category ASC, m.name ASC
        `,
        args: [],
      }),
      db.execute({
        sql: `
          SELECT
            p.id, p.name, p.cost_price, p.purchase_to_stock_qty,
            su.abbr AS stock_unit_abbr
          FROM products p
          JOIN units su ON su.id = p.stock_unit_id
          WHERE p.is_active = 1
          ORDER BY p.name ASC
        `,
        args: [],
      }),
      db.execute({
        sql: `SELECT id, name, abbr FROM units ORDER BY name`,
        args: [],
      }),
    ]);

    return NextResponse.json({
      items: itemsRes.rows,
      products: productsRes.rows,
      units: unitsRes.rows,
    });
  } catch (err) {
    console.error("[menu/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch menu." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager"].includes(user.role_key))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  try {
    const { name, category, price, notes, is_active } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: "Name is required." }, { status: 400 });

    const insert = await db.execute({
      sql: `INSERT INTO menu_items (name, category, price, notes, is_active) VALUES (?, ?, ?, ?, ?)`,
      args: [
        name.trim(),
        category?.trim() || null,
        price ?? 0,
        notes?.trim() || null,
        is_active !== false ? 1 : 0,
      ],
    });
    return NextResponse.json(
      { message: "Menu item created.", id: Number(insert.lastInsertRowid) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[menu/POST]", err);
    return NextResponse.json(
      { error: "Failed to create menu item." },
      { status: 500 },
    );
  }
}
