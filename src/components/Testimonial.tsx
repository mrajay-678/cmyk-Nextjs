import styles from "@/styles/Testimonial.module.css";

export default function Testimonial() {
  return (
    <section className={styles.section} id="support">
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.lead}>
            “Ordered 100 shirts for our company retreat and they turned out
            perfect. Super easy process and the quality is legit.”
          </p>
          <div className={styles.person}>
            <div className={styles.avatar} aria-hidden>
              SM
            </div>
            <div>
              <p className={styles.name}>Sarah Morgan</p>
              <p className={styles.role}>Event producer</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
