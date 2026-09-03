"use client";

import { useEffect, useState } from "react";

const words = ["occasions.", "impact.", "life."];

export default function TypeWriter({ appendClass }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          const nextText = currentWord.slice(0, text.length + 1);
          setText(nextText);

          if (nextText === currentWord) {
            setTimeout(() => {
              setIsDeleting(true);
            }, 1400);
          }
        } else {
          const nextText = currentWord.slice(0, text.length - 1);
          setText(nextText);

          if (nextText === "") {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? 60 : 100,
    );

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex]);

  let className = "flex flex-col gap-4";

  if (appendClass) {
    className += ` ${appendClass}`;
  }

  return (
    <section className={`max-w-screen overflow-hidden ${className}`}>
      <div className="h-8 max-w-screen bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')]" />

      <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Group-13-scaled.png.webp')] bg-center px-6 py-20 sm:py-32 md:py-40">
        <div className="font-heading mx-auto flex max-w-5xl flex-col items-center justify-center gap-3 text-center text-4xl sm:flex-row sm:gap-6 sm:text-5xl md:text-6xl">
          <span className="font-heading font-bold text-white">
            Made for real
          </span>

          <div className="min-h-[1.1em] font-heading">
            <span className="font-heading font-bold text-[#F6C520]">
              {text}
            </span>

            <span className="ml-[2px] inline-block animate-pulse font-bold text-[#F6C520]">
              |
            </span>
          </div>
        </div>
      </div>

      <div className="h-8 max-w-screen bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')]" />
    </section>
  );
}
