"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuditLogRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/settings?tab=audit-log"); }, [router]);
  return null;
}
