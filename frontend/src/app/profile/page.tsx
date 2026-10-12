import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { MyProfilePage } from "@/features/people/PeoplePages";

export const metadata: Metadata = { title: "Your profile" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <MyProfilePage />
    </Suspense>
  );
}
