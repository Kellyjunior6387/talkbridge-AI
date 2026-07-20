"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/urgent");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col justify-center items-center p-8 space-y-6">
      {/* Loading Skeleton Simulation for Premium Feel */}
      <div className="w-full max-w-4xl space-y-4 animate-pulse">
        <div className="h-8 bg-[#162033] rounded-lg w-1/4"></div>
        <div className="h-4 bg-[#162033] rounded-lg w-1/3"></div>
        <div className="grid grid-cols-1 gap-4 pt-6">
          <div className="h-32 bg-[#0F1624] border border-[#1C2640] rounded-xl"></div>
          <div className="h-32 bg-[#0F1624] border border-[#1C2640] rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
