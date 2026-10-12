import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { AdminPollsPage } from "@/features/admin/AdminPages";

export const metadata: Metadata = { title: "Manage polls" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AdminPollsPage />
    </Suspense>
  );
}
