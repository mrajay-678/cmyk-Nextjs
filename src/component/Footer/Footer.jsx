"use client";

import React from "react";

const marqueeItems = [
  "Good Quality",
  "Made in USA",
  "Design Support",
  "Fast Delivery",
];

export default function Footer() {
  return (
    <footer className="bg-[#1f1f1f] text-white overflow-hidden">
      <div className="overflow-hidden py-4 md:py-6">
        <div className="flex w-screen whitespace-nowrap py-6 marquee-animation md:py-10">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div
              key={i}
              className="mx-5 flex items-center gap-4 text-3xl font-semibold sm:text-5xl md:mx-10 md:gap-6 md:text-7xl"
            >
              <span>{item}</span>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black md:h-10 md:w-10 md:text-sm">
                CMYK
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.6fr)_minmax(160px,0.6fr)] md:py-16">
        <div>
          <h2 className="mb-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Print that makes good impressions.
          </h2>

          <div className="mt-6 flex flex-wrap gap-4 text-sm opacity-70 md:gap-6">
            <span>ISO Certified</span>
            <span>SAGE Member</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm uppercase opacity-60 mb-3">Address</h3>
          <p className="text-sm leading-6 opacity-80">
            9611 Canoga Ave,<br />
            Chatsworth,<br />
            CA 91311
          </p>
        </div>

        <div>
          <h3 className="text-sm uppercase opacity-60 mb-3">Say Hello</h3>
          <p className="text-sm opacity-80">
            hello@cmykprint.shop <br />
            +1 (818) 342-7822
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/10 px-6 py-4 text-sm opacity-70 md:flex-row md:justify-between">
        <div>Privacy Policy | Terms of Service</div>
        <div>© 2025 CMYK Print Shop. All rights reserved</div>
      </div>

    </footer>
  );
}
