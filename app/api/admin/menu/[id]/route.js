// app/api/admin/menu/[id]/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager"].includes(user.role_key))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  try {
    const { name, category, price, notes, is_active } = await req.json();

    const fields = [],
      args = [];
    if (name?.trim()) {
      fields.push("name = ?");
      args.push(name.trim());
    }
    if (category !== undefined) {
      fields.push("category = ?");
      args.push(category?.trim() || null);
    }
    if (price !== undefined) {
      fields.push("price = ?");
      args.push(price);
    }
    if (notes !== undefined) {
      fields.push("notes = ?");
      args.push(notes?.trim() || null);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      args.push(is_active ? 1 : 0);
    }

    if (!fields.length)
      return NextResponse.json(
        { error: "Nothing to update." },
        { status: 400 },
      );

    args.push(id);
    await db.execute({
      sql: `UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`,
      args,
    });
    return NextResponse.json({ message: "Menu item updated." });
  } catch (err) {
    console.error("[menu/PUT]", err);
    return NextResponse.json(
      { error: "Failed to update menu item." },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!["owner", "manager"].includes(user.role_key))
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  try {
    await db.execute({
      sql: `UPDATE menu_items SET is_active = 0 WHERE id = ?`,
      args: [id],
    });
    return NextResponse.json({ message: "Menu item deactivated." });
  } catch (err) {
    console.error("[menu/DELETE]", err);
    return NextResponse.json(
      { error: "Failed to deactivate menu item." },
      { status: 500 },
    );
  }
}
