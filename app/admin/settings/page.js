"use client";

import { useState } from "react";

// ─── Shared primitives ────────────────────────────────────────────────────────

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

function Field({ label, hint, children, half, third }) {
  let flex = "0 0 100%";
  if (half) flex = "0 0 calc(50% - 6px)";
  if (third) flex = "0 0 calc(33.33% - 8px)";
  return (
    <div style={{ marginBottom: 16, flex }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: ".72rem",
            fontWeight: 700,
            color: "var(--muted)",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      {children}
      {hint && (
        <p
          style={{
            fontSize: ".72rem",
            color: "var(--muted)",
            marginTop: 5,
            opacity: 0.8,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 99,
        background: checked ? "var(--accent)" : "var(--border)",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        transition: "background .2s",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left .2s",
          boxShadow: "0 1px 4px rgba(0,0,0,.25)",
        }}
      />
    </div>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        fontSize: ".88rem",
        color: "var(--text)",
        padding: "10px 14px",
        borderRadius: 8,
        background: checked ? "rgba(46,64,49,.06)" : "transparent",
        transition: "background .15s",
        userSelect: "none",
      }}
    >
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `2px solid ${checked ? "var(--accent)" : "var(--border)"}`,
          background: checked ? "var(--accent)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all .15s",
        }}
      >
        {checked && (
          <i
            className='fa-solid fa-check'
            style={{ fontSize: 10, color: "#fff" }}
          />
        )}
      </div>
      {label}
    </label>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: ".68rem",
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "var(--accent)",
        marginBottom: 12,
        marginTop: 24,
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--cb)", margin: "20px 0" }} />;
}

function SaveBtn({ onClick, saving }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
      <button
        onClick={onClick}
        disabled={saving}
        style={{
          padding: "11px 28px",
          borderRadius: 10,
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          fontSize: ".88rem",
          fontWeight: 700,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          opacity: saving ? 0.7 : 1,
          fontFamily: "'DM Sans',sans-serif",
          transition: "opacity .15s",
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
  );
}

function RowToggle({ title, desc, checked, onChange, disabled }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid var(--cb)",
      }}
    >
      <div>
        <div
          style={{ fontWeight: 600, fontSize: ".9rem", color: "var(--text)" }}
        >
          {title}
        </div>
        <div
          style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: 2 }}
        >
          {desc}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ─── Section components ───────────────────────────────────────────────────────

function StoreInfo({ saving, onSave }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    currency: "IDR",
    timezone: "WIB",
  });
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Basic details shown on receipts and reports.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <Field label='Store Name'>
          <input
            style={inputStyle}
            value={form.name}
            onChange={f("name")}
            placeholder='My Awesome Store'
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>
        <Field label='Address'>
          <input
            style={inputStyle}
            value={form.address}
            onChange={f("address")}
            placeholder='Jl. Contoh No. 1, Surabaya'
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>
        <Field label='Phone' half>
          <input
            style={inputStyle}
            value={form.phone}
            onChange={f("phone")}
            placeholder='+62 812 3456 7890'
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>
        <Field label='Email' half>
          <input
            style={inputStyle}
            value={form.email}
            onChange={f("email")}
            placeholder='store@example.com'
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>
        <Field label='Currency' half>
          <select
            style={selectStyle}
            value={form.currency}
            onChange={f("currency")}
          >
            <option value='IDR'>IDR — Indonesian Rupiah</option>
            <option value='USD'>USD — US Dollar</option>
            <option value='SGD'>SGD — Singapore Dollar</option>
            <option value='MYR'>MYR — Malaysian Ringgit</option>
          </select>
        </Field>
        <Field label='Timezone' half>
          <select
            style={selectStyle}
            value={form.timezone}
            onChange={f("timezone")}
          >
            <option value='WIB'>WIB — UTC+7</option>
            <option value='WITA'>WITA — UTC+8</option>
            <option value='WIT'>WIT — UTC+9</option>
          </select>
        </Field>
      </div>
      <SaveBtn onClick={onSave} saving={saving} />
    </div>
  );
}

