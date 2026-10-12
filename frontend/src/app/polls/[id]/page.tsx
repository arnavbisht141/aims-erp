import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { PollDetailPage } from "@/features/polls/PollsPages";

export const metadata: Metadata = { title: "Poll" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PollDetailPage />
    </Suspense>
  );
}
