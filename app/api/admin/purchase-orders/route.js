import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── GET /api/admin/purchase-orders ──────────────────────────────────────────
export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const orders = await db.execute({
      sql: `
        SELECT
          po.id, po.status, po.total_cost, po.notes,
          po.ordered_at, po.received_at,
          s.id   AS supplier_id,
          s.name AS supplier_name,
          u.full_name AS created_by_name,
          a.full_name AS approved_by_name,
          COUNT(poi.id) AS item_count
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        LEFT JOIN users u ON u.id = po.created_by
        LEFT JOIN users a ON a.id = po.approved_by
        LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
        GROUP BY po.id
        ORDER BY po.ordered_at DESC
      `,
      args: [],
    });

    return NextResponse.json({ orders: orders.rows });
  } catch (err) {
    console.error("[purchase-orders/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders." },
      { status: 500 },
    );
  }
}

// ─── POST /api/admin/purchase-orders ─────────────────────────────────────────
// Create a new PO with its items
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!["owner", "manager", "stock_clerk"].includes(user.role_key)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { supplier_id, notes, items } = body;
    // items: [{ product_id, quantity, purchase_unit_id, purchase_to_stock_qty, unit_cost }]

    if (!supplier_id || !items?.length) {
      return NextResponse.json(
        { error: "Supplier and at least one item are required." },
        { status: 400 },
      );
    }

    // Validate supplier
    const sup = await db.execute({
      sql: `SELECT id FROM suppliers WHERE id = ? AND is_active = 1`,
      args: [supplier_id],
    });
    if (!sup.rows[0]) {
      return NextResponse.json(
        { error: "Supplier not found or inactive." },
        { status: 400 },
      );
    }

    // Compute total
    const total_cost = items.reduce(
      (sum, i) => sum + i.quantity * i.unit_cost,
      0,
    );

    // Insert PO header
    const po = await db.execute({
      sql: `
        INSERT INTO purchase_orders (supplier_id, status, total_cost, notes, created_by)
        VALUES (?, 'pending', ?, ?, ?)
      `,
      args: [supplier_id, total_cost, notes?.trim() || null, user.sub],
    });

    const po_id = Number(po.lastInsertRowid);

    // Insert items
    for (const item of items) {
      await db.execute({
        sql: `
          INSERT INTO purchase_order_items
            (po_id, product_id, quantity, purchase_unit_id, purchase_to_stock_qty, unit_cost)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        args: [
          po_id,
          item.product_id,
          item.quantity,
          item.purchase_unit_id,
          item.purchase_to_stock_qty ?? 1,
          item.unit_cost,
        ],
      });
    }

    return NextResponse.json(
      { message: "Purchase order created.", id: po_id },
      { status: 201 },
    );
  } catch (err) {
    console.error("[purchase-orders/POST]", err);
    return NextResponse.json(
      { error: "Failed to create purchase order." },
      { status: 500 },
    );
  }
}
