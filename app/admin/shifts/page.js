"use client";

import { useState, useEffect, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
const fmtPrice = (n) => `Rp ${fmt(n)}`;

function duration(clockIn, clockOut) {
  if (!clockIn) return "—";
  const start = new Date(clockIn);
  const end = clockOut ? new Date(clockOut) : new Date();
  const mins = Math.floor((end - start) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
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

export default function ShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewOpen, setViewOpen] = useState(false);
  const [clockInOpen, setClockInOpen] = useState(false);
  const [clockOutOpen, setClockOutOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ opening_cash: 0, notes: "" });
  const [closeForm, setCloseForm] = useState({ closing_cash: 0, notes: "" });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shifts");
      const data = await res.json();
      setShifts(data.shifts ?? []);
    } catch {
      showToast("Failed to load shifts.", false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClockIn = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Shift started.");
      setClockInOpen(false);
      setForm({ opening_cash: 0, notes: "" });
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleClockOut = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shifts/${selected.id}/close`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(closeForm),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error, false);
        return;
      }
      showToast("Shift closed.");
      setClockOutOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const openShifts = shifts.filter((s) => !s.clock_out);
  const statusOptions = ["all", "open", "closed"];

  const filtered = shifts.filter((s) => {
    const isOpen = !s.clock_out;
    const matchStatus =
      statusFilter === "all" || (statusFilter === "open" ? isOpen : !isOpen);
    const matchSearch =
      !search ||
      (s.user_name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const cashDiff = (s) => {
    if (!s.closing_cash || !s.opening_cash) return null;
    return s.closing_cash - s.opening_cash;
  };

  return (
    <>
      <style>{`
        @keyframes fadeInBd { from{opacity:0} to{opacity:1} }
        @keyframes slideUpM { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .shift-row:hover td { background: var(--bg) !important; }
        .act-btn { opacity:0; transition:opacity .15s; }
        .shift-row:hover .act-btn { opacity:1; }
        .stat-card { transition: transform .2s; }
        .stat-card:hover { transform: translateY(-2px); }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
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
          Shifts
        </h1>
        <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>
          Track staff clock-in/out and cash management.
        </p>
      </div>

      {/* Open shift banners */}
      {openShifts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {openShifts.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                background: "rgba(46,64,49,.08)",
                border: "1px solid rgba(46,64,49,.2)",
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  animation: "pulse 2s infinite",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: ".88rem",
                    color: "var(--text)",
                  }}
                >
                  {s.user_name}
                </span>
                <span
                  style={{
                    fontSize: ".82rem",
                    color: "var(--muted)",
                    marginLeft: 8,
                  }}
                >
                  — Active since{" "}
                  {new Date(s.clock_in).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  style={{
                    fontSize: ".78rem",
                    color: "var(--muted)",
                    marginLeft: 8,
                  }}
                >
                  ({duration(s.clock_in, null)})
                </span>
              </div>
              <button
                onClick={() => {
                  setSelected(s);
                  setCloseForm({ closing_cash: 0, notes: "" });
                  setClockOutOpen(true);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "#c0392b",
                  color: "#fff",
                  fontSize: ".8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <i className='fa-solid fa-right-from-bracket' />
                Close Shift
              </button>
            </div>
          ))}
        </div>
      )}

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
            label: "Total Shifts",
            value: shifts.length,
            icon: "fa-calendar",
            color: "#2980b9",
            bg: "rgba(41,128,185,.1)",
          },
          {
            label: "Active Now",
            value: openShifts.length,
            icon: "fa-user-clock",
            color: "#27ae60",
            bg: "rgba(39,174,96,.1)",
          },
          {
            label: "Closed Today",
            value: shifts.filter(
              (s) =>
                s.clock_out &&
                new Date(s.clock_out).toDateString() ===
                  new Date().toDateString(),
            ).length,
            icon: "fa-check-circle",
            color: "var(--accent)",
            bg: "rgba(46,64,49,.1)",
          },
          {
            label: "Avg Duration",
            value: (() => {
              const closed = shifts.filter((s) => s.clock_out);
              if (!closed.length) return "—";
              const avg =
                closed.reduce(
                  (s, sh) =>
                    s + (new Date(sh.clock_out) - new Date(sh.clock_in)),
                  0,
                ) /
                closed.length /
                60000;
              return `${Math.floor(avg / 60)}h ${Math.floor(avg % 60)}m`;
            })(),
            icon: "fa-clock",
            color: "#e67e22",
            bg: "rgba(230,126,34,.12)",
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
              placeholder='Search staff name…'
              style={{ ...inputStyle, paddingLeft: 34 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>
          <button
            onClick={() => {
              setForm({ opening_cash: 0, notes: "" });
              setClockInOpen(true);
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
            <i
              className='fa-solid fa-right-to-bracket'
              style={{ fontSize: 12 }}
            />
            Clock In
          </button>
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
            {statusOptions.map((s) => {
              const count =
                s === "all"
                  ? shifts.length
                  : s === "open"
                    ? shifts.filter((sh) => !sh.clock_out).length
                    : shifts.filter((sh) => sh.clock_out).length;
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
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
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
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
              className='fa-solid fa-calendar-xmark'
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
              No shifts found
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {[
                    "Staff",
                    "Clock In",
                    "Clock Out",
                    "Duration",
                    "Opening Cash",
                    "Closing Cash",
                    "Variance",
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
                {filtered.map((s, i) => {
                  const diff = cashDiff(s);
                  return (
                    <tr
                      key={s.id}
                      className='shift-row'
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
                          {s.user_name}
                        </div>
                        <div
                          style={{ fontSize: ".72rem", color: "var(--muted)" }}
                        >
                          {s.user_role}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--muted)",
                        }}
                      >
                        {s.clock_in
                          ? new Date(s.clock_in).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--muted)",
                        }}
                      >
                        {s.clock_out
                          ? new Date(s.clock_out).toLocaleString("id-ID", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--text)",
                          fontWeight: 500,
                        }}
                      >
                        {duration(s.clock_in, s.clock_out)}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--muted)",
                        }}
                      >
                        {fmtPrice(s.opening_cash)}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          fontSize: ".82rem",
                          color: "var(--muted)",
                        }}
                      >
                        {s.closing_cash != null
                          ? fmtPrice(s.closing_cash)
                          : "—"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {diff != null ? (
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: ".82rem",
                              color: diff >= 0 ? "#27ae60" : "#c0392b",
                            }}
                          >
                            {diff >= 0 ? "+" : ""}
                            {fmtPrice(diff)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {!s.clock_out ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "3px 9px",
                              borderRadius: 99,
                              fontSize: ".72rem",
                              fontWeight: 600,
                              background: "rgba(39,174,96,.1)",
                              color: "#27ae60",
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#27ae60",
                                animation: "pulse 2s infinite",
                                display: "inline-block",
                              }}
                            />
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: "3px 9px",
                              borderRadius: 99,
                              fontSize: ".72rem",
                              fontWeight: 600,
                              background: "var(--bg)",
                              color: "var(--muted)",
                            }}
                          >
                            Closed
                          </span>
                        )}
                      </td>
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
                            title='View'
                            onClick={() => {
                              setSelected(s);
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
                          {!s.clock_out && (
                            <button
                              className='act-btn'
                              title='Close Shift'
                              onClick={() => {
                                setSelected(s);
                                setCloseForm({ closing_cash: 0, notes: "" });
                                setClockOutOpen(true);
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
                              <i className='fa-solid fa-right-from-bracket' />
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

      {/* Clock In Modal */}
      <Modal
        open={clockInOpen}
        onClose={() => setClockInOpen(false)}
        title='Start Shift'
        width={420}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          <Field label='Opening Cash (Rp)' required>
            <input
              style={inputStyle}
              type='number'
              min='0'
              value={form.opening_cash}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  opening_cash: parseFloat(e.target.value) || 0,
                }))
              }
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
          <Field label='Notes'>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder='Optional notes…'
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            onClick={() => setClockInOpen(false)}
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
            onClick={handleClockIn}
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
                <i className='fa-solid fa-right-to-bracket' />
                Start Shift
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Clock Out Modal */}
      <Modal
        open={clockOutOpen}
        onClose={() => setClockOutOpen(false)}
        title={`Close Shift — ${selected?.user_name}`}
        width={420}
      >
        {selected && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 16,
              }}
            >
              {[
                {
                  label: "Clocked In",
                  value: new Date(selected.clock_in).toLocaleString("id-ID", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }),
                },
                { label: "Duration", value: duration(selected.clock_in, null) },
                {
                  label: "Opening Cash",
                  value: fmtPrice(selected.opening_cash),
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
              <Field label='Closing Cash (Rp)' required>
                <input
                  style={inputStyle}
                  type='number'
                  min='0'
                  value={closeForm.closing_cash}
                  onChange={(e) =>
                    setCloseForm((f) => ({
                      ...f,
                      closing_cash: parseFloat(e.target.value) || 0,
                    }))
                  }
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--accent)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </Field>
              <Field label='Notes'>
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                  value={closeForm.notes}
                  onChange={(e) =>
                    setCloseForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder='Optional notes…'
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--accent)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </Field>
            </div>
            {closeForm.closing_cash !== 0 && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background:
                    closeForm.closing_cash - selected.opening_cash >= 0
                      ? "rgba(39,174,96,.08)"
                      : "rgba(192,57,43,.07)",
                  border: `1px solid ${closeForm.closing_cash - selected.opening_cash >= 0 ? "rgba(39,174,96,.2)" : "rgba(192,57,43,.2)"}`,
                  marginBottom: 14,
                  fontSize: ".85rem",
                }}
              >
                <span style={{ color: "var(--muted)" }}>Cash variance: </span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      closeForm.closing_cash - selected.opening_cash >= 0
                        ? "#27ae60"
                        : "#c0392b",
                  }}
                >
                  {closeForm.closing_cash - selected.opening_cash >= 0
                    ? "+"
                    : ""}
                  {fmtPrice(closeForm.closing_cash - selected.opening_cash)}
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setClockOutOpen(false)}
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
                onClick={handleClockOut}
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
                    Saving…
                  </>
                ) : (
                  <>
                    <i className='fa-solid fa-right-from-bracket' />
                    Close Shift
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title='Shift Details'
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
                  width: 42,
                  height: 42,
                  borderRadius: 11,
                  background: !selected.clock_out
                    ? "rgba(39,174,96,.1)"
                    : "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className='fa-solid fa-user-clock'
                  style={{
                    color: !selected.clock_out ? "#27ae60" : "var(--muted)",
                    fontSize: 18,
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
                  {selected.user_name}
                </div>
                <div style={{ fontSize: ".8rem", color: "var(--muted)" }}>
                  {selected.user_role}
                </div>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  padding: "4px 12px",
                  borderRadius: 99,
                  fontSize: ".75rem",
                  fontWeight: 700,
                  background: !selected.clock_out
                    ? "rgba(39,174,96,.1)"
                    : "var(--bg)",
                  color: !selected.clock_out ? "#27ae60" : "var(--muted)",
                }}
              >
                {!selected.clock_out ? "Active" : "Closed"}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                {
                  label: "Clock In",
                  value: selected.clock_in
                    ? new Date(selected.clock_in).toLocaleString("id-ID")
                    : "—",
                },
                {
                  label: "Clock Out",
                  value: selected.clock_out
                    ? new Date(selected.clock_out).toLocaleString("id-ID")
                    : "Still active",
                },
                {
                  label: "Duration",
                  value: duration(selected.clock_in, selected.clock_out),
                },
                {
                  label: "Opening Cash",
                  value: fmtPrice(selected.opening_cash),
                },
                {
                  label: "Closing Cash",
                  value:
                    selected.closing_cash != null
                      ? fmtPrice(selected.closing_cash)
                      : "—",
                },
                {
                  label: "Cash Variance",
                  value:
                    cashDiff(selected) != null
                      ? (cashDiff(selected) >= 0 ? "+" : "") +
                        fmtPrice(cashDiff(selected))
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
                  marginTop: 10,
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
          </div>
        )}
      </Modal>
    </>
  );
}
