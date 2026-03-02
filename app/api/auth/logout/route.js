import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest, buildClearCookie } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await getUserFromRequest(req);

    if (user) {
      await db.execute({
        sql: `
          UPDATE user_sessions
          SET logout_at = datetime('now')
          WHERE user_id = ?
            AND logout_at IS NULL
        `,
        args: [user.sub],
      });
    }

    return NextResponse.json(
      { message: "Logged out successfully." },
      {
        status: 200,
        headers: { "Set-Cookie": buildClearCookie() },
      },
    );
  } catch (err) {
    console.error("[auth/logout]", err);
    return NextResponse.json(
      { message: "Logged out." },
      {
        status: 200,
        headers: { "Set-Cookie": buildClearCookie() },
      },
    );
  }
}
