"use client";

import { useState, useEffect, useCallback } from "react";

const fmtDate = (dt) =>
  dt
    ? new Date(dt).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function Modal({ open, onClose, title, children, width = 500 }) {
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
  transition: "border-color .2s",
};

function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
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
        <p
          style={{
            color: "#c0392b",
            fontSize: ".72rem",
            marginTop: 4,
            margin: "4px 0 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function SupplierAvatar({ name }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        flexShrink: 0,
        background: "rgba(46,64,49,.12)",
        border: "2px solid rgba(46,64,49,.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: ".78rem",
        color: "var(--accent)",
      }}
    >
      {initials}
    </div>
  );
}

const EMPTY = {
  name: "",
  contact_name: "",
  phone: "",
  address: "",
  product_type: "",
  notes: "",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

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
      const res = await fetch("/api/admin/suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers ?? []);
    } catch {
      showToast("Failed to load suppliers.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Supplier name is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Supplier added.");
      setAddOpen(false);
      setForm(EMPTY);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (s) => {
    setSelected(s);
    setForm({
      name: s.name,
      contact_name: s.contact_name ?? "",
      phone: s.phone ?? "",
      address: s.address ?? "",
      product_type: s.product_type ?? "",
      notes: s.notes ?? "",
      is_active: Boolean(s.is_active),
    });
    setErrors({});
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/suppliers/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Supplier updated.");
      setEditOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/suppliers/${selected.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Supplier deactivated.");
      setDeleteOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const filtered = suppliers.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.phone ?? "").includes(search);
    const matchActive = showInactive ? true : s.is_active;
    return matchSearch && matchActive;
  });

  const SupplierForm = ({ isEdit }) => (
    <>
      <Field label='Supplier Name' required error={errors.name}>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder='e.g. PT Kopi Nusantara'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 12px",
        }}
      >
        <Field label='Contact Person'>
          <input
            style={inputStyle}
            value={form.contact_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, contact_name: e.target.value }))
            }
            placeholder='e.g. Budi Santoso'
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>
        <Field label='Phone'>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: ".82rem",
                color: "var(--muted)",
                borderRight: "1px solid var(--border)",
                paddingRight: 8,
                lineHeight: 1,
              }}
            >
              +62
            </span>
            <input
              style={{ ...inputStyle, paddingLeft: 52 }}
              type='tel'
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
              placeholder='812 3456 7890'
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        </Field>
      </div>
      <Field label='Product Type / Specialty'>
        <input
          style={inputStyle}
          value={form.product_type}
          onChange={(e) =>
            setForm((f) => ({ ...f, product_type: e.target.value }))
          }
          placeholder='e.g. Coffee Beans, Dairy, Packaging'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Address'>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 68 }}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder='Street address…'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Notes'>
        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder='Payment terms, delivery schedule…'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      {isEdit && (
        <Field label='Status'>
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
    </>
  );

  const ActionBtns = ({ onSave, label, icon }) => (
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
        onClick={onSave}
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
        @keyframes slideUpM { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .sup-row:hover td { background: var(--bg) !important; }
        .act-btn { opacity:0; transition:opacity .15s; }
        .sup-row:hover .act-btn { opacity:1; }
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
          Suppliers
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Manage your vendors and supply partners.
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
            label: "Total Suppliers",
            value: suppliers.length,
            icon: "fa-truck",
            color: "#2E4031",
          },
          {
            label: "Active",
            value: suppliers.filter((s) => s.is_active).length,
            icon: "fa-circle-check",
            color: "#27ae60",
          },
          {
            label: "Inactive",
            value: suppliers.filter((s) => !s.is_active).length,
            icon: "fa-circle-xmark",
            color: "#c0392b",
          },
          {
            label: "Total Orders",
            value: suppliers.reduce((s, v) => s + (v.total_orders ?? 0), 0),
            icon: "fa-file-invoice",
            color: "#2980b9",
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
              placeholder='Search name, contact, phone…'
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
            Add Supplier
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
              className='fa-solid fa-truck'
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
              No suppliers found
            </div>
            <div style={{ fontSize: ".82rem" }}>
              Try adjusting your search or add a new supplier.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {[
                    "Supplier",
                    "Contact",
                    "Phone",
                    "Specialty",
                    "Orders",
                    "Status",
                    "Since",
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
                {filtered.map((s, i) => (
                  <tr
                    key={s.id}
                    className='sup-row'
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
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <SupplierAvatar name={s.name} />
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: ".88rem",
                              color: "var(--text)",
                            }}
                          >
                            {s.name}
                          </div>
                          {s.address && (
                            <div
                              style={{
                                fontSize: ".72rem",
                                color: "var(--muted)",
                                marginTop: 1,
                                maxWidth: 180,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {s.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: ".82rem",
                        color: "var(--muted)",
                      }}
                    >
                      {s.contact_name ?? "—"}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: ".82rem",
                        color: "var(--muted)",
                      }}
                    >
                      {s.phone ? `+62 ${s.phone}` : "—"}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      {s.product_type ? (
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: ".72rem",
                            fontWeight: 600,
                            background: "rgba(46,64,49,.08)",
                            color: "var(--accent)",
                          }}
                        >
                          {s.product_type}
                        </span>
                      ) : (
                        <span
                          style={{ color: "var(--muted)", fontSize: ".82rem" }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: ".82rem",
                        fontWeight: 600,
                        color: "var(--text)",
                        textAlign: "center",
                      }}
                    >
                      {s.total_orders ?? 0}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: 99,
                          fontSize: ".7rem",
                          fontWeight: 600,
                          background: s.is_active
                            ? "rgba(39,174,96,.1)"
                            : "rgba(192,57,43,.1)",
                          color: s.is_active ? "#27ae60" : "#c0392b",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <i
                          className={`fa-solid ${s.is_active ? "fa-circle-check" : "fa-circle-xmark"}`}
                          style={{ fontSize: 9 }}
                        />
                        {s.is_active ? "Active" : "Inactive"}
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
                      {fmtDate(s.created_at)}
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
                              setSelected(s);
                              setViewOpen(true);
                            },
                            hc: "rgba(41,128,185,.15)",
                            tc: "#2980b9",
                          },
                          {
                            icon: "fa-pen-to-square",
                            title: "Edit",
                            action: () => openEdit(s),
                            hc: "rgba(46,64,49,.15)",
                            tc: "var(--accent)",
                          },
                          {
                            icon: "fa-ban",
                            title: "Deactivate",
                            action: () => {
                              setSelected(s);
                              setDeleteOpen(true);
                            },
                            hc: "rgba(192,57,43,.12)",
                            tc: "#c0392b",
                            hide: !s.is_active,
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
        title='Add New Supplier'
      >
        <SupplierForm isEdit={false} />
        <ActionBtns onSave={handleAdd} label='Add Supplier' icon='fa-plus' />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit — ${selected?.name}`}
      >
        <SupplierForm isEdit={true} />
        <ActionBtns
          onSave={handleEdit}
          label='Save Changes'
          icon='fa-floppy-disk'
        />
      </Modal>

      {/* View modal */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title='Supplier Details'
      >
        {selected && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                paddingBottom: 18,
                borderBottom: "1px solid var(--cb)",
                marginBottom: 18,
              }}
            >
              <SupplierAvatar name={selected.name} />
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {selected.name}
                </div>
                {selected.product_type && (
                  <div
                    style={{
                      fontSize: ".78rem",
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {selected.product_type}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  icon: "fa-user",
                  label: "Contact",
                  value: selected.contact_name || "—",
                },
                {
                  icon: "fa-phone",
                  label: "Phone",
                  value: selected.phone ? `+62 ${selected.phone}` : "—",
                },
                {
                  icon: "fa-location-dot",
                  label: "Address",
                  value: selected.address || "—",
                },
                {
                  icon: "fa-file-invoice",
                  label: "Total POs",
                  value: `${selected.total_orders ?? 0} orders`,
                },
                {
                  icon: "fa-calendar",
                  label: "Since",
                  value: fmtDate(selected.created_at),
                },
              ].map((r) => (
                <div
                  key={r.label}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className={`fa-solid ${r.icon}`}
                      style={{ color: "var(--muted)", fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: ".7rem", color: "var(--muted)" }}>
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontSize: ".88rem",
                        fontWeight: 500,
                        color: "var(--text)",
                        marginTop: 1,
                      }}
                    >
                      {r.value}
                    </div>
                  </div>
                </div>
              ))}
              {selected.notes && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "var(--bg)",
                    borderRadius: 8,
                    fontSize: ".84rem",
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  <b style={{ color: "var(--text)" }}>Notes: </b>
                  {selected.notes}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setViewOpen(false);
                openEdit(selected);
              }}
              style={{
                width: "100%",
                marginTop: 20,
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
              Edit Supplier
            </button>
          </div>
        )}
      </Modal>

      {/* Deactivate confirm */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title='Deactivate Supplier'
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
                <b>{selected.name}</b> will be marked inactive. Their past
                orders remain intact and this can be reversed anytime.
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
