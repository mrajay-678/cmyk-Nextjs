import React from "react";

const dtfTransferSection = {
  heading: "Quick guide",
  steps: [
    "Pre-press your garment for 5 seconds on the application side to eliminate moisture and wrinkles.",
    "Position your DTF Transfer on the desired location and cover completely with a teflon sheet or parchment paper.",
    "Apply medium pressure for 10 seconds.",
    "Remove the backing film immediately (hot peel).",
    "Place teflon/parchment paper over the transferred design and press again for 5-6 seconds to seal.",
  ],
  button: {
    text: "Shop DTF Transfers",
    link: "#",
  },
  video: {
    src: "https://cmykprint.shop/wp-content/uploads/2025/12/place-it.mp4",
    alt: "Applying DTF transfer on garment",
  },
};
const careTipsSection = {
  heading: "Care tips",
  steps: [
    "Turn garment inside out before washing. Wash in cold water only.",
    "Use mild detergent without bleach, whiteners, brighteners, OxiClean, or fabric softeners.",
    "Tumble dry on low heat setting or hang to air dry.",
    "Avoid ironing directly over the printed design.",
  ],
  supportText: "Need help? Contact our team for assistance.",
  button: {
    text: "Contact Us",
    link: "#",
  },
  video: {
    src: "https://cmykprint.shop/wp-content/uploads/2025/12/press-it.mp4",
    alt: "DTF garment care process",
  },
};

const heatPressGuideSection = {
  heading: "Heat Press Temperature Guide",
  steps: [
    "240°F (115°C) for 100% polyester fabrics.",
    "260°F (125°C) for poly/cotton blends.",
    "280°F (140°C) for 100% cotton and similar materials.",
  ],
  supportText:
    "*Note: Optimal temperatures may vary between heat press models.",
  button: {
    text: "Build a Gang Sheet",
    link: "#",
  },
  video: {
    src: "https://cmykprint.shop/wp-content/uploads/2025/12/peel-it.mp4",
    alt: "Heat press temperature guide",
  },
};

export const page = () => {
  return (
    <div>
      <section className="overflow-hidden max-w-screen">
        <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')] max-w-screen h-4"></div>
        <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Group-13-scaled.png.webp')] bg-center px-6 py-24 sm:py-32 md:py-24">
          <div className="mx-auto flex justify-center gap-6 text-center text-4xl sm:text-5xl md:text-7xl">
            <span className="font-bold font-heading text-white">
              Pressing Instructions
            </span>
          </div>
        </div>
        <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')] max-w-screen h-4"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 items-center gap-10 pb-20 pt-40 lg:grid-cols-2">
          {/* Left Content */}
          <div>
            <p className="mb-4 text-xl text-black md:text-lg">
              DTF Transfers: Application is easy!
            </p>

            <h2 className="mb-8 text-3xl md:text-4xl">
              {dtfTransferSection.heading}
            </h2>

            <div className="space-y-6">
              {dtfTransferSection.steps.map((step, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <p className="text-base leading-tight md:text-lg">{step}</p>
                </div>
              ))}
            </div>

            <a
              href={dtfTransferSection.button.link}
              className="mt-10 inline-block rounded-full bg-pink-500 px-8 py-4 text-white transition hover:bg-pink-600"
            >
              {dtfTransferSection.button.text}
            </a>
          </div>

          {/* Right Image */}
          <div>
            <video
              src={dtfTransferSection.video.src}
              alt={dtfTransferSection.video.alt}
              className="w-full rounded-3xl object-cover aspect-video "
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 items-center gap-10 pb-20 lg:grid-cols-2">
          {/* Left Content */}
          <div>
            <h2 className="mb-8 text-3xl md:text-4xl">
              {careTipsSection.heading}
            </h2>

            <div className="space-y-6">
              {careTipsSection.steps.map((step, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <p className="text-base leading-tight md:text-lg">{step}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-base md:text-lg font-heading">
              {careTipsSection.supportText}
            </p>

            <a
              href={careTipsSection.button.link}
              className="mt-10 inline-block rounded-full bg-pink-500 px-8 py-4 text-white transition hover:bg-pink-600"
            >
              {careTipsSection.button.text}
            </a>
          </div>

          {/* Right Image */}
          <div>
            <video
              src={careTipsSection.video.src}
              alt={careTipsSection.video.alt}
              className="w-full rounded-3xl object-cover aspect-video "
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 items-center gap-10 pb-20 lg:grid-cols-2">
          {/* Left Content */}
          <div>
            <h2 className="mb-8 text-3xl md:text-4xl">
              {heatPressGuideSection.heading}
            </h2>

            <div className="space-y-6">
              {heatPressGuideSection.steps.map((step, index) => (
                <div key={index} className="flex gap-4 mb-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <p className="text-base leading-tight  md:text-lg">{step}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-base md:text-lg font-heading">
              {heatPressGuideSection.supportText}
            </p>

            <a
              href={heatPressGuideSection.button.link}
              className="mt-10 inline-block rounded-full bg-pink-500 px-8 py-4 text-white transition hover:bg-pink-600"
            >
              {heatPressGuideSection.button.text}
            </a>
          </div>

          {/* Right Image */}
          <div>
            <video
              src={heatPressGuideSection.video.src}
              alt={heatPressGuideSection.video.alt}
              className="w-full rounded-3xl object-cover aspect-video "
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default page;
