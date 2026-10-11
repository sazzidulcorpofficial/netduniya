"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight,
  ShieldCheck,
  Search,
  Printer,
  Sparkles,
  Fingerprint,
  CreditCard,
  Car,
  BookOpen,
  Vote,
  FileCheck,
  ShoppingBag,
  HeartPulse,
  Building2,
  Zap,
  Smartphone,
  LucideIcon
} from "lucide-react";
import { subscribeToSiteSettings, subscribeToServices, subscribeToCategories, DEFAULT_SITE_SETTINGS } from "@/lib/firestore-service";
import { SiteSettings, Service, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useSearch } from "@/lib/search-context";

interface FeaturedServiceCard {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  bgColor: string;
  Icon: LucideIcon;
  price?: number;
}

// Default Featured Services matching user's photo with vibrant styling
const PHOTO_MATCHING_SERVICES: FeaturedServiceCard[] = [
  {
    id: "tile-aadhaar",
    name: "Aadhaar Card",
    subtitle: "Mobile link, address, biometric",
    slug: "aadhaar",
    bgColor: "bg-[#0284c7]", // Vibrant Ocean Blue
    Icon: Fingerprint,
  },
  {
    id: "tile-pan",
    name: "PAN Card",
    subtitle: "New PAN 49A, correction, link",
    slug: "pan-card",
    bgColor: "bg-[#ea580c]", // Vibrant Coral Red-Orange
    Icon: CreditCard,
  },
  {
    id: "tile-dl",
    name: "Driving Licence",
    subtitle: "Learner, permanent DL, renewal",
    slug: "driving-licence",
    bgColor: "bg-[#eab308]", // Vibrant Golden Yellow / Amber
    Icon: Car,
  },
  {
    id: "tile-passport",
    name: "Passport Service",
    subtitle: "Fresh passport, renewal, tatkaal",
    slug: "passport-service",
    bgColor: "bg-[#2563eb]", // Vibrant Electric Sky Blue
    Icon: BookOpen,
  },
  {
    id: "tile-voter",
    name: "Voter Card (EPIC)",
    subtitle: "Form 6, correction, shift address",
    slug: "voter-id",
    bgColor: "bg-[#7c3aed]", // Vibrant Purple / Violet
    Icon: Vote,
  },
  {
    id: "tile-cert",
    name: "Certificates (E-District)",
    subtitle: "Income, caste, domicile, PRC",
    slug: "certificates",
    bgColor: "bg-[#059669]", // Vibrant Emerald Green
    Icon: FileCheck,
  },
  {
    id: "tile-ration",
    name: "Ration Card",
    subtitle: "New ration card, add member",
    slug: "ration-card",
    bgColor: "bg-[#0d9488]", // Vibrant Forest Teal Green
    Icon: ShoppingBag,
  },
  {
    id: "tile-ayushman",
    name: "Ayushman Card",
    subtitle: "PM-JAY health card application",
    slug: "ayushman-card",
    bgColor: "bg-[#e11d48]", // Vibrant Crimson / Rose Red
    Icon: HeartPulse,
  },
  {
    id: "tile-bank",
    name: "Bank Account & AEPS",
    subtitle: "Savings account, Mini ATM, cash",
    slug: "banking",
    bgColor: "bg-[#0284c7]", // Vibrant Royal Blue
    Icon: Building2,
  },
  {
    id: "tile-bills",
    name: "Bill Payments",
    subtitle: "Electricity, water, gas, FASTag",
    slug: "bill-payments",
    bgColor: "bg-[#f97316]", // Vibrant Bright Orange
    Icon: Zap,
  },
  {
    id: "tile-recharge",
    name: "Mobile & DTH Recharge",
    subtitle: "Jio, Airtel, Vi, BSNL, Tata Play",
    slug: "recharge",
    bgColor: "bg-[#65a30d]", // Vibrant Lime / Grass Green
    Icon: Smartphone,
  },
  {
    id: "tile-pvc",
    name: "Smart PVC Card",
    subtitle: "Waterproof plastic card printing",
    slug: "pvc-card",
    bgColor: "bg-[#be185d]", // Vibrant Deep Berry / Magenta-Pink
    Icon: Printer,
  },
];

