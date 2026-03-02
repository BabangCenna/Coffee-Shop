import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, buildAuthCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    // ── Basic validation ────────────────────────────────────────────────────
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Identifier and password are required." },
        { status: 400 },
      );
    }

    const id = identifier.trim().toLowerCase();

    // ── Look up user by phone OR username ───────────────────────────────────
    const result = await db.execute({
      sql: `
        SELECT
          u.id,
          u.full_name,
          u.username,
          u.phone,
          u.password_hash,
          u.is_active,
          r.role_key,
          r.display_name AS role_display
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE (LOWER(u.phone) = ? OR LOWER(u.username) = ?)
        LIMIT 1
      `,
      args: [id, id],
    });

    const user = result.rows[0];

    // ── User not found ──────────────────────────────────────────────────────
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 },
      );
    }

    // ── Account deactivated ─────────────────────────────────────────────────
    if (!user.is_active) {
      return NextResponse.json(
        { error: "This account has been deactivated. Contact your manager." },
        { status: 403 },
      );
    }

    // ── Password check ──────────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 },
      );
    }

    // ── Update last_login_at ────────────────────────────────────────────────
    await db.execute({
      sql: `UPDATE users SET last_login_at = datetime('now') WHERE id = ?`,
      args: [user.id],
    });

    // ── Log session ─────────────────────────────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const ua = req.headers.get("user-agent") ?? "unknown";
    const sessionToken = crypto.randomUUID();

    await db.execute({
      sql: `
        INSERT INTO user_sessions (user_id, session_token, ip_address, device_info)
        VALUES (?, ?, ?, ?)
      `,
      args: [user.id, sessionToken, ip, ua],
    });

    // ── Sign JWT ────────────────────────────────────────────────────────────
    const token = await signToken({
      sub: String(user.id),
      username: user.username,
      full_name: user.full_name,
      role_key: user.role_key,
      role_display: user.role_display,
    });

    // ── Set cookie & respond ────────────────────────────────────────────────
    return NextResponse.json(
      {
        user: {
          id: user.id,
          full_name: user.full_name,
          username: user.username,
          role_key: user.role_key,
          role_display: user.role_display,
        },
      },
      {
        status: 200,
        headers: { "Set-Cookie": buildAuthCookie(token) },
      },
    );
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
