"use client";

import { useState, useEffect, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);

const MOVEMENT_META = {
  purchase: { color: "#27ae60", icon: "fa-arrow-down", label: "Purchase" },
  sale: { color: "#2980b9", icon: "fa-arrow-up", label: "Sale" },
  waste: { color: "#c0392b", icon: "fa-trash", label: "Waste" },
  adjustment: { color: "#8e44ad", icon: "fa-sliders", label: "Adjustment" },
  transfer: {
    color: "#e67e22",
    icon: "fa-arrows-left-right",
    label: "Transfer",
  },
};

function Modal({ open, onClose, title, children }) {
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          border: "1px solid var(--cb)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 24px 64px rgba(0,0,0,.35)",
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
};

export default function StockPage() {
  const [stock, setStock] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("levels"); // levels | movements
  const [filter, setFilter] = useState("all"); // all | low
  const [search, setSearch] = useState("");
  const [adjOpen, setAdjOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [adjForm, setAdjForm] = useState({
    type: "adjustment",
    quantity: "",
    note: "",
  });
  const [adjError, setAdjError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stock");
      const data = await res.json();
      setStock(data.stock ?? []);
      setMovements(data.movements ?? []);
    } catch {
      showToast("Failed to load stock.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const lowCount = stock.filter((s) => s.quantity <= s.low_stock_alert).length;

  const filteredStock = stock.filter((s) => {
    const matchFilter = filter === "all" || s.quantity <= s.low_stock_alert;
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.sku ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const openAdj = (item) => {
    setSelected(item);
    setAdjForm({ type: "adjustment", quantity: "", note: "" });
    setAdjError("");
    setAdjOpen(true);
  };

  const handleAdj = async () => {
    const qty = parseFloat(adjForm.quantity);
    if (!qty || qty === 0) {
      setAdjError("Enter a non-zero quantity.");
      return;
    }
    if (!adjForm.note?.trim()) {
      setAdjError("Please provide a reason/note.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selected.id,
          type: adjForm.type,
          quantity: qty,
          note: adjForm.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdjError(data.error);
        return;
      }
      showToast(`Stock updated. New quantity: ${data.new_quantity}`);
      setAdjOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dt) =>
    dt
      ? new Date(dt).toLocaleString("id-ID", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <>
      <style>{`
        @keyframes slideUpM { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .s-row:hover td { background: var(--bg) !important; }
        .act-btn { opacity:0; transition:opacity .15s; }
        .s-row:hover .act-btn { opacity:1; }
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

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.55rem",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            Stock
          </h1>
          <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
            Track inventory levels and log adjustments.
          </p>
        </div>
        {lowCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "rgba(230,126,34,.1)",
              border: "1px solid rgba(230,126,34,.3)",
              borderRadius: 9,
              fontSize: ".82rem",
              color: "#e67e22",
              fontWeight: 600,
            }}
          >
            <i className='fa-solid fa-triangle-exclamation' />
            {lowCount} item{lowCount > 1 ? "s" : ""} running low
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total SKUs",
            value: stock.length,
            icon: "fa-boxes-stacked",
            color: "#2980b9",
          },
          {
            label: "Low Stock",
            value: lowCount,
            icon: "fa-triangle-exclamation",
            color: "#e67e22",
          },
          {
            label: "Well Stocked",
            value: stock.length - lowCount,
            icon: "fa-circle-check",
            color: "#27ae60",
          },
          {
            label: "Movements",
            value: movements.length,
            icon: "fa-arrows-up-down",
            color: "#8e44ad",
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: "var(--card)",
              border: "1px solid var(--cb)",
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: `${c.color}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className={`fa-solid ${c.icon}`}
                style={{ color: c.color, fontSize: 16 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  lineHeight: 1,
                }}
              >
                {c.value}
              </div>
              <div
                style={{
                  fontSize: ".72rem",
                  color: "var(--muted)",
                  marginTop: 3,
                }}
              >
                {c.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--cb)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Tab + toolbar */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--cb)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "var(--bg)",
              borderRadius: 9,
              padding: 4,
            }}
          >
            {[
              { key: "levels", label: "Stock Levels", icon: "fa-warehouse" },
              { key: "movements", label: "Movement Log", icon: "fa-list" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "none",
                  background:
                    activeTab === t.key ? "var(--accent)" : "transparent",
                  color: activeTab === t.key ? "#fff" : "var(--muted)",
                  fontSize: ".82rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <i className={`fa-solid ${t.icon}`} style={{ fontSize: 12 }} />
                {t.label}
              </button>
            ))}
          </div>
          {activeTab === "levels" && (
            <>
              <div style={{ position: "relative", flex: "1 1 180px" }}>
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
                  placeholder='Search product…'
                  style={{ ...inputStyle, paddingLeft: 34 }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--accent)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              <button
                onClick={() => setFilter(filter === "all" ? "low" : "all")}
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${filter === "low" ? "#e67e22" : "var(--border)"}`,
                  background:
                    filter === "low" ? "rgba(230,126,34,.1)" : "var(--bg)",
                  color: filter === "low" ? "#e67e22" : "var(--muted)",
                  fontSize: ".82rem",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i
                  className='fa-solid fa-triangle-exclamation'
                  style={{ fontSize: 12 }}
                />
                {filter === "low" ? "Showing Low Stock" : "Filter Low Stock"}
              </button>
            </>
          )}
        </div>

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
        ) : activeTab === "levels" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {[
                    "Product",
                    "Category",
                    "Quantity",
                    "Low Alert",
                    "Status",
                    "Last Updated",
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
                {filteredStock.map((item, i) => {
                  const isLow = item.quantity <= item.low_stock_alert;
                  return (
                    <tr
                      key={item.id}
                      className='s-row'
                      style={{
                        borderBottom:
                          i < filteredStock.length - 1
                            ? "1px solid var(--cb)"
                            : "none",
                      }}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: ".88rem",
                            color: "var(--text)",
                          }}
                        >
                          {item.name}
                        </div>
                        {item.sku && (
                          <div
                            style={{
                              fontSize: ".72rem",
                              color: "var(--muted)",
                              fontFamily: "monospace",
                            }}
                          >
                            {item.sku}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--muted)",
                        }}
                      >
                        {item.category_name}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            fontFamily: "'Playfair Display',serif",
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: isLow ? "#e67e22" : "var(--text)",
                          }}
                        >
                          {fmt(item.quantity)}
                        </span>
                        <span
                          style={{
                            fontSize: ".72rem",
                            color: "var(--muted)",
                            marginLeft: 4,
                          }}
                        >
                          {item.unit_abbr}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--muted)",
                        }}
                      >
                        {item.low_stock_alert} {item.unit_abbr}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: ".7rem",
                            fontWeight: 600,
                            background: isLow
                              ? "rgba(230,126,34,.12)"
                              : "rgba(39,174,96,.1)",
                            color: isLow ? "#e67e22" : "#27ae60",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <i
                            className={`fa-solid ${isLow ? "fa-triangle-exclamation" : "fa-circle-check"}`}
                            style={{ fontSize: 9 }}
                          />
                          {isLow ? "Low Stock" : "OK"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <button
                          className='act-btn'
                          onClick={() => openAdj(item)}
                          title='Adjust stock'
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            border: "none",
                            background: "var(--bg)",
                            cursor: "pointer",
                            color: "var(--muted)",
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(142,68,173,.15)";
                            e.currentTarget.style.color = "#8e44ad";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--bg)";
                            e.currentTarget.style.color = "var(--muted)";
                          }}
                        >
                          <i className='fa-solid fa-sliders' />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Movement log */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["Product", "Type", "Quantity", "Note", "By", "Date"].map(
                    (h) => (
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
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {movements.map((m, i) => {
                  const meta = MOVEMENT_META[m.type] ?? {
                    color: "var(--muted)",
                    icon: "fa-circle",
                    label: m.type,
                  };
                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom:
                          i < movements.length - 1
                            ? "1px solid var(--cb)"
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "11px 16px",
                          fontSize: ".85rem",
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        {m.product_name}
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: ".72rem",
                            fontWeight: 600,
                            background: `${meta.color}18`,
                            color: meta.color,
                          }}
                        >
                          <i
                            className={`fa-solid ${meta.icon}`}
                            style={{ fontSize: 9 }}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: m.quantity >= 0 ? "#27ae60" : "#c0392b",
                            fontSize: ".88rem",
                          }}
                        >
                          {m.quantity >= 0 ? "+" : ""}
                          {fmt(m.quantity)} {m.unit_abbr}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "11px 16px",
                          fontSize: ".8rem",
                          color: "var(--muted)",
                          maxWidth: 200,
                        }}
                      >
                        {m.note ?? "—"}
                      </td>
                      <td
                        style={{
                          padding: "11px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                        }}
                      >
                        {m.created_by_name ?? "System"}
                      </td>
                      <td
                        style={{
                          padding: "11px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(m.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjustment modal */}
      <Modal
        open={adjOpen}
        onClose={() => setAdjOpen(false)}
        title={`Adjust — ${selected?.name}`}
      >
        {selected && (
          <div>
            {/* Current stock */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: "var(--bg)",
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>
                Current Stock
              </span>
              <span
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                {fmt(selected.quantity)}{" "}
                <span style={{ fontSize: ".8rem", fontWeight: 400 }}>
                  {selected.unit_abbr}
                </span>
              </span>
            </div>

            {/* Type selector */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: ".78rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                Type
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {["waste", "adjustment", "transfer"].map((t) => {
                  const meta = MOVEMENT_META[t];
                  return (
                    <button
                      key={t}
                      type='button'
                      onClick={() => setAdjForm((f) => ({ ...f, type: t }))}
                      style={{
                        padding: "9px 6px",
                        borderRadius: 8,
                        border: `1.5px solid ${adjForm.type === t ? meta.color : "var(--border)"}`,
                        background:
                          adjForm.type === t ? `${meta.color}18` : "var(--bg)",
                        color: adjForm.type === t ? meta.color : "var(--muted)",
                        fontSize: ".78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        fontFamily: "'DM Sans',sans-serif",
                        textTransform: "capitalize",
                      }}
                    >
                      <i
                        className={`fa-solid ${meta.icon}`}
                        style={{ fontSize: 11 }}
                      />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
              <p
                style={{
                  fontSize: ".72rem",
                  color: "var(--muted)",
                  marginTop: 6,
                }}
              >
                {adjForm.type === "waste"
                  ? "Quantity will be subtracted from stock."
                  : adjForm.type === "adjustment"
                    ? "Use positive to add, negative to subtract."
                    : "Transfer stock to another location."}
              </p>
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: ".78rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                Quantity ({selected.unit_abbr})
                {adjForm.type === "waste" && " — will be treated as negative"}
              </label>
              <input
                type='number'
                step='any'
                placeholder='e.g. 5'
                value={adjForm.quantity}
                onChange={(e) =>
                  setAdjForm((f) => ({ ...f, quantity: e.target.value }))
                }
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Note */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: ".78rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  marginBottom: 6,
                }}
              >
                Reason / Note <span style={{ color: "#c0392b" }}>*</span>
              </label>
              <textarea
                value={adjForm.note}
                onChange={(e) =>
                  setAdjForm((f) => ({ ...f, note: e.target.value }))
                }
                placeholder='e.g. Expired, damaged, physical count correction…'
                style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {adjError && (
              <p
                style={{
                  color: "#c0392b",
                  fontSize: ".8rem",
                  marginBottom: 12,
                }}
              >
                <i
                  className='fa-solid fa-circle-exclamation'
                  style={{ marginRight: 5 }}
                />
                {adjError}
              </p>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setAdjOpen(false)}
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
                Cancel
              </button>
              <button
                onClick={handleAdj}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: "11px",
                  borderRadius: 9,
                  border: "none",
                  background: "var(--accent)",
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
                    Saving…
                  </>
                ) : (
                  <>
                    <i className='fa-solid fa-floppy-disk' />
                    Apply Adjustment
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
