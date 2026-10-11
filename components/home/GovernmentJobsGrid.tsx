"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  ShieldCheck, 
  Building, 
  ArrowRight, 
  Calendar, 
  ExternalLink,
  Sparkles
} from "lucide-react";
import { subscribeToJobs } from "@/lib/firestore-service";
import { GovernmentJob } from "@/lib/types";

export default function GovernmentJobsGrid() {
  const [jobs, setJobs] = useState<GovernmentJob[]>([]);

  useEffect(() => {
    const unsub = subscribeToJobs((data) => {
      setJobs(data);
    }, true);

    return () => unsub();
  }, []);

  if (jobs.length === 0) return null;

  return (
    <section className="my-10" id="govt-jobs-section">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-3 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-blue font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Recruitment Alerts</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>100% Verified Government Jobs</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-300">
              Live Notifications
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verified recruitment drives across Central Ministries, Indian Railways, SSC, Banking, and State Police.
          </p>
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-blue hover:text-brand-accent transition group flex-shrink-0"
        >
          <span>Browse All ({jobs.length}) Jobs</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {jobs.slice(0, 8).map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200/90 hover:border-brand-blue/60 transition-all duration-200 p-3 sm:p-3.5 flex flex-col justify-between space-y-2.5 group"
          >
            <div className="space-y-1.5">
              {/* Top Meta */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[130px] flex items-center gap-1">
                  <Building className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job.department}</span>
                </span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                  Verified
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xs sm:text-[13px] font-black text-slate-900 group-hover:text-brand-blue transition line-clamp-2 leading-snug">
                {job.title}
              </h3>

              {/* Chips */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                <span className="inline-flex items-center text-[10px] font-bold bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded border border-amber-200/80">
                  {job.totalVacancies} Posts
                </span>
                <span className="inline-flex items-center text-[10px] font-bold bg-slate-50 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[120px]" title={job.qualification}>
                  {job.qualification}
                </span>
              </div>

              {/* Last Date Highlight */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                <span className="text-[10px] text-slate-400 font-medium">Last Date:</span>
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{job.lastDate}</span>
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href="/jobs"
                className="text-[11px] font-bold text-slate-600 hover:text-brand-blue transition"
              >
                Details
              </Link>
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-brand-blue hover:bg-blue-700 text-white text-[10px] sm:text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-sm transition flex items-center space-x-1"
              >
                <span>Apply</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
