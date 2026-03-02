"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtP = (n) => `Rp ${fmt(n)}`;

const STATUS_STYLES = {
  completed: { bg: "rgba(39,174,96,.1)", text: "#27ae60", label: "Completed" },
  in_progress: {
    bg: "rgba(41,128,185,.1)",
    text: "#2980b9",
    label: "In Progress",
  },
  cancelled: { bg: "rgba(192,57,43,.1)", text: "#c0392b", label: "Cancelled" },
  pending: { bg: "rgba(243,156,18,.12)", text: "#d68910", label: "Pending" },
};
const METHOD_ICON = {
  cash: "fa-money-bill-wave",
  qris: "fa-qrcode",
  transfer: "fa-building-columns",
  card: "fa-credit-card",
};
const C = {
  accent: "#2E4031",
  warm: "#AF8F6F",
  blue: "#2980b9",
  orange: "#e67e22",
  purple: "#8e44ad",
};

// Chart.js shared tooltip style
const tooltip = {
  backgroundColor: "#fff",
  titleColor: "#1a1a1a",
  bodyColor: "#666",
  borderColor: "#e5e5e5",
  borderWidth: 1,
  padding: 10,
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ w = "100%", h = 20, r = 6 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        flexShrink: 0,
        background:
          "linear-gradient(90deg,var(--border) 25%,var(--cb) 50%,var(--border) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite linear",
      }}
    />
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, up, icon, color, loading }) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--cb)",
        borderRadius: 14,
        padding: "20px 20px 18px",
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
          style={{ fontSize: ".8rem", color: "var(--muted)", fontWeight: 500 }}
        >
          {label}
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: `${color}1A`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className={`fa-solid ${icon}`} style={{ color, fontSize: 15 }} />
        </div>
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Sk h={28} w='70%' />
          <Sk h={14} w='50%' r={4} />
        </div>
      ) : (
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.55rem",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1,
            }}
          >
            {value}
          </div>
          {delta != null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginTop: 6,
              }}
            >
              <i
                className={`fa-solid fa-arrow-trend-${up ? "up" : "down"}`}
                style={{ fontSize: 11, color: up ? "#22c55e" : "#ef4444" }}
              />
              <span
                style={{
                  fontSize: ".75rem",
                  color: up ? "#22c55e" : "#ef4444",
                  fontWeight: 600,
                }}
              >
                {delta}
              </span>
              <span style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                vs prev. period
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bar chart: hourly (today) or daily (week/month) ──────────────────────────
function OrdersBarChart({ data, period, loading }) {
  if (loading)
    return (
      <div
        style={{
          height: 120,
          display: "flex",
          alignItems: "flex-end",
          gap: 5,
          padding: "0 2px",
        }}
      >
        {[55, 70, 45, 80, 60, 95, 75, 88, 50, 65, 40, 72].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: "3px 3px 0 0",
              background: "var(--border)",
              animation: "shimmer 1.4s infinite linear",
            }}
          />
        ))}
      </div>
    );

  const values = (data ?? []).map((d) => Number(d.count));
  const maxVal = Math.max(...values, 1);
  const labels = (data ?? []).map((d) =>
    period === "today"
      ? `${String(d.hour).padStart(2, "0")}:00`
      : new Date(d.hour).toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
        }),
  );

  return (
    <div style={{ height: 120 }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label: "Orders",
              data: values,
              backgroundColor: values.map((v) =>
                v === maxVal ? C.accent : `${C.accent}2E`,
              ),
              borderRadius: 5,
              borderSkipped: false,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltip,
              callbacks: { label: (ctx) => ` ${ctx.parsed.y} orders` },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#999", font: { size: 10 }, maxRotation: 0 },
            },
            y: {
              grid: { color: "#f0f0f0" },
              ticks: { color: "#999", font: { size: 10 } },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}

// ─── Line chart: revenue trend ────────────────────────────────────────────────
function RevenueTrendChart({ data, loading }) {
  if (loading) return <Sk h={140} r={8} />;

  const labels = (data ?? []).map((d) =>
    new Date(d.date).toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
    }),
  );

  return (
    <div style={{ height: 140 }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              label: "Revenue",
              data: (data ?? []).map((d) => d.revenue),
              fill: true,
              backgroundColor: `${C.accent}12`,
              borderColor: C.accent,
              borderWidth: 2,
              pointBackgroundColor: C.accent,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.4,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tooltip,
              callbacks: { label: (ctx) => ` ${fmtP(ctx.parsed.y)}` },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#999", font: { size: 10 } },
            },
            y: {
              grid: { color: "#f0f0f0" },
              ticks: {
                color: "#999",
                font: { size: 10 },
                callback: (v) => `Rp ${fmt(v)}`,
              },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}

// ─── Donut chart: payment mix ─────────────────────────────────────────────────
function PaymentDonut({ data, loading }) {
  const COLORS = {
    cash: C.warm,
    qris: C.accent,
    transfer: C.blue,
    card: C.orange,
  };

  if (loading)
    return (
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <Sk w={88} h={88} r={44} />
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Sk key={i} h={12} r={4} />
          ))}
        </div>
      </div>
    );

  const rows = data ?? [];
  const total = rows.reduce((s, d) => s + Number(d.count ?? 0), 0);

  if (!rows.length)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "24px 0",
          color: "var(--muted)",
          fontSize: ".82rem",
        }}
      >
        No payment data yet
      </div>
    );

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
      {/* Donut */}
      <div
        style={{ width: 88, height: 88, position: "relative", flexShrink: 0 }}
      >
        <Doughnut
          data={{
            labels: rows.map((d) => (d.method ?? "").toUpperCase()),
            datasets: [
              {
                data: rows.map((d) => Number(d.count)),
                backgroundColor: rows.map((d) => COLORS[d.method] ?? "#aaa"),
                borderWidth: 0,
                hoverOffset: 4,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tooltip,
                callbacks: {
                  label: (ctx) =>
                    ` ${ctx.label}: ${ctx.parsed} (${total ? Math.round((ctx.parsed / total) * 100) : 0}%)`,
                },
              },
            },
          }}
        />
        {/* Centre label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1,
            }}
          >
            {total}
          </div>
          <div style={{ fontSize: 7, color: "var(--muted)", marginTop: 2 }}>
            orders
          </div>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {rows.map((d) => (
          <div
            key={d.method}
            style={{ display: "flex", alignItems: "center", gap: 7 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: COLORS[d.method] ?? "#aaa",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: ".78rem",
                color: "var(--muted)",
                flex: 1,
                textTransform: "uppercase",
                letterSpacing: ".4px",
              }}
            >
              {d.method}
            </span>
            <span
              style={{
                fontSize: ".78rem",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {total ? Math.round((Number(d.count) / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Top items inline bars ────────────────────────────────────────────────────
function TopItemsBars({ data, loading }) {
  if (loading)
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Sk key={i} h={32} r={6} />
        ))}
      </div>
    );

  const rows = (data ?? []).slice(0, 5);
  const maxQty = Math.max(...rows.map((d) => Number(d.qty_sold ?? 0)), 1);
  const ITEM_C = [C.accent, C.warm, C.blue, C.purple, C.orange];

  if (!rows.length)
    return (
      <div
        style={{
          textAlign: "center",
          padding: "24px 0",
          color: "var(--muted)",
          fontSize: ".82rem",
        }}
      >
        No sales data yet
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((item, i) => (
        <div key={`${item.name}-${i}`}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <span
              style={{
                fontSize: ".82rem",
                fontWeight: 600,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  flexShrink: 0,
                  background: i < 3 ? "rgba(243,156,18,.15)" : "var(--bg)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: ".6rem",
                  fontWeight: 700,
                  color: i < 3 ? "#d68910" : "var(--muted)",
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  maxWidth: 130,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.name ?? "Unknown"}
              </span>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                {fmt(item.qty_sold)}×
              </span>
              <span
                style={{
                  fontSize: ".82rem",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {fmtP(item.revenue)}
              </span>
            </div>
          </div>
          <div
            style={{
              height: 5,
              background: "var(--bg)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: ITEM_C[i] ?? C.accent,
                width: `${(Number(item.qty_sold) / maxQty) * 100}%`,
                transition: "width .6s cubic-bezier(.22,1,.36,1)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [period, setPeriod] = useState("today");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, meRes] = await Promise.all([
        fetch(`/api/admin/dashboard?period=${period}`),
        fetch("/api/auth/me"),
      ]);
      if (dashRes.ok) setData(await dashRes.json());
      if (meRes.ok) setUser((await meRes.json()).user ?? null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Shorthand refs ──────────────────────────────────────────────────────────
  const summary = data?.summary ?? {};
  const hourly = data?.hourly ?? [];
  const weekly = data?.weekly ?? [];
  const payment = data?.payment ?? [];
  const recent = data?.recent_orders ?? [];
  const lowStock = data?.low_stock ?? [];
  const topItems = data?.top_items ?? [];
  const openShift = data?.open_shift ?? null;

  const greet = () => {
    const h = now.getHours();
    if (h < 11) return "Good morning";
    if (h < 15) return "Good afternoon";
    return "Good evening";
  };

  const periodLabel = {
    today: "Today",
    week: "This Week",
    month: "This Month",
  }[period];
  const firstName = user?.full_name?.split(" ")[0] ?? null;
  const todayStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const peakHour = hourly.length
    ? hourly.reduce(
        (a, b) => (Number(b.count) > Number(a.count) ? b : a),
        hourly[0],
      )
    : null;

  const STATS = [
    {
      label: `${periodLabel}'s Revenue`,
      value: fmtP(summary.total_revenue ?? 0),
      delta:
        summary.revenue_delta != null
          ? summary.revenue_delta >= 0
            ? `+${fmtP(summary.revenue_delta)}`
            : `-${fmtP(Math.abs(summary.revenue_delta))}`
          : null,
      up: (summary.revenue_delta ?? 0) >= 0,
      icon: "fa-coins",
      color: C.accent,
    },
    {
      label: `${periodLabel}'s Orders`,
      value: fmt(summary.total_orders ?? 0),
      delta:
        summary.orders_delta != null
          ? summary.orders_delta >= 0
            ? `+${summary.orders_delta}`
            : String(summary.orders_delta)
          : null,
      up: (summary.orders_delta ?? 0) >= 0,
      icon: "fa-receipt",
      color: C.warm,
    },
    {
      label: "Low Stock Items",
      value: String(loading ? "—" : lowStock.length),
      delta: null,
      up: false,
      icon: "fa-triangle-exclamation",
      color: C.orange,
    },
    {
      label: "New Customers",
      value: fmt(summary.active_customers ?? 0),
      delta:
        summary.customers_delta != null
          ? summary.customers_delta >= 0
            ? `+${summary.customers_delta}`
            : String(summary.customers_delta)
          : null,
      up: (summary.customers_delta ?? 0) >= 0,
      icon: "fa-users",
      color: C.blue,
    },
  ];

  const QUICK = [
    {
      label: "New Order",
      icon: "fa-plus",
      href: "/admin/orders",
      color: C.accent,
    },
    {
      label: "Receive Stock",
      icon: "fa-boxes-stacked",
      href: "/admin/stock",
      color: C.warm,
    },
    {
      label: "Add Customer",
      icon: "fa-user-plus",
      href: "/admin/customers",
      color: C.blue,
    },
    {
      label: "Daily Report",
      icon: "fa-chart-line",
      href: "/admin/reports",
      color: C.purple,
    },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
      `}</style>

      {/* Open shift banner */}
      {!loading && openShift && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            background: "rgba(46,64,49,.06)",
            border: "1px solid rgba(46,64,49,.15)",
            borderRadius: 10,
            marginBottom: 20,
            animation: "fadeUp .3s ease",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              flexShrink: 0,
              boxShadow: "0 0 0 3px rgba(46,64,49,.15)",
            }}
          />
          <span style={{ fontSize: ".82rem", color: "var(--text)" }}>
            <b>{openShift.user_name}</b>&apos;s shift started at{" "}
            <b>
              {new Date(openShift.clock_in).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </b>
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: ".78rem",
              color: "var(--muted)",
            }}
          >
            Opening cash:{" "}
            <b style={{ color: "var(--text)" }}>
              {fmtP(openShift.opening_cash)}
            </b>
          </span>
        </div>
      )}

      {/* Page header */}
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
            {greet()}
            {firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
            {todayStr}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {["today", "week", "month"].map((t) => (
            <button
              key={t}
              onClick={() => setPeriod(t)}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: period === t ? "var(--accent)" : "var(--bg)",
                color: period === t ? "#fff" : "var(--muted)",
                fontSize: ".82rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .2s",
                textTransform: "capitalize",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {t}
            </button>
          ))}
          <button
            onClick={fetchDashboard}
            title='Refresh'
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            <i
              className={`fa-solid fa-arrows-rotate${loading ? " fa-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Bar chart — span 2 */}
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
                {period === "today" ? "Hourly Orders" : "Daily Orders"}
              </div>
              <div
                style={{
                  fontSize: ".75rem",
                  color: "var(--muted)",
                  marginTop: 2,
                }}
              >
                {period === "today"
                  ? "Completed orders per hour"
                  : `Completed orders — ${period === "week" ? "last 7" : "last 30"} days`}
              </div>
            </div>
            {!loading && peakHour && (
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
                {period === "today"
                  ? `Peak: ${String(peakHour.hour).padStart(2, "0")}:00`
                  : `Best: ${fmt(peakHour.count)} orders`}
              </div>
            )}
          </div>
          <OrdersBarChart data={hourly} period={period} loading={loading} />
        </div>

        {/* Payment donut */}
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
            {periodLabel}&apos;s breakdown
          </div>
          <PaymentDonut data={payment} loading={loading} />
        </div>
      </div>

      {/* Revenue trend — week / month only */}
      {period !== "today" && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--cb)",
            borderRadius: 14,
            padding: 20,
            marginBottom: 24,
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
                Revenue Trend
              </div>
              <div
                style={{
                  fontSize: ".75rem",
                  color: "var(--muted)",
                  marginTop: 2,
                }}
              >
                Daily revenue —{" "}
                {period === "week" ? "last 7 days" : "last 30 days"}
              </div>
            </div>
            {!loading &&
              weekly.length > 0 &&
              (() => {
                const avg = Math.round(
                  weekly.reduce((s, d) => s + Number(d.revenue ?? 0), 0) /
                    weekly.length,
                );
                return (
                  <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                    Avg / day:{" "}
                    <b style={{ color: "var(--text)" }}>{fmtP(avg)}</b>
                  </div>
                );
              })()}
          </div>
          <RevenueTrendChart data={weekly} loading={loading} />
        </div>
      )}

      {/* Bottom 2-col grid */}
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
          {loading ? (
            <div
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <Sk key={i} h={46} r={8} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              <i
                className='fa-solid fa-receipt'
                style={{
                  fontSize: 24,
                  opacity: 0.2,
                  display: "block",
                  marginBottom: 8,
                }}
              />
              <div style={{ fontSize: ".82rem" }}>No orders yet</div>
            </div>
          ) : (
            recent.map((order, i) => {
              const st = STATUS_STYLES[order.status] ?? STATUS_STYLES.pending;
              return (
                <div
                  key={order.id}
                  style={{
                    padding: "12px 20px",
                    borderBottom:
                      i < recent.length - 1 ? "1px solid var(--cb)" : "none",
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
                      background: "var(--bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className={`fa-solid ${METHOD_ICON[order.payment_method] ?? "fa-money-bill"}`}
                      style={{ color: "var(--muted)", fontSize: 13 }}
                    />
                  </div>
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
                          color: "var(--accent)",
                          fontFamily: "monospace",
                        }}
                      >
                        #{String(order.id).padStart(5, "0")}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: ".82rem",
                          color: "var(--text)",
                        }}
                      >
                        {fmtP(order.total_amount)}
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
                        {order.customer_name ?? "Walk-in"}
                        {order.items_preview ? ` · ${order.items_preview}` : ""}
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
            })
          )}
        </div>

        {/* Right col */}
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
              {QUICK.map((a) => (
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

          {/* Top selling */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--cb)",
              borderRadius: 14,
              padding: 20,
              flex: 1,
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
                  Top Selling
                </div>
                <div
                  style={{
                    fontSize: ".75rem",
                    color: "var(--muted)",
                    marginTop: 2,
                  }}
                >
                  {periodLabel}
                </div>
              </div>
              <a
                href='/admin/reports'
                style={{
                  fontSize: ".78rem",
                  color: "var(--accent)",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Full report{" "}
                <i
                  className='fa-solid fa-arrow-right'
                  style={{ fontSize: 10 }}
                />
              </a>
            </div>
            <TopItemsBars data={topItems} loading={loading} />
          </div>
        </div>
      </div>

      {/* Low stock strip */}
      {(loading || lowStock.length > 0) && (
        <div
          style={{
            background: "var(--card)",
            border: "1.5px solid rgba(230,126,34,.25)",
            borderRadius: 14,
            overflow: "hidden",
            marginTop: 16,
          }}
        >
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--cb)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <i
                className='fa-solid fa-triangle-exclamation'
                style={{ color: C.orange, fontSize: 14 }}
              />
              <span
                style={{
                  fontWeight: 600,
                  color: "var(--text)",
                  fontSize: ".9rem",
                }}
              >
                Low Stock Alerts
              </span>
              {!loading && (
                <span
                  style={{
                    fontSize: ".68rem",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 99,
                    background: "rgba(230,126,34,.12)",
                    color: C.orange,
                  }}
                >
                  {lowStock.length}
                </span>
              )}
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
              Manage stock{" "}
              <i className='fa-solid fa-arrow-right' style={{ fontSize: 10 }} />
            </a>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))",
              padding: 16,
              gap: 10,
            }}
          >
            {loading
              ? [1, 2, 3].map((i) => <Sk key={i} h={56} r={10} />)
              : lowStock.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: "rgba(230,126,34,.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i
                        className='fa-solid fa-box-open'
                        style={{ color: C.orange, fontSize: 14 }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: ".82rem",
                          fontWeight: 600,
                          color: "var(--text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: ".7rem",
                          color: "var(--muted)",
                          marginTop: 1,
                        }}
                      >
                        {item.category_name ?? "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: ".82rem",
                          fontWeight: 700,
                          color: C.orange,
                        }}
                      >
                        {fmt(item.stock_qty)} {item.unit_abbr}
                      </div>
                      <div
                        style={{ fontSize: ".68rem", color: "var(--muted)" }}
                      >
                        min {fmt(item.low_stock_alert)}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      <div style={{ height: 8 }} />
    </>
  );
}
