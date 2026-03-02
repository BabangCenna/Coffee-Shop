import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/admin/roles
export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const result = await db.execute({
      sql: `SELECT id, role_key, display_name, description FROM roles ORDER BY id ASC`,
      args: [],
    });
    return NextResponse.json({ roles: result.rows });
  } catch (err) {
    console.error("[roles/GET]", err);
    return NextResponse.json(
      { error: "Failed to fetch roles." },
      { status: 500 },
    );
  }
}
