"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

// ─── Navigation tree ──────────────────────────────────────────────────────────
const NAV = [
  {
    section: "Operations",
    items: [
      { label: "Dashboard", href: "/admin", icon: "fa-chart-pie" },
      { label: "Orders", href: "/admin/orders", icon: "fa-receipt" },
      { label: "Menu", href: "/admin/menu", icon: "fa-book-open" },
    ],
  },
  {
    section: "Inventory",
    items: [
      { label: "Products", href: "/admin/products", icon: "fa-boxes-stacked" },
      { label: "Stock", href: "/admin/stock", icon: "fa-warehouse" },
      { label: "Suppliers", href: "/admin/suppliers", icon: "fa-truck" },
      {
        label: "Purchase Orders",
        href: "/admin/purchase-orders",
        icon: "fa-file-invoice",
      },
    ],
  },
  {
    section: "Customers",
    items: [
      { label: "Customers", href: "/admin/customers", icon: "fa-users" },
      { label: "Loyalty", href: "/admin/loyalty", icon: "fa-star" },
    ],
  },
  {
    section: "Management",
    items: [
      { label: "Staff", href: "/admin/staff", icon: "fa-id-badge" },
      { label: "Shifts", href: "/admin/shifts", icon: "fa-clock" },
      { label: "Reports", href: "/admin/reports", icon: "fa-chart-line" },
      { label: "Settings", href: "/admin/settings", icon: "fa-gear" },
    ],
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch the real logged-in user from JWT on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // close mobile sidebar on route change
  useEffect(() => {
    setSideOpen(false);
  }, [pathname]);

  // close user-menu on outside click
  useEffect(() => {
    const handler = () => setUserMenu(false);
    if (userMenu) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenu]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // ── palette vars injected as CSS custom properties ──
  const palette = dark
    ? {
        bg: "#121212",
        surface: "#1A1A1B",
        border: "#2a2a2b",
        text: "#E4D1B9",
        muted: "#AF8F6F",
        accent: "#4A634E",
        accentHover: "#5a7a5e",
        accent2: "#D4B89A",
        sidebar: "#0e0e0e",
        topbar: "rgba(18,18,18,0.95)",
        card: "#1A1A1B",
        cardBorder: "#2a2a2b",
      }
    : {
        bg: "#F8F4EF",
        surface: "#FFFFFF",
        border: "#e8e0d6",
        text: "#1A1A1B",
        muted: "#5C5C5C",
        accent: "#2E4031",
        accentHover: "#3a5240",
        accent2: "#AF8F6F",
        sidebar: "#FFFFFF",
        topbar: "rgba(248,244,239,0.95)",
        card: "#FFFFFF",
        cardBorder: "#e8e0d6",
      };

  // helper: is this nav item active?
  const isActive = (href) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Google fonts + FA */}
      <link
        rel='stylesheet'
        href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
      />
      <link
        href='https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap'
        rel='stylesheet'
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        :root {
          --bg:       ${palette.bg};
          --surface:  ${palette.surface};
          --border:   ${palette.border};
          --text:     ${palette.text};
          --muted:    ${palette.muted};
          --accent:   ${palette.accent};
          --accent-h: ${palette.accentHover};
          --accent2:  ${palette.accent2};
          --sidebar:  ${palette.sidebar};
          --topbar:   ${palette.topbar};
          --card:     ${palette.card};
          --cb:       ${palette.cardBorder};
        }
        html, body { margin:0; padding:0; background: var(--bg); color: var(--text);
          font-family: 'DM Sans', sans-serif; height:100%; transition: background .3s, color .3s; }

        /* scrollbar */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        .sidebar-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: .875rem; font-weight: 500;
          color: var(--muted); text-decoration: none;
          transition: background .18s, color .18s;
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-link:hover  { background: ${dark ? "rgba(74,99,78,.15)" : "rgba(46,64,49,.07)"}; color: var(--text); }
        .sidebar-link.active { background: var(--accent); color: #fff !important; }
        .sidebar-link.active .nav-icon { color: #fff !important; }

        .nav-icon { font-size: 15px; flex-shrink: 0; width: 18px; text-align: center; color: var(--muted); transition: color .18s; }
        .sidebar-link:hover .nav-icon { color: var(--accent); }

        .topbar-btn {
          width:36px; height:36px; border-radius:8px; border:none;
          background: ${dark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)"};
          color: var(--muted); cursor:pointer; display:flex; align-items:center; justify-content:center;
          transition: background .18s, color .18s; font-size: 15px;
        }
        .topbar-btn:hover { background: var(--accent); color:#fff; }

        .badge {
          display:inline-flex; align-items:center; justify-content:center;
          min-width:18px; height:18px; padding:0 5px;
          background: #c0392b; color:#fff; border-radius:99px;
          font-size:.65rem; font-weight:700; line-height:1;
        }

        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .fade-in { animation: fadeIn .25s ease both; }

        /* mobile overlay */
        .overlay {
          position:fixed; inset:0; background:rgba(0,0,0,.5);
          z-index:40; backdrop-filter: blur(2px);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        {/* ══════════ MOBILE OVERLAY ══════════ */}
        {sideOpen && (
          <div className='overlay' onClick={() => setSideOpen(false)} />
        )}

        {/* ══════════ SIDEBAR ══════════ */}
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 50,
            width: collapsed ? 64 : 240,
            background: "var(--sidebar)",
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            transition: "width .25s ease, transform .25s ease",
            transform: sideOpen ? "translateX(0)" : undefined,
            // on mobile, hide off-screen unless sideOpen
            ...(typeof window !== "undefined" && window.innerWidth < 768
              ? { transform: sideOpen ? "translateX(0)" : "translateX(-100%)" }
              : {}),
            overflow: "hidden",
          }}
          className='max-md:translate-x-[-100%]'
        >
          {/* Logo */}
          <div
            style={{
              height: 64,
              display: "flex",
              alignItems: "center",
              padding: collapsed ? "0 20px" : "0 20px",
              borderBottom: "1px solid var(--border)",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className='fa-solid fa-mug-hot'
                style={{ color: "#fff", fontSize: 14 }}
              />
            </div>
            {!collapsed && (
              <span
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                }}
              >
                Forêt
              </span>
            )}
          </div>

          {/* Nav */}
          <nav
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "12px 8px",
            }}
          >
            {NAV.map((section) => (
              <div key={section.section} style={{ marginBottom: 4 }}>
                {!collapsed && (
                  <div
                    style={{
                      fontSize: ".68rem",
                      fontWeight: 600,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      padding: "10px 12px 4px",
                      opacity: 0.6,
                    }}
                  >
                    {section.section}
                  </div>
                )}
                {collapsed && <div style={{ height: 12 }} />}
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link${isActive(item.href) ? " active" : ""}`}
                    title={collapsed ? item.label : undefined}
                    style={{ justifyContent: collapsed ? "center" : undefined }}
                  >
                    <i className={`fa-solid ${item.icon} nav-icon`} />
                    {!collapsed && item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          {/* Sidebar footer — collapse toggle (desktop only) */}
          <div
            style={{
              padding: "12px 8px",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setCollapsed(!collapsed)}
              className='sidebar-link'
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                justifyContent: collapsed ? "center" : undefined,
              }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <i
                className={`fa-solid ${collapsed ? "fa-chevron-right" : "fa-chevron-left"} nav-icon`}
              />
              {!collapsed && (
                <span style={{ color: "var(--muted)", fontSize: ".85rem" }}>
                  Collapse
                </span>
              )}
            </button>
          </div>
        </aside>

        {/* ══════════ MAIN COLUMN (topbar + content + footer) ══════════ */}
        <div
          style={{
            flex: 1,
            marginLeft: collapsed ? 64 : 240,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            overflow: "hidden",
            transition: "margin-left .25s ease",
            // on mobile no margin
          }}
          className='max-md:!ml-0'
        >
          {/* ── TOPBAR ── */}
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              height: 64,
              background: "var(--topbar)",
              backdropFilter: "blur(12px)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              padding: "0 20px",
              gap: 12,
              flexShrink: 0,
            }}
          >
            {/* Hamburger (mobile) */}
            <button
              className='topbar-btn'
              onClick={() => setSideOpen(!sideOpen)}
              style={{ display: "none" }}
              id='hamburger'
            >
              <i className='fa-solid fa-bars' />
            </button>

            {/* Breadcrumb / page title */}
            <div style={{ flex: 1 }}>
              <Breadcrumb pathname={pathname} />
            </div>

            {/* Right actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Search */}
              <button className='topbar-btn' title='Search'>
                <i className='fa-solid fa-magnifying-glass' />
              </button>

              {/* Notifications */}
              <div style={{ position: "relative" }}>
                <button className='topbar-btn' title='Notifications'>
                  <i className='fa-solid fa-bell' />
                </button>
                <span
                  className='badge'
                  style={{ position: "absolute", top: -4, right: -4 }}
                >
                  3
                </span>
              </div>

              {/* Dark mode toggle */}
              <button
                className='topbar-btn'
                onClick={() => setDark(!dark)}
                title='Toggle theme'
              >
                <i className={`fa-solid ${dark ? "fa-sun" : "fa-moon"}`} />
              </button>

              {/* Divider */}
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: "var(--border)",
                  margin: "0 4px",
                }}
              />

              {/* User menu */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenu(!userMenu);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: 8,
                    transition: "background .18s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = dark
                      ? "rgba(255,255,255,.05)"
                      : "rgba(0,0,0,.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: "#fff",
                      fontSize: ".8rem",
                      flexShrink: 0,
                    }}
                  >
                    {currentUser
                      ? currentUser.full_name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "…"}
                  </div>
                  <div style={{ textAlign: "left", lineHeight: 1.3 }}>
                    <div
                      style={{
                        fontSize: ".82rem",
                        fontWeight: 600,
                        color: "var(--text)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {currentUser
                        ? currentUser.full_name.split(" ").slice(0, 2).join(" ")
                        : "Loading…"}
                    </div>
                    <div
                      style={{
                        fontSize: ".72rem",
                        color: "var(--muted)",
                        textTransform: "capitalize",
                      }}
                    >
                      {currentUser ? currentUser.role_display : ""}
                    </div>
                  </div>
                  <i
                    className='fa-solid fa-chevron-down'
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      marginLeft: 2,
                    }}
                  />
                </button>

                {/* Dropdown */}
                {userMenu && (
                  <div
                    className='fade-in'
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: 200,
                      background: "var(--card)",
                      border: "1px solid var(--cb)",
                      borderRadius: 12,
                      boxShadow: dark
                        ? "0 16px 40px rgba(0,0,0,.5)"
                        : "0 16px 40px rgba(46,64,49,.12)",
                      overflow: "hidden",
                      zIndex: 100,
                    }}
                  >
                    {[
                      {
                        icon: "fa-user",
                        label: "My Profile",
                        href: "/admin/profile",
                      },
                      {
                        icon: "fa-gear",
                        label: "Settings",
                        href: "/admin/settings",
                      },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "11px 16px",
                          textDecoration: "none",
                          color: "var(--text)",
                          fontSize: ".85rem",
                          transition: "background .15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = dark
                            ? "rgba(255,255,255,.04)"
                            : "rgba(0,0,0,.03)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <i
                          className={`fa-solid ${item.icon}`}
                          style={{
                            color: "var(--muted)",
                            width: 16,
                            textAlign: "center",
                          }}
                        />
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ height: 1, background: "var(--border)" }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 16px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#c0392b",
                        fontSize: ".85rem",
                        transition: "background .15s",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(192,57,43,.06)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "none")
                      }
                    >
                      <i
                        className='fa-solid fa-arrow-right-from-bracket'
                        style={{ width: 16, textAlign: "center" }}
                      />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ── MAIN CONTENT ── */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "28px 24px",
              background: "var(--bg)",
            }}
          >
            {children}
          </main>

          {/* ── FOOTER ── */}
          <footer
            style={{
              height: 48,
              flexShrink: 0,
              borderTop: "1px solid var(--border)",
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
            }}
          >
            <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>
              © 2025 Forêt Coffee ·{" "}
              <span style={{ fontFamily: "'Playfair Display',serif" }}>
                Kopi Flow
              </span>{" "}
              v1.0.0
            </span>
            <span
              style={{
                fontSize: ".75rem",
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i
                className='fa-solid fa-circle'
                style={{ fontSize: 6, color: "#22c55e" }}
              />
              All systems operational
            </span>
          </footer>
        </div>
      </div>

      {/* Mobile: show hamburger, hide collapse btn */}
      <style>{`
        @media (max-width: 767px) {
          #hamburger { display:flex !important; }
          aside { transform: translateX(${sideOpen ? "0" : "-100%"}) !important; }
          .main-col { margin-left: 0 !important; }
        }
      `}</style>
    </>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ pathname }) {
  const parts = pathname.replace("/admin", "").split("/").filter(Boolean);
  const crumbs = [
    { label: "Admin", href: "/admin" },
    ...parts.map((p, i) => ({
      label: p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/admin/" + parts.slice(0, i + 1).join("/"),
    })),
  ];

  if (crumbs.length === 1) {
    return (
      <span
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--text)",
        }}
      >
        Dashboard
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {crumbs.map((c, i) => (
        <span
          key={c.href}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {i > 0 && (
            <i
              className='fa-solid fa-chevron-right'
              style={{ fontSize: 9, color: "var(--muted)" }}
            />
          )}
          {i === crumbs.length - 1 ? (
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {c.label}
            </span>
          ) : (
            <Link
              href={c.href}
              style={{
                fontSize: ".85rem",
                color: "var(--muted)",
                textDecoration: "none",
              }}
            >
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
