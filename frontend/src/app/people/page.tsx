import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { PeoplePage } from "@/features/people/PeoplePages";

export const metadata: Metadata = { title: "People" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PeoplePage />
    </Suspense>
  );
}