function BranchSection({ saving, onSave }) {
  const [branches, setBranches] = useState([
    {
      id: 1,
      name: "Cabang Utama",
      address: "Jl. Bungurasih, Surabaya",
      active: true,
    },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", address: "" });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setBranches((p) => [
      ...p,
      { id: Date.now(), name: form.name, address: form.address, active: true },
    ]);
    setForm({ name: "", address: "" });
    setAddOpen(false);
  };
  const handleDelete = (id) => setBranches((p) => p.filter((b) => b.id !== id));
  const toggleActive = (id) =>
    setBranches((p) =>
      p.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
    );

  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Manage store branches and locations.
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {branches.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              background: "var(--bg)",
              border: "1.5px solid var(--border)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(46,64,49,.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className='fa-solid fa-store'
                style={{ color: "var(--accent)", fontSize: 15 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: ".9rem",
                  color: "var(--text)",
                }}
              >
                {b.name}
              </div>
              <div
                style={{
                  fontSize: ".75rem",
                  color: "var(--muted)",
                  marginTop: 1,
                }}
              >
                {b.address}
              </div>
            </div>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 99,
                fontSize: ".7rem",
                fontWeight: 700,
                background: b.active
                  ? "rgba(39,174,96,.12)"
                  : "rgba(192,57,43,.1)",
                color: b.active ? "#27ae60" : "#c0392b",
              }}
            >
              {b.active ? "Active" : "Inactive"}
            </span>
            <button
              onClick={() => {
                setEditId(b.id);
                setForm({ name: b.name, address: b.address });
                setAddOpen(true);
              }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1.5px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
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
            </button>
            <button
              onClick={() => handleDelete(b.id)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: "1.5px solid var(--border)",
                background: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 12,
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
              <i className='fa-solid fa-trash' />
            </button>
          </div>
        ))}
      </div>

      {addOpen ? (
        <div
          style={{
            padding: "16px",
            background: "var(--bg)",
            border: "1.5px solid var(--accent)",
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder='Branch name'
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <input
              style={{ ...inputStyle, flex: 2 }}
              value={form.address}
              onChange={(e) =>
                setForm((p) => ({ ...p, address: e.target.value }))
              }
              placeholder='Address'
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setAddOpen(false);
                setEditId(null);
                setForm({ name: "", address: "" });
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 8,
                border: "1.5px solid var(--border)",
                background: "none",
                color: "var(--muted)",
                fontSize: ".82rem",
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              style={{
                flex: 2,
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: ".82rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {editId ? "Update Branch" : "Add Branch"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setEditId(null);
            setForm({ name: "", address: "" });
            setAddOpen(true);
          }}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "2px dashed var(--border)",
            background: "none",
            color: "var(--muted)",
            fontSize: ".85rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'DM Sans',sans-serif",
            width: "100%",
            justifyContent: "center",
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
          Add Branch
        </button>
      )}
    </div>
  );
}

function NotificationsSection({ saving, onSave }) {
  const [master, setMaster] = useState(true);
  const [alerts, setAlerts] = useState({
    lowStock: true,
    newOrder: true,
    dailyReport: false,
    paymentFailed: true,
  });
  const [events, setEvents] = useState({
    lowStock: true,
    newSale: true,
    refundIssued: false,
    newUserLogin: false,
    backupCompleted: false,
    systemAlert: false,
  });
  const tog = (k) => setAlerts((p) => ({ ...p, [k]: !p[k] }));
  const togEv = (k) => setEvents((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Choose which in-app alerts you want to receive.
      </p>

      <SectionLabel>Master Switch</SectionLabel>
      <RowToggle
        title='Enable All Notifications'
        desc='Turn off to silence all alerts at once.'
        checked={master}
        onChange={setMaster}
      />

      <SectionLabel>Alert Types</SectionLabel>
      <div
        style={{
          background: "var(--bg)",
          borderRadius: 12,
          border: "1.5px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {[
          {
            key: "lowStock",
            title: "Low Stock Alert",
            desc: "When items fall below threshold",
          },
          {
            key: "newOrder",
            title: "New Order",
            desc: "When a new transaction is created",
          },
          {
            key: "dailyReport",
            title: "Daily Summary Report",
            desc: "End-of-day sales summary",
          },
          {
            key: "paymentFailed",
            title: "Payment Failed",
            desc: "When a payment is declined or fails",
          },
        ].map((item, i, arr) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--cb)" : "none",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: ".88rem",
                  color: master ? "var(--text)" : "var(--muted)",
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: ".75rem",
                  color: "var(--muted)",
                  marginTop: 2,
                }}
              >
                {item.desc}
              </div>
            </div>
            <Toggle
              checked={alerts[item.key] && master}
              onChange={() => tog(item.key)}
              disabled={!master}
            />
          </div>
        ))}
      </div>

      <SectionLabel>Event Checkboxes</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {[
          { key: "lowStock", label: "Low stock" },
          { key: "newSale", label: "New sale" },
          { key: "refundIssued", label: "Refund issued" },
          { key: "newUserLogin", label: "New user login" },
          { key: "backupCompleted", label: "Backup completed" },
          { key: "systemAlert", label: "System alert" },
        ].map((ev) => (
          <Checkbox
            key={ev.key}
            checked={events[ev.key]}
            onChange={() => togEv(ev.key)}
            label={ev.label}
          />
        ))}
      </div>

      <SaveBtn onClick={onSave} saving={saving} />
    </div>
  );
}

