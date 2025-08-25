import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Home.module.css";

import logo from "../assets/logo1.png";
import laptop from "../assets/Laptop.png";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [idea, setIdea] = useState("");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [menuOpen]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <img className={styles.logo} src={logo} alt="Hatchable" />
          </div>

          {/* Desktop nav */}
          <nav className={styles.nav}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <Link to="/login" className={styles.login}>Sign in</Link>
            <Link to="/signup" className={styles.cta}>Get Started</Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            className={styles.menuBtn}
            aria-label="Open menu"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <svg
              className={styles.menuIcon}
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <aside
        id="mobile-menu"
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
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
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

      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
  <div className={styles.heroInnerCentered}>
    <h1>
      Launch Your Business<br />in Minutes 🚀
    </h1>
    <p className={styles.heroSub}>
      From logos to legal docs — Hatchable generates everything you need to start fast.
    </p>

    {/* Prompt Bar */}
    <div className={styles.promptWrap}>
      <div className={styles.tagRow}>
        <button className={styles.smallAdd} aria-label="Add attachment">＋</button>
        <span className={styles.pill}>Public</span>
      </div>
      <input
        className={styles.promptInput}
        placeholder="Describe what you need to launch…"
        aria-label="Describe what you need to launch"
      />
      <button className={styles.promptGo} aria-label="Generate">
        <span>↗</span>
      </button>
    </div>

    <div className={styles.heroActions}>
      <Link to="/signup" className={styles.primaryLight}>Try Hatchable Free</Link>
      <label className={styles.uploadWrap}>
        <input type="file" accept=".pdf,.doc,.docx,.txt,.md" />
        <span className={styles.uploadBtn}>Upload brief</span>
      </label>
    </div>
  </div>
</section>


        {/* Everything in one place */}
        <section className={styles.blocks} id="features">
          <h2>Everything in One Place</h2>
          <div className={styles.blockGrid}>
            <div className={styles.block}>
              <h3>Logo & Branding</h3>
              <p>AI logos, palettes, typography kits.</p>
            </div>
            <div className={styles.block}>
              <h3>Legal Documents</h3>
              <p>Instant NDAs, contracts, registration docs.</p>
            </div>
            <div className={styles.block}>
              <h3>Pitch Decks</h3>
              <p>Investor‑ready decks to deploy.</p>
            </div>
            <div className={styles.block}>
              <h3>Websites</h3>
              <p>Landing pages and copy, exportable.</p>
            </div>
            <div className={styles.block}>
              <h3>Marketing</h3>
              <p>Ads, posts, emails — auto‑generated.</p>
            </div>
            <div className={styles.block}>
              <h3>Automation</h3>
              <p>Smart AI tools to streamline ops.</p>
            </div>
          </div>
        </section>

        {/* Secondary callout */}
        <section className={styles.callout} id="pricing">
          <div className={styles.calloutInner}>
            <h2>Your Business, Ready Today</h2>
            <p>Start free. Upgrade when you need more output, file types, and automations.</p>
            <div className={styles.calloutActions}>
              <Link to="/signup" className={styles.primary}>Create my stack</Link>
              <Link to="/pricing" className={styles.ghost}>See pricing</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
