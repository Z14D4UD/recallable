// client/src/components/Header.js
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Home.module.css";      // <— use the SAME CSS as Home
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
        <div className={styles.brand}>
          <img className={styles.logo} src={logo} alt="Recallable" />
        </div>

        {/* Desktop nav — identical to Home */}
        <nav className={styles.nav}>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
          <Link to="/login" className={styles.login}>Log in</Link>
          <Link to="/signup" className={styles.cta}>Sign Up</Link>
        </nav>

        {/* Mobile hamburger — identical to Home */}
        <button
          className={styles.menuBtn}
          aria-label="Open menu"
          aria-controls="mobile-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span />
          <svg
            className={styles.menuIcon}
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile side menu — identical to Home */}
      <aside
        id="mobile-menu"
        className={`${styles.mobileMenu} ${menuOpen ? styles.open : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className={styles.mobileBar}>
          <div className={styles.brandMobile}>
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
            Sign Up
          </Link>
        </div>
      </aside>
    </header>
  );
}
