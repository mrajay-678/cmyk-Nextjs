import { Shirt, Printer, Settings } from "lucide-react";

export default function WhatWeOffer() {
  const items = [
    {
      icon: "https://cmykprint.shop/wp-content/uploads/2025/11/Vector-3.png.webp",
      title: "DTF Transfers",
      desc: "Perfect for events, businesses and DIY lovers. We print the film and you press it onto the apparel yourself.",
    },
    {
      icon: "https://cmykprint.shop/wp-content/uploads/2025/11/image-8.png.webp",
      title: "UV DTF Stickers",
      desc: "Great for tumblers, phone cases and accessories. These are peel-and-stick transfers for solid surfaces.",
    },
    {
      icon: "https://cmykprint.shop/wp-content/uploads/2025/11/Vector-4.png.webp",
      title: "Custom Products",
      desc: "For anyone who wants the finished product. Pick your product, upload your design, we’ll print and ship it.",
    },
  ];

  return (
    <section className="bg-gray-50 px-6 py-16 text-center md:pt-28">
      <div className="mb-6">
        <h2 className="inline-block px-4 py-1 text-4xl font-regular font-heading leading-tight text-body-color sm:text-5xl md:text-6xl">
          What we offer
        </h2>
      </div>

      <p className="mx-auto mb-12 max-w-2/4 text-base leading-7 text-[#282828] sm:text-2xl md:text-2xl">
        Be it team uniforms, corporate gifts or trade show giveaways, there are
        three ways to get what you need.
      </p>

      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[#4f61f3] text-white sm:h-36 sm:w-36 md:h-52 md:w-52">
              <img
                src={item.icon}
                alt={item.title}
                className="h-20 w-20 object-contain hover:scale-110 transition-all duration-500"
              />
            </div>

            <h3 className="text-2xl font-regular font-heading mb-3">
              {item.title}
            </h3>

            <p className="mb-6 text-base leading-7 text-[#282828] sm:text-xl">
              {item.desc}
            </p>

            <button className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full transition">
              Start Creating
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
