import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.sub,
      full_name: user.full_name,
      username: user.username,
      role_key: user.role_key,
      role_display: user.role_display,
    },
  });
}
