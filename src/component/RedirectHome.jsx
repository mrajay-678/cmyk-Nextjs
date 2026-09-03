"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectHome({ delay = 3000 }) {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      router.replace("/");
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, router]);

  return null;
}
