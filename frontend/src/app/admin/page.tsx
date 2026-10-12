import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { AdminOverviewPage } from "@/features/admin/AdminPages";

export const metadata: Metadata = { title: "Administration" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AdminOverviewPage />
    </Suspense>
  );
}