export default function DigitalSevaServicesGrid() {
  const { searchQuery } = useSearch();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [realServices, setRealServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);


  useEffect(() => {
    const unsubSettings = subscribeToSiteSettings((s) => setSettings(s));
    const unsubServices = subscribeToServices((data) => {
      setRealServices(data);
    }, true);
    const unsubCats = subscribeToCategories((cats) => {
      setCategories(cats);
    });

    return () => {
      unsubSettings();
      unsubServices();
      unsubCats();
    };
  }, []);

  // Merge predefined cards with real-time Firestore prices, PLUS any admin-added categories!
  const displayCards: FeaturedServiceCard[] = React.useMemo(() => {
    // 1. Initial 12 cards with updated real-time prices & titles
    const cards: FeaturedServiceCard[] = PHOTO_MATCHING_SERVICES.map((def) => {
      const match = realServices.find(s => 
        s.slug === def.slug || 
        s.id === def.slug || 
        s.categoryId === def.slug ||
        s.categoryId === `cat-${def.slug}` ||
        s.name.toLowerCase().includes(def.name.toLowerCase())
      );
      if (match) {
        return {
          ...def,
          name: def.name,
          subtitle: match.shortDescription || def.subtitle,
          price: match.discountPrice || match.price,
        };
      }
      return def;
    });

    // 2. Append any extra categories created by Admin in Firestore!
    const existingSlugs = new Set(cards.map(c => c.slug.toLowerCase()));
    const extraPalette = ["bg-[#0891b2]", "bg-[#4f46e5]", "bg-[#c026d3]", "bg-[#059669]", "bg-[#d97706]"];

    categories.forEach((cat, idx) => {
      const cleanSlug = cat.slug?.toLowerCase() || cat.id?.toLowerCase();
      if (!existingSlugs.has(cleanSlug)) {
        existingSlugs.add(cleanSlug);
        // Find matching services to get price
        const catService = realServices.find(s => s.categoryId === cat.id || s.categoryId === `cat-${cat.slug}`);
        cards.push({
          id: `tile-extra-${cat.id}`,
          name: cat.name,
          subtitle: cat.description || "Official Online Citizen Service",
          slug: cat.slug || cat.id,
          bgColor: extraPalette[idx % extraPalette.length],
          Icon: Sparkles,
          price: catService?.discountPrice || catService?.price,
        });
      }
    });

    return cards;
  }, [realServices, categories]);

  // Search filtering
  const filteredServices = displayCards.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q)
    );
  });

  return (
    <section className="my-5 animate-fadeIn" id="digital-seva-services">
      {/* Outer Card Container */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-200/80 p-4 sm:p-6">
        
        {/* Header: Only 'Net Duniya – Our Categories' without extra text or wasted space */}
        <div className="flex flex-col items-center text-center mb-3 sm:mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Net Duniya – Our Categories
          </h2>
        </div>

        {/* Dynamic Distinct Colorful Cards matching user screen photo - Compact & Sleek */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              No category matched &ldquo;{searchQuery}&rdquo;.
            </p>
            <Link
              href={`/services?q=${encodeURIComponent(searchQuery)}`}
              className="mt-2 inline-flex items-center space-x-1.5 text-xs font-black text-brand-blue hover:underline"
            >
              <span>Search in All Citizen Services Directory &rarr;</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {filteredServices.map((card) => {
            const cardHref = card.slug === "pvc-card" ? "/pvc-card" : `/services/${card.slug}`;
            const IconComponent = card.Icon;

            return (
              <Link
                key={card.id}
                href={cardHref}
                className={`group relative rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[125px] sm:min-h-[138px] transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl cursor-pointer ${card.bgColor} text-white shadow-sm hover:brightness-105 overflow-hidden`}
              >
                {/* Subtle soft gradient shimmer on top-right */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none -mr-4 -mt-4" />

                {/* Top Row: Small VERIFIED Badge (Top-Left) & Real-time Price (Top-Right) */}
                <div className="w-full flex items-center justify-between z-10">
                  <span className="text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/20 text-white tracking-wider backdrop-blur-xs">
                    VERIFIED
                  </span>
                  {card.price && card.price > 0 ? (
                    <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 shadow-xs">
                      {formatCurrency(card.price)}
                    </span>
                  ) : null}
                </div>

                {/* Center Icon Box: rounded-xl translucent white background */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 flex items-center justify-center text-white mx-auto my-1 sm:my-1.5 shadow-inner group-hover:scale-105 transition-transform z-10 backdrop-blur-xs">
                  <IconComponent className="h-5 w-5 text-white drop-shadow-sm" />
                </div>

                {/* Bottom Service Title & Subtitle */}
                <div className="w-full text-center z-10 mt-auto">
                  <h3 className="text-xs sm:text-[13px] font-extrabold text-white leading-tight drop-shadow-xs line-clamp-1">
                    {card.name}
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-white/85 mt-0.5 font-normal line-clamp-1">
                    {card.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        )}

        {/* Bottom Fast Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Official National E-Governance & Digital Facilitation</span>
          </div>
          <div className="flex items-center space-x-4 font-bold">
            <Link 
              href="/pvc-card" 
              className="text-rose-600 hover:text-rose-700 flex items-center space-x-1"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Order PVC Card (Doorstep)</span>
            </Link>
            <Link 
              href="/services" 
              className="text-brand-blue hover:text-brand-primary flex items-center space-x-1"
            >
              <span>Explore All Catalog</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
