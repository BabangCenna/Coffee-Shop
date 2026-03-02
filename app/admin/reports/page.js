"use client";

import { useState, useEffect, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtPrice = (n) => `Rp ${fmt(n)}`;

function StatCard({ label, value, icon, color, bg, sub, trend }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--cb)", borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`fa-solid ${icon}`} style={{ color, fontSize: 17 }} />
        </div>
        {trend != null && (
          <span style={{ fontSize: ".72rem", fontWeight: 600, padding: "3px 8px", borderRadius: 99, background: trend >= 0 ? "rgba(39,174,96,.1)" : "rgba(192,57,43,.1)", color: trend >= 0 ? "#27ae60" : "#c0392b", display: "flex", alignItems: "center", gap: 4 }}>
            <i className={`fa-solid fa-arrow-${trend >= 0 ? "up" : "down"}`} style={{ fontSize: 9 }} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>{label}</div>
      {sub && <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: 4, opacity: .7 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: 28 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(46,64,49,.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <i className={`fa-solid ${icon}`} style={{ color: "var(--accent)", fontSize: 13 }} />
      </div>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</h2>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", background: "var(--bg)",
  border: "1.5px solid var(--border)", borderRadius: 8,
  fontSize: ".88rem", color: "var(--text)", outline: "none",
  fontFamily: "'DM Sans',sans-serif",
};

const PAYMENT_COLORS = {
  cash: { bg: "rgba(39,174,96,.1)", text: "#27ae60" },
  qris: { bg: "rgba(41,128,185,.1)", text: "#2980b9" },
  transfer: { bg: "rgba(142,68,173,.1)", text: "#8e44ad" },
  card: { bg: "rgba(230,126,34,.12)", text: "#e67e22" },
};

const PAYMENT_ICONS = { cash: "fa-money-bills", qris: "fa-qrcode", transfer: "fa-building-columns", card: "fa-credit-card" };

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [dateRange, setDateRange] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const getDateParams = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    if (dateRange === "today") return { from: today, to: today };
    if (dateRange === "week") {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      return { from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, to: today };
    }
    if (dateRange === "month") {
      const d = new Date(now); d.setDate(d.getDate() - 30);
      return { from: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, to: today };
    }
    return { from: customFrom, to: customTo };
  };

  const fetchData = useCallback(async () => {
    if (dateRange === "custom" && (!customFrom || !customTo)) return;
    setLoading(true);
    try {
      const { from, to } = getDateParams();
      const res = await fetch(`/api/admin/reports?from=${from}&to=${to}`);
      const json = await res.json();
      setData(json);
    } catch { showToast("Failed to load report data.", false); }
    finally { setLoading(false); }
  }, [dateRange, customFrom, customTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sections = [
    { id: "overview", label: "Overview", icon: "fa-chart-pie" },
    { id: "sales", label: "Sales", icon: "fa-chart-line" },
    { id: "products", label: "Products", icon: "fa-boxes-stacked" },
    { id: "payments", label: "Payments", icon: "fa-credit-card" },
    { id: "staff", label: "Staff", icon: "fa-users" },
  ];

  const d = data ?? {};
  const summary = d.summary ?? {};
  const topProducts = d.top_products ?? [];
  const paymentBreakdown = d.payment_breakdown ?? [];
  const dailySales = d.daily_sales ?? [];
  const staffPerformance = d.staff_performance ?? [];
  const lowStock = d.low_stock ?? [];

  const maxDailySales = Math.max(...dailySales.map(s => s.total_amount ?? 0), 1);

  return (
    <>
      <style>{`
        @keyframes fadeInBd { from{opacity:0} to{opacity:1} }
        @keyframes slideUpM { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .report-row:hover td { background: var(--bg) !important; }
        .stat-card { transition: transform .2s; }
        .stat-card:hover { transform: translateY(-2px); }
        .section-btn { transition: all .15s; }
        .bar-fill { transition: width .6s cubic-bezier(.4,0,.2,1); }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 500, display: "flex", alignItems: "center", gap: 10, background: toast.ok ? "var(--accent)" : "#c0392b", color: "#fff", borderRadius: 10, padding: "12px 18px", fontSize: ".88rem", fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,.2)", animation: "slideUpM .25s ease" }}>
          <i className={`fa-solid ${toast.ok ? "fa-circle-check" : "fa-circle-exclamation"}`} />{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.55rem", fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Reports</h1>
          <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>Financial and operational performance overview.</p>
        </div>
        {/* Date range selector */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {["today", "week", "month", "custom"].map(r => (
            <button key={r} onClick={() => setDateRange(r)}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${dateRange === r ? "var(--accent)" : "var(--border)"}`, background: dateRange === r ? "rgba(46,64,49,.1)" : "var(--bg)", color: dateRange === r ? "var(--accent)" : "var(--muted)", fontSize: ".8rem", fontWeight: dateRange === r ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textTransform: "capitalize" }}>
              {r === "week" ? "7 Days" : r === "month" ? "30 Days" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
          {dateRange === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ ...inputStyle, width: "auto", padding: "8px 12px" }} />
              <span style={{ color: "var(--muted)", fontSize: ".8rem" }}>to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ ...inputStyle, width: "auto", padding: "8px 12px" }} />
            </>
          )}
          <button onClick={fetchData} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontSize: ".8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="fa-solid fa-arrows-rotate" />Refresh
          </button>
        </div>
      </div>

      {/* Section nav */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", scrollbarWidth: "none" }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{ padding: "9px 16px", borderRadius: 9, border: `1.5px solid ${activeSection === s.id ? "var(--accent)" : "var(--border)"}`, background: activeSection === s.id ? "rgba(46,64,49,.1)" : "var(--bg)", color: activeSection === s.id ? "var(--accent)" : "var(--muted)", fontSize: ".82rem", fontWeight: activeSection === s.id ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" }}>
            <i className={`fa-solid ${s.icon}`} style={{ fontSize: 12 }} />{s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 80, textAlign: "center", color: "var(--muted)" }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 32, display: "block", marginBottom: 12 }} />Loading report…
        </div>
      ) : (
        <>
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Revenue" value={fmtPrice(summary.total_revenue ?? 0)} icon="fa-circle-dollar-to-slot" color="#27ae60" bg="rgba(39,174,96,.1)" trend={summary.revenue_trend} />
                <StatCard label="Total Orders" value={fmt(summary.total_orders ?? 0)} icon="fa-receipt" color="#2980b9" bg="rgba(41,128,185,.1)" trend={summary.orders_trend} />
                <StatCard label="Avg Order Value" value={fmtPrice(summary.avg_order_value ?? 0)} icon="fa-chart-bar" color="#d68910" bg="rgba(243,156,18,.12)" />
                <StatCard label="Items Sold" value={fmt(summary.items_sold ?? 0)} icon="fa-bag-shopping" color="var(--accent)" bg="rgba(46,64,49,.1)" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                <StatCard label="New Customers" value={fmt(summary.new_customers ?? 0)} icon="fa-user-plus" color="#8e44ad" bg="rgba(142,68,173,.1)" />
                <StatCard label="Points Earned" value={`${fmt(summary.points_earned ?? 0)} pts`} icon="fa-star" color="#d68910" bg="rgba(243,156,18,.12)" />
                <StatCard label="Points Redeemed" value={`${fmt(summary.points_redeemed ?? 0)} pts`} icon="fa-gift" color="#e67e22" bg="rgba(230,126,34,.12)" />
                <StatCard label="Cancelled Orders" value={fmt(summary.cancelled_orders ?? 0)} icon="fa-ban" color="#c0392b" bg="rgba(192,57,43,.1)" />
              </div>

              {/* Daily sales sparkline */}
              {dailySales.length > 0 && (
                <div style={{ background: "var(--card)", border: "1px solid var(--cb)", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: 20 }}>Daily Revenue</h3>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                    {dailySales.map((day, i) => {
                      const h = Math.max(4, ((day.total_amount ?? 0) / maxDailySales) * 80);
                      return (
                        <div key={i} title={`${day.date}: ${fmtPrice(day.total_amount)}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "default" }}>
                          <div style={{ width: "100%", height: h, background: "var(--accent)", borderRadius: "4px 4px 0 0", opacity: .85, transition: "height .4s", minHeight: 4 }} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: ".65rem", color: "var(--muted)" }}>{dailySales[0]?.date}</span>
                    <span style={{ fontSize: ".65rem", color: "var(--muted)" }}>{dailySales[dailySales.length - 1]?.date}</span>
                  </div>
                </div>
              )}

              {/* Low stock alert */}
              {lowStock.length > 0 && (
                <div style={{ background: "var(--card)", border: "1px solid rgba(230,126,34,.3)", borderRadius: 16, padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ color: "#e67e22" }} />
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Low Stock Alert</h3>
                    <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: ".68rem", fontWeight: 700, background: "rgba(230,126,34,.12)", color: "#e67e22" }}>{lowStock.length}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                    {lowStock.map(p => (
                      <div key={p.id} style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: ".82rem", color: "var(--text)" }}>{p.name}</div>
                          <div style={{ fontSize: ".7rem", color: "var(--muted)" }}>Alert: {p.low_stock_alert} {p.unit_abbr}</div>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: ".82rem", color: "#e67e22" }}>{p.stock_qty} {p.unit_abbr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* SALES */}
          {activeSection === "sales" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
                <StatCard label="Total Revenue" value={fmtPrice(summary.total_revenue ?? 0)} icon="fa-circle-dollar-to-slot" color="#27ae60" bg="rgba(39,174,96,.1)" />
                <StatCard label="Total Orders" value={fmt(summary.total_orders ?? 0)} icon="fa-receipt" color="#2980b9" bg="rgba(41,128,185,.1)" />
                <StatCard label="Avg Order Value" value={fmtPrice(summary.avg_order_value ?? 0)} icon="fa-chart-bar" color="#d68910" bg="rgba(243,156,18,.12)" />
              </div>

              {dailySales.length > 0 && (
                <div style={{ background: "var(--card)", border: "1px solid var(--cb)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--cb)" }}>
                    <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>Daily Breakdown</h3>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--bg)" }}>
                          {["Date", "Orders", "Revenue", "Avg Order", "Items Sold"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: ".7rem", fontWeight: 600, color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", borderBottom: "1px solid var(--cb)", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dailySales.map((day, i) => (
                          <tr key={i} className="report-row" style={{ borderBottom: i < dailySales.length - 1 ? "1px solid var(--cb)" : "none" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: ".85rem", color: "var(--text)" }}>{day.date}</td>
                            <td style={{ padding: "12px 16px", fontSize: ".82rem", color: "var(--muted)" }}>{fmt(day.order_count)}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: ".85rem", color: "var(--text)" }}>{fmtPrice(day.total_amount)}</td>
                            <td style={{ padding: "12px 16px", fontSize: ".82rem", color: "var(--muted)" }}>{day.order_count ? fmtPrice((day.total_amount ?? 0) / day.order_count) : "—"}</td>
                            <td style={{ padding: "12px 16px", fontSize: ".82rem", color: "var(--muted)" }}>{fmt(day.items_sold)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* PRODUCTS */}
          {activeSection === "products" && (
            <>
              <SectionHeader title="Top Selling Products" icon="fa-trophy" />
              <div style={{ background: "var(--card)", border: "1px solid var(--cb)", borderRadius: 16, overflow: "hidden" }}>
                {topProducts.length === 0 ? (
                  <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
                    <i className="fa-solid fa-box-open" style={{ fontSize: 32, opacity: 0.3, display: "block", marginBottom: 12 }} />
                    <div style={{ fontWeight: 600 }}>No product data</div>
                  </div>
                ) : (
                  <div style={{ padding: "20px 24px" }}>
                    {topProducts.map((p, i) => {
                      const maxQty = topProducts[0]?.qty_sold ?? 1;
                      const pct = ((p.qty_sold ?? 0) / maxQty) * 100;
                      return (
                        <div key={p.id} style={{ marginBottom: i < topProducts.length - 1 ? 18 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 7, background: i < 3 ? "rgba(243,156,18,.12)" : "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontWeight: 700, color: i < 3 ? "#d68910" : "var(--muted)", flexShrink: 0 }}>{i + 1}</div>
                              <span style={{ fontWeight: 600, fontSize: ".88rem", color: "var(--text)" }}>{p.name}</span>
                              <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>{p.category_name}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--text)" }}>{fmtPrice(p.revenue)}</div>
                              <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>{fmt(p.qty_sold)} {p.unit_abbr}</div>
                            </div>
                          </div>
                          <div style={{ height: 6, background: "var(--bg)", borderRadius: 99, overflow: "hidden" }}>
                            <div className="bar-fill" style={{ height: "100%", width: `${pct}%`, background: "var(--accent)", borderRadius: 99 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* PAYMENTS */}
          {activeSection === "payments" && (
            <>
              <SectionHeader title="Payment Method Breakdown" icon="fa-credit-card" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 24 }}>
                {paymentBreakdown.map(p => (
                  <div key={p.method} style={{ background: "var(--card)", border: "1px solid var(--cb)", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: PAYMENT_COLORS[p.method]?.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={`fa-solid ${PAYMENT_ICONS[p.method] ?? "fa-money-bill"}`} style={{ color: PAYMENT_COLORS[p.method]?.text ?? "var(--muted)", fontSize: 20 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)", textTransform: "capitalize" }}>{p.method}</div>
                      <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>{fmt(p.order_count)} orders</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)" }}>{fmtPrice(p.total_amount)}</div>
                      <div style={{ fontSize: ".72rem", color: "var(--muted)", marginTop: 2 }}>{p.pct?.toFixed(1) ?? 0}% of sales</div>
                    </div>
                  </div>
                ))}
              </div>
              {paymentBreakdown.length > 0 && (
                <div style={{ background: "var(--card)", border: "1px solid var(--cb)", borderRadius: 16, padding: "20px 24px" }}>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Distribution</h3>
                  {paymentBreakdown.map(p => (
                    <div key={p.method} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--text)", textTransform: "capitalize", display: "flex", alignItems: "center", gap: 7 }}>
                          <i className={`fa-solid ${PAYMENT_ICONS[p.method] ?? "fa-money-bill"}`} style={{ color: PAYMENT_COLORS[p.method]?.text, fontSize: 11 }} />{p.method}
                        </span>
                        <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>{p.pct?.toFixed(1) ?? 0}%</span>
                      </div>
                      <div style={{ height: 8, background: "var(--bg)", borderRadius: 99, overflow: "hidden" }}>
                        <div className="bar-fill" style={{ height: "100%", width: `${p.pct ?? 0}%`, background: PAYMENT_COLORS[p.method]?.text ?? "var(--accent)", borderRadius: 99, opacity: .8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STAFF */}
          {activeSection === "staff" && (
            <>
              <SectionHeader title="Staff Performance" icon="fa-users" />
              <div style={{ background: "var(--card)", border: "1px solid var(--cb)", borderRadius: 16, overflow: "hidden" }}>
                {staffPerformance.length === 0 ? (
                  <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
                    <i className="fa-solid fa-users" style={{ fontSize: 32, opacity: 0.3, display: "block", marginBottom: 12 }} />
                    <div style={{ fontWeight: 600 }}>No staff data</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--bg)" }}>
                          {["Staff", "Role", "Orders Processed", "Total Sales", "Shifts", "Avg / Order"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: ".7rem", fontWeight: 600, color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", borderBottom: "1px solid var(--cb)", whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {staffPerformance.map((s, i) => (
                          <tr key={s.id} className="report-row" style={{ borderBottom: i < staffPerformance.length - 1 ? "1px solid var(--cb)" : "none" }}>
                            <td style={{ padding: "13px 16px", fontWeight: 600, fontSize: ".88rem", color: "var(--text)" }}>{s.full_name}</td>
                            <td style={{ padding: "13px 16px", fontSize: ".78rem", color: "var(--muted)", textTransform: "capitalize" }}>{s.role_display_name}</td>
                            <td style={{ padding: "13px 16px", fontSize: ".85rem", color: "var(--text)", fontWeight: 500 }}>{fmt(s.orders_count)}</td>
                            <td style={{ padding: "13px 16px", fontWeight: 600, fontSize: ".85rem", color: "var(--text)" }}>{fmtPrice(s.total_sales)}</td>
                            <td style={{ padding: "13px 16px", fontSize: ".82rem", color: "var(--muted)" }}>{fmt(s.shifts_count)}</td>
                            <td style={{ padding: "13px 16px", fontSize: ".82rem", color: "var(--muted)" }}>{s.orders_count ? fmtPrice((s.total_sales ?? 0) / s.orders_count) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}