import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── PUT /api/admin/products/[id] ────────────────────────────────────────────
export async function PUT(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager"].includes(user.role_key)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

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
      is_active,
    } = body;

    const existing = await db.execute({
      sql: `SELECT id FROM products WHERE id = ?`,
      args: [id],
    });
    if (!existing.rows[0]) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }

    // SKU uniqueness check (excluding self)
    if (sku?.trim()) {
      const skuCheck = await db.execute({
        sql: `SELECT id FROM products WHERE sku = ? AND id != ?`,
        args: [sku.trim(), id],
      });
      if (skuCheck.rows.length > 0) {
        return NextResponse.json(
          { error: `SKU "${sku}" already exists.` },
          { status: 409 },
        );
      }
    }

    const fields = [];
    const args = [];

    if (name?.trim()) {
      fields.push("name = ?");
      args.push(name.trim());
    }
    if (sku !== undefined) {
      fields.push("sku = ?");
      args.push(sku?.trim() || null);
    }
    if (category_id) {
      fields.push("category_id = ?");
      args.push(category_id);
    }
    if (stock_unit_id) {
      fields.push("stock_unit_id = ?");
      args.push(stock_unit_id);
    }
    if (purchase_unit_id) {
      fields.push("purchase_unit_id = ?");
      args.push(purchase_unit_id);
    }
    if (purchase_to_stock_qty !== undefined) {
      fields.push("purchase_to_stock_qty = ?");
      args.push(purchase_to_stock_qty);
    }
    if (cost_price !== undefined) {
      fields.push("cost_price = ?");
      args.push(cost_price);
    }
    if (selling_price !== undefined) {
      fields.push("selling_price = ?");
      args.push(selling_price);
    }
    if (low_stock_alert !== undefined) {
      fields.push("low_stock_alert = ?");
      args.push(low_stock_alert);
    }
    if (notes !== undefined) {
      fields.push("notes = ?");
      args.push(notes?.trim() || null);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      args.push(is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update." },
        { status: 400 },
      );
    }

    args.push(id);
    await db.execute({
      sql: `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ message: "Product updated." });
  } catch (err) {
    console.error("[products/PUT]", err);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/admin/products/[id] — soft delete ───────────────────────────
export async function DELETE(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (user.role_key !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can deactivate products." },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    const existing = await db.execute({
      sql: `SELECT id, is_active FROM products WHERE id = ?`,
      args: [id],
    });
    if (!existing.rows[0]) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 },
      );
    }
    if (!existing.rows[0].is_active) {
      return NextResponse.json(
        { error: "Product is already inactive." },
        { status: 400 },
      );
    }

    await db.execute({
      sql: `UPDATE products SET is_active = 0 WHERE id = ?`,
      args: [id],
    });
    return NextResponse.json({ message: "Product deactivated." });
  } catch (err) {
    console.error("[products/DELETE]", err);
    return NextResponse.json(
      { error: "Failed to deactivate product." },
      { status: 500 },
    );
  }
}
