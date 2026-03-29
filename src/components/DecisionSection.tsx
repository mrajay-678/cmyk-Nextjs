import Link from "next/link";
import styles from "@/styles/DecisionSection.module.css";

export type DecisionStep = {
  title: string;
  body: string;
  tag?: string;
};

export default function DecisionSection({ steps }: { steps: DecisionStep[] }) {
  return (
    <section className={styles.section} id="dtf-transfers">
      <div className={styles.container}>
        <div className={styles.copy}>
          <h2>Not sure which service you need?</h2>
          <p>Think of it this way:</p>
          <Link href="#offers" className={styles.cta}>
            Made for every project
          </Link>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <div className={styles.index}>{index + 1}</div>
              <div className={styles.stepBody}>
                <div className={styles.stepHeader}>
                  <h3>{step.title}</h3>
                  {step.tag ? (
                    <span className={styles.pill}>{step.tag}</span>
                  ) : null}
                </div>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
