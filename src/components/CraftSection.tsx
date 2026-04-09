import Image from "next/image";
import Link from "next/link";

export default function CraftSection() {
  const container = "mx-auto w-full max-w-[1200px] px-5 flex flex-col gap-4";
  const grid =
    "grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 items-center";
  const card =
    "rounded-3xl bg-white shadow-soft border border-[#e7e1f2] overflow-hidden flex justify-center";

  return (
    <section className="py-16" id="shop-custom">
      <div className={container}>
        <div className={grid}>
          <div className={`${card} justify-end`}>
            <Image
              src="/assets/image/Your-art.png"
              alt="Artwork ready to print"
              width={520}
              height={520}
              className="object-contain"
            />
          </div>
          <div className={card}>
            <div className="flex flex-col items-center">
              <Image
                src="/assets/image/our-craft.png"
                alt="Finished t-shirt with print"
                width={760}
                height={760}
                className="object-contain"
              />
              <div className="mt-4 flex w-3/4 justify-end">
                <Link
                  href="#offers"
                  className="inline-flex rounded-full bg-primary px-4 py-3 font-semibold text-white shadow-[0_12px_28px_rgba(239,41,135,0.32)] transition-transform hover:-translate-y-0.5"
                >
                  Start Creating
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
