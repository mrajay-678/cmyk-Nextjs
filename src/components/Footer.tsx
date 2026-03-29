import Link from "next/link";
import styles from "@/styles/Footer.module.css";

const footerLinks = [
  { label: "Print that makes good impressions.", href: "#start" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.ticker} aria-hidden>
        <div className={styles.tickerTrack}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <span key={idx}>USA • Good Quality • Design • </span>
          ))}
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.brand}>
          <p className={styles.headline}>
            Print that makes
            <br />
            good impressions.
          </p>
          <div className={styles.partnerRow}>
            <span>Print Partner</span>
            <span>Supplier Pass Member</span>
            <span>SAGE #61028</span>
          </div>
        </div>
        <div className={styles.columns}>
          <div>
            <p className={styles.columnTitle}>Address</p>
            <p>4800 Carroll Canyon Rd,</p>
            <p>San Diego, CA 92121</p>
          </div>
          <div>
            <p className={styles.columnTitle}>We got you!</p>
            <Link href="mailto:hello@cmyk.co">hello@cmyk.co</Link>
            <Link href="tel:+18009227430">+1 (800) 922-7430</Link>
          </div>
          <div>
            <p className={styles.columnTitle}>Links</p>
            <div className={styles.linkList}>
              {footerLinks.map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <p>© 2026 CMYK Print Studio. All rights reserved.</p>
      </div>
    </footer>
  );
}
