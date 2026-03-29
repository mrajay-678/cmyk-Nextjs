import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/OfferSection.module.css";

export type OfferItem = {
  title: string;
  description: string;
  icon: string;
};

export default function OfferSection({ items }: { items: OfferItem[] }) {
  return (
    <section className={styles.section} id="offers">
      <div className={styles.container}>
        <h2 className={styles.title}>What we offer</h2>
        <p className={styles.subtitle}>
          Be it team uniforms, corporate gifts or trade show giveaways, there are three ways to get
          what you need.
        </p>
        <div className={styles.cards}>
          {items.map((item) => (
            <article key={item.title} className={styles.card}>
              <div className={styles.circle}>
                <Image
                  src={item.icon}
                  alt={`${item.title} icon`}
                  width={88}
                  height={88}
                  className={styles.iconImg}
                />
              </div>
              <div className={styles.cardBody}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link className={styles.button} href="#start">
                  Start Creating
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