function PushNotificationsSection({ saving, onSave }) {
  const [enabled, setEnabled] = useState(false);
  const [notify, setNotify] = useState({
    stockLow: true,
    newOrder: true,
    dailyReport: false,
    paymentFails: true,
    backupCompletes: false,
    promotionStarts: false,
  });
  const [quietFrom, setQuietFrom] = useState("22");
  const [quietUntil, setQuietUntil] = useState("08");
  const tog = (k) => setNotify((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Manage browser and mobile push alerts.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--text)" }}
          >
            Enable Push Notifications
          </div>
          <div
            style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 2 }}
          >
            Requires browser permission.
          </div>
        </div>
        <Toggle checked={enabled} onChange={setEnabled} />
      </div>

      <SectionLabel>Notify Me When</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 4,
          marginBottom: 24,
        }}
      >
        {[
          { key: "stockLow", label: "Stock is low" },
          { key: "newOrder", label: "New order arrives" },
          { key: "dailyReport", label: "Daily report ready" },
          { key: "paymentFails", label: "Payment fails" },
          { key: "backupCompletes", label: "Backup completes" },
          { key: "promotionStarts", label: "Promotion starts" },
        ].map((ev) => (
          <Checkbox
            key={ev.key}
            checked={notify[ev.key] && enabled}
            onChange={() => tog(ev.key)}
            label={ev.label}
          />
        ))}
      </div>

      <SectionLabel>Quiet Hours</SectionLabel>
      <div
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          padding: "16px",
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontSize: ".72rem",
              fontWeight: 700,
              color: "var(--muted)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 6,
            }}
          >
            From
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              style={{
                ...inputStyle,
                width: 70,
                textAlign: "center",
                fontWeight: 700,
                fontSize: "1rem",
              }}
              value={quietFrom}
              onChange={(e) => setQuietFrom(e.target.value)}
              placeholder='22'
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <span style={{ color: "var(--muted)", fontWeight: 700 }}>:00</span>
          </div>
        </div>
        <i
          className='fa-solid fa-arrow-right'
          style={{ color: "var(--muted)", marginTop: 20 }}
        />
        <div style={{ flex: 1 }}>
          <label
            style={{
              fontSize: ".72rem",
              fontWeight: 700,
              color: "var(--muted)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 6,
            }}
          >
            Until
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              style={{
                ...inputStyle,
                width: 70,
                textAlign: "center",
                fontWeight: 700,
                fontSize: "1rem",
              }}
              value={quietUntil}
              onChange={(e) => setQuietUntil(e.target.value)}
              placeholder='08'
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <span style={{ color: "var(--muted)", fontWeight: 700 }}>:00</span>
          </div>
        </div>
        <div
          style={{
            flex: 2,
            fontSize: ".75rem",
            color: "var(--muted)",
            marginTop: 20,
          }}
        >
          <i
            className='fa-solid fa-moon'
            style={{ marginRight: 6, color: "var(--accent)" }}
          />
          No push alerts will be sent during these hours.
        </div>
      </div>

      <SaveBtn onClick={onSave} saving={saving} />
    </div>
  );
}

