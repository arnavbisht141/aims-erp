import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { ResourcesPage } from "@/features/resources/ResourcesPage";

export const metadata: Metadata = { title: "Resources" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <ResourcesPage />
    </Suspense>
  );
}
