import Link from "next/link";

import RedirectHome from "@/component/RedirectHome";

export const metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-neutral-50 px-4 py-16">
      <section className="w-full max-w-2xl text-center">
        <p className="text-sm  uppercase tracking-[0.18em] text-pink-500">
          404
        </p>
        <h1 className="mt-4 text-4xl  text-neutral-950 sm:text-5xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-neutral-600">
          The page you are looking for is unavailable. You will be redirected to
          the home page in 3 seconds.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-pink-500 px-6 text-sm  text-white transition hover:bg-pink-600"
          >
            Go home now
          </Link>
        </div>
        <RedirectHome delay={3000} />
      </section>
    </main>
  );
}
