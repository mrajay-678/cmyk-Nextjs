import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/Header.module.css";

const navItems = [
  { label: "Home", href: "#start" },
  { label: "DTF Transfers", href: "#dtf-transfers" },
  { label: "UV DTF Stickers", href: "#offers" },
  { label: "Shop Custom", href: "#shop-custom" },
  { label: "Support", href: "#support" },
];

const Icon = ({ type }: { type: "search" | "cart" }) => {
  if (type === "search") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
        aria-hidden
      >
        <circle
          cx="8.5"
          cy="8.5"
          r="5.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M12 12l3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 6h14l-1.2 7.2a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 4.5H3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="19" r="1.3" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.3" fill="currentColor" />
    </svg>
  );
};

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <nav className={styles.nav} aria-label="Primary">
          {navItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.navLink} ${
                index === 0 ? styles.navLinkActive : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className={styles.logo} aria-label="CMYK Home">
          <Image
            src="/assets/image/cmyk-white-logo.svg"
            alt="CMYK Logo"
            width={120}
            height={40}
            priority
          />
        </Link>
        <div className={styles.actions}>
          <button className={styles.iconButton} aria-label="Cart">
            <Icon type="cart" />
          </button>
          <button className={styles.iconButton} aria-label="Search">
            <Icon type="search" />
          </button>
        </div>
      </div>
      <div className={styles.bottomBorder} aria-hidden />
    </header>
  );
}
