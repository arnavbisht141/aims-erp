import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { TasksPage } from "@/features/tasks/TasksPage";

export const metadata: Metadata = { title: "Tasks" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <TasksPage />
    </Suspense>
  );
}
