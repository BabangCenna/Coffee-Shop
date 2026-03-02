"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [step, setStep] = useState(1); // 1: enter contact, 2: enter OTP, 3: new password, 4: success
  const [method, setMethod] = useState("email"); // "email" | "phone"
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

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
        successBg: "rgba(74,99,78,0.15)",
        errorBg: "rgba(180,60,60,0.15)",
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
        successBg: "rgba(46,64,49,0.07)",
        errorBg: "rgba(200,50,50,0.08)",
      };

  // Password strength
  const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const strengthScore = getStrength(newPassword);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#c0392b", "#e67e22", "#2980b9", colors.accent1];

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError("");
    if (!identifier) {
      setError("Please enter your email or phone number.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    startCountdown();
    setStep(2);
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError("");
    if (otp.join("").length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep(3);
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (strengthScore < 2) {
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep(4);
  };

  const maskedIdentifier = () => {
    if (method === "email") {
      const [user, domain] = identifier.split("@");
      if (!domain) return identifier;
      return user.slice(0, 2) + "***@" + domain;
    }
    return "+62 ***-***-" + identifier.slice(-4);
  };

  const stepTitles = [
    {},
    {
      icon: "fa-key",
      title: "Forgot Password?",
      subtitle: "No worries — we'll send you a reset code.",
    },
    {
      icon: "fa-message",
      title: "Check Your " + (method === "email" ? "Inbox" : "Messages"),
      subtitle: `We sent a 6-digit code to ${maskedIdentifier()}.`,
    },
    {
      icon: "fa-lock",
      title: "Set New Password",
      subtitle: "Choose a strong password you haven't used before.",
    },
    {
      icon: "fa-circle-check",
      title: "Password Updated!",
      subtitle: "Your password has been successfully reset.",
    },
  ];

  const current = stepTitles[step];

  return (
    <>
      <link
        rel='stylesheet'
        href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
      />
      <link
        href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap'
        rel='stylesheet'
      />

      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .fade-up { animation: fadeUp 0.55s ease both; }
        .fade-in { animation: fadeIn 0.4s ease both; }
        .pop-in { animation: popIn 0.5s cubic-bezier(.175,.885,.32,1.275) both; }
        .float { animation: float 4s ease-in-out infinite; }
        .shake { animation: shake 0.4s ease; }

        .input-field {
          width: 100%;
          background: ${colors.inputBg};
          border: 1.5px solid ${colors.border};
          border-radius: 10px;
          padding: 14px 14px 14px 44px;
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

        .otp-input {
          width: 48px; height: 56px;
          text-align: center;
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem; font-weight: 700;
          background: ${colors.inputBg};
          border: 1.5px solid ${colors.border};
          border-radius: 10px;
          color: ${colors.textPrimary};
          outline: none;
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.15s;
          caret-color: ${colors.accent1};
        }
        .otp-input:focus {
          border-color: ${colors.accent1};
          box-shadow: 0 0 0 3px ${darkMode ? "rgba(74,99,78,0.2)" : "rgba(46,64,49,0.1)"};
          transform: scale(1.06);
        }
        .otp-input:not(:placeholder-shown) {
          border-color: ${colors.accent1};
          background: ${darkMode ? "rgba(74,99,78,0.1)" : "rgba(46,64,49,0.05)"};
        }

        .btn-primary {
          width: 100%;
          background: ${colors.accent1};
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 15px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem; font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: background 0.25s, transform 0.2s;
          letter-spacing: 0.3px;
        }
        .btn-primary:hover:not(:disabled) {
          background: ${darkMode ? "#5a7a5e" : "#3a5240"};
          transform: translateY(-2px);
        }
        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

        .btn-ghost {
          background: none; border: none;
          color: ${colors.textSecondary};
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem; cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          padding: 6px 0;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: ${colors.accent1}; }

        .link-text {
          color: ${colors.accent1}; font-weight: 500;
          text-decoration: none; transition: opacity 0.2s;
          background: none; border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: inherit; cursor: pointer;
        }
        .link-text:hover { opacity: 0.7; }

        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        .theme-toggle {
          width: 46px; height: 25px;
          border-radius: 13px; border: none;
          cursor: pointer; position: relative;
          transition: background 0.3s;
          background: ${darkMode ? colors.accent1 : colors.border};
        }
        .theme-knob {
          position: absolute; top: 3.5px;
          left: ${darkMode ? "calc(100% - 21px)" : "3.5px"};
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; transition: left 0.3s ease;
          display: flex; align-items: center; justify-content: center;
        }

        .tab-btn {
          flex: 1; padding: 9px;
          border: none; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem; font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex; align-items: center; justify-content: center; gap: 7px;
        }

        .step-dot {
          width: 8px; height: 8px; border-radius: 50%;
          transition: all 0.35s ease;
        }

        .strength-bar {
          height: 4px; border-radius: 2px;
          transition: width 0.4s ease, background 0.4s ease;
        }

        @media (max-width: 500px) {
          .card { padding: 32px 20px !important; }
          .otp-input { width: 42px !important; height: 50px !important; font-size: 1.2rem !important; }
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: darkMode
            ? "radial-gradient(ellipse at 30% 70%, #1a2e1c 0%, #121212 60%)"
            : "radial-gradient(ellipse at 30% 70%, #dde8df 0%, #F8F4EF 65%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          fontFamily: "'DM Sans', sans-serif",
          transition: "background 0.4s ease",
          position: "relative",
        }}
      >
        {/* Decorative bg rings */}
        {[500, 360, 230].map((size) => (
          <div
            key={size}
            style={{
              position: "fixed",
              width: size,
              height: size,
              borderRadius: "50%",
              border: `1px solid ${darkMode ? "rgba(74,99,78,0.07)" : "rgba(46,64,49,0.06)"}`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Floating icon bg */}
        <i
          className='fa-solid fa-mug-hot float'
          style={{
            position: "fixed",
            bottom: "8%",
            right: "6%",
            fontSize: 120,
            color: darkMode ? "rgba(74,99,78,0.07)" : "rgba(46,64,49,0.06)",
            pointerEvents: "none",
          }}
        />

        {/* Theme toggle */}
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 10,
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

        {/* Back to login */}
        <div style={{ position: "fixed", top: 24, left: 24, zIndex: 10 }}>
          <a
            href='/login'
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: colors.textSecondary,
              textDecoration: "none",
              fontSize: "0.88rem",
              fontWeight: 500,
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.accent1)}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = colors.textSecondary)
            }
          >
            <i className='fa-solid fa-arrow-left' style={{ fontSize: 13 }} />
            Back to Login
          </a>
        </div>

        {/* Card */}
        <div
          className='card'
          style={{
            width: "100%",
            maxWidth: 420,
            background: colors.surface,
            borderRadius: 22,
            padding: "44px 40px",
            boxShadow: colors.cardShadow,
            border: `1px solid ${colors.border}`,
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Step progress dots */}
          {step < 4 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className='step-dot'
                  style={{
                    width: step === s ? 24 : 8,
                    background: s <= step ? colors.accent1 : colors.border,
                  }}
                />
              ))}
            </div>
          )}

          {/* Icon + heading */}
          <div
            key={step}
            className='fade-up'
            style={{ textAlign: "center", marginBottom: 32 }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 18,
                background:
                  step === 4
                    ? darkMode
                      ? "rgba(74,99,78,0.25)"
                      : "rgba(46,64,49,0.1)"
                    : darkMode
                      ? "rgba(74,99,78,0.15)"
                      : "rgba(46,64,49,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                ...(step === 4
                  ? {
                      animation:
                        "popIn 0.5s cubic-bezier(.175,.885,.32,1.275) both",
                    }
                  : {}),
              }}
            >
              <i
                className={`fa-solid ${current.icon}`}
                style={{
                  fontSize: 26,
                  color: step === 4 ? colors.accent1 : colors.accent1,
                }}
              />
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.65rem",
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: 8,
              }}
            >
              {current.title}
            </h1>
            <p
              style={{
                color: colors.textSecondary,
                fontSize: "0.88rem",
                lineHeight: 1.6,
              }}
            >
              {current.subtitle}
            </p>
          </div>

          {/* ===== STEP 1: Enter email/phone ===== */}
          {step === 1 && (
            <form
              key='step1'
              className='fade-in'
              onSubmit={handleStep1}
              noValidate
            >
              {/* Method tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  background: darkMode ? "#111" : "#f0ebe4",
                  borderRadius: 10,
                  padding: 5,
                  marginBottom: 20,
                }}
              >
                {[
                  { key: "email", label: "Email", icon: "fa-envelope" },
                  { key: "phone", label: "Phone", icon: "fa-phone" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type='button'
                    className='tab-btn'
                    onClick={() => {
                      setMethod(tab.key);
                      setIdentifier("");
                      setError("");
                    }}
                    style={{
                      background:
                        method === tab.key ? colors.accent1 : "transparent",
                      color: method === tab.key ? "#fff" : colors.textSecondary,
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

              {/* Identifier input */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: colors.textSecondary,
                  }}
                >
                  {method === "email" ? "Email Address" : "Phone Number"}
                </label>
                <div style={{ position: "relative" }}>
                  <i
                    className={`fa-solid ${method === "email" ? "fa-envelope" : "fa-phone"}`}
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
                  {method === "phone" && (
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
                    type={method === "email" ? "email" : "tel"}
                    placeholder={
                      method === "email" ? "you@example.com" : "812 3456 7890"
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      paddingLeft: method === "phone" ? "82px" : "44px",
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div
                  className='shake'
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: colors.errorBg,
                    border: "1px solid rgba(200,50,50,0.25)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    color: "#c0392b",
                    fontSize: "0.84rem",
                  }}
                >
                  <i className='fa-solid fa-circle-exclamation' />
                  {error}
                </div>
              )}

              <button className='btn-primary' type='submit' disabled={loading}>
                {loading ? (
                  <>
                    <div className='spinner' />
                    Sending Code…
                  </>
                ) : (
                  <>
                    <i className='fa-solid fa-paper-plane' />
                    Send Reset Code
                  </>
                )}
              </button>
            </form>
          )}

          {/* ===== STEP 2: OTP ===== */}
          {step === 2 && (
            <form
              key='step2'
              className='fade-in'
              onSubmit={handleStep2}
              noValidate
            >
              {/* OTP boxes */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  marginBottom: 24,
                }}
                onPaste={handleOtpPaste}
              >
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    className='otp-input'
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    placeholder='·'
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {/* Resend */}
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 20,
                  fontSize: "0.84rem",
                  color: colors.textSecondary,
                }}
              >
                {countdown > 0 ? (
                  <span>
                    Resend code in{" "}
                    <span
                      style={{
                        color: colors.accent1,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      0:{String(countdown).padStart(2, "0")}
                    </span>
                  </span>
                ) : (
                  <span>
                    Didn't receive it?{" "}
                    <button
                      type='button'
                      className='link-text'
                      onClick={() => {
                        startCountdown();
                        setOtp(["", "", "", "", "", ""]);
                        setError("");
                      }}
                    >
                      Resend Code
                    </button>
                  </span>
                )}
              </div>

              {error && (
                <div
                  className='shake'
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: colors.errorBg,
                    border: "1px solid rgba(200,50,50,0.25)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    color: "#c0392b",
                    fontSize: "0.84rem",
                  }}
                >
                  <i className='fa-solid fa-circle-exclamation' />
                  {error}
                </div>
              )}

              <button
                className='btn-primary'
                type='submit'
                disabled={loading || otp.join("").length < 6}
              >
                {loading ? (
                  <>
                    <div className='spinner' />
                    Verifying…
                  </>
                ) : (
                  <>
                    <i className='fa-solid fa-check' />
                    Verify Code
                  </>
                )}
              </button>

              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                  type='button'
                  className='btn-ghost'
                  onClick={() => {
                    setStep(1);
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                  }}
                >
                  <i
                    className='fa-solid fa-arrow-left'
                    style={{ fontSize: 12 }}
                  />
                  Change {method === "email" ? "email" : "phone"}
                </button>
              </div>
            </form>
          )}

          {/* ===== STEP 3: New password ===== */}
          {step === 3 && (
            <form
              key='step3'
              className='fade-in'
              onSubmit={handleStep3}
              noValidate
            >
              {/* New password */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: colors.textSecondary,
                  }}
                >
                  New Password
                </label>
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
                    type={showNew ? "text" : "password"}
                    placeholder='At least 8 characters'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                  />
                  <button
                    type='button'
                    onClick={() => setShowNew(!showNew)}
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
                      className={`fa-solid ${showNew ? "fa-eye-slash" : "fa-eye"}`}
                    />
                  </button>
                </div>

                {/* Strength meter */}
                {newPassword.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className='strength-bar'
                          style={{
                            flex: 1,
                            background:
                              i <= strengthScore
                                ? strengthColors[strengthScore]
                                : colors.border,
                          }}
                        />
                      ))}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                      }}
                    >
                      <span style={{ color: colors.textSecondary }}>
                        Password strength
                      </span>
                      <span
                        style={{
                          color: strengthColors[strengthScore],
                          fontWeight: 600,
                        }}
                      >
                        {strengthLabels[strengthScore]}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: colors.textSecondary,
                  }}
                >
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <i
                    className='fa-solid fa-lock-open'
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
                    type={showConfirm ? "text" : "password"}
                    placeholder='Repeat your password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirm(!showConfirm)}
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
                      className={`fa-solid ${showConfirm ? "fa-eye-slash" : "fa-eye"}`}
                    />
                  </button>
                </div>
                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 8,
                      fontSize: "0.78rem",
                    }}
                  >
                    <i
                      className={`fa-solid ${newPassword === confirmPassword ? "fa-circle-check" : "fa-circle-xmark"}`}
                      style={{
                        color:
                          newPassword === confirmPassword
                            ? colors.accent1
                            : "#c0392b",
                      }}
                    />
                    <span
                      style={{
                        color:
                          newPassword === confirmPassword
                            ? colors.accent1
                            : "#c0392b",
                      }}
                    >
                      {newPassword === confirmPassword
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </span>
                  </div>
                )}
              </div>

              {/* Password rules hint */}
              <div
                style={{
                  background: darkMode
                    ? "rgba(74,99,78,0.1)"
                    : "rgba(46,64,49,0.05)",
                  border: `1px solid ${darkMode ? "rgba(74,99,78,0.2)" : "rgba(46,64,49,0.12)"}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 20,
                }}
              >
                {[
                  {
                    rule: "At least 8 characters",
                    pass: newPassword.length >= 8,
                  },
                  {
                    rule: "One uppercase letter",
                    pass: /[A-Z]/.test(newPassword),
                  },
                  { rule: "One number", pass: /[0-9]/.test(newPassword) },
                  {
                    rule: "One special character",
                    pass: /[^A-Za-z0-9]/.test(newPassword),
                  },
                ].map((r) => (
                  <div
                    key={r.rule}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <i
                      className={`fa-solid ${r.pass ? "fa-circle-check" : "fa-circle"}`}
                      style={{
                        fontSize: 12,
                        color: r.pass ? colors.accent1 : colors.border,
                        transition: "color 0.3s",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: r.pass
                          ? colors.textPrimary
                          : colors.textSecondary,
                      }}
                    >
                      {r.rule}
                    </span>
                  </div>
                ))}
              </div>

              {error && (
                <div
                  className='shake'
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: colors.errorBg,
                    border: "1px solid rgba(200,50,50,0.25)",
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 16,
                    color: "#c0392b",
                    fontSize: "0.84rem",
                  }}
                >
                  <i className='fa-solid fa-circle-exclamation' />
                  {error}
                </div>
              )}

              <button className='btn-primary' type='submit' disabled={loading}>
                {loading ? (
                  <>
                    <div className='spinner' />
                    Updating…
                  </>
                ) : (
                  <>
                    <i className='fa-solid fa-shield-halved' />
                    Update Password
                  </>
                )}
              </button>
            </form>
          )}

          {/* ===== STEP 4: Success ===== */}
          {step === 4 && (
            <div
              key='step4'
              className='fade-in'
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  background: colors.successBg,
                  border: `1px solid ${darkMode ? "rgba(74,99,78,0.3)" : "rgba(46,64,49,0.15)"}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 28,
                  textAlign: "left",
                }}
              >
                {[
                  "Your password has been updated",
                  "All active sessions have been signed out",
                  "Use your new password to log in",
                ].map((msg) => (
                  <div
                    key={msg}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <i
                      className='fa-solid fa-circle-check'
                      style={{
                        color: colors.accent1,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.84rem",
                        color: colors.textSecondary,
                      }}
                    >
                      {msg}
                    </span>
                  </div>
                ))}
              </div>

              <a
                href='/login'
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  width: "100%",
                  padding: "15px",
                  background: colors.accent1,
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 10,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  transition: "background 0.25s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode
                    ? "#5a7a5e"
                    : "#3a5240";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.accent1;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <i className='fa-solid fa-arrow-right-to-bracket' />
                Back to Login
              </a>
            </div>
          )}

          {/* Forêt branding footer */}
          <div
            style={{
              textAlign: "center",
              marginTop: 32,
              paddingTop: 24,
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: colors.accent1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className='fa-solid fa-mug-hot'
                  style={{ color: "#fff", fontSize: 10 }}
                />
              </div>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: colors.textSecondary,
                }}
              >
                Forêt
              </span>
            </div>
            <p
              style={{
                fontSize: "0.72rem",
                color: colors.placeholder,
                marginTop: 6,
              }}
            >
              Need help? Contact us at{" "}
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
    </>
  );
}
