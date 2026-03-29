import styles from "@/styles/Banner.module.css";

export default function Banner({ text }: { text: string }) {
  const words = text.split(" ");
  const lastWord = words.pop() ?? "";
  const leading = words.join(" ");

  return (
    <section className={styles.banner}>
      <div className={styles.pattern} aria-hidden />
      <div className={styles.body}>
        <p>
          {leading} <span className={styles.highlight}>{lastWord}</span>
        </p>
      </div>
      <div className={styles.pattern} aria-hidden />
    </section>
  );
}
