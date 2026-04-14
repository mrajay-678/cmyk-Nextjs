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
      
      {/* Marquee */}
      <div className=" py-6 overflow-hidden">
        <divs
          className="flex whitespace-nowrap w-screen marquee-animation py-10"
        >
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <div
              key={i}
              className="text-5xl md:text-7xl font-semibold mx-10 flex items-center gap-6"
            >
              <span>{item}</span>

              {/* Logo Circle */}
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black text-sm font-bold">
                CMYK
              </div>
            </div>
          ))}
        </divs>
      </div>

      {/* Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 flex gap-10">
        
        {/* Left */}
        <div className="w-6/12">
          <h2 className="text-5xl font-semibold mb-4">
            Print that makes good impressions.
          </h2>

          <div className="flex gap-6 mt-6 opacity-70 text-sm">
            <span>ISO Certified</span>
            <span>SAGE Member</span>
          </div>
        </div>

        {/* Address */}
        <div className="w-3/12">
          <h3 className="text-sm uppercase opacity-60 mb-3">Address</h3>
          <p className="text-sm leading-6 opacity-80">
            9611 Canoga Ave,<br />
            Chatsworth,<br />
            CA 91311
          </p>
        </div>

        {/* Contact */}
        <div className="w-3/12">
          <h3 className="text-sm uppercase opacity-60 mb-3">Say Hello</h3>
          <p className="text-sm opacity-80">
            hello@cmykprint.shop <br />
            +1 (818) 342-7822
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 py-4 px-6 flex flex-col md:flex-row justify-between text-sm opacity-70">
        <div>Privacy Policy | Terms of Service</div>
        <div>© 2025 CMYK Print Shop. All rights reserved</div>
      </div>

    </footer>
  );
}