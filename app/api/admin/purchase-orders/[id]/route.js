import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── GET /api/admin/purchase-orders/[id] ─────────────────────────────────────
export async function GET(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  try {
    const po = await db.execute({
      sql: `
        SELECT
          po.id, po.status, po.total_cost, po.notes,
          po.ordered_at, po.received_at,
          s.id   AS supplier_id,
          s.name AS supplier_name, s.phone AS supplier_phone,
          u.full_name AS created_by_name,
          a.full_name AS approved_by_name
        FROM purchase_orders po
        JOIN suppliers s ON s.id = po.supplier_id
        LEFT JOIN users u ON u.id = po.created_by
        LEFT JOIN users a ON a.id = po.approved_by
        WHERE po.id = ?
      `,
      args: [id],
    });

    if (!po.rows[0]) {
      return NextResponse.json(
        { error: "Purchase order not found." },
        { status: 404 },
      );
    }

    const items = await db.execute({
      sql: `
        SELECT
          poi.id, poi.quantity, poi.unit_cost, poi.purchase_to_stock_qty,
          poi.stock_qty_expected,
          p.id   AS product_id,
          p.name AS product_name,
          pu.abbr AS purchase_unit_abbr,
          su.abbr AS stock_unit_abbr
        FROM purchase_order_items poi
        JOIN products p ON p.id = poi.product_id
        JOIN units pu   ON pu.id = poi.purchase_unit_id
        JOIN units su   ON su.id = p.stock_unit_id
        WHERE poi.po_id = ?
      `,
      args: [id],
    });

    return NextResponse.json({ order: po.rows[0], items: items.rows });
  } catch (err) {
    console.error("[purchase-orders/GET/:id]", err);
    return NextResponse.json(
      { error: "Failed to fetch order." },
      { status: 500 },
    );
  }
}

// ─── PUT /api/admin/purchase-orders/[id] ─────────────────────────────────────
// Actions: approve | receive | cancel
export async function PUT(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { action, notes } = body;

    const po = await db.execute({
      sql: `SELECT id, status FROM purchase_orders WHERE id = ?`,
      args: [id],
    });
    if (!po.rows[0]) {
      return NextResponse.json(
        { error: "Purchase order not found." },
        { status: 404 },
      );
    }

    const current = po.rows[0].status;

    // ── Approve (pending → pending with approved_by set) ─────────────────────
    if (action === "approve") {
      if (!["owner", "manager"].includes(user.role_key)) {
        return NextResponse.json(
          { error: "Only owner or manager can approve orders." },
          { status: 403 },
        );
      }
      if (current !== "pending") {
        return NextResponse.json(
          { error: "Only pending orders can be approved." },
          { status: 400 },
        );
      }
      await db.execute({
        sql: `UPDATE purchase_orders SET approved_by = ? WHERE id = ?`,
        args: [user.sub, id],
      });
      return NextResponse.json({ message: "Purchase order approved." });
    }

    // ── Receive (pending → received + stock updated) ──────────────────────────
    if (action === "receive") {
      if (!["owner", "manager", "stock_clerk"].includes(user.role_key)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      if (current !== "pending") {
        return NextResponse.json(
          { error: "Only pending orders can be received." },
          { status: 400 },
        );
      }

      // Fetch items
      const items = await db.execute({
        sql: `SELECT product_id, stock_qty_expected FROM purchase_order_items WHERE po_id = ?`,
        args: [id],
      });

      // Update stock for each item
      for (const item of items.rows) {
        const qty = Number(item.stock_qty_expected);

        // Upsert stock
        await db.execute({
          sql: `
            INSERT INTO stock (product_id, quantity, location, updated_at)
            VALUES (?, ?, 'main', datetime('now'))
            ON CONFLICT(product_id, location)
            DO UPDATE SET
              quantity   = quantity + ?,
              updated_at = datetime('now')
          `,
          args: [item.product_id, qty, qty],
        });

        // Log movement
        await db.execute({
          sql: `
            INSERT INTO stock_movements (product_id, type, quantity, note, reference_id, created_by)
            VALUES (?, 'purchase', ?, ?, ?, ?)
          `,
          args: [
            item.product_id,
            qty,
            `PO #${id} received`,
            String(id),
            user.sub,
          ],
        });
      }

      // Mark PO as received
      await db.execute({
        sql: `UPDATE purchase_orders SET status = 'received', received_at = datetime('now') WHERE id = ?`,
        args: [id],
      });

      return NextResponse.json({
        message: "Purchase order received. Stock updated.",
      });
    }

    // ── Cancel ────────────────────────────────────────────────────────────────
    if (action === "cancel") {
      if (!["owner", "manager"].includes(user.role_key)) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      if (current === "received") {
        return NextResponse.json(
          { error: "Cannot cancel a received order." },
          { status: 400 },
        );
      }
      if (current === "cancelled") {
        return NextResponse.json(
          { error: "Order is already cancelled." },
          { status: 400 },
        );
      }

      await db.execute({
        sql: `UPDATE purchase_orders SET status = 'cancelled', notes = COALESCE(notes || ' | ', '') || ? WHERE id = ?`,
        args: [`Cancelled: ${notes || "No reason given"}`, id],
      });

      return NextResponse.json({ message: "Purchase order cancelled." });
    }

    return NextResponse.json(
      { error: "Invalid action. Use: approve | receive | cancel" },
      { status: 400 },
    );
  } catch (err) {
    console.error("[purchase-orders/PUT/:id]", err);
    return NextResponse.json(
      { error: "Failed to update order." },
      { status: 500 },
    );
  }
}
