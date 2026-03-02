"use client";

import { useState } from "react";

// ─── Mock data (replace with real API calls later) ────────────────────────────
const STATS = [
  {
    label: "Today's Revenue",
    value: "Rp 1.284.000",
    delta: "+12%",
    up: true,
    icon: "fa-coins",
    color: "#2E4031",
  },
  {
    label: "Orders Today",
    value: "47",
    delta: "+5",
    up: true,
    icon: "fa-receipt",
    color: "#AF8F6F",
  },
  {
    label: "Items Low Stock",
    value: "3",
    delta: "-1",
    up: false,
    icon: "fa-triangle-exclamation",
    color: "#e67e22",
  },
  {
    label: "Active Customers",
    value: "128",
    delta: "+8",
    up: true,
    icon: "fa-users",
    color: "#2980b9",
  },
];

const RECENT_ORDERS = [
  {
    id: "#1042",
    customer: "Arinta W.",
    items: "Latte, Croissant",
    total: "Rp 67.000",
    status: "completed",
    method: "qris",
    time: "2 min ago",
  },
  {
    id: "#1041",
    customer: "Walk-in",
    items: "Espresso × 2",
    total: "Rp 64.000",
    status: "completed",
    method: "cash",
    time: "8 min ago",
  },
  {
    id: "#1040",
    customer: "Budi S.",
    items: "Cold Brew, Matcha",
    total: "Rp 93.000",
    status: "in_progress",
    method: "qris",
    time: "11 min ago",
  },
  {
    id: "#1039",
    customer: "Citra M.",
    items: "Cappuccino",
    total: "Rp 40.000",
    status: "completed",
    method: "cash",
    time: "18 min ago",
  },
  {
    id: "#1038",
    customer: "Walk-in",
    items: "Iced Caramel × 2",
    total: "Rp 100.000",
    status: "cancelled",
    method: "card",
    time: "25 min ago",
  },
];

const LOW_STOCK = [
  {
    name: "Oat Milk",
    qty: "800 ml",
    threshold: "1 L",
    category: "Milk & Dairy",
  },
  {
    name: "Vanilla Syrup",
    qty: "120 ml",
    threshold: "250 ml",
    category: "Syrups",
  },
  {
    name: "Paper Cups 8oz",
    qty: "14 pcs",
    threshold: "50 pcs",
    category: "Packaging",
  },
];

