"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_META = {
  owner: { label: "Owner / Admin", icon: "fa-crown", color: "#af8f6f" },
  manager: { label: "Manager", icon: "fa-briefcase", color: "#2980b9" },
  cashier: { label: "Cashier", icon: "fa-cash-register", color: "#27ae60" },
  stock_clerk: {
    label: "Stock Clerk",
    icon: "fa-boxes-stacked",
    color: "#8e44ad",
  },
  barista: { label: "Barista", icon: "fa-mug-hot", color: "#e67e22" },
  viewer: { label: "Viewer / Auditor", icon: "fa-eye", color: "#7f8c8d" },
};

const ALL_TABS = [
  { key: "all", label: "All Staff", icon: "fa-users" },
  { key: "owner", label: "Owner", icon: "fa-crown" },
  { key: "manager", label: "Manager", icon: "fa-briefcase" },
  { key: "cashier", label: "Cashier", icon: "fa-cash-register" },
  { key: "stock_clerk", label: "Stock Clerk", icon: "fa-boxes-stacked" },
  { key: "barista", label: "Barista", icon: "fa-mug-hot" },
  { key: "viewer", label: "Viewer", icon: "fa-eye" },
];

const EMPTY_FORM = {
  full_name: "",
  username: "",
  phone: "",
  password: "",
  role_id: "",
  is_active: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Avatar({ name, role_key, size = 38 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const color = ROLE_META[role_key]?.color ?? "#2E4031";
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: `${color}22`,
        border: `2px solid ${color}44`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.32,
        color,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

function StatusPill({ active }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: ".7rem",
        fontWeight: 600,
        background: active ? "rgba(39,174,96,.12)" : "rgba(192,57,43,.1)",
        color: active ? "#27ae60" : "#c0392b",
      }}
    >
      <i
        className={`fa-solid ${active ? "fa-circle-check" : "fa-circle-xmark"}`}
        style={{ fontSize: 9 }}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RolePill({ role_key }) {
  const meta = ROLE_META[role_key] ?? {
    label: role_key,
    icon: "fa-user",
    color: "#7f8c8d",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 99,
        fontSize: ".7rem",
        fontWeight: 600,
        background: `${meta.color}18`,
        color: meta.color,
      }}
    >
      <i className={`fa-solid ${meta.icon}`} style={{ fontSize: 9 }} />
      {meta.label}
    </span>
  );
}

