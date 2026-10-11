"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Fingerprint,
  Vote,
  CreditCard,
  HeartPulse,
  ShieldPlus,
  GraduationCap,
  HardHat,
  Car,
  Compass,
  FileBadge2,
  ShoppingBag,
  Send,
  Building2,
  Banknote,
  Plane,
  Train,
  Receipt,
  Baby,
  Wind,
  PiggyBank,
  Coins,
  FileEdit,
  FileSearch,
  Map,
  Briefcase,
  UserCheck,
  School,
  BadgeCheck,
  Heart,
  Sprout,
  ClipboardList,
  Umbrella,
  Flame,
  Home,
  Sun,
  Radio,
  Wifi,
  Smartphone,
  Zap,
  Tv,
  Copy,
  Printer,
  Layers,
  Camera,
  Image,
  Palette,
  FileText,
  Activity,
  ShieldCheck,
  Award,
  Scroll,
  BookOpen,
  Sparkles
} from "lucide-react";

export interface ServiceVisualMeta {
  Icon: LucideIcon;
  gradient: string;
  bgLight: string;
  textColor: string;
  badgeBg: string;
}

// 20 Unique curated vibrant gradient themes
const DISTINCT_GRADIENTS = [
  { gradient: "from-sky-500 to-cyan-600", bgLight: "bg-sky-50", textColor: "text-sky-600", badgeBg: "bg-sky-100 text-sky-800 border-sky-200" },
  { gradient: "from-amber-500 to-orange-600", bgLight: "bg-amber-50", textColor: "text-amber-600", badgeBg: "bg-amber-100 text-amber-800 border-amber-200" },
  { gradient: "from-purple-600 to-violet-700", bgLight: "bg-purple-50", textColor: "text-purple-600", badgeBg: "bg-purple-100 text-purple-800 border-purple-200" },
  { gradient: "from-emerald-500 to-teal-700", bgLight: "bg-emerald-50", textColor: "text-emerald-600", badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { gradient: "from-rose-500 to-red-600", bgLight: "bg-rose-50", textColor: "text-rose-600", badgeBg: "bg-rose-100 text-rose-800 border-rose-200" },
  { gradient: "from-blue-600 to-indigo-700", bgLight: "bg-blue-50", textColor: "text-blue-600", badgeBg: "bg-blue-100 text-blue-800 border-blue-200" },
  { gradient: "from-fuchsia-600 to-pink-600", bgLight: "bg-fuchsia-50", textColor: "text-fuchsia-600", badgeBg: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200" },
  { gradient: "from-teal-500 to-emerald-600", bgLight: "bg-teal-50", textColor: "text-teal-600", badgeBg: "bg-teal-100 text-teal-800 border-teal-200" },
  { gradient: "from-yellow-500 to-amber-600", bgLight: "bg-yellow-50", textColor: "text-yellow-700", badgeBg: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { gradient: "from-indigo-500 to-blue-700", bgLight: "bg-indigo-50", textColor: "text-indigo-600", badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { gradient: "from-orange-500 to-red-600", bgLight: "bg-orange-50", textColor: "text-orange-600", badgeBg: "bg-orange-100 text-orange-800 border-orange-200" },
  { gradient: "from-cyan-500 to-teal-600", bgLight: "bg-cyan-50", textColor: "text-cyan-600", badgeBg: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { gradient: "from-lime-600 to-green-700", bgLight: "bg-lime-50", textColor: "text-lime-700", badgeBg: "bg-lime-100 text-lime-800 border-lime-200" },
  { gradient: "from-pink-500 to-rose-600", bgLight: "bg-pink-50", textColor: "text-pink-600", badgeBg: "bg-pink-100 text-pink-800 border-pink-200" },
  { gradient: "from-violet-500 to-fuchsia-600", bgLight: "bg-violet-50", textColor: "text-violet-600", badgeBg: "bg-violet-100 text-violet-800 border-violet-200" },
  { gradient: "from-slate-700 to-slate-900", bgLight: "bg-slate-100", textColor: "text-slate-800", badgeBg: "bg-slate-200 text-slate-800 border-slate-300" },
];

// Fallback pool of unique icons for hash-based resolution
const FALLBACK_ICONS: LucideIcon[] = [
  Fingerprint, CreditCard, Vote, HeartPulse, ShieldPlus, GraduationCap, HardHat, Car,
  Compass, FileBadge2, ShoppingBag, Send, Building2, Banknote, Plane, Train,
  Receipt, Baby, Wind, PiggyBank, Coins, FileEdit, FileSearch, Map,
  Briefcase, UserCheck, School, BadgeCheck, Heart, Sprout, ClipboardList, Umbrella,
  Flame, Home, Sun, Radio, Wifi, Smartphone, Zap, Tv,
  Copy, Printer, Layers, Camera, Image, Palette, FileText, Activity
];

/**
 * Computes deterministic integer hash of a string
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Intelligent Keyword-to-Icon and Gradient resolution.
 * If user or admin enters ANY service name, this resolves a unique,
 * perfectly matched icon and aesthetic gradient.
 */
export function getServiceVisuals(name: string = "", categoryId: string = "", customIcon?: string): ServiceVisualMeta {
  const safeName = String(name || "service");
  const text = `${safeName} ${categoryId || ""} ${customIcon || ""}`.toLowerCase();
  const hash = Math.abs(hashString(safeName));
  const fallbackColor = DISTINCT_GRADIENTS[hash % DISTINCT_GRADIENTS.length] || DISTINCT_GRADIENTS[0];
  const fallbackIcon = FALLBACK_ICONS[hash % FALLBACK_ICONS.length] || Sparkles;

  // 1. Aadhaar Card / Biometrics
  if (text.includes("aadhaar") || text.includes("aadhar") || text.includes("uidai") || text.includes("biometric") || text.includes("fingerprint")) {
    return {
      Icon: Fingerprint,
      gradient: "from-sky-500 to-cyan-600",
      bgLight: "bg-sky-50",
      textColor: "text-sky-600",
      badgeBg: "bg-sky-100 text-sky-800 border-sky-200"
    };
  }

  // 2. Voter Card / EPIC / Foli Copy
  if (text.includes("voter") || text.includes("epic") || text.includes("foli") || text.includes("election")) {
    return {
      Icon: Vote,
      gradient: "from-purple-600 to-violet-700",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
      badgeBg: "bg-purple-100 text-purple-800 border-purple-200"
    };
  }

  // 3. PAN Card
  if (text.includes("pan card") || text.includes("pan 49a") || text.includes("pan-card") || text.includes("nsdl") || text.includes("utiitsl")) {
    return {
      Icon: CreditCard,
      gradient: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }

  // 4. ABHA Card
  if (text.includes("abha") || text.includes("ndhm") || text.includes("health id")) {
    return {
      Icon: Activity,
      gradient: "from-teal-500 to-emerald-600",
      bgLight: "bg-teal-50",
      textColor: "text-teal-600",
      badgeBg: "bg-teal-100 text-teal-800 border-teal-200"
    };
  }

  // 5. Ayushman Card / PM-JAY
  if (text.includes("ayushman") || text.includes("pmjay") || text.includes("pm-jay") || text.includes("golden card")) {
    return {
      Icon: HeartPulse,
      gradient: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-50",
      textColor: "text-rose-600",
      badgeBg: "bg-rose-100 text-rose-800 border-rose-200"
    };
  }

  // 6. APAAR ID Card (ABC)
  if (text.includes("apaar") || text.includes("abc card") || text.includes("academic bank")) {
    return {
      Icon: GraduationCap,
      gradient: "from-indigo-600 to-violet-700",
      bgLight: "bg-indigo-50",
      textColor: "text-indigo-600",
      badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200"
    };
  }

  // 7. E-Shram Card
  if (text.includes("shram") || text.includes("labour") || text.includes("labor")) {
    return {
      Icon: HardHat,
      gradient: "from-orange-500 to-amber-600",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
      badgeBg: "bg-orange-100 text-orange-800 border-orange-200"
    };
  }

  // 8. Driving Licence / Learner Licence / RC PVC Card
  if (text.includes("learner") || text.includes("ll test")) {
    return {
      Icon: Compass,
      gradient: "from-yellow-500 to-amber-600",
      bgLight: "bg-yellow-50",
      textColor: "text-yellow-700",
      badgeBg: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
  }
  if (text.includes("rc pvc") || text.includes("rc card") || text.includes("registration certificate")) {
    return {
      Icon: FileBadge2,
      gradient: "from-blue-600 to-indigo-700",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      badgeBg: "bg-blue-100 text-blue-800 border-blue-200"
    };
  }
  if (text.includes("driving") || text.includes("licence") || text.includes("license") || text.includes("sarathi") || text.includes("rto")) {
    return {
      Icon: Car,
      gradient: "from-amber-400 to-yellow-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }

  // 9. Ration Card PVC
  if (text.includes("ration") || text.includes("nfsa") || text.includes("epds")) {
    return {
      Icon: ShoppingBag,
      gradient: "from-teal-500 to-cyan-700",
      bgLight: "bg-teal-50",
      textColor: "text-teal-600",
      badgeBg: "bg-teal-100 text-teal-800 border-teal-200"
    };
  }

  // 10. Money Transfer
  if (text.includes("money transfer") || text.includes("dmt") || text.includes("remittance") || text.includes("fund transfer")) {
    return {
      Icon: Send,
      gradient: "from-emerald-600 to-teal-700",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
  }

  // 11. Account Opening
  if (text.includes("account opening") || text.includes("bank account") || text.includes("savings account") || text.includes("zero balance")) {
    return {
      Icon: Building2,
      gradient: "from-blue-600 to-indigo-800",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      badgeBg: "bg-blue-100 text-blue-800 border-blue-200"
    };
  }

  // 12. Cash Withdrawal / Mini ATM / AEPS
  if (text.includes("cash withdrawal") || text.includes("mini atm") || text.includes("aeps") || text.includes("cash deposit") || text.includes("withdrawal")) {
    return {
      Icon: Banknote,
      gradient: "from-green-600 to-emerald-700",
      bgLight: "bg-green-50",
      textColor: "text-green-600",
      badgeBg: "bg-green-100 text-green-800 border-green-200"
    };
  }

  // 13. Flight Ticket Booking
  if (text.includes("flight") || text.includes("airline") || text.includes("air ticket") || text.includes("aviation")) {
    return {
      Icon: Plane,
      gradient: "from-sky-600 to-blue-700",
      bgLight: "bg-sky-50",
      textColor: "text-sky-600",
      badgeBg: "bg-sky-100 text-sky-800 border-sky-200"
    };
  }

  // 14. Railway Ticket Booking
  if (text.includes("railway") || text.includes("train") || text.includes("irctc") || text.includes("tatkal")) {
    return {
      Icon: Train,
      gradient: "from-orange-600 to-red-600",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
      badgeBg: "bg-orange-100 text-orange-800 border-orange-200"
    };
  }

  // 15. Income Certificate / Caste / Domicile
  if (text.includes("income") || text.includes("caste") || text.includes("domicile") || text.includes("prc") || text.includes("edistrict") || text.includes("certificate")) {
    if (text.includes("birth")) {
      return {
        Icon: Baby,
        gradient: "from-pink-500 to-rose-600",
        bgLight: "bg-pink-50",
        textColor: "text-pink-600",
        badgeBg: "bg-pink-100 text-pink-800 border-pink-200"
      };
    }
    return {
      Icon: Receipt,
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
  }

  // 16. Pollution Certificate (PUC)
  if (text.includes("pollution") || text.includes("puc") || text.includes("emission")) {
    return {
      Icon: Wind,
      gradient: "from-cyan-600 to-blue-600",
      bgLight: "bg-cyan-50",
      textColor: "text-cyan-600",
      badgeBg: "bg-cyan-100 text-cyan-800 border-cyan-200"
    };
  }

  // 17. PF Withdrawal / EPFO
  if (text.includes("pf") || text.includes("epfo") || text.includes("provident") || text.includes("uan")) {
    return {
      Icon: PiggyBank,
      gradient: "from-amber-600 to-orange-700",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }

  // 18. E-Khajana / Land Revenue / Jamabandi
  if (text.includes("khajana") || text.includes("revenue") || text.includes("tax")) {
    return {
      Icon: Coins,
      gradient: "from-yellow-600 to-amber-700",
      bgLight: "bg-yellow-50",
      textColor: "text-yellow-700",
      badgeBg: "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
  }
  if (text.includes("jamabandi") || text.includes("land record") || text.includes("dharitree") || text.includes("khatian") || text.includes("patta")) {
    return {
      Icon: Map,
      gradient: "from-lime-600 to-emerald-700",
      bgLight: "bg-lime-50",
      textColor: "text-lime-700",
      badgeBg: "bg-lime-100 text-lime-800 border-lime-200"
    };
  }

  // 19. Online Form Fill-Up
  if (text.includes("form fill") || text.includes("online form") || text.includes("application form")) {
    return {
      Icon: FileEdit,
      gradient: "from-blue-600 to-cyan-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      badgeBg: "bg-blue-100 text-blue-800 border-blue-200"
    };
  }

  // 20. Udyam Registration / MSME
  if (text.includes("udyam") || text.includes("msme") || text.includes("business") || text.includes("gst")) {
    return {
      Icon: Briefcase,
      gradient: "from-indigo-600 to-purple-700",
      bgLight: "bg-indigo-50",
      textColor: "text-indigo-600",
      badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200"
    };
  }

  // 21. Bio Data / Resume
  if (text.includes("bio data") || text.includes("resume") || text.includes("cv") || text.includes("biodata")) {
    return {
      Icon: UserCheck,
      gradient: "from-slate-700 to-slate-900",
      bgLight: "bg-slate-50",
      textColor: "text-slate-700",
      badgeBg: "bg-slate-200 text-slate-800 border-slate-300"
    };
  }

  // 22. HS 1st Year Admission / BA 1st Semester Admission
  if (text.includes("admission") || text.includes("hs 1st") || text.includes("ba 1st") || text.includes("college") || text.includes("darpan") || text.includes("samarth")) {
    return {
      Icon: School,
      gradient: "from-violet-600 to-indigo-700",
      bgLight: "bg-violet-50",
      textColor: "text-violet-600",
      badgeBg: "bg-violet-100 text-violet-800 border-violet-200"
    };
  }

  // 23. Police Verification / PCC
  if (text.includes("police") || text.includes("verification") || text.includes("pcc")) {
    return {
      Icon: BadgeCheck,
      gradient: "from-rose-600 to-red-800",
      bgLight: "bg-rose-50",
      textColor: "text-rose-600",
      badgeBg: "bg-rose-100 text-rose-800 border-rose-200"
    };
  }

  // 24. Government Schemes (PMMVY, PM Kisan, Farmer, PMFBY, PMKVY, PMAY, Orunodoi)
  if (text.includes("pmmvy") || text.includes("matru vandana")) {
    return {
      Icon: Heart,
      gradient: "from-pink-600 to-rose-600",
      bgLight: "bg-pink-50",
      textColor: "text-pink-600",
      badgeBg: "bg-pink-100 text-pink-800 border-pink-200"
    };
  }
  if (text.includes("pm kisan") || text.includes("kisan") || text.includes("farmer")) {
    return {
      Icon: Sprout,
      gradient: "from-emerald-600 to-green-700",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
  }
  if (text.includes("pmfby") || text.includes("fasal bima") || text.includes("crop insurance")) {
    return {
      Icon: Umbrella,
      gradient: "from-teal-600 to-cyan-700",
      bgLight: "bg-teal-50",
      textColor: "text-teal-600",
      badgeBg: "bg-teal-100 text-teal-800 border-teal-200"
    };
  }
  if (text.includes("pmkvy") || text.includes("kaushal")) {
    return {
      Icon: Flame,
      gradient: "from-orange-500 to-amber-600",
      bgLight: "bg-orange-50",
      textColor: "text-orange-600",
      badgeBg: "bg-orange-100 text-orange-800 border-orange-200"
    };
  }
  if (text.includes("pmay") || text.includes("awas")) {
    return {
      Icon: Home,
      gradient: "from-blue-600 to-cyan-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      badgeBg: "bg-blue-100 text-blue-800 border-blue-200"
    };
  }
  if (text.includes("orunodoi") || text.includes("arunodoi") || text.includes("assam")) {
    return {
      Icon: Sun,
      gradient: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }

  // 25. Telecom / SIM / Recharge
  if (text.includes("jio") || text.includes("airtel") || text.includes("sim")) {
    return {
      Icon: Radio,
      gradient: "from-red-500 to-rose-600",
      bgLight: "bg-red-50",
      textColor: "text-red-600",
      badgeBg: "bg-red-100 text-red-800 border-red-200"
    };
  }
  if (text.includes("mobile recharge") || text.includes("recharge")) {
    return {
      Icon: Smartphone,
      gradient: "from-emerald-500 to-green-600",
      bgLight: "bg-emerald-50",
      textColor: "text-emerald-600",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200"
    };
  }
  if (text.includes("electricity") || text.includes("bijli") || text.includes("power") || text.includes("bill")) {
    return {
      Icon: Zap,
      gradient: "from-amber-500 to-yellow-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }
  if (text.includes("dth") || text.includes("dish") || text.includes("tv")) {
    return {
      Icon: Tv,
      gradient: "from-purple-600 to-indigo-600",
      bgLight: "bg-purple-50",
      textColor: "text-purple-600",
      badgeBg: "bg-purple-100 text-purple-800 border-purple-200"
    };
  }

  // 26. Printing & Digital Services
  if (text.includes("xerox")) {
    return {
      Icon: Copy,
      gradient: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50",
      textColor: "text-blue-600",
      badgeBg: "bg-blue-100 text-blue-800 border-blue-200"
    };
  }
  if (text.includes("printout") || text.includes("printing") || text.includes("print")) {
    return {
      Icon: Printer,
      gradient: "from-teal-500 to-emerald-600",
      bgLight: "bg-teal-50",
      textColor: "text-teal-600",
      badgeBg: "bg-teal-100 text-teal-800 border-teal-200"
    };
  }
  if (text.includes("lamination")) {
    return {
      Icon: Layers,
      gradient: "from-amber-600 to-orange-600",
      bgLight: "bg-amber-50",
      textColor: "text-amber-600",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200"
    };
  }
  if (text.includes("passport photo") || text.includes("photo shoot")) {
    return {
      Icon: Camera,
      gradient: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-50",
      textColor: "text-rose-600",
      badgeBg: "bg-rose-100 text-rose-800 border-rose-200"
    };
  }
  if (text.includes("photo frame") || text.includes("binding")) {
    return {
      Icon: Image,
      gradient: "from-violet-600 to-purple-700",
      bgLight: "bg-violet-50",
      textColor: "text-violet-600",
      badgeBg: "bg-violet-100 text-violet-800 border-violet-200"
    };
  }
  if (text.includes("photo editing") || text.includes("jpeg") || text.includes("hd photo") || text.includes("photoshop")) {
    return {
      Icon: Palette,
      gradient: "from-fuchsia-500 to-pink-600",
      bgLight: "bg-fuchsia-50",
      textColor: "text-fuchsia-600",
      badgeBg: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200"
    };
  }

  // Fallback: Deterministic aesthetic gradient and icon based on name hash
  return {
    Icon: fallbackIcon,
    gradient: fallbackColor.gradient,
    bgLight: fallbackColor.bgLight,
    textColor: fallbackColor.textColor,
    badgeBg: fallbackColor.badgeBg,
  };
}

interface ServiceIconBadgeProps {
  name: string;
  categoryId?: string;
  customIcon?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ServiceIconBadge({
  name = "",
  categoryId = "",
  customIcon,
  size = "md",
  className = "",
}: ServiceIconBadgeProps) {
  const visual = getServiceVisuals(name, categoryId, customIcon);
  const CandidateIcon = visual?.Icon;
  const IconComponent = (CandidateIcon && (typeof CandidateIcon === "function" || typeof CandidateIcon === "object"))
    ? CandidateIcon
    : Sparkles;

  const sizeClasses: Record<string, string> = {
    sm: "w-8 h-8 rounded-lg p-1.5",
    md: "w-11 h-11 rounded-xl p-2.5 shadow-sm",
    lg: "w-14 h-14 rounded-2xl p-3.5 shadow-md",
    xl: "w-16 h-16 rounded-2xl p-4 shadow-lg",
  };

  const iconSizes: Record<string, string> = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    xl: "w-8 h-8",
  };

  const gradient = visual?.gradient || "from-sky-500 to-cyan-600";
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-br ${gradient} text-white transition-transform group-hover:scale-105 ${sizeClass} ${className}`}
    >
      <IconComponent className={`${iconSize} text-white drop-shadow-sm`} />
    </div>
  );
}

export default ServiceIconBadge;
