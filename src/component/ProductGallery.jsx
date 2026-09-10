import Image from "next/image";
import Link from "next/link";

const products = [
  {
    title: "Drinkware",
    href: "./products/25-oz-hydrapeak-stainless-steel-insulated-oasis-water-bottle/",
    url: "https://wp.cmykprint.shop/wp-content/uploads/2025/11/Gemini_Generated_Image_5uyf8h5uyf8h5uyf-e1766170470865.png.webp",
  },
  {
    title: "Buttons",
    href: "./products/2-25-round-button-w-pin/",
    url: "https://wp.cmykprint.shop/wp-content/uploads/2025/11/pin-e1766176511733.png.webp",
  },
  {
    title: "Hoodies",
    href: "./products/gildan-50-50-cotton-polyester-fleece-hoodie-7-75-oz/",
    url: "https://wp.cmykprint.shop/wp-content/uploads/2025/12/Gemini_Generated_Image_jybgfvjybgfvjybg.png.webp",
  },
  {
    title: "Mugs",
    href: "./products/11-oz-ceramic-mug/",
    url: "https://wp.cmykprint.shop/wp-content/uploads/2025/12/Gemini_Generated_Image_1qlwyb1qlwyb1qlw.png.webp",
  },
  {
    title: "Sticker Sheets",
    href: "/products?category=labels&sort=date-desc",
    url: "https://wp.cmykprint.shop/wp-content/uploads/2025/12/MKE-KG-2-211-2-scaled.jpg",
  },
  {
    title: "Tees",
    href: "./products/100-preshrunk-cotton-t-shirt-with-custom-imprint/",
    url: "https://wp.cmykprint.shop/wp-content/uploads/2025/12/Gemini_Generated_Image_4zhh8x4zhh8x4zhh.png",
  },
  {
    title: "Packaging",
    href: "./products/full-color-5-x-7-mylar-bag",
    url: "https://wp.cmykprint.shop/wp-content/uploads/2025/12/Gemini_Generated_Image_pedxrwpedxrwpedx.png",
  },
  {
    title: "Tote Bags",
    href: "./products/usa-union-made-union-printed-grocery-tote/",
    url: "https://wp.cmykprint.shop/wp-content/uploads/2025/12/Gemini_Generated_Image_nz5rrnnz5rrnnz5r-e1766555560955.png",
  },
];

export default function ProductGallery() {
  return (
    <section className="px-6 py-16 bg-white md:px-10 md:py-20 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group relative overflow-hidden bg-neutral-100 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <div className="relative aspect-[4/4] overflow-hidden">
                <Image
                  src={`${product.url}`}
                  alt={product.title}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                  className="object-cover transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 scale-95 rounded-4xl bg-neutral-950/0 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-neutral-950/18" />

              <div className="pointer-events-none h-full absolute inset-x-0 bottom-0 flex translate-y-6 justify-center items-center px-4 pb-6 opacity-0 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100">
                <button
                  type="button"
                  className="pointer-events-auto rounded-4xl bg-pink-500 px-8 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(236,72,153,0.35)] transition duration-300 ease-out hover:bg-pink-600 "
                >
                  Buy Now
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
