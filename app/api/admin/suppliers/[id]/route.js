import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── PUT /api/admin/suppliers/[id] ───────────────────────────────────────────
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
      contact_name,
      phone,
      address,
      product_type,
      notes,
      is_active,
    } = body;

    const existing = await db.execute({
      sql: `SELECT id FROM suppliers WHERE id = ?`,
      args: [id],
    });
    if (!existing.rows[0]) {
      return NextResponse.json(
        { error: "Supplier not found." },
        { status: 404 },
      );
    }

    const fields = [];
    const args = [];

    if (name?.trim()) {
      fields.push("name = ?");
      args.push(name.trim());
    }
    if (contact_name !== undefined) {
      fields.push("contact_name = ?");
      args.push(contact_name?.trim() || null);
    }
    if (phone !== undefined) {
      fields.push("phone = ?");
      args.push(phone?.trim() || null);
    }
    if (address !== undefined) {
      fields.push("address = ?");
      args.push(address?.trim() || null);
    }
    if (product_type !== undefined) {
      fields.push("product_type = ?");
      args.push(product_type?.trim() || null);
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
      sql: `UPDATE suppliers SET ${fields.join(", ")} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ message: "Supplier updated." });
  } catch (err) {
    console.error("[suppliers/PUT]", err);
    return NextResponse.json(
      { error: "Failed to update supplier." },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/admin/suppliers/[id] — soft delete ──────────────────────────
export async function DELETE(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager"].includes(user.role_key)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await db.execute({
      sql: `SELECT id, is_active FROM suppliers WHERE id = ?`,
      args: [id],
    });
    if (!existing.rows[0]) {
      return NextResponse.json(
        { error: "Supplier not found." },
        { status: 404 },
      );
    }
    if (!existing.rows[0].is_active) {
      return NextResponse.json(
        { error: "Supplier is already inactive." },
        { status: 400 },
      );
    }

    await db.execute({
      sql: `UPDATE suppliers SET is_active = 0 WHERE id = ?`,
      args: [id],
    });
    return NextResponse.json({ message: "Supplier deactivated." });
  } catch (err) {
    console.error("[suppliers/DELETE]", err);
    return NextResponse.json(
      { error: "Failed to deactivate supplier." },
      { status: 500 },
    );
  }
}
