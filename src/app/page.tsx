import Banner from "@/components/Banner";
import CraftSection from "@/components/CraftSection";
import DecisionSection from "@/components/DecisionSection";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import OfferSection from "@/components/OfferSection";
import Testimonial from "@/components/Testimonial";

const offers = [
  {
    title: "DTF Transfers",
    description:
      "If you have a heat press and want to apply the transfers to your own apparel, get DTF transfers.",
    icon: "/assets/image/dtf.svg",
  },
  {
    title: "UV DTF Stickers",
    description:
      "If you're decorating hard surfaces like bottles, phone cases, or signs, go with UV DTF stickers.",
    icon: "/assets/image/uv-dtf.svg",
  },
  {
    title: "Custom Products",
    description:
      "If you want us to handle everything end-to-end, including blanks, shop our custom products.",
    icon: "/assets/image/custom-product.svg",
  },
];

const galleryImages = [
  { src: "/assets/gallery1.svg", alt: "Printed mug", tall: false },
  { src: "/assets/gallery2.svg", alt: "Sticker pack", tall: true },
  { src: "/assets/gallery3.svg", alt: "Colorful labels", tall: false },
  { src: "/assets/gallery4.svg", alt: "Custom signage", tall: false },
  { src: "/assets/gallery5.svg", alt: "Die-cut stickers", tall: false },
  { src: "/assets/gallery6.svg", alt: "Premium shirt print", tall: true },
  { src: "/assets/gallery7.svg", alt: "Product tags", tall: false },
  { src: "/assets/gallery8.svg", alt: "Event merch", tall: false },
];

const decisionSteps = [
  {
    title: "DTF Transfers",
    body: "If you have a heat press and want to apply the transfers to your own apparel, get DTF Transfers.",
    tag: "Fast DIY",
  },
  {
    title: "UV DTF Stickers",
    body: "If you're decorating hard surfaces like bottles, phone cases, or signs, go with UV DTF Stickers.",
    tag: "Waterproof",
  },
  {
    title: "Custom Products",
    body: "If you want us to handle everything end-to-end, shop Custom Products.",
    tag: "Done for you",
  },
];

export default function Home() {
  return (
    <main className="flex flex-col bg-white text-text">
      <Header />
      <Hero />
      <OfferSection items={offers} />
      <Gallery images={galleryImages} />
      <Banner text="Made for real life" />
      <DecisionSection steps={decisionSteps} />
      <CraftSection />
      <Testimonial />
      <Footer />
    </main>
  );
}
