import Image from "next/image";
import Link from "next/link";

export type OfferItem = {
  title: string;
  description: string;
  icon: string;
};

export default function OfferSection({ items }: { items: OfferItem[] }) {
  const container =
    "mx-auto w-full max-w-[1200px] px-5 flex flex-col items-center gap-5";

  return (
    <section className="py-18 px-5" id="offers">
      <div className={container}>
        <h2 className="text-center text-[clamp(26px,3vw,36px)] font-bold">
          What we offer
        </h2>
        <p className="max-w-4xl text-center text-[16px] leading-relaxed text-muted">
          Be it team uniforms, corporate gifts or trade show giveaways, there are three ways to get
          what you need.
        </p>
        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
          {items.map((item) => (
            <article key={item.title} className="flex flex-col items-center gap-4 bg-transparent pt-12">
              <div className="flex h-36 w-36 items-center justify-center rounded-full bg-blue text-white">
                <Image
                  src={item.icon}
                  alt={`${item.title} icon`}
                  width={88}
                  height={88}
                  className="h-15 w-15"
                />
              </div>
              <div className="text-center">
                <h3 className="mb-2 text-[22px] font-semibold">{item.title}</h3>
                <p className="mx-auto mb-6 w-3/4 text-center text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
                <Link
                  className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(239,41,135,0.4)] transition-transform hover:-translate-y-0.5"
                  href="#start"
                >
                  Start Creating
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
