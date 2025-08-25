import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Header.module.css";
import logo from "../assets/logo1.png";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        {/* DESKTOP: brand now links home */}
        <Link
          to="/"
          className={styles.brand}
          aria-label="Go to Recallable home"
        >
          <img className={styles.logo} src={logo} alt="Recallable" />
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <Link to="/login" className={styles.login}>Log in</Link>
          <Link to="/signup" className={styles.cta}>Sign Up</Link>
        </nav>

        <button
          className={styles.menuBtn}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* MOBILE DRAWER */}
      <aside
        className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className={styles.mobileBar}>
          {/* MOBILE: brand links home & closes drawer */}
          <Link
            to="/"
            className={styles.brandMobile}
            onClick={() => setMenuOpen(false)}
            aria-label="Go to Recallable home"
          >
            <img className={styles.logoMobile} src={logo} alt="Recallable" />
          </Link>

          <button
            className={styles.closeBtn}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className={styles.mobileNav} aria-label="Mobile">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#about"   onClick={() => setMenuOpen(false)}>About</a>
          <a href="#blog"    onClick={() => setMenuOpen(false)}>Blog</a>
          <a href="#docs"    onClick={() => setMenuOpen(false)}>Docs</a>
          <a href="#careers" onClick={() => setMenuOpen(false)}>Careers</a>
        </nav>

        <div className={styles.mobileActions}>
          <Link to="/login"  className={styles.mobileGhost}   onClick={() => setMenuOpen(false)}>Sign in</Link>
          <Link to="/signup" className={styles.mobilePrimary} onClick={() => setMenuOpen(false)}>Sign Up</Link>
        </div>
      </aside>
    </header>
  );
}
