// app/api/admin/loyalty/transactions/route.js

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const result = await db.execute({
      sql: `
        SELECT
          pt.id, pt.type, pt.points, pt.order_id, pt.note, pt.created_at,
          c.name AS customer_name
        FROM point_transactions pt
        JOIN customers c ON c.id = pt.customer_id
        ORDER BY pt.created_at DESC
        LIMIT 500
      `,
      args: [],
    });
    return NextResponse.json({ transactions: result.rows });
  } catch (err) {
    console.error("[loyalty/transactions/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch transactions." },
      { status: 500 },
    );
  }
}
