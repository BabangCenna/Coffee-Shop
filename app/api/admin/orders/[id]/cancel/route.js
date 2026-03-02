// app/api/admin/orders/[id]/cancel/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager", "cashier"].includes(user.role_key))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  try {
    const existing = await db.execute({
      sql: `SELECT id, status FROM orders WHERE id = ?`,
      args: [id],
    });
    if (!existing.rows[0])
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!["pending", "in_progress"].includes(existing.rows[0].status))
      return NextResponse.json(
        { error: "Only pending or in-progress orders can be cancelled." },
        { status: 400 },
      );

    // Restock
    const items = await db.execute({
      sql: `SELECT product_id, quantity FROM order_items WHERE order_id = ? AND product_id IS NOT NULL`,
      args: [id],
    });
    for (const item of items.rows) {
      await db.execute({
        sql: `UPDATE stock SET quantity = quantity + ?, updated_at = datetime('now') WHERE product_id = ? AND location = 'main'`,
        args: [item.quantity, item.product_id],
      });
      await db.execute({
        sql: `INSERT INTO stock_movements (product_id, type, quantity, note, reference_id, created_by) VALUES (?, 'adjustment', ?, ?, ?, ?)`,
        args: [
          item.product_id,
          item.quantity,
          `Order #${id} cancelled`,
          String(id),
          user.id,
        ],
      });
    }

    await db.execute({
      sql: `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
      args: [id],
    });
    return NextResponse.json({ message: "Order cancelled." });
  } catch (err) {
    console.error("[orders/cancel/PUT]", err);
    return NextResponse.json(
      { error: "Failed to cancel order." },
      { status: 500 },
    );
  }
}
