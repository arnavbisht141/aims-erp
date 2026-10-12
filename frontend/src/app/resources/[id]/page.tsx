import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { ResourceDetailPage } from "@/features/resources/ResourceDetailPage";

export const metadata: Metadata = { title: "Resource" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ResourceDetailPage />
    </Suspense>
  );
}
