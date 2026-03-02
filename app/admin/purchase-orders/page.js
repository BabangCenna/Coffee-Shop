"use client";

import { useState, useEffect, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtRp = (n) => `Rp ${fmt(n)}`;
const fmtDate = (dt) =>
  dt
    ? new Date(dt).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const STATUS_META = {
  pending: {
    bg: "rgba(230,126,34,.12)",
    text: "#e67e22",
    icon: "fa-clock",
    label: "Pending",
  },
  received: {
    bg: "rgba(39,174,96,.1)",
    text: "#27ae60",
    icon: "fa-circle-check",
    label: "Received",
  },
  cancelled: {
    bg: "rgba(192,57,43,.1)",
    text: "#c0392b",
    icon: "fa-ban",
    label: "Cancelled",
  },
};

function Modal({ open, onClose, title, children, width = 560 }) {
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
          maxWidth: width,
          boxShadow: "0 24px 64px rgba(0,0,0,.35)",
          animation: "slideUpM .25s cubic-bezier(.175,.885,.32,1.1)",
          maxHeight: "92vh",
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
  transition: "border-color .2s",
};

const EMPTY_ITEM = { product_id: "", quantity: 1, unit_cost: 0 };

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [poDetail, setPoDetail] = useState(null); // { order, items }
  const [pendingAction, setPendingAction] = useState(null); // approve | receive | cancel
  const [actionNote, setActionNote] = useState("");

  // New PO form
  const [poForm, setPoForm] = useState({ supplier_id: "", notes: "" });
  const [poItems, setPoItems] = useState([{ ...EMPTY_ITEM }]);
  const [poErrors, setPoErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        fetch("/api/admin/purchase-orders"),
        fetch("/api/admin/suppliers"),
        fetch("/api/admin/products"),
      ]);
      const [od, sd, pd] = await Promise.all([
        ordersRes.json(),
        suppliersRes.json(),
        productsRes.json(),
      ]);
      setOrders(od.orders ?? []);
      setSuppliers((sd.suppliers ?? []).filter((s) => s.is_active));
      setProducts((pd.products ?? []).filter((p) => p.is_active));
    } catch {
      showToast("Failed to load data.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── New PO ───────────────────────────────────────────────────────────────
  const addItem = () => setPoItems((items) => [...items, { ...EMPTY_ITEM }]);
  const removeItem = (idx) =>
    setPoItems((items) => items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) =>
    setPoItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );

  const totalCost = poItems.reduce(
    (s, item) => s + item.quantity * item.unit_cost,
    0,
  );

  const validatePO = () => {
    const e = {};
    if (!poForm.supplier_id) e.supplier_id = "Select a supplier.";
    if (
      !poItems.length ||
      poItems.some(
        (item) => !item.product_id || !item.quantity || item.quantity <= 0,
      )
    ) {
      e.items = "All items need a product and a valid quantity.";
    }
    setPoErrors(e);
    return !Object.keys(e).length;
  };

  const handleCreatePO = async () => {
    if (!validatePO()) return;
    setSaving(true);
    try {
      // Enrich items with purchase_unit_id and purchase_to_stock_qty from products list
      const enriched = poItems.map((item) => {
        const prod = products.find(
          (p) => String(p.id) === String(item.product_id),
        );
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          purchase_unit_id: prod?.purchase_unit_id,
          purchase_to_stock_qty: prod?.purchase_to_stock_qty ?? 1,
        };
      });

      const res = await fetch("/api/admin/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...poForm, items: enriched }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast(`Purchase order #${data.id} created.`);
      setAddOpen(false);
      setPoForm({ supplier_id: "", notes: "" });
      setPoItems([{ ...EMPTY_ITEM }]);
      fetchOrders();
    } finally {
      setSaving(false);
    }
  };

  // ── View PO detail ────────────────────────────────────────────────────────
  const openView = async (order) => {
    setSelected(order);
    setPoDetail(null);
    setViewOpen(true);
    try {
      const res = await fetch(`/api/admin/purchase-orders/${order.id}`);
      const data = await res.json();
      setPoDetail(data);
    } catch {
      showToast("Failed to load order details.", false);
    }
  };

  // ── Action (approve / receive / cancel) ───────────────────────────────────
  const openAction = (order, action) => {
    setSelected(order);
    setPendingAction(action);
    setActionNote("");
    setActionOpen(true);
  };

  const handleAction = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/purchase-orders/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: pendingAction, notes: actionNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast(data.message);
      setActionOpen(false);
      setViewOpen(false);
      fetchOrders();
    } finally {
      setSaving(false);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch =
      !search ||
      o.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search);
    return matchStatus && matchSearch;
  });

  const countByStatus = (s) => orders.filter((o) => o.status === s).length;

  return (
    <>
      <style>{`
        @keyframes slideUpM { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .po-row:hover td { background: var(--bg) !important; }
        .act-btn { opacity:0; transition:opacity .15s; }
        .po-row:hover .act-btn { opacity:1; }
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
          Purchase Orders
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Create and manage stock purchase orders from suppliers.
        </p>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total Orders",
            value: orders.length,
            icon: "fa-file-invoice",
            color: "#2980b9",
          },
          {
            label: "Pending",
            value: countByStatus("pending"),
            icon: "fa-clock",
            color: "#e67e22",
          },
          {
            label: "Received",
            value: countByStatus("received"),
            icon: "fa-circle-check",
            color: "#27ae60",
          },
          {
            label: "Cancelled",
            value: countByStatus("cancelled"),
            icon: "fa-ban",
            color: "#c0392b",
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
                style={{ color: c.color, fontSize: 15 }}
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
              placeholder='Search supplier or PO#…'
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          {/* Status filter pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "pending", "received", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "7px 13px",
                  borderRadius: 8,
                  border: `1.5px solid ${statusFilter === s ? (STATUS_META[s]?.text ?? "var(--accent)") : "var(--border)"}`,
                  background:
                    statusFilter === s
                      ? s === "all"
                        ? "var(--accent)"
                        : STATUS_META[s]?.bg
                      : "var(--bg)",
                  color:
                    statusFilter === s
                      ? s === "all"
                        ? "#fff"
                        : STATUS_META[s]?.text
                      : "var(--muted)",
                  fontSize: ".78rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  textTransform: "capitalize",
                }}
              >
                {s === "all" ? "All" : STATUS_META[s]?.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setPoForm({ supplier_id: "", notes: "" });
              setPoItems([{ ...EMPTY_ITEM }]);
              setPoErrors({});
              setAddOpen(true);
            }}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: ".88rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            <i className='fa-solid fa-plus' style={{ fontSize: 12 }} />
            New PO
          </button>
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
        ) : filtered.length === 0 ? (
          <div
            style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}
          >
            <i
              className='fa-solid fa-file-invoice'
              style={{
                fontSize: 32,
                opacity: 0.3,
                display: "block",
                marginBottom: 12,
              }}
            />
            <div
              style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}
            >
              No purchase orders found
            </div>
            <div style={{ fontSize: ".82rem" }}>
              Create your first PO to start tracking stock purchases.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {[
                    "PO #",
                    "Supplier",
                    "Items",
                    "Total Cost",
                    "Status",
                    "Created By",
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
                {filtered.map((o, i) => {
                  const meta = STATUS_META[o.status] ?? STATUS_META.pending;
                  return (
                    <tr
                      key={o.id}
                      className='po-row'
                      style={{
                        borderBottom:
                          i < filtered.length - 1
                            ? "1px solid var(--cb)"
                            : "none",
                      }}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: ".9rem",
                            color: "var(--text)",
                          }}
                        >
                          #{o.id}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: ".88rem",
                            color: "var(--text)",
                          }}
                        >
                          {o.supplier_name}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--muted)",
                          textAlign: "center",
                        }}
                      >
                        {o.item_count}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontWeight: 700,
                          fontSize: ".9rem",
                          color: "var(--text)",
                        }}
                      >
                        {fmtRp(o.total_cost)}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 10px",
                            borderRadius: 99,
                            fontSize: ".72rem",
                            fontWeight: 600,
                            background: meta.bg,
                            color: meta.text,
                          }}
                        >
                          <i
                            className={`fa-solid ${meta.icon}`}
                            style={{ fontSize: 9 }}
                          />
                          {meta.label}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".8rem",
                          color: "var(--muted)",
                        }}
                      >
                        {o.created_by_name ?? "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtDate(o.ordered_at)}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 5,
                            justifyContent: "flex-end",
                          }}
                        >
                          {/* View */}
                          <button
                            className='act-btn'
                            title='View details'
                            onClick={() => openView(o)}
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
                          {/* Approve (pending only) */}
                          {o.status === "pending" && !o.approved_by_name && (
                            <button
                              className='act-btn'
                              title='Approve'
                              onClick={() => openAction(o, "approve")}
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
                                  "rgba(39,174,96,.15)";
                                e.currentTarget.style.color = "#27ae60";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--bg)";
                                e.currentTarget.style.color = "var(--muted)";
                              }}
                            >
                              <i className='fa-solid fa-thumbs-up' />
                            </button>
                          )}
                          {/* Receive */}
                          {o.status === "pending" && (
                            <button
                              className='act-btn'
                              title='Mark as Received'
                              onClick={() => openAction(o, "receive")}
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
                                  "rgba(46,64,49,.15)";
                                e.currentTarget.style.color = "var(--accent)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--bg)";
                                e.currentTarget.style.color = "var(--muted)";
                              }}
                            >
                              <i className='fa-solid fa-boxes-stacked' />
                            </button>
                          )}
                          {/* Cancel */}
                          {o.status === "pending" && (
                            <button
                              className='act-btn'
                              title='Cancel'
                              onClick={() => openAction(o, "cancel")}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create PO modal ── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title='New Purchase Order'
        width={640}
      >
        {/* Supplier */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: ".78rem",
              fontWeight: 600,
              color: "var(--muted)",
              marginBottom: 5,
            }}
          >
            Supplier <span style={{ color: "#c0392b" }}>*</span>
          </label>
          <select
            value={poForm.supplier_id}
            onChange={(e) =>
              setPoForm((f) => ({ ...f, supplier_id: e.target.value }))
            }
            style={{ ...inputStyle, cursor: "pointer" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          >
            <option value=''>— Select supplier —</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {poErrors.supplier_id && (
            <p style={{ color: "#c0392b", fontSize: ".72rem", marginTop: 4 }}>
              {poErrors.supplier_id}
            </p>
          )}
        </div>

        {/* Items */}
        <div style={{ marginBottom: 4 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <label
              style={{
                fontSize: ".78rem",
                fontWeight: 600,
                color: "var(--muted)",
              }}
            >
              Items <span style={{ color: "#c0392b" }}>*</span>
            </label>
            <button
              onClick={addItem}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 7,
                border: "1.5px solid var(--border)",
                background: "var(--bg)",
                color: "var(--accent)",
                fontSize: ".78rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <i className='fa-solid fa-plus' style={{ fontSize: 10 }} />
              Add Item
            </button>
          </div>

          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 110px 28px",
              gap: 6,
              marginBottom: 6,
            }}
          >
            {["Product", "Qty", "Unit Cost (Rp)", ""].map((h) => (
              <div
                key={h}
                style={{
                  fontSize: ".68rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  paddingLeft: 4,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {poItems.map((item, idx) => {
              const prod = products.find(
                (p) => String(p.id) === String(item.product_id),
              );
              return (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 90px 110px 28px",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <select
                    value={item.product_id}
                    onChange={(e) =>
                      updateItem(idx, "product_id", e.target.value)
                    }
                    style={{ ...inputStyle, fontSize: ".82rem" }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--accent)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  >
                    <option value=''>— Product —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ position: "relative" }}>
                    <input
                      type='number'
                      min='0.01'
                      step='any'
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "quantity",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      style={{ ...inputStyle, fontSize: ".82rem" }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--accent)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                    {prod && (
                      <span
                        style={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: ".65rem",
                          color: "var(--muted)",
                          pointerEvents: "none",
                        }}
                      >
                        {prod.purchase_unit_abbr}
                      </span>
                    )}
                  </div>
                  <input
                    type='number'
                    min='0'
                    value={item.unit_cost}
                    onChange={(e) =>
                      updateItem(
                        idx,
                        "unit_cost",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    style={{ ...inputStyle, fontSize: ".82rem" }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--accent)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={poItems.length === 1}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "none",
                      background: "transparent",
                      cursor: poItems.length === 1 ? "not-allowed" : "pointer",
                      color: poItems.length === 1 ? "var(--border)" : "#c0392b",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className='fa-solid fa-xmark' />
                  </button>
                </div>
              );
            })}
          </div>
          {poErrors.items && (
            <p style={{ color: "#c0392b", fontSize: ".72rem", marginTop: 8 }}>
              {poErrors.items}
            </p>
          )}
        </div>

        {/* Total */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10,
            padding: "12px 0",
            borderTop: "1px solid var(--cb)",
            borderBottom: "1px solid var(--cb)",
            margin: "16px 0",
          }}
        >
          <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>
            Estimated Total:
          </span>
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--text)",
            }}
          >
            {fmtRp(totalCost)}
          </span>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: ".78rem",
              fontWeight: 600,
              color: "var(--muted)",
              marginBottom: 5,
            }}
          >
            Notes
          </label>
          <textarea
            value={poForm.notes}
            onChange={(e) =>
              setPoForm((f) => ({ ...f, notes: e.target.value }))
            }
            placeholder='Delivery instructions, special requests…'
            style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setAddOpen(false)}
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
            onClick={handleCreatePO}
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
                Creating…
              </>
            ) : (
              <>
                <i className='fa-solid fa-file-invoice' />
                Create Purchase Order
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ── View PO detail modal ── */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={`Purchase Order #${selected?.id}`}
        width={580}
      >
        {!poDetail ? (
          <div
            style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
          >
            <i
              className='fa-solid fa-circle-notch fa-spin'
              style={{ fontSize: 24 }}
            />
          </div>
        ) : (
          <div>
            {/* PO header info */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 20,
              }}
            >
              {[
                { label: "Supplier", value: poDetail.order.supplier_name },
                {
                  label: "Status",
                  value: STATUS_META[poDetail.order.status]?.label,
                },
                {
                  label: "Created By",
                  value: poDetail.order.created_by_name ?? "—",
                },
                {
                  label: "Approved By",
                  value: poDetail.order.approved_by_name ?? "Pending",
                },
                {
                  label: "Ordered At",
                  value: fmtDate(poDetail.order.ordered_at),
                },
                {
                  label: "Received At",
                  value: fmtDate(poDetail.order.received_at),
                },
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
                      fontSize: ".7rem",
                      color: "var(--muted)",
                      marginBottom: 2,
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

            {/* Items table */}
            <div
              style={{
                border: "1px solid var(--cb)",
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  background: "var(--bg)",
                  padding: "8px 14px",
                  fontSize: ".7rem",
                  fontWeight: 600,
                  color: "var(--muted)",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 80px 100px",
                }}
              >
                <span>Product</span>
                <span>Qty</span>
                <span>Unit</span>
                <span style={{ textAlign: "right" }}>Cost</span>
              </div>
              {poDetail.items.map((item, i) => (
                <div
                  key={item.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 80px 100px",
                    padding: "10px 14px",
                    borderTop: "1px solid var(--cb)",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: ".85rem",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {item.product_name}
                  </span>
                  <span style={{ fontSize: ".82rem", color: "var(--muted)" }}>
                    {item.quantity}
                  </span>
                  <span style={{ fontSize: ".72rem", color: "var(--muted)" }}>
                    {item.purchase_unit_abbr}
                  </span>
                  <span
                    style={{
                      fontSize: ".85rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      textAlign: "right",
                    }}
                  >
                    {fmtRp(item.unit_cost * item.quantity)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderTop: "1px solid var(--cb)",
                  background: "var(--bg)",
                }}
              >
                <span
                  style={{
                    fontSize: ".82rem",
                    fontWeight: 600,
                    color: "var(--muted)",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {fmtRp(poDetail.order.total_cost)}
                </span>
              </div>
            </div>

            {/* Action buttons for pending orders */}
            {poDetail.order.status === "pending" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                }}
              >
                {!poDetail.order.approved_by_name && (
                  <button
                    onClick={() => {
                      setViewOpen(false);
                      openAction(poDetail.order, "approve");
                    }}
                    style={{
                      padding: "10px",
                      borderRadius: 9,
                      border: "none",
                      background: "rgba(39,174,96,.15)",
                      color: "#27ae60",
                      fontSize: ".82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'DM Sans',sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <i className='fa-solid fa-thumbs-up' />
                    Approve
                  </button>
                )}
                <button
                  onClick={() => {
                    setViewOpen(false);
                    openAction(poDetail.order, "receive");
                  }}
                  style={{
                    padding: "10px",
                    borderRadius: 9,
                    border: "none",
                    background: "rgba(46,64,49,.12)",
                    color: "var(--accent)",
                    fontSize: ".82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <i className='fa-solid fa-boxes-stacked' />
                  Receive
                </button>
                <button
                  onClick={() => {
                    setViewOpen(false);
                    openAction(poDetail.order, "cancel");
                  }}
                  style={{
                    padding: "10px",
                    borderRadius: 9,
                    border: "none",
                    background: "rgba(192,57,43,.1)",
                    color: "#c0392b",
                    fontSize: ".82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <i className='fa-solid fa-ban' />
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Action confirm modal ── */}
      <Modal
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        title={
          pendingAction === "approve"
            ? "Approve Order"
            : pendingAction === "receive"
              ? "Receive Stock"
              : "Cancel Order"
        }
      >
        {selected && (
          <div>
            {/* Warning/info box */}
            <div
              style={{
                display: "flex",
                gap: 12,
                padding: "12px 16px",
                borderRadius: 10,
                marginBottom: 20,
                background:
                  pendingAction === "cancel"
                    ? "rgba(192,57,43,.07)"
                    : "rgba(46,64,49,.07)",
                border: `1px solid ${pendingAction === "cancel" ? "rgba(192,57,43,.2)" : "rgba(46,64,49,.2)"}`,
              }}
            >
              <i
                className={`fa-solid ${pendingAction === "receive" ? "fa-boxes-stacked" : pendingAction === "approve" ? "fa-thumbs-up" : "fa-triangle-exclamation"}`}
                style={{
                  color:
                    pendingAction === "cancel" ? "#c0392b" : "var(--accent)",
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
                {pendingAction === "approve" && (
                  <>
                    Approving <b>PO #{selected.id}</b> from{" "}
                    <b>{selected.supplier_name}</b> confirms this order is
                    authorized.
                  </>
                )}
                {pendingAction === "receive" && (
                  <>
                    Marking <b>PO #{selected.id}</b> as received will
                    automatically <b>add all items to stock</b>. This cannot be
                    undone.
                  </>
                )}
                {pendingAction === "cancel" && (
                  <>
                    This will cancel <b>PO #{selected.id}</b> from{" "}
                    <b>{selected.supplier_name}</b>. No stock changes will be
                    made.
                  </>
                )}
              </div>
            </div>

            {pendingAction === "cancel" && (
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: ".78rem",
                    fontWeight: 600,
                    color: "var(--muted)",
                    marginBottom: 5,
                  }}
                >
                  Reason for cancellation
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder='e.g. Supplier not available, price changed…'
                  style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--accent)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setActionOpen(false)}
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
                onClick={handleAction}
                disabled={saving}
                style={{
                  flex: 2,
                  padding: "11px",
                  borderRadius: 9,
                  border: "none",
                  background:
                    pendingAction === "cancel" ? "#c0392b" : "var(--accent)",
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
                    Processing…
                  </>
                ) : (
                  <>
                    <i
                      className={`fa-solid ${pendingAction === "approve" ? "fa-thumbs-up" : pendingAction === "receive" ? "fa-boxes-stacked" : "fa-ban"}`}
                    />
                    {pendingAction === "approve"
                      ? "Approve Order"
                      : pendingAction === "receive"
                        ? "Receive & Update Stock"
                        : "Cancel Order"}
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