function EmailUpdatesSection({ saving, onSave }) {
  const [email, setEmail] = useState("");
  const [prefs, setPrefs] = useState({
    dailySales: true,
    weeklyDigest: false,
    lowStockWarnings: true,
    newUserRegistered: false,
    backupConfirmation: false,
    promotions: false,
  });
  const tog = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Control which emails are sent to you.
      </p>

      <Field
        label='Notification Email Address'
        hint='All notification emails will be sent here.'
      >
        <input
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='you@example.com'
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>

      <SectionLabel>Email Preferences</SectionLabel>
      <div
        style={{
          background: "var(--bg)",
          borderRadius: 12,
          border: "1.5px solid var(--border)",
          overflow: "hidden",
        }}
      >
        {[
          {
            key: "dailySales",
            title: "Daily Sales Report",
            desc: "Every day at end of business",
          },
          {
            key: "weeklyDigest",
            title: "Weekly Digest",
            desc: "Summary every Monday morning",
          },
          {
            key: "lowStockWarnings",
            title: "Low Stock Warnings",
            desc: "When products need restocking",
          },
          {
            key: "newUserRegistered",
            title: "New User Registered",
            desc: "When a new staff account is created",
          },
          {
            key: "backupConfirmation",
            title: "Backup Confirmation",
            desc: "After each successful backup",
          },
          {
            key: "promotions",
            title: "Promotions & Updates",
            desc: "Product news and announcements",
          },
        ].map((item, i, arr) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--cb)" : "none",
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: ".88rem",
                  color: "var(--text)",
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: ".75rem",
                  color: "var(--muted)",
                  marginTop: 2,
                }}
              >
                {item.desc}
              </div>
            </div>
            <Toggle checked={prefs[item.key]} onChange={() => tog(item.key)} />
          </div>
        ))}
      </div>

      <SaveBtn onClick={onSave} saving={saving} />
    </div>
  );
}

