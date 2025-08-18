import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Signup.module.css";

import logo from "../assets/logo1.png";
import laptop from "../assets/Laptop.png"; // small brand visual (optional)

const API_BASE = process.env.REACT_APP_API_BASE || ""; // e.g. http://localhost:5000

export default function Signup() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [menuOpen]);

  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleContinue = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.email) return setErr("Please enter your email.");
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/email-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create account.");
      // redirect to your app/dashboard or back to home
      window.location.href = "/";
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const google = () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  };
  const apple = () => {
    window.location.href = `${API_BASE}/api/auth/apple`;
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <img className={styles.logo} src={logo} alt="Recallable" />
          </div>

          <nav className={styles.nav}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <Link to="/login" className={styles.login}>Log in</Link>
            <Link to="/signup" className={styles.cta}>Get Started</Link>
          </nav>

          <button
            className={styles.menuBtn}
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* MOBILE SIDE MENU */}
      <aside
        className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className={styles.mobileBar}>
          <button
            className={styles.closeBtn}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className={styles.mobileNav}>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#blog" onClick={() => setMenuOpen(false)}>Blog</a>
          <a href="#docs" onClick={() => setMenuOpen(false)}>Docs</a>
          <a href="#careers" onClick={() => setMenuOpen(false)}>Careers</a>
        </nav>

        <div className={styles.mobileActions}>
          <Link to="/login" className={styles.mobileGhost} onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
          <Link to="/signup" className={styles.mobilePrimary} onClick={() => setMenuOpen(false)}>
            Get Started
          </Link>
        </div>
      </aside>

      {/* AUTH SECTION */}
      <main className={styles.main}>
        <section className={styles.authWrap}>
          <div className={styles.logoTop}>
            <img src={logo} alt="" />
          </div>
          <h1 className={styles.title}>Sign up</h1>

          <form className={styles.card} onSubmit={handleContinue}>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label>First name</label>
                <input
                  name="firstName"
                  placeholder="Your first name"
                  value={form.firstName}
                  onChange={onChange}
                />
              </div>
              <div className={styles.field}>
                <label>Last name</label>
                <input
                  name="lastName"
                  placeholder="Your last name"
                  value={form.lastName}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="Your email address"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>

            {err && <div className={styles.error}>{err}</div>}

            <button className={styles.primary} disabled={loading}>
              {loading ? "Please wait…" : "Continue"}
            </button>

            <div className={styles.hr}>
              <span>OR</span>
            </div>

            <button className={styles.social} type="button" onClick={google}>
              <span className={styles.iconGoogle} aria-hidden="true" />
              Continue with Google
            </button>

            <button className={styles.social} type="button" onClick={apple}>
              <span className={styles.iconApple} aria-hidden="true"></span>
              Continue with Apple
            </button>

            <p className={styles.meta}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>

          {/* Optional brand image */}
          <img src={laptop} className={styles.heroImage} alt="" />
        </section>
      </main>
    </div>
  );
}
