"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";

import { testimonials } from "@/data/testimonials";

export default function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeTestimonial = testimonials[activeIndex];

  const handlePrevious = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1,
    );
  };

  const handleNext = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1,
    );
  };

  return (
    <section className="relative px-6 overflow-hidden text-white py-18 md:px-10 md:py-22 lg:px-16 lg:py-28">
      <div className="absolute inset-0">
        <Image
          src="/assets/image/testimonial-bg.png"
          alt=""
          fill
          className="object-cover w-full h-full"
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <h2 className="text-center text-3xl font-regural tracking-[-0.03em] text-white md:text-4xl lg:text-5xl">
          Don&apos;t just take our word for it.
        </h2>

        <div className="mt-10 rounded-[2rem] bg-white px-5 py-8 text-center text-neutral-900 shadow-[0_24px_80px_rgba(11,22,74,0.22)] md:mt-14 md:px-10 md:py-12 lg:px-8 lg:py-10">
          <div className="grid items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-6">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={handlePrevious}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-neutral-800 transition hover:-translate-x-0.5 hover:border-neutral-300 hover:bg-neutral-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="max-w-3xl mx-auto">
              <div className=" md:block h-28"></div>
              <p className="text-xl leading-9 tracking-[-0.02em] text-neutral-900 md:text-xl md:leading-10 lg:text-2xl lg:leading-12">
                &ldquo;{activeTestimonial.quote}&rdquo;
              </p>

              <div className="flex justify-center mt-8 text-pink-500">
                <Quote className="w-8 h-8 fill-current" strokeWidth={1.8} />
              </div>

              <div className="mt-4">
                <p className="text-lg font-semibold text-neutral-900">
                  {activeTestimonial.name}
                </p>
                <p className="mt-1 text-base text-neutral-500">
                  {activeTestimonial.location}
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Next testimonial"
              onClick={handleNext}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-neutral-800 transition hover:translate-x-0.5 hover:border-neutral-300 hover:bg-neutral-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial.id}
                type="button"
                aria-label={`Show testimonial ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition ${index === activeIndex ? "w-7 bg-neutral-950" : "w-2.5 bg-neutral-300 hover:bg-neutral-400"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
