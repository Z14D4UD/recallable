import { Link } from "react-router-dom";
import styles from "../styles/Footer.module.css";
import logo from "../assets/logo1.png";

/* Social icons from react-icons (already in your deps) */
import {
  SiTwitter,
  SiLinkedin,
  SiYoutube,
  SiDiscord,
  SiReddit,
  SiInstagram,
  SiFacebook,
  SiTiktok,
  SiGithub,
} from "react-icons/si";

export default function Footer() {
  const year = new Date().getFullYear();

  const socials = [
    { label: "Twitter / X", href: "https://x.com/hatchable", Icon: SiTwitter },
    { label: "LinkedIn", href: "https://linkedin.com/company/hatchable", Icon: SiLinkedin },
    { label: "YouTube", href: "https://youtube.com/@hatchable", Icon: SiYoutube },
    { label: "Discord", href: "https://discord.gg/hatchable", Icon: SiDiscord },
    { label: "Reddit", href: "https://reddit.com/r/hatchable", Icon: SiReddit },
    { label: "Instagram", href: "https://instagram.com/hatchable", Icon: SiInstagram },
    { label: "Facebook", href: "https://facebook.com/hatchable", Icon: SiFacebook },
    { label: "TikTok", href: "https://tiktok.com/@hatchable", Icon: SiTiktok },
    { label: "GitHub", href: "https://github.com/hatchable", Icon: SiGithub },
  ];

  return (
    <footer className={styles.wrap} role="contentinfo">
      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brandCol}>
          <img src={logo} alt="Hatchable" className={styles.logo} />
          <p className={styles.copy}>© {year} Hatchable. All rights reserved.</p>

          {/* Icon row */}
          <div className={styles.socialRow} aria-label="Hatchable social links">
            {socials.map(({ href, label, Icon }) => (
              <a
                key={label}
                className={styles.socialBtn}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Columns */}
        <nav className={styles.cols} aria-label="Footer">
          <div className={styles.col}>
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className={styles.col}>
            <h4>Product</h4>
            <Link to="/features">Features</Link>
            <Link to="/templates">Templates</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/changelog">Changelog</Link>
          </div>

          <div className={styles.col}>
            <h4>Resources</h4>
            <Link to="/docs">Docs</Link>
            <Link to="/guides">Startup Guides</Link>
            <Link to="/support">Help Center</Link>
            <Link to="/integrations">Integrations</Link>
          </div>

          <div className={styles.col}>
            <h4>Legal</h4>
            <Link to="/legal/privacy">Privacy Policy</Link>
            <Link to="/legal/terms">Terms &amp; Conditions</Link>
            <Link to="/legal/cookies">Cookie Policy</Link>
            <Link to="/legal/dpa">Data Processing Addendum</Link>
          </div>

          <div className={styles.col}>
            <h4>Socials</h4>
            {socials.map(({ href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </footer>
  );
}
