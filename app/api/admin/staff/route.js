import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// ─── GET /api/admin/staff ─────────────────────────────────────────────────────
// Returns all users with their role info
export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const result = await db.execute({
      sql: `
        SELECT
          u.id,
          u.full_name,
          u.username,
          u.phone,
          u.is_active,
          u.last_login_at,
          u.created_at,
          r.id        AS role_id,
          r.role_key,
          r.display_name AS role_display
        FROM users u
        JOIN roles r ON r.id = u.role_id
        ORDER BY u.created_at DESC
      `,
      args: [],
    });

    return NextResponse.json({ staff: result.rows });
  } catch (err) {
    console.error("[staff/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch staff." },
      { status: 500 },
    );
  }
}

// ─── POST /api/admin/staff ────────────────────────────────────────────────────
// Create a new staff account
export async function POST(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // Only owner can create staff
  if (!["owner", "manager"].includes(user.role_key)) {
    return NextResponse.json(
      { error: "Forbidden. Insufficient permissions." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const { full_name, username, phone, password, role_id } = body;

    // Validate required fields
    if (!full_name?.trim() || !username?.trim() || !password || !role_id) {
      return NextResponse.json(
        { error: "Full name, username, password, and role are required." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    // Check username uniqueness
    const existing = await db.execute({
      sql: `SELECT id FROM users WHERE LOWER(username) = ?`,
      args: [username.trim().toLowerCase()],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: `Username "${username}" is already taken.` },
        { status: 409 },
      );
    }

    // Check phone uniqueness if provided
    if (phone?.trim()) {
      const existingPhone = await db.execute({
        sql: `SELECT id FROM users WHERE phone = ?`,
        args: [phone.trim()],
      });
      if (existingPhone.rows.length > 0) {
        return NextResponse.json(
          { error: "That phone number is already registered to another user." },
          { status: 409 },
        );
      }
    }

    // Verify role exists and get its key
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

    const targetRoleKey = roleCheck.rows[0].role_key;

    // Nobody can create a second owner
    if (targetRoleKey === "owner") {
      return NextResponse.json(
        {
          error:
            "Only one Owner account is allowed. You cannot create another owner.",
        },
        { status: 403 },
      );
    }

    // Only owner can assign manager role — managers cannot promote others to manager
    if (targetRoleKey === "manager" && user.role_key !== "owner") {
      return NextResponse.json(
        { error: "Only the Owner can assign the Manager role." },
        { status: 403 },
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Insert
    const insert = await db.execute({
      sql: `
        INSERT INTO users (full_name, username, phone, password_hash, role_id, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `,
      args: [
        full_name.trim(),
        username.trim(),
        phone?.trim() || null,
        password_hash,
        role_id,
        user.sub,
      ],
    });

    return NextResponse.json(
      {
        message: "Staff member created successfully.",
        id: Number(insert.lastInsertRowid),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[staff/POST]", err);
    return NextResponse.json(
      { error: "Failed to create staff member." },
      { status: 500 },
    );
  }
}
