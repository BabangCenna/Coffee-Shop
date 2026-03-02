// app/api/admin/reports/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const pad = (n) => String(n).padStart(2, "0");
    const todayStr = (() => {
      const n = new Date();
      return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
    })();
    const from = searchParams.get("from") ?? todayStr;
    const to = searchParams.get("to") ?? from;
    const fromDt = `${from} 00:00:00`;
    const toDt = `${to} 23:59:59`;

    const [
      summaryRes,
      newCustRes,
      topProductsRes,
      paymentRes,
      dailyRes,
      staffRes,
      lowStockRes,
    ] = await Promise.all([
      // ── Order summary ──────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            COALESCE(SUM(CASE WHEN status='completed' THEN total_amount END), 0)  AS total_revenue,
            COUNT(CASE WHEN status='completed' THEN 1 END)                        AS total_orders,
            COALESCE(AVG(CASE WHEN status='completed' THEN total_amount END), 0)  AS avg_order_value,
            COUNT(CASE WHEN status='cancelled'  THEN 1 END)                       AS cancelled_orders,
            COALESCE(SUM(points_earned),   0)                                     AS points_earned,
            COALESCE(SUM(points_redeemed), 0)                                     AS points_redeemed
          FROM orders
          WHERE created_at BETWEEN ? AND ?
        `,
        args: [fromDt, toDt],
      }),

      // ── New customers ──────────────────────────────────────
      db.execute({
        sql: `SELECT COUNT(*) AS new_customers FROM customers WHERE created_at BETWEEN ? AND ?`,
        args: [fromDt, toDt],
      }),

      // ── Top products ───────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            p.id, p.name,
            c.name  AS category_name,
            u.abbr  AS unit_abbr,
            COALESCE(SUM(oi.quantity), 0) AS qty_sold,
            COALESCE(SUM(oi.subtotal), 0) AS revenue
          FROM order_items oi
          JOIN orders     o  ON o.id  = oi.order_id
                             AND o.status = 'completed'
                             AND o.created_at BETWEEN ? AND ?
          JOIN products   p  ON p.id  = oi.product_id
          JOIN categories c  ON c.id  = p.category_id
          JOIN units      u  ON u.id  = p.stock_unit_id
          GROUP BY p.id
          ORDER BY revenue DESC
          LIMIT 10
        `,
        args: [fromDt, toDt],
      }),

      // ── Payment breakdown ──────────────────────────────────
      db.execute({
        sql: `
          SELECT
            payment_method AS method,
            COUNT(*)                        AS order_count,
            COALESCE(SUM(total_amount), 0)  AS total_amount,
            ROUND(
              COUNT(*) * 100.0 / NULLIF(
                (SELECT COUNT(*) FROM orders
                 WHERE status='completed' AND created_at BETWEEN ? AND ?), 0
              ), 1
            ) AS pct
          FROM orders
          WHERE status = 'completed' AND created_at BETWEEN ? AND ?
          GROUP BY payment_method
          ORDER BY total_amount DESC
        `,
        args: [fromDt, toDt, fromDt, toDt],
      }),

      // ── Daily sales ────────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            DATE(created_at)                AS date,
            COUNT(*)                        AS order_count,
            COALESCE(SUM(total_amount), 0)  AS total_amount
          FROM orders
          WHERE status = 'completed' AND created_at BETWEEN ? AND ?
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
        args: [fromDt, toDt],
      }),

      // ── Staff performance ──────────────────────────────────
      db.execute({
        sql: `
          SELECT
            u.id, u.full_name,
            r.display_name                        AS role_display_name,
            COUNT(DISTINCT o.id)                  AS orders_count,
            COALESCE(SUM(o.total_amount), 0)      AS total_sales,
            COUNT(DISTINCT s.id)                  AS shifts_count
          FROM users u
          JOIN roles r ON r.id = u.role_id
          LEFT JOIN orders o
            ON o.created_by = u.id
           AND o.status = 'completed'
           AND o.created_at BETWEEN ? AND ?
          LEFT JOIN shifts s
            ON s.user_id = u.id
           AND s.clock_in BETWEEN ? AND ?
          WHERE u.is_active = 1
          GROUP BY u.id
          ORDER BY total_sales DESC
        `,
        args: [fromDt, toDt, fromDt, toDt],
      }),

      // ── Low stock ──────────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            p.id, p.name, p.low_stock_alert,
            COALESCE(s.quantity, 0) AS stock_qty,
            u.abbr AS unit_abbr
          FROM products p
          JOIN units u ON u.id = p.stock_unit_id
          LEFT JOIN stock s ON s.product_id = p.id AND s.location = 'main'
          WHERE p.is_active = 1
            AND COALESCE(s.quantity, 0) <= p.low_stock_alert
          ORDER BY stock_qty ASC
        `,
        args: [],
      }),
    ]);

    return NextResponse.json({
      summary: {
        ...summaryRes.rows[0],
        new_customers: newCustRes.rows[0]?.new_customers ?? 0,
      },
      top_products: topProductsRes.rows,
      payment_breakdown: paymentRes.rows,
      daily_sales: dailyRes.rows,
      staff_performance: staffRes.rows,
      low_stock: lowStockRes.rows,
    });
  } catch (err) {
    console.error("[reports/GET]", err);
    return NextResponse.json(
      { error: "Failed to generate report." },
      { status: 500 },
    );
  }
}
