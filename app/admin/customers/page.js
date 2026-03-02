"use client";

import { useState, useEffect, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtPrice = (n) => `Rp ${fmt(n)}`;

const TIER_COLORS = {
  member: { bg: "rgba(41,128,185,.1)", text: "#2980b9" },
  silver: { bg: "rgba(127,140,141,.15)", text: "#7f8c8d" },
  gold: { bg: "rgba(243,156,18,.12)", text: "#d68910" },
};

const TIER_ICONS = {
  member: "fa-user",
  silver: "fa-medal",
  gold: "fa-crown",
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const EMPTY = { name: "", phone: "", tier: "member", notes: "" };
  const [form, setForm] = useState(EMPTY);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      setCustomers(data.customers ?? []);
    } catch {
      showToast("Failed to load customers.", false);
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
    if (!form.phone.trim()) e.phone = "Phone is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Customer registered.");
      setAddOpen(false);
      setForm(EMPTY);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c) => {
    setSelected(c);
    setForm({
      name: c.name,
      phone: c.phone,
      tier: c.tier,
      notes: c.notes ?? "",
    });
    setErrors({});
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Customer updated.");
      setEditOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const tiers = ["all", "member", "silver", "gold"];
  const filtered = customers.filter((c) => {
    const matchTier = tierFilter === "all" || c.tier === tierFilter;
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    return matchTier && matchSearch;
  });

  const stats = {
    total: customers.length,
    gold: customers.filter((c) => c.tier === "gold").length,
    silver: customers.filter((c) => c.tier === "silver").length,
    member: customers.filter((c) => c.tier === "member").length,
  };

  const CustomerForm = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
      <Field label='Full Name' required error={errors.name}>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder='e.g. Budi Santoso'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Phone' required half error={errors.phone}>
        <input
          style={inputStyle}
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder='e.g. 081234567890'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>
      <Field label='Tier' half>
        <select
          style={selectStyle}
          value={form.tier}
          onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
        >
          <option value='member'>Member</option>
          <option value='silver'>Silver</option>
          <option value='gold'>Gold</option>
        </select>
      </Field>
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
        .cust-row:hover td { background: var(--bg) !important; }
        .act-btn { opacity:0; transition:opacity .15s; }
        .cust-row:hover .act-btn { opacity:1; }
        .stat-card { transition: transform .2s; }
        .stat-card:hover { transform: translateY(-2px); }
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
          Customers
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Manage customer profiles and loyalty tiers.
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
            label: "Total Customers",
            value: stats.total,
            icon: "fa-users",
            color: "#2980b9",
            bg: "rgba(41,128,185,.1)",
          },
          {
            label: "Gold Members",
            value: stats.gold,
            icon: "fa-crown",
            color: "#d68910",
            bg: "rgba(243,156,18,.12)",
          },
          {
            label: "Silver Members",
            value: stats.silver,
            icon: "fa-medal",
            color: "#7f8c8d",
            bg: "rgba(127,140,141,.15)",
          },
          {
            label: "Members",
            value: stats.member,
            icon: "fa-user",
            color: "#2980b9",
            bg: "rgba(41,128,185,.1)",
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
              placeholder='Search name or phone…'
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
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
            <i className='fa-solid fa-user-plus' style={{ fontSize: 12 }} />
            Add Customer
          </button>
        </div>

        {/* Tier tabs */}
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
            {tiers.map((tier) => {
              const count =
                tier === "all"
                  ? customers.length
                  : customers.filter((c) => c.tier === tier).length;
              const active = tierFilter === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
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
                    textTransform: "capitalize",
                  }}
                >
                  {tier === "all" ? (
                    "All"
                  ) : (
                    <>
                      <i
                        className={`fa-solid ${TIER_ICONS[tier]}`}
                        style={{ fontSize: 11 }}
                      />
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </>
                  )}
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
              className='fa-solid fa-users-slash'
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
              No customers found
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
                    "Customer",
                    "Phone",
                    "Tier",
                    "Total Spent",
                    "Points Balance",
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
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className='cust-row'
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
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: TIER_COLORS[c.tier]?.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <i
                            className={`fa-solid ${TIER_ICONS[c.tier]}`}
                            style={{
                              color: TIER_COLORS[c.tier]?.text,
                              fontSize: 13,
                            }}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: ".88rem",
                              color: "var(--text)",
                            }}
                          >
                            {c.name}
                          </div>
                          {c.notes && (
                            <div
                              style={{
                                fontSize: ".72rem",
                                color: "var(--muted)",
                                marginTop: 1,
                              }}
                            >
                              {c.notes}
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
                        fontFamily: "monospace",
                      }}
                    >
                      {c.phone}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span
                        style={{
                          ...TIER_COLORS[c.tier],
                          padding: "3px 9px",
                          borderRadius: 99,
                          fontSize: ".72rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        <i
                          className={`fa-solid ${TIER_ICONS[c.tier]}`}
                          style={{ marginRight: 5, fontSize: 10 }}
                        />
                        {c.tier}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: ".82rem",
                        fontWeight: 600,
                        color: "var(--text)",
                      }}
                    >
                      {fmtPrice(c.total_spent)}
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
                          background: "rgba(46,64,49,.1)",
                          color: "var(--accent)",
                        }}
                      >
                        <i
                          className='fa-solid fa-star'
                          style={{ fontSize: 9 }}
                        />
                        {fmt(c.points_balance ?? 0)} pts
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        fontSize: ".78rem",
                        color: "var(--muted)",
                      }}
                    >
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString("id-ID")
                        : "—"}
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
                              setSelected(c);
                              setViewOpen(true);
                            },
                            hc: "rgba(41,128,185,.15)",
                            tc: "#2980b9",
                          },
                          {
                            icon: "fa-pen-to-square",
                            title: "Edit",
                            action: () => openEdit(c),
                            hc: "rgba(46,64,49,.15)",
                            tc: "var(--accent)",
                          },
                        ].map((b) => (
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

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title='Register Customer'
        width={540}
      >
        <CustomerForm />
        <SaveBtn
          onClick={handleAdd}
          label='Register Customer'
          icon='fa-user-plus'
        />
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit — ${selected?.name}`}
        width={540}
      >
        <CustomerForm />
        <SaveBtn
          onClick={handleEdit}
          label='Save Changes'
          icon='fa-floppy-disk'
        />
      </Modal>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title='Customer Details'
      >
        {selected && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                background: "var(--bg)",
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 13,
                  background: TIER_COLORS[selected.tier]?.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className={`fa-solid ${TIER_ICONS[selected.tier]}`}
                  style={{
                    color: TIER_COLORS[selected.tier]?.text,
                    fontSize: 20,
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--text)",
                  }}
                >
                  {selected.name}
                </div>
                <div
                  style={{
                    fontSize: ".8rem",
                    color: "var(--muted)",
                    marginTop: 2,
                  }}
                >
                  {selected.phone}
                </div>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  ...TIER_COLORS[selected.tier],
                  padding: "4px 12px",
                  borderRadius: 99,
                  fontSize: ".75rem",
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                {selected.tier}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                { label: "Total Spent", value: fmtPrice(selected.total_spent) },
                {
                  label: "Points Balance",
                  value: `${fmt(selected.points_balance ?? 0)} pts`,
                },
                {
                  label: "Member Since",
                  value: selected.created_at
                    ? new Date(selected.created_at).toLocaleDateString("id-ID")
                    : "—",
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
                  marginBottom: 16,
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
              Edit Customer
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