function BackupSection({ saving, onSave }) {
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFreq, setBackupFreq] = useState("daily");
  const [backing, setBacking] = useState(false);

  const doBackup = async () => {
    setBacking(true);
    await new Promise((r) => setTimeout(r, 2000));
    setBacking(false);
  };

  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Keep your data safe and portable.
      </p>

      <SectionLabel>Export Data</SectionLabel>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Export CSV",
            desc: "Transactions, products, customers",
            icon: "fa-file-csv",
            color: "#27ae60",
            bg: "rgba(39,174,96,.1)",
          },
          {
            label: "Export Excel",
            desc: "Full report with charts",
            icon: "fa-file-excel",
            color: "#27ae60",
            bg: "rgba(39,174,96,.1)",
          },
          {
            label: "Export PDF Report",
            desc: "Formatted for printing",
            icon: "fa-file-pdf",
            color: "#c0392b",
            bg: "rgba(192,57,43,.1)",
          },
          {
            label: "Export JSON",
            desc: "Raw data for developers",
            icon: "fa-file-code",
            color: "#2980b9",
            bg: "rgba(41,128,185,.1)",
          },
        ].map((ex) => (
          <button
            key={ex.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              background: "var(--bg)",
              border: "1.5px solid var(--border)",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color .15s",
              fontFamily: "'DM Sans',sans-serif",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: ex.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className={`fa-solid ${ex.icon}`}
                style={{ color: ex.color, fontSize: 15 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: ".85rem",
                  color: "var(--text)",
                }}
              >
                {ex.label}
              </div>
              <div
                style={{
                  fontSize: ".72rem",
                  color: "var(--muted)",
                  marginTop: 1,
                }}
              >
                {ex.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      <SectionLabel>Manual Backup</SectionLabel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--text)" }}
          >
            Backup Now
          </div>
          <div
            style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: 2 }}
          >
            Last backup: Today, 08:00 WIB
          </div>
        </div>
        <button
          onClick={doBackup}
          disabled={backing}
          style={{
            padding: "10px 20px",
            borderRadius: 9,
            border: "none",
            background: backing ? "var(--border)" : "var(--text)",
            color: backing ? "var(--muted)" : "var(--bg)",
            fontSize: ".85rem",
            fontWeight: 700,
            cursor: backing ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'DM Sans',sans-serif",
            transition: "all .15s",
          }}
        >
          {backing ? (
            <>
              <i className='fa-solid fa-circle-notch fa-spin' />
              Backing up…
            </>
          ) : (
            <>
              <i className='fa-solid fa-cloud-arrow-up' />
              Back Up
            </>
          )}
        </button>
      </div>

      <SectionLabel>Auto Backup Schedule</SectionLabel>
      <div
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: autoBackup ? "1px solid var(--cb)" : "none",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 600,
                fontSize: ".88rem",
                color: "var(--text)",
              }}
            >
              Enable Automatic Backups
            </div>
            <div
              style={{
                fontSize: ".75rem",
                color: "var(--muted)",
                marginTop: 2,
              }}
            >
              Runs in the background on your chosen schedule.
            </div>
          </div>
          <Toggle checked={autoBackup} onChange={setAutoBackup} />
        </div>
        {autoBackup && (
          <div style={{ padding: "14px 16px" }}>
            <label
              style={{
                fontSize: ".72rem",
                fontWeight: 700,
                color: "var(--muted)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 8,
              }}
            >
              Frequency
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {["hourly", "daily", "weekly"].map((f) => (
                <button
                  key={f}
                  onClick={() => setBackupFreq(f)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 8,
                    border: `1.5px solid ${backupFreq === f ? "var(--accent)" : "var(--border)"}`,
                    background: backupFreq === f ? "rgba(46,64,49,.1)" : "none",
                    color: backupFreq === f ? "var(--accent)" : "var(--muted)",
                    fontSize: ".82rem",
                    fontWeight: backupFreq === f ? 700 : 400,
                    cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif",
                    textTransform: "capitalize",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <SectionLabel>Full Database</SectionLabel>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "rgba(192,57,43,.04)",
          border: "1.5px solid rgba(192,57,43,.2)",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <i
            className='fa-solid fa-triangle-exclamation'
            style={{ color: "#c0392b", fontSize: 16 }}
          />
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: ".88rem",
                color: "var(--text)",
              }}
            >
              Download Full Database
            </div>
            <div
              style={{
                fontSize: ".75rem",
                color: "var(--muted)",
                marginTop: 2,
              }}
            >
              Downloads a complete .sql dump. Keep this file secure.
            </div>
          </div>
        </div>
        <button
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1.5px solid rgba(192,57,43,.3)",
            background: "rgba(192,57,43,.06)",
            color: "#c0392b",
            fontSize: ".82rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          <i className='fa-solid fa-download' />
          Download
        </button>
      </div>
    </div>
  );
}

function SocialMediaSection({ saving, onSave }) {
  const [form, setForm] = useState({
    instagram: "",
    facebook: "",
    tiktok: "",
    whatsapp: "",
    tokopedia: "",
    shopee: "",
    gofood: "",
    grabfood: "",
  });
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const fields = [
    {
      key: "instagram",
      icon: "fa-instagram",
      label: "Instagram",
      prefix: "instagram.com/",
      placeholder: "yourhandle",
      color: "#e1306c",
    },
    {
      key: "facebook",
      icon: "fa-facebook",
      label: "Facebook",
      prefix: "facebook.com/",
      placeholder: "yourpage",
      color: "#1877f2",
    },
    {
      key: "tiktok",
      icon: "fa-tiktok",
      label: "TikTok",
      prefix: "tiktok.com/@",
      placeholder: "yourhandle",
      color: "var(--text)",
    },
    {
      key: "whatsapp",
      icon: "fa-whatsapp",
      label: "WhatsApp",
      prefix: "+62",
      placeholder: "81234567890",
      color: "#25d366",
    },
    {
      key: "tokopedia",
      icon: "fa-bag-shopping",
      label: "Tokopedia",
      prefix: "tokopedia.com/",
      placeholder: "yourstore",
      color: "#42b549",
    },
    {
      key: "shopee",
      icon: "fa-bag-shopping",
      label: "Shopee",
      prefix: "shopee.co.id/",
      placeholder: "yourstore",
      color: "#ee4d2d",
    },
    {
      key: "gofood",
      icon: "fa-motorcycle",
      label: "GoFood",
      prefix: "gofood.co.id/",
      placeholder: "yourrestaurant",
      color: "#00880a",
    },
    {
      key: "grabfood",
      icon: "fa-motorcycle",
      label: "GrabFood",
      prefix: "food.grab.com/",
      placeholder: "yourrestaurant",
      color: "#00b14f",
    },
  ];

  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Link your store's social accounts and marketplaces.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {fields.map((field) => (
          <div key={field.key}>
            <label
              style={{
                fontSize: ".72rem",
                fontWeight: 700,
                color: "var(--muted)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 6,
              }}
            >
              <i
                className={`fa-brands ${field.icon}`}
                style={{ color: field.color, fontSize: 13 }}
              />
              {field.label}
            </label>
            <div
              style={{
                display: "flex",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "9px 12px",
                  background: "var(--bg)",
                  borderRight: "1.5px solid var(--border)",
                  fontSize: ".8rem",
                  color: "var(--muted)",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {field.prefix}
              </div>
              <input
                style={{
                  ...inputStyle,
                  border: "none",
                  borderRadius: 0,
                  flex: 1,
                }}
                value={form[field.key]}
                onChange={f(field.key)}
                placeholder={field.placeholder}
                onFocus={(e) => {
                  e.currentTarget.parentElement.style.borderColor =
                    "var(--accent)";
                }}
                onBlur={(e) => {
                  e.currentTarget.parentElement.style.borderColor =
                    "var(--border)";
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <SaveBtn onClick={onSave} saving={saving} />
    </div>
  );
}

function LoyaltyRulesSection({ saving, onSave }) {
  const [form, setForm] = useState({
    earn_per: 10000,
    earn_points: 1,
    redeem_per: 100,
    redeem_value: 1000,
    min_redeem: 100,
    tier_silver: 500000,
    tier_gold: 2000000,
    expiry_days: 365,
  });
  const f = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));

  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Configure how customers earn and redeem loyalty points.
      </p>

      <SectionLabel>Earning Rules</SectionLabel>
      <div
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          padding: "16px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          <Field label='Spend Amount (Rp)' half>
            <input
              style={inputStyle}
              type='number'
              value={form.earn_per}
              onChange={f("earn_per")}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
          <Field label='Points Earned' half>
            <input
              style={inputStyle}
              type='number'
              value={form.earn_points}
              onChange={f("earn_points")}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(46,64,49,.06)",
            borderRadius: 8,
            fontSize: ".82rem",
            color: "var(--muted)",
          }}
        >
          <i
            className='fa-solid fa-circle-info'
            style={{ color: "var(--accent)", marginRight: 7 }}
          />
          Customer earns{" "}
          <b style={{ color: "var(--text)" }}>{form.earn_points} point</b> for
          every{" "}
          <b style={{ color: "var(--text)" }}>
            Rp {new Intl.NumberFormat("id-ID").format(form.earn_per)}
          </b>{" "}
          spent.
        </div>
      </div>

      <SectionLabel>Redemption Rules</SectionLabel>
      <div
        style={{
          background: "var(--bg)",
          border: "1.5px solid var(--border)",
          borderRadius: 12,
          padding: "16px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          <Field label='Points to Redeem' half>
            <input
              style={inputStyle}
              type='number'
              value={form.redeem_per}
              onChange={f("redeem_per")}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
          <Field label='Value (Rp)' half>
            <input
              style={inputStyle}
              type='number'
              value={form.redeem_value}
              onChange={f("redeem_value")}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
          <Field label='Minimum Points to Redeem'>
            <input
              style={inputStyle}
              type='number'
              value={form.min_redeem}
              onChange={f("min_redeem")}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(46,64,49,.06)",
            borderRadius: 8,
            fontSize: ".82rem",
            color: "var(--muted)",
          }}
        >
          <i
            className='fa-solid fa-circle-info'
            style={{ color: "var(--accent)", marginRight: 7 }}
          />
          <b style={{ color: "var(--text)" }}>{form.redeem_per} points</b> ={" "}
          <b style={{ color: "var(--text)" }}>
            Rp {new Intl.NumberFormat("id-ID").format(form.redeem_value)}
          </b>{" "}
          discount.
        </div>
      </div>

      <SectionLabel>Tier Thresholds (Total Spend)</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <Field label='Silver Tier (Rp)' half>
          <div style={{ position: "relative" }}>
            <i
              className='fa-solid fa-medal'
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#7f8c8d",
                fontSize: 13,
                pointerEvents: "none",
              }}
            />
            <input
              style={{ ...inputStyle, paddingLeft: 34 }}
              type='number'
              value={form.tier_silver}
              onChange={f("tier_silver")}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        </Field>
        <Field label='Gold Tier (Rp)' half>
          <div style={{ position: "relative" }}>
            <i
              className='fa-solid fa-crown'
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#d68910",
                fontSize: 13,
                pointerEvents: "none",
              }}
            />
            <input
              style={{ ...inputStyle, paddingLeft: 34 }}
              type='number'
              value={form.tier_gold}
              onChange={f("tier_gold")}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
        </Field>
        <Field label='Points Expiry (days)' hint='Set 0 to never expire.'>
          <input
            style={inputStyle}
            type='number'
            value={form.expiry_days}
            onChange={f("expiry_days")}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </Field>
      </div>

      <SaveBtn onClick={onSave} saving={saving} />
    </div>
  );
}

