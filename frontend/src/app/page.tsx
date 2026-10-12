import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { HomePage } from "@/features/dashboard/HomePage";

export const metadata: Metadata = { title: "Home" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HomePage />
    </Suspense>
  );
}
