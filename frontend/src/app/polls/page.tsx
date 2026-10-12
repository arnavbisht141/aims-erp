import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { PollsList } from "@/features/polls/PollsPages";

export const metadata: Metadata = { title: "Polls" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PollsList />
    </Suspense>
  );
}