function ReceiptSection({ saving, onSave }) {
  const [form, setForm] = useState({
    footer: "Thank you for shopping with us!",
    tax: 11,
    lowStockThreshold: 5,
  });
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const fmt = (n) => new Intl.NumberFormat("id-ID").format(n);

  return (
    <div>
      <p
        style={{ fontSize: ".85rem", color: "var(--accent)", marginBottom: 24 }}
      >
        Customize what appears on printed and digital receipts.
      </p>

      <Field
        label='Footer Message'
        hint='This message will appear at the bottom of every receipt.'
      >
        <textarea
          style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
          value={form.footer}
          onChange={f("footer")}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </Field>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <Field label='Default Tax Rate (%)' half>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <input
              style={{
                ...inputStyle,
                borderRadius: "8px 0 0 8px",
                borderRight: "none",
              }}
              type='number'
              min='0'
              max='100'
              value={form.tax}
              onChange={(e) =>
                setForm((p) => ({ ...p, tax: parseFloat(e.target.value) || 0 }))
              }
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <div
              style={{
                padding: "9px 12px",
                background: "var(--bg)",
                border: "1.5px solid var(--border)",
                borderRadius: "0 8px 8px 0",
                fontSize: ".85rem",
                color: "var(--muted)",
                borderLeft: "none",
              }}
            >
              %
            </div>
          </div>
        </Field>
        <Field label='Low Stock Alert Threshold' half>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              style={{
                ...inputStyle,
                borderRadius: "8px 0 0 8px",
                borderRight: "none",
              }}
              type='number'
              min='0'
              value={form.lowStockThreshold}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  lowStockThreshold: parseFloat(e.target.value) || 0,
                }))
              }
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <div
              style={{
                padding: "9px 12px",
                background: "var(--bg)",
                border: "1.5px solid var(--border)",
                borderRadius: "0 8px 8px 0",
                fontSize: ".85rem",
                color: "var(--muted)",
                borderLeft: "none",
              }}
            >
              units
            </div>
          </div>
        </Field>
      </div>

      {/* Receipt preview */}
      <div
        style={{
          border: "1.5px dashed var(--border)",
          borderRadius: 12,
          padding: "20px",
          marginTop: 8,
        }}
      >
        <div
          style={{
            fontSize: ".68rem",
            fontWeight: 700,
            color: "var(--muted)",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Receipt Preview
        </div>
        <div
          style={{
            maxWidth: 280,
            margin: "0 auto",
            fontFamily: "monospace",
            fontSize: ".8rem",
            color: "var(--text)",
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontWeight: 700,
              fontSize: ".95rem",
              marginBottom: 10,
            }}
          >
            Kopi Flow Store
          </div>
          <div
            style={{ borderTop: "1px dashed var(--border)", margin: "8px 0" }}
          />
          {[
            { name: "Arabica Latte", price: 32000 },
            { name: "Croissant", price: 18000 },
          ].map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span>1x {item.name}</span>
              <span>Rp {fmt(item.price)}</span>
            </div>
          ))}
          <div
            style={{ borderTop: "1px dashed var(--border)", margin: "8px 0" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 3,
            }}
          >
            <span>Subtotal</span>
            <span>Rp {fmt(50000)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 3,
            }}
          >
            <span>Tax ({form.tax}%)</span>
            <span>Rp {fmt(Math.round((50000 * form.tax) / 100))}</span>
          </div>
          <div
            style={{ borderTop: "1px dashed var(--border)", margin: "8px 0" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 700,
              fontSize: ".9rem",
            }}
          >
            <span>Total</span>
            <span>Rp {fmt(50000 + Math.round((50000 * form.tax) / 100))}</span>
          </div>
          <div
            style={{ borderTop: "1px dashed var(--border)", margin: "8px 0" }}
          />
          <div
            style={{
              textAlign: "center",
              color: "var(--accent)",
              fontStyle: "italic",
              fontSize: ".78rem",
              marginTop: 8,
            }}
          >
            {form.footer}
          </div>
        </div>
      </div>

      <SaveBtn onClick={onSave} saving={saving} />
    </div>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { id: "store", label: "Store Information", icon: "fa-store" },
  { id: "branch", label: "Branch", icon: "fa-code-branch" },
  { id: "notif", label: "Notifications", icon: "fa-bell" },
  { id: "push", label: "Push Notifications", icon: "fa-mobile-screen" },
  { id: "email", label: "Email Updates", icon: "fa-envelope" },
  { id: "loyalty", label: "Loyalty Rules", icon: "fa-star" },
  { id: "backup", label: "Backup & Export", icon: "fa-database" },
  { id: "social", label: "Social Media", icon: "fa-share-nodes" },
  { id: "receipt", label: "Receipt", icon: "fa-receipt" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [active, setActive] = useState("store");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      showToast("Settings saved successfully.");
    } catch {
      showToast("Failed to save settings.", false);
    } finally {
      setSaving(false);
    }
  };

  const current = NAV.find((n) => n.id === active);

  const renderSection = () => {
    const props = { saving, onSave: handleSave };
    switch (active) {
      case "store":
        return <StoreInfo {...props} />;
      case "branch":
        return <BranchSection {...props} />;
      case "notif":
        return <NotificationsSection {...props} />;
      case "push":
        return <PushNotificationsSection {...props} />;
      case "email":
        return <EmailUpdatesSection {...props} />;
      case "loyalty":
        return <LoyaltyRulesSection {...props} />;
      case "backup":
        return <BackupSection {...props} />;
      case "social":
        return <SocialMediaSection {...props} />;
      case "receipt":
        return <ReceiptSection {...props} />;
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUpM { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
        .nav-btn { transition: all .15s; }
        .nav-btn:hover { background: var(--bg) !important; color: var(--text) !important; }
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
          Settings
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Store configuration and preferences.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Sidebar nav */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--cb)",
            borderRadius: 16,
            overflow: "hidden",
            position: "sticky",
            top: 20,
          }}
        >
          <div
            style={{
              padding: "12px 14px 6px",
              fontSize: ".65rem",
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Menu
          </div>
          {NAV.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                className='nav-btn'
                onClick={() => setActive(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "11px 14px",
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#fff" : "var(--muted)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: ".85rem",
                  fontWeight: isActive ? 700 : 400,
                  fontFamily: "'DM Sans',sans-serif",
                  borderRadius: 0,
                  transition: "all .15s",
                }}
              >
                <i
                  className={`fa-solid ${item.icon}`}
                  style={{ fontSize: 13, width: 16, textAlign: "center" }}
                />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--cb)",
            borderRadius: 16,
            padding: "24px 28px",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 20,
              paddingBottom: 18,
              borderBottom: "1px solid var(--cb)",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "rgba(46,64,49,.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className={`fa-solid ${current?.icon}`}
                style={{ color: "var(--accent)", fontSize: 14 }}
              />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                {current?.label}
              </h2>
            </div>
          </div>

          {/* Section content */}
          <div key={active} style={{ animation: "slideUpM .2s ease" }}>
            {renderSection()}
          </div>
        </div>
      </div>
    </>
  );
}