function formatDate(dt) {
  if (!dt) return "Never";
  return new Date(dt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
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
        padding: "20px",
        animation: "fadeIn .2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card)",
          border: "1px solid var(--cb)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 500,
          boxShadow: "0 24px 64px rgba(0,0,0,.35)",
          animation: "slideUp .25s cubic-bezier(.175,.885,.32,1.1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--cb)",
            position: "sticky",
            top: 0,
            background: "var(--card)",
            zIndex: 1,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.15rem",
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
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "var(--bg)",
              cursor: "pointer",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              transition: "background .15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "#c0392b22")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--bg)")
            }
          >
            <i className='fa-solid fa-xmark' />
          </button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────
function Field({ label, error, children, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: ".8rem",
          fontWeight: 600,
          color: "var(--muted)",
          marginBottom: 6,
          letterSpacing: ".3px",
        }}
      >
        {label}
        {required && <span style={{ color: "#c0392b", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && (
        <div
          style={{
            fontSize: ".75rem",
            color: "#c0392b",
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <i
            className='fa-solid fa-circle-exclamation'
            style={{ fontSize: 10 }}
          />
          {error}
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "10px 14px",
        background: "var(--bg)",
        border: "1.5px solid var(--border)",
        borderRadius: 9,
        fontSize: ".9rem",
        color: "var(--text)",
        outline: "none",
        transition: "border-color .2s, box-shadow .2s",
        fontFamily: "'DM Sans', sans-serif",
        opacity: disabled ? 0.6 : 1,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--accent)";
        e.target.style.boxShadow = "0 0 0 3px rgba(46,64,49,.1)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--border)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

// ─── Staff form (shared for add & edit) ──────────────────────────────────────
function StaffForm({ form, setForm, roles, errors, isEdit }) {
  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0 16px",
        }}
      >
        <Field label='Full Name' required error={errors.full_name}>
          <Input
            value={form.full_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, full_name: e.target.value }))
            }
            placeholder='e.g. Budi Santoso'
          />
        </Field>
        <Field label='Username' required error={errors.username}>
          <Input
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
            placeholder='e.g. budi007'
            disabled={isEdit} // username shouldn't change in edit
          />
        </Field>
      </div>

      <Field label='Phone Number' error={errors.phone}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: ".85rem",
              color: "var(--muted)",
              borderRight: "1px solid var(--border)",
              paddingRight: 10,
              lineHeight: 1,
            }}
          >
            +62
          </span>
          <input
            type='tel'
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder='812 3456 7890'
            style={{
              width: "100%",
              padding: "10px 14px 10px 60px",
              background: "var(--bg)",
              border: "1.5px solid var(--border)",
              borderRadius: 9,
              fontSize: ".9rem",
              color: "var(--text)",
              outline: "none",
              transition: "border-color .2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
      </Field>

      <Field label='Role' required error={errors.role_id}>
        <select
          value={form.role_id}
          onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "var(--bg)",
            border: "1.5px solid var(--border)",
            borderRadius: 9,
            fontSize: ".9rem",
            color: "var(--text)",
            outline: "none",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        >
          <option value=''>— Select a role —</option>
          {roles
            .filter((r) => r.role_key !== "owner")
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.display_name}
              </option>
            ))}
        </select>
      </Field>

      <Field
        label={isEdit ? "New Password" : "Password"}
        required={!isEdit}
        error={errors.password}
      >
        <Input
          type='password'
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder={
            isEdit ? "Leave blank to keep current" : "Min. 6 characters"
          }
        />
      </Field>

      {isEdit && (
        <Field label='Account Status'>
          <div style={{ display: "flex", gap: 10 }}>
            {[true, false].map((val) => (
              <button
                key={String(val)}
                type='button'
                onClick={() => setForm((f) => ({ ...f, is_active: val }))}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: 8,
                  border: `1.5px solid ${form.is_active === val ? "var(--accent)" : "var(--border)"}`,
                  background:
                    form.is_active === val ? "var(--accent)" : "var(--bg)",
                  color: form.is_active === val ? "#fff" : "var(--muted)",
                  fontSize: ".85rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all .2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <i
                  className={`fa-solid ${val ? "fa-circle-check" : "fa-circle-xmark"}`}
                  style={{ fontSize: 12 }}
                />
                {val ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
        </Field>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // Form
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { msg, ok }

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        fetch("/api/admin/staff"),
        fetch("/api/admin/roles"),
      ]);
      const staffData = await staffRes.json();
      const rolesData = await rolesRes.json();
      setStaff(staffData.staff ?? []);
      setRoles(rolesData.roles ?? []);
    } catch {
      showToast("Failed to load staff data.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Validate ─────────────────────────────────────────────────────────────
  const validate = (isEdit) => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required.";
    if (!isEdit && !form.username.trim()) e.username = "Username is required.";
    if (!form.role_id) e.role_id = "Please select a role.";
    if (!isEdit && !form.password) e.password = "Password is required.";
    if (form.password && form.password.length < 6)
      e.password = "Minimum 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!validate(false)) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Staff member added successfully.");
      setAddOpen(false);
      setForm(EMPTY_FORM);
      fetchStaff();
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (member) => {
    setSelected(member);
    setForm({
      full_name: member.full_name,
      username: member.username,
      phone: member.phone ?? "",
      password: "",
      role_id: String(member.role_id),
      is_active: Boolean(member.is_active),
    });
    setErrors({});
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!validate(true)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/staff/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Staff member updated.");
      setEditOpen(false);
      fetchStaff();
    } finally {
      setSaving(false);
    }
  };

  // ── Soft delete ──────────────────────────────────────────────────────────
  const openDelete = (member) => {
    setSelected(member);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/staff/${selected.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Account deactivated.");
      setDeleteOpen(false);
      fetchStaff();
    } finally {
      setSaving(false);
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = staff.filter((s) => {
    const matchTab = activeTab === "all" || s.role_key === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.full_name.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.phone ?? "").includes(q);
    return matchTab && matchSearch;
  });

  // Tab counts
  const countFor = (key) =>
    key === "all"
      ? staff.length
      : staff.filter((s) => s.role_key === key).length;

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        .tab-scroll { overflow-x:auto; scrollbar-width:none; }
        .tab-scroll::-webkit-scrollbar { display:none; }
        .staff-row:hover { background: var(--bg) !important; }
        .action-btn { opacity:0; transition:opacity .15s; }
        .staff-row:hover .action-btn { opacity:1; }
      `}</style>

      {/* ── Toast ── */}
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
            animation: "slideDown .25s ease",
          }}
        >
          <i
            className={`fa-solid ${toast.ok ? "fa-circle-check" : "fa-circle-exclamation"}`}
          />
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
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
          Staff Management
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Manage your team members and their access roles.
        </p>
      </div>

      {/* ── Main card ── */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--cb)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* ── Toolbar ── */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--cb)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px" }}>
            <i
              className='fa-solid fa-magnifying-glass'
              style={{
                position: "absolute",
                left: 12,
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
              placeholder='Search by name, username, phone…'
              style={{
                width: "100%",
                padding: "9px 14px 9px 36px",
                background: "var(--bg)",
                border: "1.5px solid var(--border)",
                borderRadius: 9,
                fontSize: ".88rem",
                color: "var(--text)",
                outline: "none",
                fontFamily: "'DM Sans',sans-serif",
                transition: "border-color .2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Count badge */}
          <span
            style={{
              fontSize: ".82rem",
              color: "var(--muted)",
              whiteSpace: "nowrap",
            }}
          >
            <b style={{ color: "var(--text)" }}>{filtered.length}</b> member
            {filtered.length !== 1 ? "s" : ""}
          </span>

          {/* Add button */}
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setErrors({});
              setAddOpen(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 9,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: ".88rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background .2s, transform .15s",
              fontFamily: "'DM Sans',sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-h)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "none";
            }}
          >
            <i className='fa-solid fa-user-plus' style={{ fontSize: 13 }} />
            Add Staff
          </button>
        </div>

        {/* ── Tabs ── */}
        <div
          className='tab-scroll'
          style={{ borderBottom: "1px solid var(--cb)" }}
        >
          <div
            style={{
              display: "flex",
              padding: "0 20px",
              gap: 2,
              minWidth: "max-content",
            }}
          >
            {ALL_TABS.map((tab) => {
              const count = countFor(tab.key);
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "12px 14px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                    color: active ? "var(--accent)" : "var(--muted)",
                    fontSize: ".82rem",
                    fontWeight: active ? 600 : 400,
                    transition: "color .15s, border-color .15s",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  <i
                    className={`fa-solid ${tab.icon}`}
                    style={{ fontSize: 12 }}
                  />
                  {tab.label}
                  {count > 0 && (
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
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div
            style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}
          >
            <i
              className='fa-solid fa-circle-notch fa-spin'
              style={{ fontSize: 28, marginBottom: 12, display: "block" }}
            />
            Loading staff…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}
          >
            <i
              className='fa-solid fa-users-slash'
              style={{
                fontSize: 32,
                marginBottom: 12,
                display: "block",
                opacity: 0.4,
              }}
            />
            <div
              style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}
            >
              No staff found
            </div>
            <div style={{ fontSize: ".82rem" }}>
              Try adjusting your search or tab filter.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {[
                    "Member",
                    "Role",
                    "Phone",
                    "Status",
                    "Last Login",
                    "Joined",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: ".72rem",
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
                {filtered.map((member, i) => (
                  <tr
                    key={member.id}
                    className='staff-row'
                    style={{
                      background: "var(--card)",
                      borderBottom:
                        i < filtered.length - 1
                          ? "1px solid var(--cb)"
                          : "none",
                      transition: "background .15s",
                    }}
                  >
                    {/* Member */}
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <Avatar
                          name={member.full_name}
                          role_key={member.role_key}
                        />
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: ".88rem",
                              color: "var(--text)",
                            }}
                          >
                            {member.full_name}
                          </div>
                          <div
                            style={{
                              fontSize: ".75rem",
                              color: "var(--muted)",
                              marginTop: 1,
                            }}
                          >
                            @{member.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: "14px 16px" }}>
                      <RolePill role_key={member.role_key} />
                    </td>

                    {/* Phone */}
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: ".82rem",
                        color: "var(--muted)",
                      }}
                    >
                      {member.phone ? `+62 ${member.phone}` : "—"}
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <StatusPill active={Boolean(member.is_active)} />
                    </td>

                    {/* Last login */}
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: ".8rem",
                        color: "var(--muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(member.last_login_at)}
                    </td>

                    {/* Joined */}
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: ".8rem",
                        color: "var(--muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(member.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          justifyContent: "flex-end",
                        }}
                      >
                        {/* View */}
                        <button
                          className='action-btn'
                          title='View details'
                          onClick={() => {
                            setSelected(member);
                            setViewOpen(true);
                          }}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: "none",
                            background: "var(--bg)",
                            cursor: "pointer",
                            color: "var(--muted)",
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background .15s, color .15s",
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

                        {/* Edit */}
                        <button
                          className='action-btn'
                          title='Edit'
                          onClick={() => openEdit(member)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            border: "none",
                            background: "var(--bg)",
                            cursor: "pointer",
                            color: "var(--muted)",
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background .15s, color .15s",
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
                          <i className='fa-solid fa-pen-to-square' />
                        </button>

                        {/* Deactivate */}
                        {member.is_active ? (
                          <button
                            className='action-btn'
                            title='Deactivate'
                            onClick={() => openDelete(member)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 7,
                              border: "none",
                              background: "var(--bg)",
                              cursor: "pointer",
                              color: "var(--muted)",
                              fontSize: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background .15s, color .15s",
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
                            <i className='fa-solid fa-user-slash' />
                          </button>
                        ) : (
                          // Reactivate via edit
                          <button
                            className='action-btn'
                            title='Reactivate'
                            onClick={() => openEdit(member)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 7,
                              border: "none",
                              background: "var(--bg)",
                              cursor: "pointer",
                              color: "var(--muted)",
                              fontSize: 12,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background .15s, color .15s",
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
                            <i className='fa-solid fa-user-check' />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* ── Add modal ── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title='Add New Staff Member'
      >
        <StaffForm
          form={form}
          setForm={setForm}
          roles={roles}
          errors={errors}
          isEdit={false}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
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
            onClick={handleAdd}
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
                <i className='fa-solid fa-user-plus' />
                Add Staff Member
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ── Edit modal ── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit — ${selected?.full_name}`}
      >
        <StaffForm
          form={form}
          setForm={setForm}
          roles={roles}
          errors={errors}
          isEdit={true}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            onClick={() => setEditOpen(false)}
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
            onClick={handleEdit}
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
                Save Changes
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* ── View modal ── */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title='Staff Details'
      >
        {selected && (
          <div>
            {/* Profile header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 0 20px",
                borderBottom: "1px solid var(--cb)",
                marginBottom: 20,
              }}
            >
              <Avatar
                name={selected.full_name}
                role_key={selected.role_key}
                size={56}
              />
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {selected.full_name}
                </div>
                <div
                  style={{
                    fontSize: ".82rem",
                    color: "var(--muted)",
                    marginBottom: 8,
                  }}
                >
                  @{selected.username}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <RolePill role_key={selected.role_key} />
                  <StatusPill active={Boolean(selected.is_active)} />
                </div>
              </div>
            </div>

            {/* Detail rows */}
            {[
              {
                icon: "fa-phone",
                label: "Phone",
                value: selected.phone
                  ? `+62 ${selected.phone}`
                  : "Not provided",
              },
              {
                icon: "fa-clock",
                label: "Last Login",
                value: formatDate(selected.last_login_at),
              },
              {
                icon: "fa-calendar",
                label: "Member Since",
                value: formatDate(selected.created_at),
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 0",
                  borderBottom: "1px solid var(--cb)",
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
                    className={`fa-solid ${row.icon}`}
                    style={{ color: "var(--muted)", fontSize: 13 }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: ".72rem",
                      color: "var(--muted)",
                      marginBottom: 2,
                    }}
                  >
                    {row.label}
                  </div>
                  <div
                    style={{
                      fontSize: ".88rem",
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    {row.value}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => {
                  setViewOpen(false);
                  openEdit(selected);
                }}
                style={{
                  flex: 1,
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
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <i className='fa-solid fa-pen-to-square' />
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Deactivate confirm modal ── */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title='Deactivate Account'
      >
        {selected && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                background: "rgba(192,57,43,.07)",
                border: "1px solid rgba(192,57,43,.2)",
                borderRadius: 10,
                marginBottom: 20,
              }}
            >
              <i
                className='fa-solid fa-triangle-exclamation'
                style={{ color: "#c0392b", fontSize: 20, flexShrink: 0 }}
              />
              <div
                style={{
                  fontSize: ".88rem",
                  color: "var(--text)",
                  lineHeight: 1.6,
                }}
              >
                You're about to deactivate <b>{selected.full_name}</b>. They
                will lose access immediately. The account record is preserved
                and can be reactivated anytime.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <Avatar name={selected.full_name} role_key={selected.role_key} />
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: "var(--text)",
                    fontSize: ".9rem",
                  }}
                >
                  {selected.full_name}
                </div>
                <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                  @{selected.username} ·{" "}
                  <span style={{ textTransform: "capitalize" }}>
                    {selected.role_key.replace("_", " ")}
                  </span>
                </div>
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
                    <i className='fa-solid fa-user-slash' />
                    Yes, Deactivate
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
