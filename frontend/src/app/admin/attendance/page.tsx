import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLoading } from "@/components/ui/States";
import { AttendancePage } from "@/features/admin/AdminPages";

export const metadata: Metadata = { title: "Attendance" };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AttendancePage />
    </Suspense>
  );
}
