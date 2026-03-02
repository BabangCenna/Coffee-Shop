"use client";

import { useState, useEffect, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtPrice = (n) => `Rp ${fmt(n)}`;

const TYPE_COLORS = {
  earn: { bg: "rgba(39,174,96,.1)", text: "#27ae60" },
  redeem: { bg: "rgba(230,126,34,.12)", text: "#e67e22" },
  expire: { bg: "rgba(192,57,43,.1)", text: "#c0392b" },
  adjust: { bg: "rgba(41,128,185,.1)", text: "#2980b9" },
};
const TYPE_ICONS = {
  earn: "fa-plus",
  redeem: "fa-minus",
  expire: "fa-clock-rotate-left",
  adjust: "fa-sliders",
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

export default function LoyaltyPage() {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    customer_id: "",
    type: "adjust",
    points: 0,
    note: "",
  });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, custRes] = await Promise.all([
        fetch("/api/admin/loyalty/transactions"),
        fetch("/api/admin/customers"),
      ]);
      const txData = await txRes.json();
      const custData = await custRes.json();
      setTransactions(txData.transactions ?? []);
      setCustomers(custData.customers ?? []);
    } catch {
      showToast("Failed to load data.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validate = () => {
    const e = {};
    if (!form.customer_id) e.customer_id = "Select a customer.";
    if (!form.points || form.points === 0) e.points = "Points cannot be zero.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAdjust = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/loyalty/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Points adjusted.");
      setAdjustOpen(false);
      setForm({ customer_id: "", type: "adjust", points: 0, note: "" });
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const types = ["all", "earn", "redeem", "expire", "adjust"];
  const filtered = transactions.filter((t) => {
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchSearch =
      !search ||
      (t.customer_name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalEarned = transactions
    .filter((t) => t.type === "earn")
    .reduce((s, t) => s + (t.points ?? 0), 0);
  const totalRedeemed = transactions
    .filter((t) => t.type === "redeem")
    .reduce((s, t) => s + Math.abs(t.points ?? 0), 0);
  const totalExpired = transactions
    .filter((t) => t.type === "expire")
    .reduce((s, t) => s + Math.abs(t.points ?? 0), 0);
  const topCustomers = [...customers]
    .sort((a, b) => (b.points_balance ?? 0) - (a.points_balance ?? 0))
    .slice(0, 5);

  return (
    <>
      <style>{`
        @keyframes fadeInBd { from{opacity:0} to{opacity:1} }
        @keyframes slideUpM { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .tx-row:hover td { background: var(--bg) !important; }
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
          Loyalty
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Track point transactions and manage customer rewards.
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
            label: "Total Transactions",
            value: transactions.length,
            icon: "fa-list",
            color: "#2980b9",
            bg: "rgba(41,128,185,.1)",
          },
          {
            label: "Points Earned",
            value: `${fmt(totalEarned)} pts`,
            icon: "fa-plus-circle",
            color: "#27ae60",
            bg: "rgba(39,174,96,.1)",
          },
          {
            label: "Points Redeemed",
            value: `${fmt(totalRedeemed)} pts`,
            icon: "fa-minus-circle",
            color: "#e67e22",
            bg: "rgba(230,126,34,.12)",
          },
          {
            label: "Points Expired",
            value: `${fmt(totalExpired)} pts`,
            icon: "fa-clock",
            color: "#c0392b",
            bg: "rgba(192,57,43,.1)",
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
                  fontSize: s.value.toString().length > 8 ? "1rem" : "1.35rem",
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
        style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}
      >
        {/* Transactions table */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--cb)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
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
                placeholder='Search customer…'
                style={{ ...inputStyle, paddingLeft: 34 }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
            <button
              onClick={() => setAdjustOpen(true)}
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
              <i className='fa-solid fa-sliders' style={{ fontSize: 12 }} />
              Adjust Points
            </button>
          </div>

          {/* Type tabs */}
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
              {types.map((type) => {
                const count =
                  type === "all"
                    ? transactions.length
                    : transactions.filter((t) => t.type === type).length;
                const active = typeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
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
                    {type === "all" ? (
                      "All"
                    ) : (
                      <>
                        <i
                          className={`fa-solid ${TYPE_ICONS[type]}`}
                          style={{ fontSize: 10 }}
                        />
                        {type}
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

          {loading ? (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              <i
                className='fa-solid fa-circle-notch fa-spin'
                style={{ fontSize: 28, display: "block", marginBottom: 12 }}
              />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              <i
                className='fa-solid fa-star-slash'
                style={{
                  fontSize: 32,
                  opacity: 0.3,
                  display: "block",
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 4,
                }}
              >
                No transactions found
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    {[
                      "Customer",
                      "Type",
                      "Points",
                      "Order",
                      "Note",
                      "Date",
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
                  {filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      className='tx-row'
                      style={{
                        borderBottom:
                          i < filtered.length - 1
                            ? "1px solid var(--cb)"
                            : "none",
                      }}
                    >
                      <td
                        style={{
                          padding: "13px 16px",
                          fontWeight: 600,
                          fontSize: ".88rem",
                          color: "var(--text)",
                        }}
                      >
                        {t.customer_name ?? "—"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            ...TYPE_COLORS[t.type],
                            padding: "3px 9px",
                            borderRadius: 99,
                            fontSize: ".72rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <i
                            className={`fa-solid ${TYPE_ICONS[t.type]}`}
                            style={{ fontSize: 9 }}
                          />
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: ".88rem",
                            color: t.points > 0 ? "#27ae60" : "#c0392b",
                          }}
                        >
                          {t.points > 0 ? "+" : ""}
                          {fmt(t.points)}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {t.order_id ? `#${t.order_id}` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                          maxWidth: 150,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.note ?? "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".78rem",
                          color: "var(--muted)",
                        }}
                      >
                        {t.created_at
                          ? new Date(t.created_at).toLocaleDateString("id-ID")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top customers sidebar */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--cb)",
            borderRadius: 16,
            overflow: "hidden",
            height: "fit-content",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--cb)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: ".95rem",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Top Point Holders
            </h3>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {topCustomers.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--muted)",
                  fontSize: ".82rem",
                }}
              >
                No data yet
              </div>
            ) : (
              topCustomers.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 4px",
                    borderBottom:
                      i < topCustomers.length - 1
                        ? "1px solid var(--cb)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      background:
                        i === 0 ? "rgba(243,156,18,.15)" : "var(--bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: ".7rem",
                      fontWeight: 700,
                      color: i === 0 ? "#d68910" : "var(--muted)",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: ".82rem",
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: ".7rem",
                        color: "var(--muted)",
                        textTransform: "capitalize",
                      }}
                    >
                      {c.tier}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 99,
                      fontSize: ".7rem",
                      fontWeight: 700,
                      background: "rgba(46,64,49,.1)",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    {fmt(c.points_balance ?? 0)} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title='Adjust Points'
        width={480}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          <Field label='Customer' required error={errors.customer_id}>
            <select
              style={selectStyle}
              value={form.customer_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, customer_id: e.target.value }))
              }
            >
              <option value=''>— Select Customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </Field>
          <Field label='Type' half>
            <select
              style={selectStyle}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value='adjust'>Adjust</option>
              <option value='earn'>Earn</option>
              <option value='redeem'>Redeem</option>
              <option value='expire'>Expire</option>
            </select>
          </Field>
          <Field label='Points' half error={errors.points}>
            <input
              style={inputStyle}
              type='number'
              value={form.points}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  points: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder='e.g. 100 or -50'
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
          <Field label='Note'>
            <input
              style={inputStyle}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder='Reason for adjustment…'
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            onClick={() => setAdjustOpen(false)}
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
            onClick={handleAdjust}
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
                <i className='fa-solid fa-sliders' />
                Apply Adjustment
              </>
            )}
          </button>
        </div>
      </Modal>
    </>
  );
}
