"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const heroRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const colors = darkMode
    ? {
        bg: "#121212",
        surface: "#1A1A1B",
        textPrimary: "#E4D1B9",
        textSecondary: "#AF8F6F",
        accent1: "#4A634E",
        accent2: "#D4B89A",
        border: "#2a2a2b",
        cardShadow: "0 8px 32px rgba(0,0,0,0.5)",
        navBg: "rgba(18,18,18,0.92)",
      }
    : {
        bg: "#F8F4EF",
        surface: "#FFFFFF",
        textPrimary: "#1A1A1B",
        textSecondary: "#5C5C5C",
        accent1: "#2E4031",
        accent2: "#AF8F6F",
        border: "#e8e0d6",
        cardShadow: "0 8px 32px rgba(46,64,49,0.08)",
        navBg: "rgba(248,244,239,0.92)",
      };

  const menuItems = [
    {
      name: "Espresso",
      price: "Rp 32.000",
      tag: "Best Seller",
      icon: "fa-coffee",
      desc: "Bold, rich, and perfectly extracted single shot.",
    },
    {
      name: "Latte",
      price: "Rp 42.000",
      tag: "Popular",
      icon: "fa-mug-hot",
      desc: "Silky steamed milk with a shot of espresso artfully layered.",
    },
    {
      name: "Cold Brew",
      price: "Rp 48.000",
      tag: "New",
      icon: "fa-glass-water",
      desc: "12-hour slow-steeped for a smooth, low-acid experience.",
    },
    {
      name: "Matcha Latte",
      price: "Rp 45.000",
      tag: "Vegan",
      icon: "fa-leaf",
      desc: "Ceremonial-grade matcha whisked with oat milk.",
    },
    {
      name: "Cappuccino",
      price: "Rp 40.000",
      tag: "Classic",
      icon: "fa-mug-hot",
      desc: "Equal parts espresso, steamed milk, and foam.",
    },
    {
      name: "Iced Caramel",
      price: "Rp 50.000",
      tag: "Sweet",
      icon: "fa-glass-water",
      desc: "House caramel drizzle over chilled espresso and milk.",
    },
  ];

  const testimonials = [
    {
      name: "Arinta W.",
      stars: 5,
      text: "The best coffee shop in Surabaya. The ambiance is warm and the latte art is incredible.",
      avatar: "AW",
    },
    {
      name: "Budi S.",
      stars: 5,
      text: "Cold brew is unmatched. I've tried dozens of cafes and nothing comes close.",
      avatar: "BS",
    },
    {
      name: "Citra M.",
      stars: 5,
      text: "My go-to for working remotely. Fast wifi, great playlist, amazing espresso.",
      avatar: "CM",
    },
  ];

  const tagColors = {
    "Best Seller": { bg: colors.accent1, text: "#fff" },
    Popular: { bg: colors.accent2, text: darkMode ? "#1A1A1B" : "#fff" },
    New: { bg: "#c0392b", text: "#fff" },
    Vegan: { bg: "#4a7c59", text: "#fff" },
    Classic: { bg: colors.textSecondary, text: "#fff" },
    Sweet: { bg: colors.accent2, text: darkMode ? "#1A1A1B" : "#fff" },
  };

  return (
    <>
      {/* Font Awesome + Google Fonts */}
      <link
        rel='stylesheet'
        href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
      />
      <link
        href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500&display=swap'
        rel='stylesheet'
      />

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: ${colors.bg}; color: ${colors.textPrimary}; transition: background 0.4s ease, color 0.4s ease; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 8vw, 7rem);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -2px;
          animation: fadeUp 0.9s ease both;
        }
        .hero-subtitle {
          animation: fadeUp 0.9s 0.2s ease both;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .hero-cta {
          animation: fadeUp 0.9s 0.4s ease both;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .hero-badge {
          animation: fadeUp 0.9s 0.6s ease both;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        .float-icon {
          animation: float 4s ease-in-out infinite;
        }
        .card-hover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          cursor: pointer;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(46,64,49,0.15) !important;
        }
        .btn-primary {
          background: ${colors.accent1};
          color: #fff;
          border: none;
          padding: 14px 32px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.25s ease;
          letter-spacing: 0.5px;
        }
        .btn-primary:hover {
          background: ${darkMode ? "#5a7a5e" : "#3a5240"};
          transform: translateY(-2px);
        }
        .btn-outline {
          background: transparent;
          color: ${colors.accent1};
          border: 2px solid ${colors.accent1};
          padding: 12px 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .btn-outline:hover {
          background: ${colors.accent1};
          color: #fff;
        }
        .section-label {
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: ${colors.accent2};
        }
        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          line-height: 1.15;
          color: ${colors.textPrimary};
        }
        .divider-line {
          width: 48px;
          height: 3px;
          background: ${colors.accent1};
          margin: 16px 0 24px;
        }
        .nav-link {
          color: ${colors.textSecondary};
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
          cursor: pointer;
        }
        .nav-link:hover { color: ${colors.accent1}; }

        .grain-overlay::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }
        .content-z { position: relative; z-index: 2; }

        .star-filled { color: #d4a017; }
        .star-empty { color: ${colors.border}; }

        @media (max-width: 768px) {
          .hero-cols { flex-direction: column !important; }
          .menu-grid { grid-template-columns: 1fr !important; }
          .testi-grid { grid-template-columns: 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-grid { flex-direction: column !important; gap: 32px !important; }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled ? colors.navBg : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `1px solid ${colors.border}` : "none",
          transition: "all 0.3s ease",
          padding: "0 5%",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 72,
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: colors.accent1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className='fa-solid fa-mug-hot'
                style={{ color: "#fff", fontSize: 16 }}
              />
            </div>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: colors.textPrimary,
              }}
            >
              Forêt
            </span>
          </div>

          {/* Desktop Nav */}
          <div
            style={{ display: "flex", gap: 36, alignItems: "center" }}
            className='desktop-nav'
          >
            {["Menu", "About", "Experience", "Contact"].map((item) => (
              <a
                key={item}
                className='nav-link'
                href={`#${item.toLowerCase()}`}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: darkMode ? colors.accent1 : colors.border,
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.3s ease",
                flexShrink: 0,
              }}
              title='Toggle theme'
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: darkMode ? "calc(100% - 21px)" : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className={`fa-solid ${darkMode ? "fa-moon" : "fa-sun"}`}
                  style={{
                    fontSize: 8,
                    color: darkMode ? colors.accent1 : "#f59e0b",
                  }}
                />
              </div>
            </button>

            <button
              className='btn-primary'
              style={{ padding: "10px 20px", fontSize: "0.85rem" }}
              onClick={() => router.push("/login")}
            >
              <i
                className='fa-solid fa-arrow-right'
                style={{ marginRight: 8 }}
              />
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section
        id='home'
        ref={heroRef}
        className='grain-overlay'
        style={{
          minHeight: "100vh",
          background: darkMode
            ? `radial-gradient(ellipse at 70% 50%, #1f2e22 0%, #121212 60%)`
            : `radial-gradient(ellipse at 70% 50%, #e8ddd0 0%, #F8F4EF 60%)`,
          display: "flex",
          alignItems: "center",
          padding: "100px 5% 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative circles */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: `1px solid ${darkMode ? "rgba(74,99,78,0.2)" : "rgba(46,64,49,0.1)"}`,
            top: "50%",
            right: "5%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: `1px solid ${darkMode ? "rgba(74,99,78,0.15)" : "rgba(46,64,49,0.08)"}`,
            top: "50%",
            right: "15%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />

        {/* Floating coffee beans decoration */}
        <div
          className='float-icon'
          style={{
            position: "absolute",
            top: "20%",
            right: "8%",
            fontSize: 80,
            color: darkMode ? "rgba(74,99,78,0.3)" : "rgba(46,64,49,0.12)",
            pointerEvents: "none",
          }}
        >
          <i className='fa-solid fa-mug-saucer' />
        </div>
        <div
          className='float-icon'
          style={{
            position: "absolute",
            bottom: "25%",
            right: "28%",
            fontSize: 40,
            color: darkMode
              ? "rgba(175,143,111,0.25)"
              : "rgba(175,143,111,0.3)",
            pointerEvents: "none",
            animationDelay: "1.5s",
          }}
        >
          <i className='fa-solid fa-seedling' />
        </div>

        <div
          className='content-z'
          style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}
        >
          <div
            className='hero-cols'
            style={{ display: "flex", alignItems: "center", gap: 60 }}
          >
            {/* Left content */}
            <div style={{ flex: "0 0 55%" }}>
              {/* Pill badge */}
              <div
                className='hero-badge'
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: darkMode
                    ? "rgba(74,99,78,0.25)"
                    : "rgba(46,64,49,0.08)",
                  border: `1px solid ${darkMode ? "rgba(74,99,78,0.4)" : "rgba(46,64,49,0.2)"}`,
                  borderRadius: 100,
                  padding: "6px 16px",
                  fontSize: "0.8rem",
                  color: colors.accent1,
                  fontWeight: 500,
                  marginBottom: 28,
                }}
              >
                <i
                  className='fa-solid fa-circle'
                  style={{ fontSize: 6, animation: "pulse 2s infinite" }}
                />
                Now Open · Surabaya, ID
              </div>

              <h1 className='hero-title' style={{ color: colors.textPrimary }}>
                Where Every
                <br />
                <span style={{ color: colors.accent1, fontStyle: "italic" }}>
                  Cup
                </span>{" "}
                Tells
                <br />a Story.
              </h1>

              <p
                className='hero-subtitle'
                style={{
                  fontSize: "1.1rem",
                  color: colors.textSecondary,
                  lineHeight: 1.7,
                  maxWidth: 420,
                  marginTop: 24,
                  marginBottom: 36,
                }}
              >
                Specialty coffee crafted from single-origin beans, roasted
                in-house and brewed with intention. A slow cup in a fast world.
              </p>

              <div
                className='hero-cta'
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <button
                  className='btn-primary'
                  style={{ fontSize: "1rem", padding: "16px 36px" }}
                >
                  <i
                    className='fa-solid fa-book-open'
                    style={{ marginRight: 10 }}
                  />
                  Explore Menu
                </button>
                <button className='btn-outline'>
                  <i
                    className='fa-solid fa-location-dot'
                    style={{ marginRight: 8 }}
                  />
                  Find Us
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 40, marginTop: 52 }}>
                {[
                  { num: "12+", label: "Origins" },
                  { num: "4.9", label: "Rating" },
                  { num: "8K+", label: "Happy Guests" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: colors.accent1,
                      }}
                    >
                      {stat.num}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: colors.textSecondary,
                        letterSpacing: 1,
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero Card */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  background: colors.surface,
                  borderRadius: 24,
                  padding: 32,
                  boxShadow: colors.cardShadow,
                  maxWidth: 320,
                  width: "100%",
                  border: `1px solid ${colors.border}`,
                  animation: "fadeIn 1s 0.5s ease both",
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                {/* Featured drink */}
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background: darkMode
                        ? "rgba(74,99,78,0.2)"
                        : "rgba(46,64,49,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}
                  >
                    <i
                      className='fa-solid fa-mug-hot float-icon'
                      style={{
                        fontSize: 44,
                        color: colors.accent1,
                        animationDelay: "0.5s",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: colors.textPrimary,
                    }}
                  >
                    Signature Latte
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    Forêt House Special
                  </div>
                </div>

                {/* Details */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 20,
                  }}
                >
                  {[
                    { icon: "fa-fire", label: "Medium Roast" },
                    { icon: "fa-droplet", label: "Oat Milk" },
                    { icon: "fa-star", label: "4.9 / 5" },
                  ].map((d) => (
                    <div key={d.label} style={{ textAlign: "center" }}>
                      <i
                        className={`fa-solid ${d.icon}`}
                        style={{
                          color: colors.accent2,
                          fontSize: 18,
                          display: "block",
                          marginBottom: 4,
                        }}
                      />
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: colors.textSecondary,
                        }}
                      >
                        {d.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: 20,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: colors.textPrimary,
                    }}
                  >
                    Rp 42.000
                  </div>
                  <button
                    className='btn-primary'
                    style={{ padding: "10px 20px", fontSize: "0.85rem" }}
                  >
                    <i
                      className='fa-solid fa-plus'
                      style={{ marginRight: 6 }}
                    />
                    Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES STRIP ===== */}
      <section
        style={{
          background: colors.accent1,
          padding: "28px 5%",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            className='features-grid'
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
              textAlign: "center",
            }}
          >
            {[
              {
                icon: "fa-seedling",
                title: "Single Origin",
                desc: "Direct from farm",
              },
              {
                icon: "fa-fire",
                title: "In-House Roasted",
                desc: "Fresh every batch",
              },
              { icon: "fa-wifi", title: "Free WiFi", desc: "Fast & reliable" },
              { icon: "fa-clock", title: "Open Daily", desc: "7 AM – 10 PM" },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  justifyContent: "center",
                }}
              >
                <i
                  className={`fa-solid ${f.icon}`}
                  style={{ color: "rgba(255,255,255,0.8)", fontSize: 20 }}
                />
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.65)",
                      fontSize: "0.75rem",
                    }}
                  >
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MENU ===== */}
      <section id='menu' style={{ padding: "100px 5%", background: colors.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className='section-label'>Our Offerings</div>
            <div
              className='divider-line'
              style={{ margin: "16px auto 24px" }}
            />
            <h2 className='section-title'>Crafted with Care</h2>
            <p
              style={{
                color: colors.textSecondary,
                marginTop: 12,
                maxWidth: 480,
                margin: "12px auto 0",
              }}
            >
              Every item on our menu is a labor of love — from sourcing the
              beans to the final pour.
            </p>
          </div>

          <div
            className='menu-grid'
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {menuItems.map((item, i) => (
              <div
                key={item.name}
                className='card-hover'
                style={{
                  background: colors.surface,
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: colors.cardShadow,
                  border: `1px solid ${colors.border}`,
                  animation: `fadeUp 0.6s ${i * 0.1}s ease both`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      background: darkMode
                        ? "rgba(74,99,78,0.2)"
                        : "rgba(46,64,49,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className={`fa-solid ${item.icon}`}
                      style={{ fontSize: 22, color: colors.accent1 }}
                    />
                  </div>
                  <span
                    style={{
                      background: tagColors[item.tag]?.bg || colors.accent1,
                      color: tagColors[item.tag]?.text || "#fff",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      padding: "4px 10px",
                      borderRadius: 100,
                    }}
                  >
                    {item.tag}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  {item.name}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: colors.textSecondary,
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  {item.desc}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: colors.accent1,
                    }}
                  >
                    {item.price}
                  </span>
                  <button
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: colors.accent1,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <i
                      className='fa-solid fa-plus'
                      style={{ color: "#fff", fontSize: 14 }}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button className='btn-outline'>
              <i className='fa-solid fa-book-open' style={{ marginRight: 8 }} />
              View Full Menu
            </button>
          </div>
        </div>
      </section>

      {/* ===== ABOUT / EXPERIENCE ===== */}
      <section
        id='about'
        style={{
          padding: "100px 5%",
          background: darkMode
            ? `linear-gradient(135deg, #1a1a1b 0%, #121212 100%)`
            : `linear-gradient(135deg, #ede5d8 0%, #F8F4EF 100%)`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            gap: 80,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Left visual */}
          <div style={{ flex: "0 0 45%", minWidth: 280 }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  background: colors.surface,
                  borderRadius: 24,
                  padding: 48,
                  boxShadow: colors.cardShadow,
                  border: `1px solid ${colors.border}`,
                  textAlign: "center",
                }}
              >
                <i
                  className='fa-solid fa-mug-saucer'
                  style={{
                    fontSize: 120,
                    color: colors.accent1,
                    opacity: 0.85,
                  }}
                />
                <div
                  style={{
                    marginTop: 24,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.1rem",
                    fontStyle: "italic",
                    color: colors.textSecondary,
                  }}
                >
                  "A cup of coffee shared with a friend is happiness tasted and
                  time well spent."
                </div>
              </div>
              {/* Floating stat */}
              <div
                style={{
                  position: "absolute",
                  bottom: -20,
                  right: -20,
                  background: colors.accent1,
                  borderRadius: 16,
                  padding: "16px 24px",
                  boxShadow: colors.cardShadow,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  2019
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Est. Surabaya
                </div>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className='section-label'>Our Story</div>
            <div className='divider-line' />
            <h2 className='section-title' style={{ marginBottom: 20 }}>
              More Than Coffee.
              <br />
              It's a Ritual.
            </h2>
            <p
              style={{
                color: colors.textSecondary,
                lineHeight: 1.8,
                marginBottom: 24,
              }}
            >
              Forêt was born from a simple belief: that great coffee has the
              power to slow the world down. We source our beans directly from
              smallholder farms in Aceh, Flores, and Toraja — building
              relationships that go beyond trade.
            </p>
            <p
              style={{
                color: colors.textSecondary,
                lineHeight: 1.8,
                marginBottom: 36,
              }}
            >
              Our roasters work in small batches to highlight each origin's
              unique character. Every cup you sip has a story behind it — a
              mountain, a farmer, a process, a season.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
            >
              {[
                {
                  icon: "fa-mountain",
                  title: "Farm Direct",
                  desc: "We visit each origin personally",
                },
                {
                  icon: "fa-fire",
                  title: "Small Batch",
                  desc: "Roasted fresh weekly",
                },
                {
                  icon: "fa-recycle",
                  title: "Sustainable",
                  desc: "Zero-waste packaging",
                },
                {
                  icon: "fa-heart",
                  title: "Community",
                  desc: "Free coffee for volunteers",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    background: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: darkMode
                        ? "rgba(74,99,78,0.2)"
                        : "rgba(46,64,49,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i
                      className={`fa-solid ${f.icon}`}
                      style={{ color: colors.accent1, fontSize: 16 }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: colors.textPrimary,
                        fontSize: "0.9rem",
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        color: colors.textSecondary,
                        fontSize: "0.78rem",
                        marginTop: 2,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== EXPERIENCE / GALLERY ===== */}
      <section
        id='experience'
        style={{ padding: "100px 5%", background: colors.bg }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className='section-label'>The Forêt Life</div>
            <div
              className='divider-line'
              style={{ margin: "16px auto 24px" }}
            />
            <h2 className='section-title'>
              An Experience,
              <br />
              Not Just a Drink
            </h2>
          </div>

          {/* Bento-style layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gridTemplateRows: "auto auto",
              gap: 20,
            }}
          >
            {[
              {
                icon: "fa-music",
                title: "Live Jazz Evenings",
                desc: "Every Friday & Saturday, 7–10 PM. Local artists, great sets.",
                span: "1 / 3",
                bg: darkMode ? "#1f2e22" : "#dde8df",
                tall: true,
              },
              {
                icon: "fa-graduation-cap",
                title: "Brewing Workshops",
                desc: "Monthly hands-on sessions — V60, Chemex, Aeropress.",
                bg: darkMode ? "#2a2219" : "#f0e6d6",
              },
              {
                icon: "fa-laptop",
                title: "Co-Work Space",
                desc: "Dedicated quiet zone, monitors on request.",
                bg: darkMode ? "#1a1d26" : "#e8eaf2",
              },
              {
                icon: "fa-box",
                title: "Subscription Boxes",
                desc: "Monthly origin box — curated and delivered.",
                bg: darkMode ? "#1a1d26" : "#e8eaf2",
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className='card-hover'
                style={{
                  background: card.bg,
                  borderRadius: 20,
                  padding: 32,
                  border: `1px solid ${colors.border}`,
                  gridColumn: card.span,
                  minHeight: card.tall ? 180 : 160,
                }}
              >
                <i
                  className={`fa-solid ${card.icon}`}
                  style={{
                    fontSize: 28,
                    color: colors.accent1,
                    marginBottom: 16,
                    display: "block",
                  }}
                />
                <h3
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: colors.textSecondary,
                    lineHeight: 1.65,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section
        style={{
          padding: "100px 5%",
          background: darkMode ? "#0e0e0e" : "#EDE5D8",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className='section-label'>Guest Reviews</div>
            <div
              className='divider-line'
              style={{ margin: "16px auto 24px" }}
            />
            <h2 className='section-title'>Loved by Our Community</h2>
          </div>

          <div
            className='testi-grid'
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}
          >
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                style={{
                  background: colors.surface,
                  borderRadius: 16,
                  padding: 28,
                  border: `1px solid ${colors.border}`,
                  boxShadow: colors.cardShadow,
                  animation: `fadeUp 0.6s ${i * 0.15}s ease both`,
                  opacity: 0,
                  animationFillMode: "forwards",
                }}
              >
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {[...Array(5)].map((_, si) => (
                    <i
                      key={si}
                      className='fa-solid fa-star'
                      style={{
                        fontSize: 14,
                        color: si < t.stars ? "#d4a017" : colors.border,
                      }}
                    />
                  ))}
                </div>
                <p
                  style={{
                    color: colors.textSecondary,
                    lineHeight: 1.7,
                    fontSize: "0.95rem",
                    fontStyle: "italic",
                    marginBottom: 20,
                  }}
                >
                  "{t.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: colors.accent1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: colors.textPrimary,
                        fontSize: "0.9rem",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: colors.textSecondary,
                      }}
                    >
                      Regular Guest
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section
        style={{
          padding: "80px 5%",
          background: colors.accent1,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -40,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
          }}
        />
        <div style={{ position: "relative", zIndex: 2 }}>
          <i
            className='fa-solid fa-mug-hot'
            style={{
              fontSize: 36,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 16,
              display: "block",
            }}
          />
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 700,
              color: "#fff",
              marginBottom: 16,
            }}
          >
            Your First Cup Is On Us
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              marginBottom: 32,
              maxWidth: 480,
              margin: "0 auto 32px",
            }}
          >
            Join the Forêt loyalty program and receive a complimentary drink on
            your first visit.
          </p>
          <button
            style={{
              background: "#fff",
              color: colors.accent1,
              border: "none",
              padding: "16px 40px",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: 4,
              cursor: "pointer",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.04)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <i className='fa-solid fa-gift' style={{ marginRight: 10 }} />
            Claim Your Free Drink
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer
        id='contact'
        style={{
          background: darkMode ? "#0a0a0a" : "#1A1A1B",
          padding: "64px 5% 32px",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            className='footer-grid'
            style={{
              display: "flex",
              gap: 60,
              marginBottom: 48,
              flexWrap: "wrap",
            }}
          >
            {/* Brand */}
            <div style={{ flex: "0 0 280px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: colors.accent1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className='fa-solid fa-mug-hot'
                    style={{ color: "#fff", fontSize: 16 }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  Forêt
                </span>
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.7,
                  fontSize: "0.9rem",
                  marginBottom: 24,
                }}
              >
                Specialty coffee roasters and café in the heart of Surabaya.
                Open daily, 7 AM – 10 PM.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { icon: "fa-brands fa-instagram", href: "#" },
                  { icon: "fa-brands fa-tiktok", href: "#" },
                  { icon: "fa-brands fa-whatsapp", href: "#" },
                ].map((s) => (
                  <a
                    key={s.icon}
                    href={s.href}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.6)",
                      textDecoration: "none",
                      transition: "background 0.2s, color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.accent1;
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }}
                  >
                    <i className={s.icon} />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.75rem",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Explore
              </div>
              {[
                "Our Menu",
                "About Us",
                "Workshops",
                "Subscription",
                "Blog",
              ].map((l) => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <a
                    href='#'
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
                    }
                  >
                    {l}
                  </a>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.75rem",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                Contact
              </div>
              {[
                { icon: "fa-location-dot", text: "Jl. Darmo Permai, Surabaya" },
                { icon: "fa-phone", text: "+62 31 1234 5678" },
                { icon: "fa-envelope", text: "hello@foret.coffee" },
                { icon: "fa-clock", text: "7 AM – 10 PM Daily" },
              ].map((c) => (
                <div
                  key={c.text}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <i
                    className={`fa-solid ${c.icon}`}
                    style={{
                      color: colors.accent2,
                      fontSize: 14,
                      marginTop: 3,
                    }}
                  />
                  <span
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {c.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span
              style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}
            >
              © 2025 Forêt Coffee. All rights reserved.
            </span>
            <div style={{ display: "flex", gap: 24 }}>
              {["Privacy", "Terms", "Cookies"].map((l) => (
                <a
                  key={l}
                  href='#'
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "0.8rem",
                    textDecoration: "none",
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
