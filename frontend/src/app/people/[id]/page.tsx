import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { PersonPage } from "@/features/people/PeoplePages";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PersonPage />
    </Suspense>
  );
}
