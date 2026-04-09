export default function Banner({ text }: { text: string }) {
  const words = text.split(" ");
  const lastWord = words.pop() ?? "";
  const leading = words.join(" ");

  const patternClass =
    "h-3 bg-[repeating-linear-gradient(90deg,#111_0,#111_12px,#fff_12px,#fff_24px),repeating-linear-gradient(0deg,#111_0,#111_12px,#fff_12px,#fff_24px)] opacity-85";

  return (
    <section className="w-full">
      <div className={patternClass} aria-hidden />
      <div className="bg-[linear-gradient(90deg,#4d61f4_0%,#5569fa_25%,#4d61f4_50%,#5569fa_75%,#4d61f4_100%)] text-white text-center py-10 px-5 text-[clamp(24px,3vw,32px)] font-bold">
        <p>
          {leading} <span className="text-accent">{lastWord}</span>
        </p>
      </div>
      <div className={patternClass} aria-hidden />
    </section>
  );
}
