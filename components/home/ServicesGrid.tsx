"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Clock, 
  ArrowRight, 
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Fingerprint,
  CreditCard,
  Car,
  Vote,
  FileCheck2,
  HeartPulse,
  Building2,
  Zap,
  Globe,
  Tag
} from "lucide-react";
import { 
  subscribeToServices, 
  subscribeToCategories, 
  subscribeToSiteSettings, 
  DEFAULT_SITE_SETTINGS 
} from "@/lib/firestore-service";
import { Service, Category, SiteSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ServiceIconBadge, getServiceVisuals } from "@/lib/service-icons";
import { DIGITAL_SEVA_CATEGORIES, INITIAL_INDIAN_SERVICES } from "@/lib/data/indian-services";

import { useSearch } from "@/lib/search-context";

export default function ServicesGrid({ initialCategory }: { initialCategory?: string }) {
  const [services, setServices] = useState<Service[]>(INITIAL_INDIAN_SERVICES);
  const [categories, setCategories] = useState<Category[]>(DIGITAL_SEVA_CATEGORIES.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.iconName,
    sortOrder: c.sortOrder,
    isActive: true,
    createdAt: 0,
  })));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategory || "all");
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Real-time synchronization for services and categories from Firestore
  useEffect(() => {
    const unsubServices = subscribeToServices((data) => {
      setServices(data);
      setLoading(false);
    }, true);

    const unsubCategories = subscribeToCategories((cats) => {
      // Ensure active categories exist
      if (cats && cats.length > 0) {
        setCategories(cats.filter(c => c.isActive !== false));
      } else {
        setCategories(DIGITAL_SEVA_CATEGORIES.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.iconName,
          sortOrder: c.sortOrder,
          isActive: true,
          createdAt: 0,
        })));
      }
    });

    const unsubSettings = subscribeToSiteSettings((s) => setSettings(s));

    return () => {
      unsubServices();
      unsubCategories();
      unsubSettings();
    };
  }, []);

  // Compute count of services per category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const srv of services) {
      if (srv.categoryId) {
        counts[srv.categoryId] = (counts[srv.categoryId] || 0) + 1;
      }
      // Also match by categoryName or slug if id is different
      const matchedCat = categories.find(c => 
        c.id === srv.categoryId || 
        c.name.toLowerCase() === srv.categoryName?.toLowerCase()
      );
      if (matchedCat && matchedCat.id !== srv.categoryId) {
        counts[matchedCat.id] = (counts[matchedCat.id] || 0) + 1;
      }
    }
    return counts;
  }, [services, categories]);

  // Filter services by category and search query
  const filteredServices = services.filter((srv) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === "" || 
      srv.name.toLowerCase().includes(query) || 
      srv.shortDescription.toLowerCase().includes(query) ||
      (srv.categoryName && srv.categoryName.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (selectedCategoryId === "all") return true;

    // Direct category ID match
    if (srv.categoryId === selectedCategoryId) return true;

    // Fuzzy category match based on category name
    const activeCategory = categories.find(c => c.id === selectedCategoryId);
    if (activeCategory) {
      const catName = activeCategory.name.toLowerCase();
      if (srv.categoryName && srv.categoryName.toLowerCase().includes(catName)) return true;
      if (srv.categoryId.includes(activeCategory.slug)) return true;
    }

    return false;
  });

  const activeCategoryObj = categories.find(c => c.id === selectedCategoryId);

  return (
    <section className="my-8 animate-fadeIn" id="citizen-services-catalog">
      
      {/* Dynamic Category Tabs: Only All Categories, Aadhaar, PAN, Voter ID, Driving Licence, etc. */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-200/90 mb-5">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          
          {/* "All Categories" Tab */}
          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 flex-shrink-0 cursor-pointer shadow-xs ${
              selectedCategoryId === "all"
                ? "bg-brand-blue text-white shadow-md font-extrabold"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>All Categories</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedCategoryId === "all" ? "bg-white text-brand-blue" : "bg-slate-200 text-slate-700"
            }`}>
              {services.length}
            </span>
          </button>

          {/* Render Each Real Admin Category */}
          {categories.map((cat) => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 flex-shrink-0 cursor-pointer shadow-xs ${
                  isSelected
                    ? "bg-brand-blue text-white shadow-md font-extrabold"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                }`}
              >
                <Tag className={`h-3.5 w-3.5 ${isSelected ? "text-amber-300" : "text-slate-500"}`} />
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? "bg-white text-brand-blue" : "bg-slate-200 text-slate-700"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

        </div>
      </div>

      {/* Real-time search query indicator bar if searching */}
      {searchQuery && (
        <div className="mb-4 flex items-center justify-between bg-blue-50/80 border border-blue-200 px-4 py-2.5 rounded-xl text-xs text-brand-blue font-bold">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-brand-blue" />
            <span>Showing results for: &ldquo;<strong className="text-slate-900">{searchQuery}</strong>&rdquo;</span>
          </div>
          <button
            type="button"
            onClick={clearSearch}
            className="text-xs text-rose-600 hover:text-rose-800 underline font-black cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Active Category Information Strip */}
      {activeCategoryObj && selectedCategoryId !== "all" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 mb-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-brand-blue animate-pulse" />
            <span className="text-xs font-black text-slate-900">
              {activeCategoryObj.name}
            </span>
            <span className="text-xs text-slate-600 font-medium">
              &bull; Showing {filteredServices.length} verified services in this category
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className="text-[11px] text-brand-blue font-bold hover:underline cursor-pointer"
          >
            Show All Categories
          </button>
        </div>
      )}

      {/* Services Grid Display */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
              <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-full"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border-2 border-dashed border-slate-300 text-center space-y-3">
          <Layers className="h-10 w-10 text-slate-400 mx-auto" />
          <p className="text-slate-700 text-sm font-bold">No services found for "{searchQuery || activeCategoryObj?.name}".</p>
          <button
            type="button"
            onClick={() => { clearSearch(); setSelectedCategoryId("all"); }}
            className="text-xs bg-brand-blue text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-brand-primary cursor-pointer"
          >
            View All Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredServices.map((srv) => {
            const visual = getServiceVisuals(srv.name, srv.categoryId, srv.iconName);
            const fee = srv.discountPrice ?? srv.price ?? 0;

            return (
              <div
                key={srv.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-brand-blue hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden shadow-xs"
              >
                {/* Top Subtle Gradient Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${visual.gradient}`} />

                <div>
                  {/* Top Row: Dynamic Icon Badge & Price Tag */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <ServiceIconBadge
                      name={srv.name}
                      categoryId={srv.categoryId}
                      customIcon={srv.iconName}
                      size="sm"
                    />

                    <div className="text-right flex flex-col items-end">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                        Govt / Cafe Fee
                      </span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {fee === 0 ? "Free / Portal" : formatCurrency(fee)}
                      </span>
                    </div>
                  </div>

                  {/* Category Chip */}
                  <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 mb-1.5">
                    {srv.categoryName || "Digital Seva"}
                  </span>

                  {/* Service Title */}
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-brand-blue transition line-clamp-2 leading-snug">
                    {srv.name}
                  </h3>

                  {/* Short Description */}
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {srv.shortDescription}
                  </p>

                  {/* Turnaround Time Badge */}
                  {srv.processingTime && (
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                      <Clock className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      <span className="font-semibold text-slate-600">{srv.processingTime}</span>
                    </div>
                  )}
                </div>

                {/* Direct Action Link - Compact, High Contrast, Sleek */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                  <Link
                    href={`/services/${srv.slug || srv.id}`}
                    className="w-full py-2 px-3 rounded-xl text-[11px] font-black transition flex items-center justify-center space-x-1.5 shadow-xs hover:shadow-md cursor-pointer bg-brand-blue hover:bg-brand-primary text-white border border-brand-blue group/btn"
                  >
                    <span>Apply Online</span>
                    <ArrowRight className="h-3 w-3 text-amber-400 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}
