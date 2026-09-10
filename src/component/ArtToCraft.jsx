import Image from "next/image";
import Link from "next/link";

export default function ArtToCraft() {
  return (
    <section className="bg-white px-6 py-16 md:py-20">
      <div className="grid items-center">
        <div className="relative flex flex-col items-center md:items-center">
          <div className="relative mb-6 w-full text-center sm:h-[56vh]">
            <Image
              src="https://wp.cmykprint.shop/wp-content/uploads/2025/12/6-3.png"
              alt="Our Craft"
              width={1200}
              height={700}
              className="h-full w-full object-contain mx-auto"
            />
          </div>
          <div className="w-full max-w-6xl text-center sm:text-end">
            <Link
              href={"products/uv-dtf-by-size"}
              className="bg-pink-500 hover:bg-pink-600 text-white ms-auto px-6 py-3 rounded-full transition"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
