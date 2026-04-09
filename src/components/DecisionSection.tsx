import Link from "next/link";

export type DecisionStep = {
  title: string;
  body: string;
  tag?: string;
};

export default function DecisionSection({ steps }: { steps: DecisionStep[] }) {
  const container =
    "mx-auto w-full max-w-[1200px] px-5 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-7 items-start";

  return (
    <section className="py-16" id="dtf-transfers">
      <div className={container}>
        <div>
          <h2 className="mb-2 text-[clamp(24px,3vw,32px)] font-bold">
            Not sure which service you need?
          </h2>
          <p className="mb-4 text-muted">Think of it this way:</p>
          <Link
            href="#offers"
            className="inline-flex rounded-full bg-primary px-4 py-3 font-semibold text-white shadow-[0_10px_26px_rgba(239,41,135,0.32)] transition-transform hover:-translate-y-0.5"
          >
            Made for every project
          </Link>
        </div>
        <ol className="flex list-none flex-col gap-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid grid-cols-[auto,1fr] items-start gap-3 border-b border-[#ededed] pb-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dark font-bold">
                {index + 1}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  {step.tag ? (
                    <span className="inline-flex items-center rounded-xl bg-[#f6f7ff] px-3 py-1 text-xs font-semibold text-blue">
                      {step.tag}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
