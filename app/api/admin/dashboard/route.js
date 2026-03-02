// app/api/admin/dashboard/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "today"; // "today" | "week" | "month"

  // ── Date range helpers ───────────────────────────────────────────────────────
  const pad = (n) => String(n).padStart(2, "0");
  const toDateStr = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const now = new Date();
  const today = toDateStr(now);

  let fromDate, toDate, prevFrom, prevTo;

  if (period === "today") {
    fromDate = today;
    toDate = today;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    prevFrom = prevTo = toDateStr(yesterday);
  } else if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    fromDate = toDateStr(start);
    toDate = today;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 6);
    prevFrom = toDateStr(prevStart);
    prevTo = toDateStr(prevEnd);
  } else {
    // month
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    fromDate = toDateStr(start);
    toDate = today;
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 29);
    prevFrom = toDateStr(prevStart);
    prevTo = toDateStr(prevEnd);
  }

  const fromDt = `${fromDate} 00:00:00`;
  const toDt = `${toDate}   23:59:59`;
  const pFromDt = `${prevFrom} 00:00:00`;
  const pToDt = `${prevTo}   23:59:59`;

  try {
    const [
      summaryRes,
      prevSummaryRes,
      hourlyRes,
      weeklyRes,
      paymentRes,
      recentRes,
      topItemsRes,
      lowStockRes,
      openShiftRes,
      newCustRes,
      prevNewCustRes,
    ] = await Promise.all([
      // ── Current period summary ───────────────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            COALESCE(SUM(CASE WHEN status='completed' THEN total_amount END), 0) AS total_revenue,
            COUNT(CASE WHEN status='completed' THEN 1 END)                       AS total_orders,
            COALESCE(AVG(CASE WHEN status='completed' THEN total_amount END), 0) AS avg_order_value,
            COUNT(CASE WHEN status='cancelled'  THEN 1 END)                      AS cancelled_orders
          FROM orders
          WHERE created_at BETWEEN ? AND ?
        `,
        args: [fromDt, toDt],
      }),

      // ── Previous period summary (for delta) ──────────────────────────────────
      db.execute({
        sql: `
          SELECT
            COALESCE(SUM(CASE WHEN status='completed' THEN total_amount END), 0) AS total_revenue,
            COUNT(CASE WHEN status='completed' THEN 1 END)                       AS total_orders
          FROM orders
          WHERE created_at BETWEEN ? AND ?
        `,
        args: [pFromDt, pToDt],
      }),

      // ── Hourly order count (today) or daily (week/month) ──────────────────────
      period === "today"
        ? db.execute({
            sql: `
              SELECT
                CAST(strftime('%H', created_at) AS INTEGER) AS hour,
                COUNT(*) AS count
              FROM orders
              WHERE status = 'completed'
                AND DATE(created_at) = ?
              GROUP BY hour
              ORDER BY hour ASC
            `,
            args: [today],
          })
        : db.execute({
            sql: `
              SELECT
                DATE(created_at) AS hour,
                COUNT(*) AS count
              FROM orders
              WHERE status = 'completed'
                AND created_at BETWEEN ? AND ?
              GROUP BY DATE(created_at)
              ORDER BY DATE(created_at) ASC
            `,
            args: [fromDt, toDt],
          }),

      // ── Weekly/monthly revenue trend (daily buckets) ─────────────────────────
      db.execute({
        sql: `
          SELECT
            DATE(created_at) AS date,
            COALESCE(SUM(CASE WHEN status='completed' THEN total_amount END), 0) AS revenue,
            COUNT(CASE WHEN status='completed' THEN 1 END) AS orders
          FROM orders
          WHERE created_at BETWEEN ? AND ?
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
        args: [fromDt, toDt],
      }),

      // ── Payment method breakdown ──────────────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            payment_method AS method,
            COUNT(*)                       AS count,
            COALESCE(SUM(total_amount), 0) AS amount
          FROM orders
          WHERE status = 'completed'
            AND created_at BETWEEN ? AND ?
          GROUP BY payment_method
          ORDER BY count DESC
        `,
        args: [fromDt, toDt],
      }),

      // ── Recent 8 orders ───────────────────────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            o.id, o.total_amount, o.payment_method, o.status, o.created_at,
            c.name AS customer_name,
            (
              SELECT GROUP_CONCAT(
                COALESCE(p.name, m.name) || CASE WHEN oi2.quantity > 1 THEN ' ×' || oi2.quantity ELSE '' END,
                ', '
              )
              FROM (
                SELECT * FROM order_items oi3
                WHERE oi3.order_id = o.id
                LIMIT 2
              ) oi2
              LEFT JOIN products   p ON p.id = oi2.product_id
              LEFT JOIN menu_items m ON m.id = oi2.menu_item_id
            ) AS items_preview
          FROM orders o
          LEFT JOIN customers c ON c.id = o.customer_id
          ORDER BY o.created_at DESC
          LIMIT 8
        `,
        args: [],
      }),

      // ── Top 5 selling menu items ──────────────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            COALESCE(p.name, m.name) AS name,
            SUM(oi.quantity)         AS qty_sold,
            SUM(oi.subtotal)         AS revenue
          FROM order_items oi
          JOIN orders o
            ON o.id = oi.order_id
           AND o.status = 'completed'
           AND o.created_at BETWEEN ? AND ?
          LEFT JOIN products   p ON p.id = oi.product_id
          LEFT JOIN menu_items m ON m.id = oi.menu_item_id
          GROUP BY COALESCE(p.id, -oi.menu_item_id)
          ORDER BY qty_sold DESC
          LIMIT 5
        `,
        args: [fromDt, toDt],
      }),

      // ── Low stock ─────────────────────────────────────────────────────────────
      db.execute({
        sql: `
          SELECT
            p.id, p.name, p.low_stock_alert,
            COALESCE(s.quantity, 0) AS stock_qty,
            c.name  AS category_name,
            u.abbr  AS unit_abbr
          FROM products p
          JOIN units u ON u.id = p.stock_unit_id
          LEFT JOIN categories c ON c.id = p.category_id
          LEFT JOIN stock      s ON s.product_id = p.id AND s.location = 'main'
          WHERE p.is_active = 1
            AND COALESCE(s.quantity, 0) <= p.low_stock_alert
          ORDER BY COALESCE(s.quantity, 0) ASC
          LIMIT 12
        `,
        args: [],
      }),

      // ── Currently open shift ──────────────────────────────────────────────────
      db.execute({
        sql: `
          SELECT s.id, s.clock_in, s.opening_cash, u.full_name AS user_name
          FROM shifts s
          JOIN users u ON u.id = s.user_id
          WHERE s.clock_out IS NULL
          ORDER BY s.clock_in DESC
          LIMIT 1
        `,
        args: [],
      }),

      // ── New customers in period ───────────────────────────────────────────────
      db.execute({
        sql: `SELECT COUNT(*) AS cnt FROM customers WHERE created_at BETWEEN ? AND ?`,
        args: [fromDt, toDt],
      }),

      // ── New customers previous period ─────────────────────────────────────────
      db.execute({
        sql: `SELECT COUNT(*) AS cnt FROM customers WHERE created_at BETWEEN ? AND ?`,
        args: [pFromDt, pToDt],
      }),
    ]);

    // ── Build deltas ─────────────────────────────────────────────────────────────
    const cur = summaryRes.rows[0];
    const prev = prevSummaryRes.rows[0];

    const revenueDelta = (cur.total_revenue ?? 0) - (prev.total_revenue ?? 0);
    const ordersDelta = (cur.total_orders ?? 0) - (prev.total_orders ?? 0);
    const newCust = newCustRes.rows[0]?.cnt ?? 0;
    const prevNewCust = prevNewCustRes.rows[0]?.cnt ?? 0;
    const customersDelta = newCust - prevNewCust;

    // ── Fill in hour gaps for hourly chart (today: 0–23) ─────────────────────
    let hourly = hourlyRes.rows;
    if (period === "today") {
      const byHour = Object.fromEntries(hourly.map((r) => [r.hour, r.count]));
      const currentHour = now.getHours();
      hourly = Array.from({ length: currentHour + 1 }, (_, h) => ({
        hour: String(h).padStart(2, "0"),
        count: byHour[h] ?? 0,
      }));
    }

    return NextResponse.json({
      period,
      summary: {
        total_revenue: cur.total_revenue ?? 0,
        total_orders: cur.total_orders ?? 0,
        avg_order_value: cur.avg_order_value ?? 0,
        cancelled_orders: cur.cancelled_orders ?? 0,
        active_customers: newCust,
        revenue_delta: revenueDelta,
        orders_delta: ordersDelta,
        customers_delta: customersDelta,
      },
      hourly,
      weekly: weeklyRes.rows,
      payment: paymentRes.rows,
      recent_orders: recentRes.rows,
      top_items: topItemsRes.rows,
      low_stock: lowStockRes.rows,
      open_shift: openShiftRes.rows[0] ?? null,
    });
  } catch (err) {
    console.error("[dashboard/GET]", err);
    return NextResponse.json(
      { error: "Failed to load dashboard." },
      { status: 500 },
    );
  }
}
