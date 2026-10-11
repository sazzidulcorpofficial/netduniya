"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ServicesGrid from "@/components/home/ServicesGrid";
import { Sparkles, ShieldCheck } from "lucide-react";

import { useSearch } from "@/lib/search-context";

function ServicesContent() {
  const searchParams = useSearchParams();
  const cat = searchParams.get("category") || undefined;
  const q = searchParams.get("q");
  const { setSearchQuery } = useSearch();

  React.useEffect(() => {
    if (q) {
      setSearchQuery(q);
    }
  }, [q, setSearchQuery]);

  return (
    <div className="space-y-6">
      <ServicesGrid initialCategory={cat} />
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading digital services...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
