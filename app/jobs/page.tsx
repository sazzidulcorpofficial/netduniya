"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Calendar, 
  Building, 
  ArrowRight,
  GraduationCap,
  Clock,
  Sparkles,
  CheckCircle2,
  Users
} from "lucide-react";
import { subscribeToJobs } from "@/lib/firestore-service";
import { GovernmentJob } from "@/lib/types";

export default function GovernmentJobsPage() {
  const [jobs, setJobs] = useState<GovernmentJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToJobs((data) => {
      setJobs(data);
      setLoading(false);
    }, true);

    return () => unsub();
  }, []);

  const categories = ["all", "Central Govt", "State Govt", "Banking", "Railways", "Defence / Police"];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = searchQuery === "" ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.qualification.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory === "Central Govt") matchesCategory = job.state === "Central Govt";
    else if (selectedCategory === "State Govt") matchesCategory = job.state !== "Central Govt";
    else if (selectedCategory === "Banking") matchesCategory = job.department.toLowerCase().includes("bank");
    else if (selectedCategory === "Railways") matchesCategory = job.department.toLowerCase().includes("railway") || job.title.toLowerCase().includes("rrb");
    else if (selectedCategory === "Defence / Police") matchesCategory = job.department.toLowerCase().includes("police") || job.title.toLowerCase().includes("police");

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto py-2">
      

      {/* Search & Category Filter Strip */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, SSC, Railway, Police, Qualification..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-brand-blue text-white shadow"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {cat === "all" ? "All Jobs" : cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Job Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 hover:border-brand-blue/70 transition-all p-3.5 sm:p-4 flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 truncate max-w-[170px]">
                  <Building className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{job.department}</span>
                </span>
                <span className="inline-flex items-center space-x-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  <span>Verified</span>
                </span>
              </div>

              {/* Title */}
              <h2 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-brand-blue transition line-clamp-2 leading-snug">
                {job.title}
              </h2>

              {/* Key Specs Compact Grid */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-150">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Vacancies</span>
                  <span className="font-extrabold text-slate-900 text-xs">{job.totalVacancies}</span>
                </div>
                <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-150">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Last Date</span>
                  <span className="font-extrabold text-rose-600 text-xs truncate block">{job.lastDate}</span>
                </div>
                <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-150 col-span-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Qualification</span>
                  <span className="font-semibold text-slate-700 truncate block text-[11px]">{job.qualification}</span>
                </div>
                {job.salaryScale && (
                  <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-150 col-span-2">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Salary / Scale</span>
                    <span className="font-bold text-emerald-700 truncate block text-[11px]">{job.salaryScale}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bottom Bar */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
              {job.notificationUrl ? (
                <a
                  href={job.notificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-slate-500 hover:text-brand-blue flex items-center space-x-1"
                >
                  <span>Notice</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : <span />}
              
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow-sm transition flex items-center space-x-1 ml-auto"
              >
                <span>Apply Portal</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
