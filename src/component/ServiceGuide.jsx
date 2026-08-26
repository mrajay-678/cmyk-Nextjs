"use client";

import { useEffect } from "react";
import "animate.css";

const services = [
  {
    icon: "https://cmykprint.shop/wp-content/uploads/2020/04/Vector-1.png.webp",
    title: "DTF Transfers",
    description:
      "If you have a heat press and want to apply the transfers to your own apparel, get DTF Transfers.",
  },
  {
    icon: "https://cmykprint.shop/wp-content/uploads/2020/04/Vector-2.png.webp",
    title: "UV DTF Stickers",
    description:
      "If you're decorating hard surfaces like glasses, bottles or phone cases, go with UV DTF Stickers.",
  },
  {
    icon: "https://cmykprint.shop/wp-content/uploads/2020/04/IOE_1.png.webp",
    title: "Custom Products",
    description:
      "If you want us to handle everything and ship the finished products ready to hand out, shop Custom Products.",
  },
];

export default function ServiceGuide() {
  useEffect(() => {
    const elements = document.querySelectorAll(".service-animation");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target;
          const animation = element.dataset.animation || "animate__fadeInUp";

          element.classList.add("animate__animated", animation);

          observer.unobserve(element);
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-white px-6 py-20 md:px-10 lg:px-16 lg:py-28">
      <div className="relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-24">
        {/* Left */}
        <div className="sticky top-40 h-fit max-w-2xl">
          <div className="w-full font-heading text-4xl font-medium leading-tight text-neutral-900 sm:text-5xl lg:text-6xl lg:leading-[0.95]">
            Not sure which service you need?
          </div>

          <p className="mt-5 text-xl text-neutral-800 md:text-3xl md:leading-tight lg:text-4xl">
            Think of it this way:
          </p>
        </div>

        {/* Right */}
        <div className="relative">
          <div className="space-y-2">
            {services.map((service, index) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.title}
                  className="service-animation grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 opacity-0 md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-8"
                  data-animation="animate__fadeInUp"
                  style={{
                    animationDelay: `${index * 0.25}s`,
                  }}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F4F2F7] text-[#EF2987] hover:bg-black transition-colors duration-750">
                      <img src={Icon} alt={service.title} className="h-5 w-5" />
                    </div>

                    {index < services.length - 1 && (
                      <div className="mt-3 h-24 w-px bg-[#F4F2F7] md:h-18" />
                    )}
                  </div>

                  <div className="pt-1">
                    <h3 className="font-heading text-xl font-normal text-body-color md:text-2xl">
                      {service.title}
                    </h3>

                    <p className="mt-3 max-w-xl text-base leading-7 text-[#6D6F72] md:mt-4 md:text-lg md:leading-8">
                      {service.description}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Button */}
            <div
              className="service-animation mt-10 grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 md:grid-cols-[5.5rem_minmax(0,1fr)] md:gap-8"
              data-animation="animate__fadeInUp"
              style={{
                animationDelay: "0.8s",
              }}
            >
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full">
                  <div alt="Still confused? We got you" className="h-5 w-5" />
                </div>
              </div>
              <div className="flex justify-start">
                <button className="rounded-full bg-pink-500 px-7 py-4 text-base text-white transition hover:bg-pink-600 md:px-9 md:text-lg">
                  Still confused? We got you
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
