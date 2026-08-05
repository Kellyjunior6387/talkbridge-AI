"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectUrgent() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/messages");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-mono text-slate-500">
      Redirecting to unified Messages inbox...
    </div>
  );
}
