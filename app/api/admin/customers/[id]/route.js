// ============================================================
// app/api/admin/customers/[id]/route.js
// ============================================================

// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { getUserFromRequest } from "@/lib/auth";

export async function PUT_customer(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  try {
    const { name, phone, tier, notes } = await req.json();

    if (phone?.trim()) {
      const phoneCheck = await db.execute({
        sql: `SELECT id FROM customers WHERE phone = ? AND id != ?`,
        args: [phone.trim(), id],
      });
      if (phoneCheck.rows.length > 0)
        return NextResponse.json(
          { error: "Phone already in use." },
          { status: 409 },
        );
    }

    const fields = [],
      args = [];
    if (name?.trim()) {
      fields.push("name = ?");
      args.push(name.trim());
    }
    if (phone?.trim()) {
      fields.push("phone = ?");
      args.push(phone.trim());
    }
    if (tier) {
      fields.push("tier = ?");
      args.push(tier);
    }
    if (notes !== undefined) {
      fields.push("notes = ?");
      args.push(notes?.trim() || null);
    }

    if (!fields.length)
      return NextResponse.json(
        { error: "Nothing to update." },
        { status: 400 },
      );
    args.push(id);
    await db.execute({
      sql: `UPDATE customers SET ${fields.join(", ")} WHERE id = ?`,
      args,
    });
    return NextResponse.json({ message: "Customer updated." });
  } catch (err) {
    console.error("[customers/PUT]", err);
    return NextResponse.json(
      { error: "Failed to update customer." },
      { status: 500 },
    );
  }
}
