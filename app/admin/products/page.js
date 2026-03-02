"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtPrice = (n) => `Rp ${fmt(n)}`;

const CATEGORY_COLORS = {
  sellable: { bg: "rgba(41,128,185,.1)", text: "#2980b9" },
  consumable: { bg: "rgba(142,68,173,.1)", text: "#8e44ad" },
  both: { bg: "rgba(46,64,49,.1)", text: "#2E4031" },
};

function StockBadge({ qty, threshold }) {
  const low = qty <= threshold;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 99,
        fontSize: ".72rem",
        fontWeight: 600,
        background: low ? "rgba(230,126,34,.12)" : "rgba(39,174,96,.1)",
        color: low ? "#e67e22" : "#27ae60",
      }}
    >
      <i
        className={`fa-solid ${low ? "fa-triangle-exclamation" : "fa-circle-check"}`}
        style={{ fontSize: 9 }}
      />
      {qty}
    </span>
  );
}

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

function Field({ label, required, error, children, half }) {
  return (
    <div
      style={{
        marginBottom: 14,
        flex: half ? "0 0 calc(50% - 6px)" : "0 0 100%",
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: ".78rem",
          fontWeight: 600,
          color: "var(--muted)",
          marginBottom: 5,
        }}
      >
        {label}
        {required && <span style={{ color: "#c0392b", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ color: "#c0392b", fontSize: ".72rem", marginTop: 4 }}>
          {error}
        </p>
      )}
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

const selectStyle = { ...inputStyle, cursor: "pointer" };

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const EMPTY = {
    name: "",
    sku: "",
    category_id: "",
    stock_unit_id: "",
    purchase_unit_id: "",
    purchase_to_stock_qty: 1,
    cost_price: 0,
    selling_price: 0,
    low_stock_alert: 10,
    notes: "",
  };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products ?? []);
      setCategories(data.categories ?? []);
      setUnits(data.units ?? []);
    } catch {
      showToast("Failed to load products.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.category_id) e.category_id = "Select a category.";
    if (!form.stock_unit_id) e.stock_unit_id = "Select stock unit.";
    if (!form.purchase_unit_id) e.purchase_unit_id = "Select purchase unit.";
    if (form.purchase_to_stock_qty <= 0)
      e.purchase_to_stock_qty = "Must be > 0.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Product created.");
      setAddOpen(false);
      setForm(EMPTY);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p) => {
    setSelected(p);
    setForm({
      name: p.name,
      sku: p.sku ?? "",
      category_id: String(p.category_id),
      stock_unit_id: String(p.stock_unit_id),
      purchase_unit_id: String(p.purchase_unit_id),
      purchase_to_stock_qty: p.purchase_to_stock_qty,
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      low_stock_alert: p.low_stock_alert,
      notes: p.notes ?? "",
      is_active: Boolean(p.is_active),
    });
    setErrors({});
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Product updated.");
      setEditOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${selected.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Product deactivated.");
      setDeleteOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  // Tabs = All + each category
  const tabs = [{ id: "all", name: "All", type: null }, ...categories];
  const filtered = products.filter((p) => {
    const matchTab =
      activeTab === "all" || String(p.category_id) === String(activeTab);
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
    const matchActive = showInactive ? true : p.is_active;
    return matchTab && matchSearch && matchActive;
  });

  const ProductForm = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
      <Field label='Product Name' required error={errors.name}>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder='e.g. Arabica Gayo'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='SKU' half error={errors.sku}>
        <input
          style={inputStyle}
          value={form.sku}
          onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          placeholder='e.g. CBN-001'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Category' required half error={errors.category_id}>
        <select
          style={selectStyle}
          value={form.category_id}
          onChange={(e) =>
            setForm((f) => ({ ...f, category_id: e.target.value }))
          }
        >
          <option value=''>— Select —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label='Stock Unit' required half error={errors.stock_unit_id}>
        <select
          style={selectStyle}
          value={form.stock_unit_id}
          onChange={(e) =>
            setForm((f) => ({ ...f, stock_unit_id: e.target.value }))
          }
        >
          <option value=''>— Select —</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.abbr})
            </option>
          ))}
        </select>
      </Field>
      <Field
        label='Purchase Unit'
        required
        half
        error={errors.purchase_unit_id}
      >
        <select
          style={selectStyle}
          value={form.purchase_unit_id}
          onChange={(e) =>
            setForm((f) => ({ ...f, purchase_unit_id: e.target.value }))
          }
        >
          <option value=''>— Select —</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.abbr})
            </option>
          ))}
        </select>
      </Field>
      <Field
        label='Purchase → Stock Qty'
        required
        half
        error={errors.purchase_to_stock_qty}
      >
        <input
          style={inputStyle}
          type='number'
          min='0.01'
          step='any'
          value={form.purchase_to_stock_qty}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              purchase_to_stock_qty: parseFloat(e.target.value) || 1,
            }))
          }
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Cost Price (per purchase unit)' half>
        <input
          style={inputStyle}
          type='number'
          min='0'
          value={form.cost_price}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              cost_price: parseFloat(e.target.value) || 0,
            }))
          }
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Selling Price (per stock unit)' half>
        <input
          style={inputStyle}
          type='number'
          min='0'
          value={form.selling_price}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              selling_price: parseFloat(e.target.value) || 0,
            }))
          }
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Low Stock Alert Threshold' half>
        <input
          style={inputStyle}
          type='number'
          min='0'
          value={form.low_stock_alert}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              low_stock_alert: parseFloat(e.target.value) || 0,
            }))
          }
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      {form.is_active !== undefined && (
        <Field label='Status' half>
          <div style={{ display: "flex", gap: 8 }}>
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type='button'
                onClick={() => setForm((f) => ({ ...f, is_active: v }))}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 8,
                  border: `1.5px solid ${form.is_active === v ? "var(--accent)" : "var(--border)"}`,
                  background:
                    form.is_active === v ? "var(--accent)" : "var(--bg)",
                  color: form.is_active === v ? "#fff" : "var(--muted)",
                  fontSize: ".82rem",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {v ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Field label='Notes'>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder='Optional notes…'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
    </div>
  );

  const SaveBtn = ({ onClick, label, icon }) => (
    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
      <button
        onClick={() => {
          setAddOpen(false);
          setEditOpen(false);
        }}
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
        onClick={onClick}
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
            <i className={`fa-solid ${icon}`} />
            {label}
          </>
        )}
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeInBd { from{opacity:0} to{opacity:1} }
        @keyframes slideUpM { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .prod-row:hover td { background: var(--bg) !important; }
        .act-btn { opacity:0; transition:opacity .15s; }
        .prod-row:hover .act-btn { opacity:1; }
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
          Products
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Manage your product catalog, pricing, and unit settings.
        </p>
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
              placeholder='Search name or SKU…'
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <button
            onClick={() => setShowInactive(!showInactive)}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              border: `1.5px solid ${showInactive ? "var(--accent)" : "var(--border)"}`,
              background: showInactive ? "rgba(46,64,49,.1)" : "var(--bg)",
              color: showInactive ? "var(--accent)" : "var(--muted)",
              fontSize: ".82rem",
              cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className='fa-solid fa-eye' style={{ fontSize: 12 }} />
            Show Inactive
          </button>
          <button
            onClick={() => {
              setForm(EMPTY);
              setErrors({});
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
            Add Product
          </button>
        </div>

        {/* Category tabs */}
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
            {tabs.map((tab) => {
              const count =
                tab.id === "all"
                  ? products.filter((p) => showInactive || p.is_active).length
                  : products.filter(
                      (p) =>
                        String(p.category_id) === String(tab.id) &&
                        (showInactive || p.is_active),
                    ).length;
              const active = activeTab === String(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(String(tab.id))}
                  style={{
                    padding: "11px 14px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: ".82rem",
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--accent)" : "var(--muted)",
                    borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  {tab.name}
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: 99,
                      fontSize: ".68rem",
                      fontWeight: 700,
                      background: active ? "var(--accent)" : "var(--bg)",
                      color: active ? "#fff" : "var(--muted)",
                      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
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
        ) : filtered.length === 0 ? (
          <div
            style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}
          >
            <i
              className='fa-solid fa-box-open'
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
              No products found
            </div>
            <div style={{ fontSize: ".82rem" }}>
              Try adjusting your search or filter.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {[
                    "Product",
                    "SKU",
                    "Category",
                    "Stock",
                    "Cost Price",
                    "Selling Price",
                    "Status",
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
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className='prod-row'
                    style={{
                      borderBottom:
                        i < filtered.length - 1
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
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: ".73rem",
                          color: "var(--muted)",
                          marginTop: 1,
                        }}
                      >
                        1 {p.purchase_unit_abbr} = {p.purchase_to_stock_qty}{" "}
                        {p.stock_unit_abbr}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: ".8rem",
                        color: "var(--muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      {p.sku ?? "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          ...CATEGORY_COLORS[p.category_type],
                          padding: "3px 9px",
                          borderRadius: 99,
                          fontSize: ".72rem",
                          fontWeight: 600,
                        }}
                      >
                        {p.category_name}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <StockBadge
                        qty={p.stock_qty}
                        threshold={p.low_stock_alert}
                      />
                      <span
                        style={{
                          fontSize: ".7rem",
                          color: "var(--muted)",
                          marginLeft: 4,
                        }}
                      >
                        {p.stock_unit_abbr}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: ".82rem",
                        color: "var(--muted)",
                      }}
                    >
                      {fmtPrice(p.cost_price)}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: ".82rem",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {fmtPrice(p.selling_price)}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 99,
                          fontSize: ".7rem",
                          fontWeight: 600,
                          background: p.is_active
                            ? "rgba(39,174,96,.1)"
                            : "rgba(192,57,43,.1)",
                          color: p.is_active ? "#27ae60" : "#c0392b",
                        }}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          justifyContent: "flex-end",
                        }}
                      >
                        {[
                          {
                            icon: "fa-eye",
                            title: "View",
                            action: () => {
                              setSelected(p);
                              setViewOpen(true);
                            },
                            hc: "rgba(41,128,185,.15)",
                            tc: "#2980b9",
                          },
                          {
                            icon: "fa-pen-to-square",
                            title: "Edit",
                            action: () => openEdit(p),
                            hc: "rgba(46,64,49,.15)",
                            tc: "var(--accent)",
                          },
                          {
                            icon: "fa-ban",
                            title: "Deactivate",
                            action: () => {
                              setSelected(p);
                              setDeleteOpen(true);
                            },
                            hc: "rgba(192,57,43,.12)",
                            tc: "#c0392b",
                            hide: !p.is_active,
                          },
                        ]
                          .filter((b) => !b.hide)
                          .map((b) => (
                            <button
                              key={b.icon}
                              className='act-btn'
                              title={b.title}
                              onClick={b.action}
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
                                e.currentTarget.style.background = b.hc;
                                e.currentTarget.style.color = b.tc;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--bg)";
                                e.currentTarget.style.color = "var(--muted)";
                              }}
                            >
                              <i className={`fa-solid ${b.icon}`} />
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title='Add New Product'
        width={600}
      >
        <ProductForm />
        <SaveBtn onClick={handleAdd} label='Create Product' icon='fa-plus' />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit — ${selected?.name}`}
        width={600}
      >
        <ProductForm />
        <SaveBtn
          onClick={handleEdit}
          label='Save Changes'
          icon='fa-floppy-disk'
        />
      </Modal>

      {/* View modal */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title='Product Details'
      >
        {selected && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {[
                { label: "Category", value: selected.category_name },
                { label: "SKU", value: selected.sku ?? "—" },
                {
                  label: "Stock Unit",
                  value: `${selected.stock_unit_name} (${selected.stock_unit_abbr})`,
                },
                {
                  label: "Purchase Unit",
                  value: `${selected.purchase_unit_name} (${selected.purchase_unit_abbr})`,
                },
                {
                  label: "Conversion",
                  value: `1 ${selected.purchase_unit_abbr} = ${selected.purchase_to_stock_qty} ${selected.stock_unit_abbr}`,
                },
                {
                  label: "Current Stock",
                  value: `${selected.stock_qty} ${selected.stock_unit_abbr}`,
                },
                { label: "Cost Price", value: fmtPrice(selected.cost_price) },
                {
                  label: "Selling Price",
                  value: fmtPrice(selected.selling_price),
                },
                {
                  label: "Low Stock Alert",
                  value: `${selected.low_stock_alert} ${selected.stock_unit_abbr}`,
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
                      marginBottom: 3,
                    }}
                  >
                    {r.label}
                  </div>
                  <div
                    style={{
                      fontSize: ".88rem",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {r.value}
                  </div>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div
                style={{
                  background: "var(--bg)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: ".85rem",
                  color: "var(--muted)",
                }}
              >
                <b style={{ color: "var(--text)" }}>Notes: </b>
                {selected.notes}
              </div>
            )}
            <button
              onClick={() => {
                setViewOpen(false);
                openEdit(selected);
              }}
              style={{
                width: "100%",
                marginTop: 16,
                padding: "11px",
                borderRadius: 9,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: ".88rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <i
                className='fa-solid fa-pen-to-square'
                style={{ marginRight: 8 }}
              />
              Edit Product
            </button>
          </div>
        )}
      </Modal>

      {/* Deactivate confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title='Deactivate Product'
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
                <b>{selected.name}</b> will be marked inactive and hidden from
                new orders. This can be reversed by editing the product.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteOpen(false)}
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
                onClick={handleDelete}
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
                    Processing…
                  </>
                ) : (
                  <>
                    <i className='fa-solid fa-ban' />
                    Deactivate
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
