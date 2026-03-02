import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

// Roles allowed to access /admin
const ADMIN_ROLES = [
  "owner",
  "manager",
  "stock_clerk",
  "cashier",
  "barista",
  "viewer",
];

const AUTH_ROUTES = ["/login", "/forgot-password"];

// Some admin sections are further restricted by role
const ROLE_RESTRICTIONS = [
  { prefix: "/admin/staff", allowed: ["owner", "manager"] },
  { prefix: "/admin/reports", allowed: ["owner", "manager", "viewer"] },
  { prefix: "/admin/settings", allowed: ["owner"] },
];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Skip API routes — they handle auth themselves
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  const user = await getUserFromRequest(req);

  // ── Unauthenticated → redirect to login ──────────────────────────────────
  if (isAdminRoute && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated but role not allowed in admin at all ───────────────────
  if (isAdminRoute && user && !ADMIN_ROLES.includes(user.role_key)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // ── Role-restricted sections ─────────────────────────────────────────────
  if (isAdminRoute && user) {
    const restriction = ROLE_RESTRICTIONS.find((r) =>
      pathname.startsWith(r.prefix),
    );
    if (restriction && !restriction.allowed.includes(user.role_key)) {
      return NextResponse.redirect(new URL("/admin/unauthorized", req.url));
    }
  }

  // ── Already logged in → don't show login page again ─────────────────────
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
