import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Home.module.css";

import logo from "../assets/logo1.png";      // your logo
import laptop from "../assets/Laptop.png";   // hero image (right side)

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock document scroll when mobile menu is open
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
            <img className={styles.logo} src={logo} alt="Recallable" />
          </div>

          {/* Desktop nav */}
          <nav className={styles.nav}>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <Link to="/login" className={styles.login}>Log in</Link>
            <Link to="/signup" className={styles.cta}>Sign up</Link>
          </nav>

          {/* Mobile hamburger (added SVG, kept original spans) */}
          <button
            className={styles.menuBtn}
            aria-label="Open menu"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            {/* original bars (kept) */}
            <span />
            <span />
            <span />
            {/* added crisp SVG icon */}
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

      {/* Mobile side menu */}
      <aside
        id="mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className={styles.mobileBar}>
          <div className={styles.brandMobile}>
            {/* keep your big logo inside drawer */}
            <img className={styles.logoMobile} src={logo} alt="Recallable" />
          </div>
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
            Download
          </Link>
        </div>
      </aside>

      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <h1>Learn smarter<br />with AI</h1>
              <p className={styles.heroSub}>
                Transform your notes and docs into smart flashcards for
                optimized, personalized learning.
              </p>

              <div className={styles.heroActions}>
                <Link to="/signup" className={styles.primary}>Get Started</Link>
                <label className={styles.uploadWrap}>
                  <input type="file" accept=".pdf,.doc,.docx,.txt,.md" />
                  <span className={styles.uploadBtn}>Upload a file</span>
                </label>
              </div>

              <div className={styles.trustedWrap}>
                <p className={styles.trustedText}>Trusted by students worldwide</p>
                <div className={styles.logos}>
                  <span>THE VERGE</span>
                  <span>TC <small>tecCrunch</small></span>
                  <span>WIRED</span>
                  <span>Forbes</span>
                </div>
              </div>
            </div>

            {/* Right image (dashboard) */}
            <div className={styles.heroRight} aria-hidden="true">
              <img src={laptop} alt="" className={styles.heroImage} loading="eager" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className={styles.how} id="how">
          <h2>How it works</h2>
          <div className={styles.howGrid}>
            <div className={styles.howItem}>
              <div className={styles.howIcon}><span>⬆</span></div>
              <h3>Upload</h3>
              <p>Add your notes, docs, or articles and let our AI do the rest.</p>
            </div>
            <div className={styles.howItem}>
              <div className={styles.howIcon}><span>⚙</span></div>
              <h3>Generate</h3>
              <p>Turn your content into flashcards in seconds with smart, auto‑generated questions.</p>
            </div>
            <div className={styles.howItem}>
              <div className={styles.howIcon}><span>✔</span></div>
              <h3>Learn</h3>
              <p>Review your flashcards using proven techniques for effective studying.</p>
            </div>
          </div>
        </section>

        {/* AI tutor callout */}
        <section className={styles.tutor}>
          <div className={styles.tutorInner}>
            <div className={styles.tutorText}>
              <h2>Get instant answers<br />from your AI tutor</h2>
              <p>Ask any question to deepen your understanding, get clarifications, and improve retention.</p>
            </div>

            <div className={styles.tutorCard} aria-hidden="true">
              <div className={styles.tutorHeader}>
                <div className={styles.brandDot} /> Get Instant answers?
                <span className={styles.ellipsis}>• • •</span>
              </div>
              <div className={styles.tutorBody}>
                <div className={styles.promptLabel}>What are neural networks?</div>
                <div className={styles.inputRow}>
                  <div className={styles.inputGhost}>Example</div>
                  <button className={styles.exportBtn}>Go • export</button>
                </div>
                <div className={styles.helperText}>Try <em>explain?</em></div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom features */}
        <section className={styles.bottomFeatures} id="features">
          <div className={styles.bottomGrid}>
            <div>
              <h3>Spaced Repetition</h3>
              <p>Add your notes, docs, or articles and let our AI do the rest.</p>
            </div>
            <div>
              <h3>Customizable Cards</h3>
              <p>Turn your content into flashcards in seconds with smart, auto‑generated questions.</p>
            </div>
            <div>
              <h3>Progress Tracking</h3>
              <p>See your streaks, study time, and mastery levels across decks.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
