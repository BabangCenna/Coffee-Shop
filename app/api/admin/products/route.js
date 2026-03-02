// app/api/admin/products/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── GET /api/admin/products ──────────────────────────────────────────────────
export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const category_id = searchParams.get("category_id");

    const result = await db.execute({
      sql: `
        SELECT
          p.id, p.name, p.sku, p.cost_price, p.selling_price,
          p.low_stock_alert, p.is_active, p.notes, p.created_at,
          p.purchase_to_stock_qty,
          c.id   AS category_id,
          c.name AS category_name,
          c.type AS category_type,
          su.id   AS stock_unit_id,
          su.name AS stock_unit_name,
          su.abbr AS stock_unit_abbr,
          pu.id   AS purchase_unit_id,
          pu.name AS purchase_unit_name,
          pu.abbr AS purchase_unit_abbr,
          COALESCE(s.quantity, 0) AS stock_qty
        FROM products p
        JOIN categories c  ON c.id = p.category_id
        JOIN units su       ON su.id = p.stock_unit_id
        JOIN units pu       ON pu.id = p.purchase_unit_id
        LEFT JOIN stock s   ON s.product_id = p.id AND s.location = 'main'
        ${category_id ? "WHERE p.category_id = ?" : ""}
        ORDER BY p.name ASC
      `,
      args: category_id ? [category_id] : [],
    });

    // Also fetch categories and units for dropdowns
    const [cats, units] = await Promise.all([
      db.execute({
        sql: `SELECT id, name, type FROM categories ORDER BY name`,
        args: [],
      }),
      db.execute({
        sql: `SELECT id, name, abbr FROM units ORDER BY name`,
        args: [],
      }),
    ]);

    return NextResponse.json({
      products: result.rows,
      categories: cats.rows,
      units: units.rows,
    });
  } catch (err) {
    console.error("[products/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch products." },
      { status: 500 },
    );
  }
}

// ─── POST /api/admin/products ─────────────────────────────────────────────────
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!["owner", "manager"].includes(user.role_key)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      sku,
      category_id,
      stock_unit_id,
      purchase_unit_id,
      purchase_to_stock_qty,
      cost_price,
      selling_price,
      low_stock_alert,
      notes,
    } = body;

    if (!name?.trim() || !category_id || !stock_unit_id || !purchase_unit_id) {
      return NextResponse.json(
        { error: "Name, category, and units are required." },
        { status: 400 },
      );
    }

    // Check SKU uniqueness
    if (sku?.trim()) {
      const skuCheck = await db.execute({
        sql: `SELECT id FROM products WHERE sku = ?`,
        args: [sku.trim()],
      });
      if (skuCheck.rows.length > 0) {
        return NextResponse.json(
          { error: `SKU "${sku}" already exists.` },
          { status: 409 },
        );
      }
    }

    const insert = await db.execute({
      sql: `
        INSERT INTO products
          (name, sku, category_id, stock_unit_id, purchase_unit_id,
           purchase_to_stock_qty, cost_price, selling_price, low_stock_alert, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        name.trim(),
        sku?.trim() || null,
        category_id,
        stock_unit_id,
        purchase_unit_id,
        purchase_to_stock_qty ?? 1,
        cost_price ?? 0,
        selling_price ?? 0,
        low_stock_alert ?? 10,
        notes?.trim() || null,
      ],
    });

    // Create stock record at 0
    await db.execute({
      sql: `INSERT INTO stock (product_id, quantity, location) VALUES (?, 0, 'main')`,
      args: [Number(insert.lastInsertRowid)],
    });

    return NextResponse.json(
      { message: "Product created.", id: Number(insert.lastInsertRowid) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[products/POST]", err);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 },
    );
  }
}
