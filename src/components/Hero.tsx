"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "@/styles/Hero.module.css";

type Slide = {
  id: number;
  kicker: string;
  title: string;
  subtitle: string;
  imageLeft: string;
  imageRight: string;
};

const slides: Slide[] = [
  {
    id: 1,
    kicker: "DTF & Personalization Nerds",
    title: "Your Design. Our Printers. Zero Hassle.",
    subtitle:
      "Production-ready DTF transfers, UV DTF stickers, and custom merch for teams, creators, and brands.",
    imageLeft: "/assets/image/shirt-banner.png",
    imageRight: "/assets/image/mug.png",
  },
];

const AUTOPLAY_MS = 15500;

export default function Hero() {
  const [active, setActive] = useState(0);

  const next = () => setActive((i) => (i + 1) % slides.length);
  const prev = () => setActive((i) => (i - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  const activeSlide = useMemo(() => slides[active], [active]);

  return (
    <section className={styles.hero} id="start">
      <div className={styles.patternTop} aria-hidden />
      <div className={styles.slider}>
        <div className={styles.track}>
          {slides.map((slide, idx) => (
            <article
              key={slide.id}
              className={`${styles.slide} ${idx === active ? styles.isActive : ""}`}
              aria-hidden={idx !== active}
            >
              <div className={styles.grid}>
                <div className={styles.leftImage}>
                  <Image
                    src={slide.imageLeft}
                    alt="Printed t-shirt"
                    width={1020}
                    height={700}
                    priority={idx === 0}
                    sizes="(min-width: 768px) 100%, 100%"
                  />
                </div>
                <div className={styles.content}>
                  <p className={styles.kicker}>{slide.kicker}</p>
                  <h1 className={styles.title}>{slide.title}</h1>
                  <p className={styles.subtitle}>{slide.subtitle}</p>
                  <Link className={styles.cta} href="#offers">
                    Start Creating
                  </Link>
                </div>
                <div className={styles.rightImage}>
                  <Image
                    src={slide.imageRight}
                    alt="Custom mug"
                    width={520}
                    height={560}
                    priority={idx === 0}
                    sizes="(min-width: 1200px) 32vw, (min-width: 768px) 44vw, 88vw"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.controls}>
          <button onClick={prev} aria-label="Previous slide" className={styles.arrow}>
            ‹
          </button>
          <div className={styles.dots} role="tablist">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                role="tab"
                aria-selected={idx === active}
                className={`${styles.dot} ${idx === active ? styles.dotActive : ""}`}
                onClick={() => setActive(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          <button onClick={next} aria-label="Next slide" className={styles.arrow}>
            ›
          </button>
        </div>
      </div>
      <div className={styles.patternBottom} aria-hidden />
    </section>
  );
}
