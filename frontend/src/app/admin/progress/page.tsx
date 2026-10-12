import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { ProgressPage } from "@/features/admin/AdminPages";

export const metadata: Metadata = { title: "Junior progress" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ProgressPage />
    </Suspense>
  );
}
