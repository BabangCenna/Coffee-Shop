// app/api/admin/orders/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const payment = searchParams.get("payment");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [];
    const args = [];
    if (status) {
      conditions.push("o.status = ?");
      args.push(status);
    }
    if (payment) {
      conditions.push("o.payment_method = ?");
      args.push(payment);
    }
    if (from) {
      conditions.push("DATE(o.created_at) >= ?");
      args.push(from);
    }
    if (to) {
      conditions.push("DATE(o.created_at) <= ?");
      args.push(to);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await db.execute({
      sql: `
        SELECT
          o.id, o.total_amount, o.points_earned, o.points_redeemed,
          o.payment_method, o.status, o.notes, o.created_at,
          c.name  AS customer_name,
          c.phone AS customer_phone,
          u.full_name AS created_by_name,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items_count
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        LEFT JOIN users     u ON u.id = o.created_by
        ${where}
        ORDER BY o.created_at DESC
        LIMIT 500
      `,
      args,
    });

    return NextResponse.json({ orders: result.rows });
  } catch (err) {
    console.error("[orders/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 },
    );
  }
}
