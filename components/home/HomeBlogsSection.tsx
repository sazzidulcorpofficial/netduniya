"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Tag, 
  ChevronRight,
  Clock
} from "lucide-react";
import { subscribeToBlogs } from "@/lib/firestore-service";
import { BlogArticle } from "@/lib/types";

export default function HomeBlogsSection() {
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToBlogs((data) => {
      setBlogs(data.slice(0, 3)); // Top 3 latest published blogs
      setLoading(false);
    }, true);

    return () => unsub();
  }, []);

  if (!loading && blogs.length === 0) {
    return null; // Don't show empty block if no blogs exist yet
  }

  return (
    <section className="my-10 animate-fadeIn" id="latest-news-blogs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-brand-blue font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Updates & Citizen Guides</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Latest News & Government Alerts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay updated with Aadhaar deadlines, exam notifications, scheme guidelines, and digital tips.
          </p>
        </div>

        <Link
          href="/blog"
          className="text-xs font-bold text-brand-blue hover:text-brand-primary flex items-center space-x-1 group self-start sm:self-auto"
        >
          <span>View All Blogs</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-3">
              <div className="h-36 bg-slate-200 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {blogs.map((article) => {
            const formattedDate = article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })
              : "Recent";

            return (
              <article
                key={article.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Image / Header Thumbnail */}
                <div className="relative h-44 bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-800 flex items-center justify-center overflow-hidden">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <BookOpen className="h-10 w-10 text-amber-400 mx-auto opacity-70 mb-2" />
                      <span className="text-xs font-bold text-slate-300">NetDuniya Official Guide</span>
                    </div>
                  )}

                  {/* Category Pill on Image */}
                  <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-xs text-amber-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-400/20">
                    {article.category || "E-Governance"}
                  </span>
                </div>

                {/* Article Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-2">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>{formattedDate}</span>
                      {article.author && (
                        <>
                          <span>&bull;</span>
                          <span>By {article.author}</span>
                        </>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 group-hover:text-brand-blue transition line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {article.summary || article.content?.substring(0, 120)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/blog/${article.slug || article.id}`}
                      className="text-xs font-black text-brand-blue group-hover:text-brand-primary flex items-center space-x-1"
                    >
                      <span>Read Article</span>
                      <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Live
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
