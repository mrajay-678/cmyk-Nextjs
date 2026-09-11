"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const marqueeItems = [
  "Good Quality",
  "Made in USA",
  "Design Support",
  "Fast Delivery",
];

export default function Footer() {
  return (
    <footer className="bg-[#282828] text-white overflow-hidden">
      <div className="overflow-hidden py-10 md:py-20">
        <div className="flex w-screen whitespace-nowrap py-6 gap-24 md:gap-6 marquee-animation">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div
              key={i}
              className="ms-3 flex items-center gap-4 text-5xl font-medium sm:text-5xl md:ms-28 md:text-8xl"
            >
              <span className="whitespace-nowrap font-heading">{item}</span>

              <Image
                src="https://wp.cmykprint.shop/wp-content/uploads/2025/11/Vector.png.webp"
                alt="CMYK"
                className="object-contain ms-0 md:ms-9"
                width={80}
                height={80}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl px-5 md:px-0 gap-6 md:gap-20 pb-10 md:pb-24 md:grid-cols-[minmax(0,1.4fr)_minmax(160px,0.6fr)_minmax(160px,0.6fr)]">
        <div>
          <p className="mb-4 text-4xl font-light leading-none sm:text-4xl md:text-5xl md:pb-16">
            Print that makes <br /> good impressions.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm md:gap-6">
            <Image
              width={154}
              height={77}
              src="https://wp.cmykprint.shop/wp-content/uploads/2023/11/UnionBug_Final-white.png.webp"
              alt="Union Bug"
              className="object-contain"
            />
            <Image
              src="https://wp.cmykprint.shop/wp-content/uploads/2023/11/Distributor_Member_Grayscale-white.png.webp"
              alt="Sage Member"
              width={154}
              height={77}
              className="object-contain"
            />
          </div>
        </div>

        <div>
          <p className="text-2xl mb-5" style={{ fontWeight: 650 }}>
            Address
          </p>
          <p className="text-lg leading-6">
            <Link className="text-white hover:text-[#f12f88]" href="https://maps.app.goo.gl/eQEr1ExkGPBfyhoM8" target="_blank" rel="noopener noreferrer">
              9611 Canoga Ave,
              <br />
              Chatsworth,
              <br />
              CA 91311
            </Link>
          </p>
        </div>

        <div>
          <h3 className="text-2xl mb-5" style={{ fontWeight: 500 }}>
            Say Hello
          </h3>
          <p className="text-lg">
            <Link className="text-white hover:text-[#f12f88]" href="mailto:hello@cmykprint.shop">hello@cmykprint.shop</Link>{" "}
            <br />
            <Link className="text-white hover:text-[#f12f88]" href="tel:+18183427822">+1 (818) 342-7822</Link>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white px-5 md:px-0 py-4 text-sm md:text-lg md:flex-row md:justify-between max-w-7xl mx-auto">
        <div><Link href="/privacy-policy" className="text-white hover:text-[#f12f88]">Privacy Policy</Link> | <Link href="/terms-of-service" className="text-white hover:text-[#f12f88]">Terms of Service</Link></div>
        <div>© 2025 CMYK Print Shop. All rights reserved</div>
      </div>
    </footer>
  );
}
