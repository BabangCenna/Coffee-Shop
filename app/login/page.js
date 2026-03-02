"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/admin";

  const [darkMode, setDarkMode] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [identifierType, setIdentifierType] = useState("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const colors = darkMode
    ? {
        bg: "#121212",
        surface: "#1A1A1B",
        textPrimary: "#E4D1B9",
        textSecondary: "#AF8F6F",
        accent1: "#4A634E",
        accent2: "#D4B89A",
        border: "#2a2a2b",
        inputBg: "#111111",
        cardShadow: "0 24px 64px rgba(0,0,0,0.6)",
        placeholder: "#4a4a4a",
      }
    : {
        bg: "#F8F4EF",
        surface: "#FFFFFF",
        textPrimary: "#1A1A1B",
        textSecondary: "#5C5C5C",
        accent1: "#2E4031",
        accent2: "#AF8F6F",
        border: "#e8e0d6",
        inputBg: "#F8F4EF",
        cardShadow: "0 24px 64px rgba(46,64,49,0.10)",
        placeholder: "#b0a898",
      };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const isPhone = identifierType === "phone";

  return (
    <>
      <link
        rel='stylesheet'
        href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
      />
      <link
        href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap'
        rel='stylesheet'
      />

      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-6deg); }
          50%       { transform: translateY(-14px) rotate(-6deg); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .fade-up-1 { animation: fadeUp 0.7s 0.1s ease both; opacity: 0; animation-fill-mode: forwards; }
        .fade-up-2 { animation: fadeUp 0.7s 0.2s ease both; opacity: 0; animation-fill-mode: forwards; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; opacity: 0; animation-fill-mode: forwards; }
        .fade-up-4 { animation: fadeUp 0.7s 0.4s ease both; opacity: 0; animation-fill-mode: forwards; }
        .fade-up-5 { animation: fadeUp 0.7s 0.5s ease both; opacity: 0; animation-fill-mode: forwards; }
        .float-mug { animation: float 5s ease-in-out infinite; }
        .error-shake { animation: shake 0.4s ease; }

        .input-field {
          width: 100%;
          background: ${colors.inputBg};
          border: 1.5px solid ${colors.border};
          border-radius: 10px;
          padding: 14px 44px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          color: ${colors.textPrimary};
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s;
        }
        .input-field::placeholder { color: ${colors.placeholder}; }
        .input-field:focus {
          border-color: ${colors.accent1};
          box-shadow: 0 0 0 3px ${darkMode ? "rgba(74,99,78,0.2)" : "rgba(46,64,49,0.1)"};
        }
        .btn-submit {
          width: 100%; background: ${colors.accent1}; color: #fff;
          border: none; border-radius: 10px; padding: 15px;
          font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 600;
          cursor: pointer; letter-spacing: 0.4px;
          transition: background 0.25s, transform 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .btn-submit:hover:not(:disabled) { background: ${darkMode ? "#5a7a5e" : "#3a5240"}; transform: translateY(-2px); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .tab-btn {
          flex: 1; padding: 9px; border: none; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: all 0.25s ease;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }
        .theme-toggle {
          width: 46px; height: 25px; border-radius: 13px; border: none;
          cursor: pointer; position: relative; transition: background 0.3s;
          background: ${darkMode ? colors.accent1 : colors.border};
        }
        .theme-knob {
          position: absolute; top: 3.5px;
          left: ${darkMode ? "calc(100% - 21px)" : "3.5px"};
          width: 18px; height: 18px; border-radius: 50%; background: #fff;
          transition: left 0.3s ease;
          display: flex; align-items: center; justify-content: center;
        }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }
        @media (max-width: 600px) {
          .login-card { padding: 32px 24px !important; }
          .side-panel { display: none !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: colors.bg,
          display: "flex",
          transition: "background 0.4s ease",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Left decorative panel ── */}
        <div
          className='side-panel'
          style={{
            flex: "0 0 42%",
            background: darkMode
              ? "linear-gradient(160deg, #1f2e22 0%, #121212 100%)"
              : "linear-gradient(160deg, #2E4031 0%, #3d5643 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {[320, 220, 130].map((size) => (
            <div
              key={size}
              style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.07)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              bottom: -60,
              right: -60,
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -40,
              left: -40,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
            }}
          />

          <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
            <div
              className='float-mug'
              style={{
                fontSize: 80,
                color: "rgba(255,255,255,0.85)",
                marginBottom: 24,
              }}
            >
              <i className='fa-solid fa-mug-hot' />
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "3rem",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: -1,
                marginBottom: 12,
              }}
            >
              Forêt
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                color: "rgba(255,255,255,0.55)",
                fontSize: "1rem",
                lineHeight: 1.7,
                maxWidth: 240,
              }}
            >
              "A slow cup in a fast world."
            </div>
            <div
              style={{
                width: 40,
                height: 2,
                background: "rgba(255,255,255,0.25)",
                margin: "28px auto",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                textAlign: "left",
              }}
            >
              {[
                { icon: "fa-shield-halved", text: "Secure staff portal" },
                { icon: "fa-chart-line", text: "Real-time sales & reports" },
                { icon: "fa-boxes-stacked", text: "Full inventory control" },
              ].map((p) => (
                <div
                  key={p.text}
                  style={{ display: "flex", gap: 12, alignItems: "center" }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className={`fa-solid ${p.icon}`}
                      style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}
                    />
                  </div>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "0.88rem",
                    }}
                  >
                    {p.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 24px",
            position: "relative",
          }}
        >
          {/* Theme toggle */}
          <div
            style={{
              position: "absolute",
              top: 24,
              right: 28,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className={`fa-solid ${darkMode ? "fa-moon" : "fa-sun"}`}
              style={{ color: colors.textSecondary, fontSize: 14 }}
            />
            <button
              className='theme-toggle'
              onClick={() => setDarkMode(!darkMode)}
            >
              <div className='theme-knob'>
                <i
                  className={`fa-solid ${darkMode ? "fa-moon" : "fa-sun"}`}
                  style={{
                    fontSize: 8,
                    color: darkMode ? colors.accent1 : "#f59e0b",
                  }}
                />
              </div>
            </button>
          </div>

          {/* Card */}
          <div
            className='login-card'
            style={{
              width: "100%",
              maxWidth: 420,
              background: colors.surface,
              borderRadius: 20,
              padding: "44px 40px",
              boxShadow: colors.cardShadow,
              border: `1px solid ${colors.border}`,
            }}
          >
            {/* Header */}
            <div className='fade-up-1' style={{ marginBottom: 32 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: darkMode
                    ? "rgba(74,99,78,0.2)"
                    : "rgba(46,64,49,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <i
                  className='fa-solid fa-mug-hot'
                  style={{ color: colors.accent1, fontSize: 22 }}
                />
              </div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: 6,
                }}
              >
                Staff Login
              </h1>
              <p style={{ color: colors.textSecondary, fontSize: "0.9rem" }}>
                Sign in to the Forêt management portal.
              </p>
            </div>

            {/* Tabs — phone vs username */}
            <div
              className='fade-up-2'
              style={{
                display: "flex",
                gap: 6,
                background: darkMode ? "#111" : "#f0ebe4",
                borderRadius: 10,
                padding: 5,
                marginBottom: 24,
              }}
            >
              {[
                { key: "phone", label: "Phone", icon: "fa-phone" },
                { key: "username", label: "Username", icon: "fa-user" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className='tab-btn'
                  onClick={() => {
                    setIdentifierType(tab.key);
                    setIdentifier("");
                    setError("");
                  }}
                  style={{
                    background:
                      identifierType === tab.key
                        ? colors.accent1
                        : "transparent",
                    color:
                      identifierType === tab.key
                        ? "#fff"
                        : colors.textSecondary,
                  }}
                >
                  <i
                    className={`fa-solid ${tab.icon}`}
                    style={{ fontSize: 13 }}
                  />
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Identifier */}
              <div className='fade-up-2' style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: colors.textSecondary,
                  }}
                >
                  {isPhone ? "Phone Number" : "Username"}
                </label>
                <div style={{ position: "relative" }}>
                  <i
                    className={`fa-solid ${isPhone ? "fa-phone" : "fa-user"}`}
                    style={{
                      position: "absolute",
                      left: 15,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: colors.textSecondary,
                      fontSize: 15,
                      pointerEvents: "none",
                    }}
                  />
                  {isPhone && (
                    <span
                      style={{
                        position: "absolute",
                        left: 40,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: colors.textSecondary,
                        fontSize: "0.9rem",
                        borderRight: `1px solid ${colors.border}`,
                        paddingRight: 10,
                        lineHeight: 1,
                      }}
                    >
                      +62
                    </span>
                  )}
                  <input
                    className='input-field'
                    type={isPhone ? "tel" : "text"}
                    placeholder={isPhone ? "812 3456 7890" : "your.username"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{ paddingLeft: isPhone ? "82px" : "44px" }}
                    autoComplete={isPhone ? "tel" : "username"}
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className='fade-up-3' style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 7,
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: colors.textSecondary,
                    }}
                  >
                    Password
                  </label>
                  <a
                    href='/forgot-password'
                    style={{
                      fontSize: "0.8rem",
                      color: colors.accent1,
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: "relative" }}>
                  <i
                    className='fa-solid fa-lock'
                    style={{
                      position: "absolute",
                      left: 15,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: colors.textSecondary,
                      fontSize: 15,
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    className='input-field'
                    type={showPassword ? "text" : "password"}
                    placeholder='Enter your password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete='current-password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: colors.textSecondary,
                      fontSize: 15,
                      padding: 4,
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = colors.accent1)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = colors.textSecondary)
                    }
                  >
                    <i
                      className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className='error-shake'
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: darkMode
                      ? "rgba(180,60,60,0.15)"
                      : "rgba(200,50,50,0.08)",
                    border: "1px solid rgba(200,50,50,0.25)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    marginTop: 8,
                    color: "#c0392b",
                    fontSize: "0.84rem",
                  }}
                >
                  <i className='fa-solid fa-circle-exclamation' />
                  {error}
                </div>
              )}

              {/* Remember me */}
              <div
                className='fade-up-4'
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: "18px 0 22px",
                }}
              >
                <input
                  type='checkbox'
                  id='remember'
                  style={{
                    accentColor: colors.accent1,
                    width: 15,
                    height: 15,
                    cursor: "pointer",
                  }}
                />
                <label
                  htmlFor='remember'
                  style={{
                    fontSize: "0.85rem",
                    color: colors.textSecondary,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  Keep me signed in
                </label>
              </div>

              {/* Submit */}
              <div className='fade-up-5'>
                <button className='btn-submit' type='submit' disabled={loading}>
                  {loading ? (
                    <>
                      <div className='spinner' />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <i className='fa-solid fa-arrow-right-to-bracket' />
                      Sign In
                    </>
                  )}
                </button>
              </div>
            </form>

            <div
              style={{
                textAlign: "center",
                marginTop: 32,
                paddingTop: 24,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <p style={{ fontSize: "0.72rem", color: colors.placeholder }}>
                Staff access only ·{" "}
                <a
                  href='mailto:hello@foret.coffee'
                  style={{ color: colors.accent2, textDecoration: "none" }}
                >
                  hello@foret.coffee
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
