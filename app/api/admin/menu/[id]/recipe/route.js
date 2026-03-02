// app/api/admin/menu/[id]/recipe/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  try {
    const result = await db.execute({
      sql: `
        SELECT r.product_id, r.quantity, r.unit_id,
               p.name AS product_name,
               su.abbr AS unit_abbr
        FROM recipes r
        JOIN products p  ON p.id  = r.product_id
        JOIN units   su  ON su.id = r.unit_id
        WHERE r.menu_item_id = ?
      `,
      args: [id],
    });
    return NextResponse.json({ recipe: result.rows });
  } catch (err) {
    console.error("[recipe/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch recipe." },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager"].includes(user.role_key))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  try {
    const { recipe } = await req.json();

    // Replace all rows for this menu item
    await db.execute({
      sql: `DELETE FROM recipes WHERE menu_item_id = ?`,
      args: [id],
    });

    for (const row of recipe ?? []) {
      if (!row.product_id || !row.quantity) continue;
      // Resolve unit: use provided unit_id, or fall back to product's stock_unit_id
      let unitId = row.unit_id;
      if (!unitId) {
        const prod = await db.execute({
          sql: `SELECT stock_unit_id FROM products WHERE id = ?`,
          args: [row.product_id],
        });
        unitId = prod.rows[0]?.stock_unit_id;
      }
      await db.execute({
        sql: `INSERT INTO recipes (menu_item_id, product_id, quantity, unit_id) VALUES (?, ?, ?, ?)`,
        args: [id, row.product_id, row.quantity, unitId],
      });
    }

    return NextResponse.json({ message: "Recipe saved." });
  } catch (err) {
    console.error("[recipe/PUT]", err);
    return NextResponse.json(
      { error: "Failed to save recipe." },
      { status: 500 },
    );
  }
}
