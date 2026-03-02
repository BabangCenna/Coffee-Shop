import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── GET /api/admin/stock ─────────────────────────────────────────────────────
export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // 'low' | 'all'

    const result = await db.execute({
      sql: `
        SELECT
          p.id, p.name, p.sku, p.low_stock_alert, p.is_active,
          c.name  AS category_name,
          su.abbr AS unit_abbr, su.name AS unit_name,
          COALESCE(s.quantity, 0) AS quantity,
          s.updated_at
        FROM products p
        JOIN categories c ON c.id = p.category_id
        JOIN units su      ON su.id = p.stock_unit_id
        LEFT JOIN stock s  ON s.product_id = p.id AND s.location = 'main'
        WHERE p.is_active = 1
        ${filter === "low" ? "HAVING quantity <= p.low_stock_alert" : ""}
        ORDER BY p.name ASC
      `,
      args: [],
    });

    // Recent movements (last 50)
    const movements = await db.execute({
      sql: `
        SELECT
          sm.id, sm.type, sm.quantity, sm.note, sm.created_at, sm.reference_id,
          p.name AS product_name, su.abbr AS unit_abbr,
          u.full_name AS created_by_name
        FROM stock_movements sm
        JOIN products p ON p.id = sm.product_id
        JOIN units su   ON su.id = p.stock_unit_id
        LEFT JOIN users u ON u.id = sm.created_by
        ORDER BY sm.created_at DESC
        LIMIT 50
      `,
      args: [],
    });

    return NextResponse.json({
      stock: result.rows,
      movements: movements.rows,
    });
  } catch (err) {
    console.error("[stock/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch stock." },
      { status: 500 },
    );
  }
}

// ─── POST /api/admin/stock ────────────────────────────────────────────────────
// Manual stock adjustment (waste, adjustment, transfer)
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!["owner", "manager", "stock_clerk"].includes(user.role_key)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { product_id, type, quantity, note } = body;

    if (!product_id || !type || quantity === undefined) {
      return NextResponse.json(
        { error: "product_id, type, and quantity are required." },
        { status: 400 },
      );
    }

    const validTypes = ["waste", "adjustment", "transfer"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(", ")}` },
        { status: 400 },
      );
    }

    // Get current stock
    const stockRow = await db.execute({
      sql: `SELECT quantity FROM stock WHERE product_id = ? AND location = 'main'`,
      args: [product_id],
    });

    const current = stockRow.rows[0]?.quantity ?? 0;
    const delta = type === "waste" ? -Math.abs(quantity) : Number(quantity);
    const newQty = current + delta;

    if (newQty < 0) {
      return NextResponse.json(
        {
          error: `Cannot reduce below 0. Current stock: ${current} — adjustment would result in ${newQty}.`,
        },
        { status: 400 },
      );
    }

    // Upsert stock
    await db.execute({
      sql: `
        INSERT INTO stock (product_id, quantity, location, updated_at)
        VALUES (?, ?, 'main', datetime('now'))
        ON CONFLICT(product_id, location)
        DO UPDATE SET quantity = ?, updated_at = datetime('now')
      `,
      args: [product_id, newQty, newQty],
    });

    // Log movement
    await db.execute({
      sql: `
        INSERT INTO stock_movements (product_id, type, quantity, note, created_by)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [product_id, type, delta, note?.trim() || null, user.sub],
    });

    return NextResponse.json({
      message: "Stock updated.",
      new_quantity: newQty,
    });
  } catch (err) {
    console.error("[stock/POST]", err);
    return NextResponse.json(
      { error: "Failed to update stock." },
      { status: 500 },
    );
  }
}