const QUICK_ACTIONS = [
  {
    label: "New Order",
    icon: "fa-plus",
    href: "/admin/orders/new",
    color: "#2E4031",
  },
  {
    label: "Receive Stock",
    icon: "fa-boxes-stacked",
    href: "/admin/stock/receive",
    color: "#AF8F6F",
  },
  {
    label: "Add Customer",
    icon: "fa-user-plus",
    href: "/admin/customers/new",
    color: "#2980b9",
  },
  {
    label: "Daily Report",
    icon: "fa-chart-line",
    href: "/admin/reports/daily",
    color: "#8e44ad",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  completed: { bg: "rgba(46,64,49,.1)", text: "#2E4031", label: "Completed" },
  in_progress: {
    bg: "rgba(41,128,185,.1)",
    text: "#2980b9",
    label: "In Progress",
  },
  cancelled: { bg: "rgba(192,57,43,.1)", text: "#c0392b", label: "Cancelled" },
  pending: { bg: "rgba(230,126,34,.1)", text: "#e67e22", label: "Pending" },
};

const METHOD_ICON = {
  cash: "fa-money-bill-wave",
  qris: "fa-qrcode",
  transfer: "fa-building-columns",
  card: "fa-credit-card",
};

// ─── Mini bar chart (pure CSS/SVG, no library needed) ─────────────────────────
const HOURLY = [12, 28, 45, 62, 38, 71, 89, 95, 74, 58, 42, 33];
const HOURS = [
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
];

function MiniBarChart() {
  const max = Math.max(...HOURLY);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        height: 80,
        padding: "0 4px",
      }}
    >
      {HOURLY.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            title={`${HOURS[i]}:00 — ${v} orders`}
            style={{
              width: "100%",
              borderRadius: "3px 3px 0 0",
              height: `${(v / max) * 100}%`,
              background:
                i === 6
                  ? "var(--accent)"
                  : "var(--accent-faint, rgba(46,64,49,.2))",
              transition: "height .4s ease",
              cursor: "default",
            }}
          />
          <span style={{ fontSize: ".6rem", color: "var(--muted)" }}>
            {HOURS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut chart (SVG) ────────────────────────────────────────────────────────
function DonutChart() {
  const data = [
    { label: "QRIS", value: 48, color: "#2E4031" },
    { label: "Cash", value: 35, color: "#AF8F6F" },
    { label: "Transfer", value: 10, color: "#2980b9" },
    { label: "Card", value: 7, color: "#e67e22" },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 36,
    cx = 44,
    cy = 44,
    stroke = 14;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = data.map((d) => {
    const dash = (d.value / total) * circumference;
    const gap = circumference - dash;
    const sl = { ...d, dash, gap, offset };
    offset += dash;
    return sl;
  });

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
      <svg width={88} height={88} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill='none'
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={circumference / 4 - s.offset}
            style={{ transition: "stroke-dasharray .6s ease" }}
          />
        ))}
        <text
          x={cx}
          y={cy}
          textAnchor='middle'
          dominantBaseline='middle'
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 13,
            fontWeight: 700,
            fill: "var(--text)",
          }}
        >
          47
        </text>
        <text
          x={cx}
          y={cy + 13}
          textAnchor='middle'
          style={{ fontSize: 7, fill: "var(--muted)" }}
        >
          orders
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {data.map((d) => (
          <div
            key={d.label}
            style={{ display: "flex", alignItems: "center", gap: 7 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: d.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{ fontSize: ".78rem", color: "var(--muted)", flex: 1 }}
            >
              {d.label}
            </span>
            <span
              style={{
                fontSize: ".78rem",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("today");

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ margin: "0 auto" }}>
      {/* ── Page header ── */}
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            Good morning, Aulia 👋
          </h1>
          <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>{today}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Period tabs */}
          {["today", "week", "month"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background:
                  activeTab === t ? "var(--accent)" : "var(--surface)",
                color: activeTab === t ? "#fff" : "var(--muted)",
                fontSize: ".82rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {STATS.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--card)",
              border: "1px solid var(--cb)",
              borderRadius: 14,
              padding: "20px 20px 18px",
              boxShadow: "0 2px 12px rgba(0,0,0,.04)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  fontSize: ".8rem",
                  color: "var(--muted)",
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: `${s.color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className={`fa-solid ${s.icon}`}
                  style={{ color: s.color, fontSize: 15 }}
                />
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  marginTop: 6,
                }}
              >
                <i
                  className={`fa-solid ${s.up ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`}
                  style={{ fontSize: 11, color: s.up ? "#22c55e" : "#ef4444" }}
                />
                <span
                  style={{
                    fontSize: ".75rem",
                    color: s.up ? "#22c55e" : "#ef4444",
                    fontWeight: 600,
                  }}
                >
                  {s.delta}
                </span>
                <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                  vs yesterday
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Hourly orders */}
        <div
          style={{
            gridColumn: "span 2",
            background: "var(--card)",
            border: "1px solid var(--cb)",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: "var(--text)",
                  fontSize: ".9rem",
                }}
              >
                Hourly Orders
              </div>
              <div
                style={{
                  fontSize: ".75rem",
                  color: "var(--muted)",
                  marginTop: 2,
                }}
              >
                Orders per hour today
              </div>
            </div>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: 99,
                background: "rgba(46,64,49,.1)",
                color: "var(--accent)",
                fontSize: ".72rem",
                fontWeight: 600,
              }}
            >
              Peak: 14:00
            </div>
          </div>
          <MiniBarChart />
        </div>

        {/* Payment methods */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--cb)",
            borderRadius: 14,
            padding: 20,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: "var(--text)",
              fontSize: ".9rem",
              marginBottom: 4,
            }}
          >
            Payment Mix
          </div>
          <div
            style={{
              fontSize: ".75rem",
              color: "var(--muted)",
              marginBottom: 16,
            }}
          >
            Today's breakdown
          </div>
          <DonutChart />
        </div>
      </div>

      {/* ── Bottom row: Recent orders + Low stock + Quick actions ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Recent orders */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--cb)",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--cb)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "var(--text)",
                fontSize: ".9rem",
              }}
            >
              Recent Orders
            </div>
            <a
              href='/admin/orders'
              style={{
                fontSize: ".78rem",
                color: "var(--accent)",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              View all{" "}
              <i className='fa-solid fa-arrow-right' style={{ fontSize: 10 }} />
            </a>
          </div>
          <div>
            {RECENT_ORDERS.map((order, i) => {
              const st = STATUS_STYLES[order.status];
              return (
                <div
                  key={order.id}
                  style={{
                    padding: "12px 20px",
                    borderBottom:
                      i < RECENT_ORDERS.length - 1
                        ? "1px solid var(--cb)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {/* Method icon */}
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: "var(--bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className={`fa-solid ${METHOD_ICON[order.method]}`}
                      style={{ color: "var(--muted)", fontSize: 13 }}
                    />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: ".82rem",
                          color: "var(--text)",
                        }}
                      >
                        {order.id}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: ".82rem",
                          color: "var(--text)",
                        }}
                      >
                        {order.total}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: ".75rem",
                          color: "var(--muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 160,
                        }}
                      >
                        {order.customer} · {order.items}
                      </span>
                      <span
                        style={{
                          fontSize: ".68rem",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background: st.bg,
                          color: st.text,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Low stock + Quick actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Quick actions */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--cb)",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: "var(--text)",
                fontSize: ".9rem",
                marginBottom: 14,
              }}
            >
              Quick Actions
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {QUICK_ACTIONS.map((a) => (
                <a
                  key={a.label}
                  href={a.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 10,
                    textDecoration: "none",
                    border: "1px solid var(--cb)",
                    background: "var(--bg)",
                    transition: "all .18s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = a.color;
                    e.currentTarget.style.borderColor = a.color;
                    e.currentTarget
                      .querySelectorAll("*")
                      .forEach((el) => (el.style.color = "#fff"));
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg)";
                    e.currentTarget.style.borderColor = "var(--cb)";
                    e.currentTarget
                      .querySelectorAll("*")
                      .forEach((el) => (el.style.color = ""));
                  }}
                >
                  <i
                    className={`fa-solid ${a.icon}`}
                    style={{
                      color: a.color,
                      fontSize: 15,
                      transition: "color .18s",
                    }}
                  />
                  <span
                    style={{
                      fontSize: ".8rem",
                      fontWeight: 500,
                      color: "var(--text)",
                      transition: "color .18s",
                    }}
                  >
                    {a.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Low stock alerts */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--cb)",
              borderRadius: 14,
              overflow: "hidden",
              flex: 1,
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--cb)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <i
                  className='fa-solid fa-triangle-exclamation'
                  style={{ color: "#e67e22", fontSize: 14 }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--text)",
                    fontSize: ".9rem",
                  }}
                >
                  Low Stock
                </span>
                <span
                  style={{
                    fontSize: ".68rem",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 99,
                    background: "rgba(230,126,34,.12)",
                    color: "#e67e22",
                  }}
                >
                  {LOW_STOCK.length}
                </span>
              </div>
              <a
                href='/admin/stock'
                style={{
                  fontSize: ".78rem",
                  color: "var(--accent)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Manage{" "}
                <i
                  className='fa-solid fa-arrow-right'
                  style={{ fontSize: 10 }}
                />
              </a>
            </div>
            {LOW_STOCK.map((item, i) => (
              <div
                key={item.name}
                style={{
                  padding: "12px 20px",
                  borderBottom:
                    i < LOW_STOCK.length - 1 ? "1px solid var(--cb)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: "rgba(230,126,34,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className='fa-solid fa-box-open'
                    style={{ color: "#e67e22", fontSize: 14 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: ".82rem",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      fontSize: ".73rem",
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {item.category}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: ".82rem",
                      fontWeight: 700,
                      color: "#e67e22",
                    }}
                  >
                    {item.qty}
                  </div>
                  <div style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                    min {item.threshold}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div style={{ height: 8 }} />
    </div>
  );
}
