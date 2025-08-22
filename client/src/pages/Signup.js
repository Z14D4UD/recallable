import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import styles from "../styles/Signup.module.css";

const API_BASE = process.env.REACT_APP_API_BASE || "";

export default function Signup() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

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
      window.location.href = "/";
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const google = () => (window.location.href = `${API_BASE}/api/auth/google`);
  const apple  = () => (window.location.href = `${API_BASE}/api/auth/apple`);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <section className={styles.centerWrap}>
          <h1 className={styles.title}>Sign up</h1>

          <form className={styles.card} onSubmit={handleContinue}>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  placeholder="Your first name"
                  value={form.firstName}
                  onChange={onChange}
                  autoComplete="given-name"
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  placeholder="Your last name"
                  value={form.lastName}
                  onChange={onChange}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Your email address"
                value={form.email}
                onChange={onChange}
                autoComplete="email"
                required
              />
            </div>

            {err && <div className={styles.error}>{err}</div>}

            <button className={styles.primary} disabled={loading}>
              {loading ? "Please wait…" : "Continue"}
            </button>

            <div className={styles.hr}><span>OR</span></div>

            <button
              type="button"
              className={`${styles.social} ${styles.google}`}
              onClick={google}
            >
              <span className={styles.icon}>
                {/* Google "G" */}
                <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-7.2 0-13-5.8-13-13S16.8 10 24 10c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.6 4.2 29.6 2 24 2 11.9 2 2 11.9 2 24s9.9 22 22 22c11 0 21-8 21-22 0-1.3-.1-2.7-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.8 16.6 19 14 24 14c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.6 4.2 29.6 2 24 2 16.2 2 9.5 6.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 46c5.1 0 9.7-1.9 13.2-4.9l-6.1-5c-2 1.4-4.6 2.2-7.1 2.2-5.1 0-9.3-3.4-10.8-8.1l-6.6 5.1C9.7 41.6 16.3 46 24 46z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-5.7 8-11.3 8-5 0-9.2-3.4-10.7-8.1l-6.6 5.1C9.5 41.7 16.1 46 24 46c11 0 21-8 21-22 0-1.3-.1-2.7-.4-3.5z"/>
                </svg>
              </span>
              Continue with Google
            </button>

            <button
              type="button"
              className={`${styles.social} ${styles.apple}`}
              onClick={apple}
            >
              <span className={styles.icon}>
                {/* Apple logo */}
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M16.365 1.43c0 1.14-.468 2.214-1.225 3.005-.785.82-2.08 1.45-3.152 1.36-.13-1.155.508-2.37 1.25-3.15.82-.86 2.216-1.47 3.127-1.215zM20.9 17.27c-.358.82-.786 1.586-1.28 2.29-.67.964-1.21 1.63-1.952 2.49-.78.9-1.815 2.04-3.13 2.06-1.19.02-1.5-.78-3.126-.77-1.626.01-1.973.79-3.163.77-1.315-.02-2.32-1.03-3.1-1.93-2.126-2.45-3.757-6.93-2.595-10.23.648-1.86 2.35-3.2 4.24-3.23 1.326-.03 2.58.77 3.128.77.548 0 2.2-.95 3.724-.81.634.03 2.414.25 3.55 1.89-.093.06-2.124 1.25-2.1 3.74.024 2.98 2.598 3.98 2.62 3.99z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              Continue with Apple
            </button>

            <p className={styles.meta}>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
