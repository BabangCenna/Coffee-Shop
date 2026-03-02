"use client";

import { useState, useEffect, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtPrice = (n) => `Rp ${fmt(n)}`;

const CATEGORY_COLORS = [
  { bg: "rgba(46,64,49,.1)", text: "var(--accent)" },
  { bg: "rgba(41,128,185,.1)", text: "#2980b9" },
  { bg: "rgba(142,68,173,.1)", text: "#8e44ad" },
  { bg: "rgba(243,156,18,.12)", text: "#d68910" },
  { bg: "rgba(39,174,96,.1)", text: "#27ae60" },
  { bg: "rgba(230,126,34,.12)", text: "#e67e22" },
];
const getCatColor = (name = "") =>
  CATEGORY_COLORS[
    Math.abs(name.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
      CATEGORY_COLORS.length
  ];

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
  boxSizing: "border-box",
};
const selectStyle = { ...inputStyle, cursor: "pointer" };

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const EMPTY = {
    name: "",
    category: "",
    price: 0,
    notes: "",
    is_active: true,
  };
  const [form, setForm] = useState(EMPTY);

  // Recipe state: array of { product_id, quantity, unit_id }
  const [recipe, setRecipe] = useState([]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu");
      const data = await res.json();
      setItems(data.items ?? []);
      setProducts(data.products ?? []);
      setUnits(data.units ?? []);
    } catch {
      showToast("Failed to load menu.", false);
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
    if (!form.price && form.price !== 0) e.price = "Price is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Menu item created.");
      setAddOpen(false);
      setForm(EMPTY);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item) => {
    setSelected(item);
    setForm({
      name: item.name,
      category: item.category ?? "",
      price: item.price,
      notes: item.notes ?? "",
      is_active: Boolean(item.is_active),
    });
    setErrors({});
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/menu/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Menu item updated.");
      setEditOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const openRecipe = async (item) => {
    setSelected(item);
    try {
      const res = await fetch(`/api/admin/menu/${item.id}/recipe`);
      const data = await res.json();
      setRecipe(data.recipe ?? []);
    } catch {
      setRecipe([]);
    }
    setRecipeOpen(true);
  };

  const handleSaveRecipe = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/menu/${selected.id}/recipe`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Recipe saved.");
      setRecipeOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/menu/${selected.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Menu item deactivated.");
      setDeleteOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  // All unique categories
  const categories = [
    "all",
    ...Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
  ];

  const filtered = items.filter((item) => {
    const matchCat = catFilter === "all" || item.category === catFilter;
    const matchSearch =
      !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchActive = showInactive ? true : item.is_active;
    return matchCat && matchSearch && matchActive;
  });

  const MenuForm = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
      <Field label='Item Name' required error={errors.name}>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder='e.g. Arabica Latte'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Category' half>
        <input
          style={inputStyle}
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          placeholder='e.g. Coffee, Food, Snack'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Price (Rp)' required half error={errors.price}>
        <input
          style={inputStyle}
          type='number'
          min='0'
          value={form.price}
          onChange={(e) =>
            setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))
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
          style={{ ...inputStyle, resize: "vertical", minHeight: 66 }}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder='Optional description or allergen info…'
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
        .menu-card { transition:box-shadow .2s,transform .2s; }
        .menu-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.1); transform:translateY(-2px); }
        .menu-card:hover .act-btns { opacity:1 !important; }
        .ord-row:hover td { background: var(--bg) !important; }
        .act-btn { opacity:0; transition:opacity .15s; }
        .ord-row:hover .act-btn { opacity:1; }
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
          Menu
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Manage your menu items, pricing, and ingredient recipes.
        </p>
      </div>

      {/* Stats row */}
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
            label: "Total Items",
            value: items.length,
            icon: "fa-book-open",
            color: "#2980b9",
            bg: "rgba(41,128,185,.1)",
          },
          {
            label: "Active Items",
            value: items.filter((i) => i.is_active).length,
            icon: "fa-circle-check",
            color: "#27ae60",
            bg: "rgba(39,174,96,.1)",
          },
          {
            label: "Categories",
            value: categories.length - 1,
            icon: "fa-layer-group",
            color: "var(--accent)",
            bg: "rgba(46,64,49,.1)",
          },
          {
            label: "With Recipes",
            value: items.filter((i) => i.recipe_count > 0).length,
            icon: "fa-flask",
            color: "#8e44ad",
            bg: "rgba(142,68,173,.1)",
          },
        ].map((s) => (
          <div
            key={s.label}
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
                  fontSize: "1.35rem",
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
              placeholder='Search menu items…'
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          {/* View toggle */}
          <div
            style={{
              display: "flex",
              border: "1.5px solid var(--border)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {[
              { v: "grid", icon: "fa-grip" },
              { v: "table", icon: "fa-table-list" },
            ].map(({ v, icon }) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                style={{
                  width: 34,
                  height: 34,
                  border: "none",
                  background: viewMode === v ? "var(--accent)" : "none",
                  color: viewMode === v ? "#fff" : "var(--muted)",
                  cursor: "pointer",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all .15s",
                }}
              >
                <i className={`fa-solid ${icon}`} />
              </button>
            ))}
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
            Add Item
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
            {categories.map((cat) => {
              const count =
                cat === "all"
                  ? items.filter((i) => showInactive || i.is_active).length
                  : items.filter(
                      (i) =>
                        i.category === cat && (showInactive || i.is_active),
                    ).length;
              const isActive = catFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
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
                  {cat === "all" ? "All" : cat}
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

        {/* Content */}
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
              className='fa-solid fa-book-open'
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
              No menu items found
            </div>
            <div style={{ fontSize: ".82rem" }}>
              Try adjusting your search or filter.
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* ── Grid view ── */
          <div
            style={{
              padding: 20,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            {filtered.map((item) => {
              const cc = getCatColor(item.category);
              return (
                <div
                  key={item.id}
                  className='menu-card'
                  style={{
                    background: "var(--bg)",
                    border: "1.5px solid var(--border)",
                    borderRadius: 14,
                    overflow: "hidden",
                    opacity: item.is_active ? 1 : 0.55,
                    position: "relative",
                  }}
                >
                  {/* Color stripe */}
                  <div
                    style={{ height: 5, background: cc.text, opacity: 0.7 }}
                  />
                  <div style={{ padding: "14px 16px 16px" }}>
                    {/* Category badge */}
                    {item.category && (
                      <span
                        style={{
                          ...cc,
                          padding: "2px 8px",
                          borderRadius: 99,
                          fontSize: ".65rem",
                          fontWeight: 700,
                          display: "inline-block",
                          marginBottom: 8,
                        }}
                      >
                        {item.category}
                      </span>
                    )}
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: ".95rem",
                        color: "var(--text)",
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.name}
                    </div>
                    {item.notes && (
                      <div
                        style={{
                          fontSize: ".72rem",
                          color: "var(--muted)",
                          marginBottom: 10,
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.notes}
                      </div>
                    )}
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: "1.05rem",
                        color: "var(--accent)",
                        marginBottom: 12,
                      }}
                    >
                      {fmtPrice(item.price)}
                    </div>
                    {/* Recipe indicator */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 12,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "3px 8px",
                          borderRadius: 99,
                          fontSize: ".68rem",
                          fontWeight: 600,
                          background:
                            item.recipe_count > 0
                              ? "rgba(142,68,173,.1)"
                              : "var(--bg)",
                          color:
                            item.recipe_count > 0 ? "#8e44ad" : "var(--muted)",
                          border: `1px solid ${item.recipe_count > 0 ? "rgba(142,68,173,.2)" : "var(--border)"}`,
                        }}
                      >
                        <i
                          className='fa-solid fa-flask'
                          style={{ fontSize: 9 }}
                        />
                        {item.recipe_count > 0
                          ? `${item.recipe_count} ingredient${item.recipe_count > 1 ? "s" : ""}`
                          : "No recipe"}
                      </span>
                      {!item.is_active && (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 99,
                            fontSize: ".65rem",
                            fontWeight: 600,
                            background: "rgba(192,57,43,.1)",
                            color: "#c0392b",
                          }}
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div
                      className='act-btns'
                      style={{
                        display: "flex",
                        gap: 6,
                        opacity: 0,
                        transition: "opacity .15s",
                      }}
                    >
                      <button
                        title='Edit'
                        onClick={() => openEdit(item)}
                        style={{
                          flex: 1,
                          height: 30,
                          borderRadius: 7,
                          border: "1.5px solid var(--border)",
                          background: "none",
                          cursor: "pointer",
                          color: "var(--muted)",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          fontFamily: "'DM Sans',sans-serif",
                          fontSize: ".72rem",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--accent)";
                          e.currentTarget.style.color = "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--muted)";
                        }}
                      >
                        <i className='fa-solid fa-pen' />
                        Edit
                      </button>
                      <button
                        title='Edit Recipe'
                        onClick={() => openRecipe(item)}
                        style={{
                          flex: 1,
                          height: 30,
                          borderRadius: 7,
                          border: "1.5px solid var(--border)",
                          background: "none",
                          cursor: "pointer",
                          color: "var(--muted)",
                          fontSize: 11,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          fontFamily: "'DM Sans',sans-serif",
                          fontSize: ".72rem",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#8e44ad";
                          e.currentTarget.style.color = "#8e44ad";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--muted)";
                        }}
                      >
                        <i className='fa-solid fa-flask' />
                        Recipe
                      </button>
                      {item.is_active && (
                        <button
                          title='Deactivate'
                          onClick={() => {
                            setSelected(item);
                            setDeleteOpen(true);
                          }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: "1.5px solid var(--border)",
                            background: "none",
                            cursor: "pointer",
                            color: "var(--muted)",
                            fontSize: 11,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#c0392b";
                            e.currentTarget.style.color = "#c0392b";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--muted)";
                          }}
                        >
                          <i className='fa-solid fa-ban' />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Table view ── */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["Item", "Category", "Price", "Recipe", "Status", ""].map(
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
                {filtered.map((item, i) => {
                  const cc = getCatColor(item.category);
                  return (
                    <tr
                      key={item.id}
                      className='ord-row'
                      style={{
                        borderBottom:
                          i < filtered.length - 1
                            ? "1px solid var(--cb)"
                            : "none",
                        opacity: item.is_active ? 1 : 0.55,
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
                        {item.notes && (
                          <div
                            style={{
                              fontSize: ".72rem",
                              color: "var(--muted)",
                              marginTop: 1,
                            }}
                          >
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {item.category ? (
                          <span
                            style={{
                              ...cc,
                              padding: "3px 9px",
                              borderRadius: 99,
                              fontSize: ".72rem",
                              fontWeight: 600,
                            }}
                          >
                            {item.category}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--muted)",
                              fontSize: ".78rem",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontWeight: 700,
                          fontSize: ".88rem",
                          color: "var(--text)",
                        }}
                      >
                        {fmtPrice(item.price)}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: ".72rem",
                            fontWeight: 600,
                            background:
                              item.recipe_count > 0
                                ? "rgba(142,68,173,.1)"
                                : "var(--bg)",
                            color:
                              item.recipe_count > 0
                                ? "#8e44ad"
                                : "var(--muted)",
                            border: `1px solid ${item.recipe_count > 0 ? "rgba(142,68,173,.2)" : "var(--border)"}`,
                          }}
                        >
                          <i
                            className='fa-solid fa-flask'
                            style={{ fontSize: 9 }}
                          />
                          {item.recipe_count > 0
                            ? `${item.recipe_count} ingredient${item.recipe_count > 1 ? "s" : ""}`
                            : "No recipe"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: ".7rem",
                            fontWeight: 600,
                            background: item.is_active
                              ? "rgba(39,174,96,.1)"
                              : "rgba(192,57,43,.1)",
                            color: item.is_active ? "#27ae60" : "#c0392b",
                          }}
                        >
                          {item.is_active ? "Active" : "Inactive"}
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
                              icon: "fa-pen-to-square",
                              title: "Edit",
                              action: () => openEdit(item),
                              hc: "rgba(46,64,49,.15)",
                              tc: "var(--accent)",
                            },
                            {
                              icon: "fa-flask",
                              title: "Recipe",
                              action: () => openRecipe(item),
                              hc: "rgba(142,68,173,.15)",
                              tc: "#8e44ad",
                            },
                            {
                              icon: "fa-ban",
                              title: "Deactivate",
                              action: () => {
                                setSelected(item);
                                setDeleteOpen(true);
                              },
                              hc: "rgba(192,57,43,.12)",
                              tc: "#c0392b",
                              hide: !item.is_active,
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
                                  e.currentTarget.style.background =
                                    "var(--bg)";
                                  e.currentTarget.style.color = "var(--muted)";
                                }}
                              >
                                <i className={`fa-solid ${b.icon}`} />
                              </button>
                            ))}
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

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title='Add Menu Item'
        width={560}
      >
        <MenuForm />
        <SaveBtn onClick={handleAdd} label='Create Item' icon='fa-plus' />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit — ${selected?.name}`}
        width={560}
      >
        <MenuForm />
        <SaveBtn
          onClick={handleEdit}
          label='Save Changes'
          icon='fa-floppy-disk'
        />
      </Modal>

      {/* Recipe modal */}
      <Modal
        open={recipeOpen}
        onClose={() => setRecipeOpen(false)}
        title={`Recipe — ${selected?.name}`}
        width={600}
      >
        <div>
          <p
            style={{
              fontSize: ".82rem",
              color: "var(--muted)",
              marginBottom: 18,
            }}
          >
            Define the ingredients consumed when this item is sold. Stock will
            be deducted automatically on each order.
          </p>

          {/* Ingredient rows */}
          {recipe.length === 0 ? (
            <div
              style={{
                padding: "28px",
                textAlign: "center",
                color: "var(--muted)",
                background: "var(--bg)",
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <i
                className='fa-solid fa-flask'
                style={{
                  fontSize: 24,
                  opacity: 0.3,
                  display: "block",
                  marginBottom: 8,
                }}
              />
              <div style={{ fontSize: ".82rem" }}>
                No ingredients yet. Add one below.
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              {recipe.map((row, idx) => {
                const prod = products.find(
                  (p) => String(p.id) === String(row.product_id),
                );
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    {/* Product select */}
                    <select
                      value={row.product_id}
                      onChange={(e) =>
                        setRecipe((r) =>
                          r.map((x, i) =>
                            i === idx
                              ? { ...x, product_id: e.target.value }
                              : x,
                          ),
                        )
                      }
                      style={{ ...selectStyle, flex: 2 }}
                    >
                      <option value=''>— Select ingredient —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.stock_unit_abbr})
                        </option>
                      ))}
                    </select>
                    {/* Quantity */}
                    <input
                      type='number'
                      min='0.01'
                      step='any'
                      value={row.quantity}
                      onChange={(e) =>
                        setRecipe((r) =>
                          r.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  quantity: parseFloat(e.target.value) || 0,
                                }
                              : x,
                          ),
                        )
                      }
                      style={{ ...inputStyle, width: 80, flex: "0 0 80px" }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--accent)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--border)")
                      }
                    />
                    {/* Unit label */}
                    <span
                      style={{
                        fontSize: ".78rem",
                        color: "var(--muted)",
                        minWidth: 30,
                      }}
                    >
                      {prod?.stock_unit_abbr ?? ""}
                    </span>
                    {/* Remove */}
                    <button
                      onClick={() =>
                        setRecipe((r) => r.filter((_, i) => i !== idx))
                      }
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: "1.5px solid var(--border)",
                        background: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                        fontSize: 11,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#c0392b";
                        e.currentTarget.style.color = "#c0392b";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.color = "var(--muted)";
                      }}
                    >
                      <i className='fa-solid fa-minus' />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add ingredient row button */}
          <button
            onClick={() =>
              setRecipe((r) => [
                ...r,
                { product_id: "", quantity: 1, unit_id: "" },
              ])
            }
            style={{
              width: "100%",
              padding: "9px",
              borderRadius: 9,
              border: "2px dashed var(--border)",
              background: "none",
              color: "var(--muted)",
              fontSize: ".82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 20,
              fontFamily: "'DM Sans',sans-serif",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            <i className='fa-solid fa-plus' />
            Add Ingredient
          </button>

          {/* Estimated cost */}
          {recipe.length > 0 &&
            (() => {
              const cost = recipe.reduce((sum, row) => {
                const prod = products.find(
                  (p) => String(p.id) === String(row.product_id),
                );
                if (!prod) return sum;
                const costPerStockUnit =
                  prod.cost_price / prod.purchase_to_stock_qty;
                return sum + costPerStockUnit * (row.quantity || 0);
              }, 0);
              const margin =
                selected?.price > 0
                  ? (((selected.price - cost) / selected.price) * 100).toFixed(
                      1,
                    )
                  : null;
              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  {[
                    {
                      label: "Est. Cost",
                      value: fmtPrice(Math.round(cost)),
                      color: "#c0392b",
                    },
                    {
                      label: "Selling Price",
                      value: fmtPrice(selected?.price ?? 0),
                      color: "var(--text)",
                    },
                    {
                      label: "Gross Margin",
                      value: margin != null ? `${margin}%` : "—",
                      color:
                        parseFloat(margin) > 50
                          ? "#27ae60"
                          : parseFloat(margin) > 20
                            ? "#d68910"
                            : "#c0392b",
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      style={{
                        background: "var(--bg)",
                        borderRadius: 10,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: ".68rem",
                          color: "var(--muted)",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          marginBottom: 4,
                        }}
                      >
                        {r.label}
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "1rem",
                          color: r.color,
                        }}
                      >
                        {r.value}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

          {/* Save */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setRecipeOpen(false)}
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
              onClick={handleSaveRecipe}
              disabled={saving}
              style={{
                flex: 2,
                padding: "11px",
                borderRadius: 9,
                border: "none",
                background: "#8e44ad",
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
                  <i className='fa-solid fa-flask' />
                  Save Recipe
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Deactivate confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title='Deactivate Item'
        width={440}
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
                <b>{selected.name}</b> will be hidden from new orders. This can
                be reversed by editing the item.
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
