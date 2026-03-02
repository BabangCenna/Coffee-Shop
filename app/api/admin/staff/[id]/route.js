import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── PUT /api/admin/staff/[id] ────────────────────────────────────────────────
// Update a staff member's details
export async function PUT(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (!["owner", "manager"].includes(user.role_key)) {
    return NextResponse.json(
      { error: "Forbidden. Insufficient permissions." },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { full_name, username, phone, password, role_id, is_active } = body;

    // Make sure the target user exists
    const target = await db.execute({
      sql: `SELECT id, username FROM users WHERE id = ?`,
      args: [id],
    });
    if (!target.rows[0]) {
      return NextResponse.json(
        { error: "Staff member not found." },
        { status: 404 },
      );
    }

    // Check username uniqueness (if changing)
    if (username?.trim()) {
      const existing = await db.execute({
        sql: `SELECT id FROM users WHERE LOWER(username) = ? AND id != ?`,
        args: [username.trim().toLowerCase(), id],
      });
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { error: `Username "${username}" is already taken.` },
          { status: 409 },
        );
      }
    }

    // Check phone uniqueness (if changing)
    if (phone?.trim()) {
      const existingPhone = await db.execute({
        sql: `SELECT id FROM users WHERE phone = ? AND id != ?`,
        args: [phone.trim(), id],
      });
      if (existingPhone.rows.length > 0) {
        return NextResponse.json(
          { error: "That phone number is already registered to another user." },
          { status: 409 },
        );
      }
    }

    // If changing role, validate the new role
    if (role_id) {
      const roleCheck = await db.execute({
        sql: `SELECT id, role_key FROM roles WHERE id = ?`,
        args: [role_id],
      });
      if (!roleCheck.rows[0]) {
        return NextResponse.json(
          { error: "Invalid role selected." },
          { status: 400 },
        );
      }

      const newRoleKey = roleCheck.rows[0].role_key;

      // Nobody can promote someone to owner
      if (newRoleKey === "owner") {
        return NextResponse.json(
          { error: "The Owner role cannot be assigned via this form." },
          { status: 403 },
        );
      }

      // Only owner can assign the manager role
      if (newRoleKey === "manager" && user.role_key !== "owner") {
        return NextResponse.json(
          { error: "Only the Owner can assign the Manager role." },
          { status: 403 },
        );
      }
    }

    // Prevent demoting/editing the owner account (unless you are the owner editing yourself)
    const targetRoleResult = await db.execute({
      sql: `SELECT r.role_key FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
      args: [id],
    });
    const targetIsOwner = targetRoleResult.rows[0]?.role_key === "owner";
    if (targetIsOwner && String(id) !== String(user.sub)) {
      return NextResponse.json(
        {
          error:
            "The Owner account can only be edited by the owner themselves.",
        },
        { status: 403 },
      );
    }
    const fields = [];
    const args = [];

    if (full_name?.trim()) {
      fields.push("full_name = ?");
      args.push(full_name.trim());
    }
    if (username?.trim()) {
      fields.push("username = ?");
      args.push(username.trim());
    }
    if (phone !== undefined) {
      fields.push("phone = ?");
      args.push(phone?.trim() || null);
    }
    if (role_id) {
      fields.push("role_id = ?");
      args.push(role_id);
    }
    if (is_active !== undefined) {
      fields.push("is_active = ?");
      args.push(is_active ? 1 : 0);
    }

    // Optional password change
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 },
        );
      }
      const hash = await bcrypt.hash(password, 12);
      fields.push("password_hash = ?");
      args.push(hash);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: "No fields provided to update." },
        { status: 400 },
      );
    }

    args.push(id);

    await db.execute({
      sql: `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      args,
    });

    return NextResponse.json({ message: "Staff member updated successfully." });
  } catch (err) {
    console.error("[staff/PUT]", err);
    return NextResponse.json(
      { error: "Failed to update staff member." },
      { status: 500 },
    );
  }
}

// ─── DELETE /api/admin/staff/[id] ─────────────────────────────────────────────
// Soft-delete: sets is_active = 0, never removes the record
export async function DELETE(req, { params }) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Only owner can deactivate accounts
  if (user.role_key !== "owner") {
    return NextResponse.json(
      { error: "Forbidden. Only the owner can deactivate accounts." },
      { status: 403 },
    );
  }

  const { id } = await params;

  // Prevent self-deactivation
  if (String(id) === String(user.sub)) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account." },
      { status: 400 },
    );
  }

  try {
    const target = await db.execute({
      sql: `SELECT id, is_active FROM users WHERE id = ?`,
      args: [id],
    });

    if (!target.rows[0]) {
      return NextResponse.json(
        { error: "Staff member not found." },
        { status: 404 },
      );
    }

    if (!target.rows[0].is_active) {
      return NextResponse.json(
        { error: "This account is already deactivated." },
        { status: 400 },
      );
    }

    await db.execute({
      sql: `UPDATE users SET is_active = 0 WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({
      message: "Staff member deactivated successfully.",
    });
  } catch (err) {
    console.error("[staff/DELETE]", err);
    return NextResponse.json(
      { error: "Failed to deactivate staff member." },
      { status: 500 },
    );
  }
}
