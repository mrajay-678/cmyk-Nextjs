"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqData = [
  {
    question: "What is a DTF transfer?",
    answer:
      "DTF (Direct To Film) is a printing technique where we print your design directly onto a special film and then transfer it to materials like cotton, polyester, and linen using a simple 15-second heat press application.",
  },
  {
    question: "What is the minimum order quantity?",
    answer:
      "No minimums! Whether you need just 1 transfer or 100,000, we can accommodate your order.",
  },
  {
    question: "What kind of heat press do I need?",
    answer:
      "You can use anything from a household iron to an industrial heat press.",
  },
  {
    question: "What sizes are available?",
    answer:
      "We offer transfers ranging from 2″ × 2″ all the way up to 24″ × 30 feet.",
  },
  {
    question: "How do transfers hold up in the wash?",
    answer:
      "Our DTF transfers are tested for durability and resist peeling, cracking, and fading even after multiple wash cycles.",
  },
  {
    question: "How quickly can I get my order?",
    answer: "Expedited orders ship within 24-48 hours.",
  },
  {
    question: "What file format should my artwork be?",
    answer:
      "Vector art is preferred (AI, PDF). For raster files, use at least 300 DPI. JPG and PNG are also accepted.",
  },
  {
    question: "How do I apply DTF transfers correctly?",
    answer:
      "Follow the pressing instructions carefully for best results and professional-quality application.",
  },
  {
    question: "What is your refund policy?",
    answer:
      "We stand behind our work 100%. If you experience any issues with your transfers, contact us and we’ll make it right.",
  },
];
export const Page = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div>
      <section className="overflow-hidden max-w-screen">
        <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')] max-w-screen h-4"></div>
        <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Group-13-scaled.png.webp')] bg-center px-6 py-24 sm:py-32 md:py-24">
          <div className="mx-auto flex justify-center gap-6 text-center text-4xl sm:text-5xl md:text-7xl">
            <span className="font-heading text-white">FAQs</span>
          </div>
        </div>
        <div className="bg-[url('https://cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')] max-w-screen h-4"></div>
        <div className="mx-auto max-w-7xl py-14 md:py-20">
          {faqData.map((item, index) => (
            <div key={index} className="border-b border-[#d9d9d9]">
              <button
                onClick={() => toggleAccordion(index)}
                className="flex w-full items-center justify-between gap-4 py-6 text-left md:py-8"
              >
                <h3 className="text-xl font-normal text-black md:text-3xl">
                  {item.question}
                </h3>

                <span className="shrink-0">
                  {openIndex === index ? (
                    <Minus size={32} strokeWidth={1.5} />
                  ) : (
                    <Plus size={32} strokeWidth={1.5} />
                  )}
                </span>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? "max-h-96 pb-8 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <p className="max-w-4xl text-base leading-relaxed text-[#555] md:text-lg">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Page;
