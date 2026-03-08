"use client";

import { QueryProvider } from "@/components/common/QueryProvider";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <DashboardShell>{children}</DashboardShell>
    </QueryProvider>
  );
}
