import type { ReactNode } from "react";

import { requireWorkspaceContext } from "@/src/lib/workspace-access";

export default async function InterventionReportLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireWorkspaceContext("write");

  return children;
}
