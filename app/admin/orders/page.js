"use client";

import { useState, useEffect, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtPrice = (n) => `Rp ${fmt(n)}`;

const STATUS_COLORS = {
  pending: { bg: "rgba(243,156,18,.12)", text: "#d68910" },
  in_progress: { bg: "rgba(41,128,185,.12)", text: "#2980b9" },
  completed: { bg: "rgba(39,174,96,.1)", text: "#27ae60" },
  cancelled: { bg: "rgba(192,57,43,.1)", text: "#c0392b" },
};
const STATUS_ICONS = {
  pending: "fa-clock",
  in_progress: "fa-spinner",
  completed: "fa-circle-check",
  cancelled: "fa-ban",
};
const PAYMENT_COLORS = {
  cash: { bg: "rgba(39,174,96,.1)", text: "#27ae60" },
  qris: { bg: "rgba(41,128,185,.1)", text: "#2980b9" },
  transfer: { bg: "rgba(142,68,173,.1)", text: "#8e44ad" },
  card: { bg: "rgba(230,126,34,.12)", text: "#e67e22" },
};
const PAYMENT_ICONS = {
  cash: "fa-money-bills",
  qris: "fa-qrcode",
  transfer: "fa-building-columns",
  card: "fa-credit-card",
};

function Modal({ open, onClose, title, children, width = 580 }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeInBd .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          border: "1px solid var(--cb)",
          borderRadius: 16,
          width: "100%",
          maxWidth: width,
          boxShadow: "0 24px 64px rgba(0,0,0,.35)",
          animation: "slideUpM .25s cubic-bezier(.175,.885,.32,1.1)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid var(--cb)",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              border: "none",
              background: "var(--bg)",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className='fa-solid fa-xmark' />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px", overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  background: "var(--bg)",
  border: "1.5px solid var(--border)",
  borderRadius: 8,
  fontSize: ".88rem",
  color: "var(--text)",
  outline: "none",
  fontFamily: "'DM Sans',sans-serif",
  boxSizing: "border-box",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (paymentFilter !== "all") params.set("payment", paymentFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setPage(1);
    } catch {
      showToast("Failed to load orders.", false);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${selected.id}/cancel`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Order cancelled.");
      setCancelOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const filtered = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(o.id).includes(q) ||
      (o.customer_name ?? "").toLowerCase().includes(q) ||
      (o.created_by_name ?? "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Stats
  const completed = orders.filter((o) => o.status === "completed");
  const totalRevenue = completed.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) =>
    (o.created_at ?? "").startsWith(todayStr),
  );
  const todayRevenue = todayOrders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + (o.total_amount ?? 0), 0);

  const statuses = ["all", "pending", "in_progress", "completed", "cancelled"];

  return (
    <>
      <style>{`
        @keyframes fadeInBd { from{opacity:0} to{opacity:1} }
        @keyframes slideUpM { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .ord-row:hover td { background: var(--bg) !important; }
        .act-btn { opacity:0; transition:opacity .15s; }
        .ord-row:hover .act-btn { opacity:1; }
        .stat-card { transition:transform .2s; }
        .stat-card:hover { transform:translateY(-2px); }
        .pg-btn:hover { background:var(--accent)!important; color:#fff!important; }
      `}</style>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: toast.ok ? "var(--accent)" : "#c0392b",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 18px",
            fontSize: ".88rem",
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,.2)",
            animation: "slideUpM .25s ease",
          }}
        >
          <i
            className={`fa-solid ${toast.ok ? "fa-circle-check" : "fa-circle-exclamation"}`}
          />
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.55rem",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          Orders
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          View and manage all customer transactions.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total Orders",
            value: fmt(orders.length),
            icon: "fa-receipt",
            color: "#2980b9",
            bg: "rgba(41,128,185,.1)",
          },
          {
            label: "Today's Orders",
            value: fmt(todayOrders.length),
            icon: "fa-calendar-day",
            color: "var(--accent)",
            bg: "rgba(46,64,49,.1)",
          },
          {
            label: "Today's Revenue",
            value: fmtPrice(todayRevenue),
            icon: "fa-circle-dollar-to-slot",
            color: "#27ae60",
            bg: "rgba(39,174,96,.1)",
          },
          {
            label: "Pending Now",
            value: fmt(orders.filter((o) => o.status === "pending").length),
            icon: "fa-clock",
            color: "#d68910",
            bg: "rgba(243,156,18,.12)",
          },
        ].map((s) => (
          <div
            key={s.label}
            className='stat-card'
            style={{
              background: "var(--card)",
              border: "1px solid var(--cb)",
              borderRadius: 14,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className={`fa-solid ${s.icon}`}
                style={{ color: s.color, fontSize: 17 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: s.value.length > 10 ? ".95rem" : "1.3rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: ".73rem",
                  color: "var(--muted)",
                  marginTop: 3,
                }}
              >
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--cb)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--cb)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <i
              className='fa-solid fa-magnifying-glass'
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted)",
                fontSize: 13,
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search order ID, customer, staff…'
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          {/* Payment filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ ...inputStyle, width: "auto", minWidth: 130 }}
          >
            <option value='all'>All Payments</option>
            <option value='cash'>Cash</option>
            <option value='qris'>QRIS</option>
            <option value='transfer'>Transfer</option>
            <option value='card'>Card</option>
          </select>
          {/* Date range */}
          <input
            type='date'
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ ...inputStyle, width: "auto" }}
          />
          <span style={{ color: "var(--muted)", fontSize: ".82rem" }}>–</span>
          <input
            type='date'
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ ...inputStyle, width: "auto" }}
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className='fa-solid fa-xmark' />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div
          style={{
            overflowX: "auto",
            borderBottom: "1px solid var(--cb)",
            scrollbarWidth: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "0 20px",
              minWidth: "max-content",
            }}
          >
            {statuses.map((s) => {
              const count =
                s === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === s).length;
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  style={{
                    padding: "11px 14px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: ".82rem",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--accent)" : "var(--muted)",
                    borderBottom: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {s === "all" ? (
                    "All"
                  ) : (
                    <>
                      <i
                        className={`fa-solid ${STATUS_ICONS[s]}`}
                        style={{ fontSize: 10 }}
                      />
                      {s
                        .replace("_", " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </>
                  )}
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: 99,
                      fontSize: ".68rem",
                      fontWeight: 700,
                      background: isActive ? "var(--accent)" : "var(--bg)",
                      color: isActive ? "#fff" : "var(--muted)",
                      border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div
            style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}
          >
            <i
              className='fa-solid fa-circle-notch fa-spin'
              style={{ fontSize: 28, display: "block", marginBottom: 12 }}
            />
            Loading…
          </div>
        ) : paginated.length === 0 ? (
          <div
            style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}
          >
            <i
              className='fa-solid fa-receipt'
              style={{
                fontSize: 32,
                opacity: 0.25,
                display: "block",
                marginBottom: 12,
              }}
            />
            <div
              style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}
            >
              No orders found
            </div>
            <div style={{ fontSize: ".82rem" }}>
              Try adjusting your filters.
            </div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    {[
                      "Order",
                      "Customer",
                      "Items",
                      "Total",
                      "Payment",
                      "Status",
                      "Cashier",
                      "Date",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: ".7rem",
                          fontWeight: 600,
                          color: "var(--muted)",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          borderBottom: "1px solid var(--cb)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((o, i) => (
                    <tr
                      key={o.id}
                      className='ord-row'
                      style={{
                        borderBottom:
                          i < paginated.length - 1
                            ? "1px solid var(--cb)"
                            : "none",
                      }}
                    >
                      {/* Order ID */}
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: ".85rem",
                            color: "var(--accent)",
                          }}
                        >
                          #{String(o.id).padStart(5, "0")}
                        </span>
                      </td>
                      {/* Customer */}
                      <td style={{ padding: "13px 16px" }}>
                        {o.customer_name ? (
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: ".85rem",
                                color: "var(--text)",
                              }}
                            >
                              {o.customer_name}
                            </div>
                            <div
                              style={{
                                fontSize: ".72rem",
                                color: "var(--muted)",
                              }}
                            >
                              {o.customer_phone}
                            </div>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: ".82rem",
                              color: "var(--muted)",
                              fontStyle: "italic",
                            }}
                          >
                            Walk-in
                          </span>
                        )}
                      </td>
                      {/* Items count */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--muted)",
                          textAlign: "center",
                        }}
                      >
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "var(--bg)",
                            border: "1px solid var(--border)",
                            fontWeight: 600,
                            fontSize: ".75rem",
                            color: "var(--text)",
                          }}
                        >
                          {o.items_count ?? "—"}
                        </span>
                      </td>
                      {/* Total */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontWeight: 700,
                          fontSize: ".88rem",
                          color: "var(--text)",
                        }}
                      >
                        {fmtPrice(o.total_amount)}
                      </td>
                      {/* Payment */}
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            ...PAYMENT_COLORS[o.payment_method],
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: ".72rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            textTransform: "capitalize",
                          }}
                        >
                          <i
                            className={`fa-solid ${PAYMENT_ICONS[o.payment_method] ?? "fa-money-bill"}`}
                            style={{ fontSize: 9 }}
                          />
                          {o.payment_method}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            ...STATUS_COLORS[o.status],
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: ".72rem",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            textTransform: "capitalize",
                          }}
                        >
                          <i
                            className={`fa-solid ${STATUS_ICONS[o.status]}`}
                            style={{ fontSize: 9 }}
                          />
                          {o.status.replace("_", " ")}
                        </span>
                      </td>
                      {/* Cashier */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                        }}
                      >
                        {o.created_by_name ?? "—"}
                      </td>
                      {/* Date */}
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {o.created_at
                          ? new Date(o.created_at).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            className='act-btn'
                            title='View Details'
                            onClick={() => {
                              setSelected(o);
                              setViewOpen(true);
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "none",
                              background: "var(--bg)",
                              cursor: "pointer",
                              color: "var(--muted)",
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(41,128,185,.15)";
                              e.currentTarget.style.color = "#2980b9";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "var(--bg)";
                              e.currentTarget.style.color = "var(--muted)";
                            }}
                          >
                            <i className='fa-solid fa-eye' />
                          </button>
                          {["pending", "in_progress"].includes(o.status) && (
                            <button
                              className='act-btn'
                              title='Cancel Order'
                              onClick={() => {
                                setSelected(o);
                                setCancelOpen(true);
                              }}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                border: "none",
                                background: "var(--bg)",
                                cursor: "pointer",
                                color: "var(--muted)",
                                fontSize: 11,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(192,57,43,.12)";
                                e.currentTarget.style.color = "#c0392b";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--bg)";
                                e.currentTarget.style.color = "var(--muted)";
                              }}
                            >
                              <i className='fa-solid fa-ban' />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: "14px 20px",
                  borderTop: "1px solid var(--cb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                  Showing {(page - 1) * PER_PAGE + 1}–
                  {Math.min(page * PER_PAGE, filtered.length)} of{" "}
                  {filtered.length} orders
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className='pg-btn'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      border: "1.5px solid var(--border)",
                      background: "none",
                      cursor: page === 1 ? "default" : "pointer",
                      color: page === 1 ? "var(--border)" : "var(--muted)",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all .15s",
                    }}
                  >
                    <i className='fa-solid fa-chevron-left' />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p =
                      Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                    return (
                      <button
                        key={p}
                        className='pg-btn'
                        onClick={() => setPage(p)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 7,
                          border: `1.5px solid ${p === page ? "var(--accent)" : "var(--border)"}`,
                          background: p === page ? "var(--accent)" : "none",
                          cursor: "pointer",
                          color: p === page ? "#fff" : "var(--muted)",
                          fontSize: ".78rem",
                          fontWeight: p === page ? 700 : 400,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all .15s",
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    className='pg-btn'
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      border: "1.5px solid var(--border)",
                      background: "none",
                      cursor: page === totalPages ? "default" : "pointer",
                      color:
                        page === totalPages ? "var(--border)" : "var(--muted)",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all .15s",
                    }}
                  >
                    <i className='fa-solid fa-chevron-right' />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Order Modal */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={selected ? `Order #${String(selected.id).padStart(5, "0")}` : ""}
        width={600}
      >
        {selected && (
          <div>
            {/* Header info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 18,
              }}
            >
              {[
                {
                  label: "Status",
                  value: (
                    <span
                      style={{
                        ...STATUS_COLORS[selected.status],
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: ".78rem",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {selected.status.replace("_", " ")}
                    </span>
                  ),
                },
                {
                  label: "Payment",
                  value: (
                    <span
                      style={{
                        ...PAYMENT_COLORS[selected.payment_method],
                        padding: "3px 10px",
                        borderRadius: 99,
                        fontSize: ".78rem",
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {selected.payment_method}
                    </span>
                  ),
                },
                {
                  label: "Customer",
                  value: selected.customer_name ?? "Walk-in",
                },
                { label: "Cashier", value: selected.created_by_name ?? "—" },
                {
                  label: "Date",
                  value: selected.created_at
                    ? new Date(selected.created_at).toLocaleString("id-ID")
                    : "—",
                },
                {
                  label: "Points Earned",
                  value: `+${fmt(selected.points_earned ?? 0)} pts`,
                },
                {
                  label: "Points Redeemed",
                  value: selected.points_redeemed
                    ? `-${fmt(selected.points_redeemed)} pts`
                    : "—",
                },
                { label: "Notes", value: selected.notes ?? "—" },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{
                    background: "var(--bg)",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: ".68rem",
                      color: "var(--muted)",
                      marginBottom: 3,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontWeight: 700,
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: ".85rem",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {r.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Items */}
            <div
              style={{
                fontWeight: 700,
                fontSize: ".75rem",
                color: "var(--muted)",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Order Items
            </div>
            <div
              style={{
                background: "var(--bg)",
                borderRadius: 10,
                border: "1px solid var(--cb)",
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              {(selected.items ?? []).length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--muted)",
                    fontSize: ".82rem",
                  }}
                >
                  No item details available
                </div>
              ) : (
                (selected.items ?? []).map((item, i, arr) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 14px",
                      borderBottom:
                        i < arr.length - 1 ? "1px solid var(--cb)" : "none",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: ".85rem",
                          color: "var(--text)",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: ".72rem",
                          color: "var(--muted)",
                          marginTop: 1,
                        }}
                      >
                        {fmtPrice(item.unit_price)} × {item.quantity}
                      </div>
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: ".88rem",
                        color: "var(--text)",
                      }}
                    >
                      {fmtPrice(item.subtotal)}
                    </span>
                  </div>
                ))
              )}
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(46,64,49,.04)",
                  borderTop: "1px solid var(--cb)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: ".9rem",
                    color: "var(--text)",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    color: "var(--accent)",
                  }}
                >
                  {fmtPrice(selected.total_amount)}
                </span>
              </div>
            </div>

            {/* Cancel button if applicable */}
            {["pending", "in_progress"].includes(selected.status) && (
              <button
                onClick={() => {
                  setViewOpen(false);
                  setCancelOpen(true);
                }}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 9,
                  border: "none",
                  background: "#c0392b",
                  color: "#fff",
                  fontSize: ".88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <i className='fa-solid fa-ban' />
                Cancel This Order
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirm Modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title='Cancel Order'
        width={460}
      >
        {selected && (
          <div>
            <div
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(192,57,43,.07)",
                border: "1px solid rgba(192,57,43,.2)",
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <i
                className='fa-solid fa-triangle-exclamation'
                style={{
                  color: "#c0392b",
                  fontSize: 18,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div
                style={{
                  fontSize: ".88rem",
                  color: "var(--text)",
                  lineHeight: 1.6,
                }}
              >
                Order <b>#{String(selected.id).padStart(5, "0")}</b> (
                {fmtPrice(selected.total_amount)}) will be cancelled. Stock will
                be restocked automatically.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setCancelOpen(false)}
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: 9,
                  border: "1.5px solid var(--border)",
                  background: "none",
                  color: "var(--muted)",
                  fontSize: ".88rem",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: "11px",
                  borderRadius: 9,
                  border: "none",
                  background: "#c0392b",
                  color: "#fff",
                  fontSize: ".88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: saving ? 0.7 : 1,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {saving ? (
                  <>
                    <i className='fa-solid fa-circle-notch fa-spin' />
                    Cancelling…
                  </>
                ) : (
                  <>
                    <i className='fa-solid fa-ban' />
                    Cancel Order
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
