"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  HelpCircle, 
  Search, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  ExternalLink
} from "lucide-react";
import { subscribeToSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/firestore-service";
import { SiteSettings } from "@/lib/types";

export default function SupportPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    const unsub = subscribeToSiteSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  // Helpline Phone Number (Dynamically updated from Admin Panel)
  const helplinePhone = settings.contactPhone || DEFAULT_SITE_SETTINGS.contactPhone || "+91 6001716993";
  const cleanHelpline = helplinePhone.replace(/[^0-9+]/g, "");

  // Email (Dynamically updated from Admin Panel)
  const contactEmail = settings.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail || "netduniya@gmail.com";

  // WhatsApp Helpline Number (Dynamically updated from Admin Panel - avoids developer number)
  let waDigits = (settings.whatsappNumber || settings.contactPhone || DEFAULT_SITE_SETTINGS.whatsappNumber || "916001716993").replace(/[^0-9]/g, "");
  // If the admin whatsapp number was accidentally defaulting to developer, fallback to contactPhone or default
  if (waDigits.includes("9864761058") && settings.contactPhone) {
    waDigits = settings.contactPhone.replace(/[^0-9]/g, "");
  }
  if (waDigits.length === 10) {
    waDigits = `91${waDigits}`;
  } else if (!waDigits) {
    waDigits = "916001716993";
  }

  const displayWaPhone = waDigits.startsWith("91") && waDigits.length === 12
    ? `+91 ${waDigits.slice(2, 7)} ${waDigits.slice(7)}`
    : `+${waDigits}`;

  const defaultWaMsg = settings.whatsappDefaultMessage || "Hello NetDuniya, I need help with an online citizen service.";
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${waDigits}&text=${encodeURIComponent(defaultWaMsg)}`;

  // Kendra Location (Dynamically updated from Admin Panel)
  const centerAddress = settings.address || DEFAULT_SITE_SETTINGS.address || "Net Duniya Digital Center, Hajo Daulashal Road, Near Khongra Post Office, Barpeta, Assam 781305";
  const workingHours = settings.workingHours || DEFAULT_SITE_SETTINGS.workingHours || "8:00 AM – 9:00 PM (Daily)";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-10 shadow-card border-b-4 border-amber-500">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-black uppercase tracking-wider bg-white/10 text-amber-300 px-3 py-1 rounded inline-block">
            Dedicated Customer Care & Helpline
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Need help with your application, payment verification, appointment, or PVC card order? Our certified e-governance support team is ready to assist you.
          </p>
          <div className="pt-2 flex items-center space-x-2 text-xs text-amber-300 font-semibold">
            <Clock className="h-4 w-4" />
            <span>Working Hours: {workingHours}</span>
          </div>
        </div>
      </div>

      {/* Support Channels Grid - 4 Dynamic Cards (Helpline, WhatsApp, Email, Center Address) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Helpline Phone */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200 flex flex-col justify-between space-y-3 text-center">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Phone className="h-6 w-6" />
            </div>
            <h3 className="font-black text-sm text-slate-900">Helpline Phone</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct Voice Assistance</p>
            <p className="text-xs font-black text-slate-800 mt-2 truncate">{helplinePhone}</p>
          </div>
          <a
            href={`tel:${cleanHelpline}`}
            className="block w-full text-xs font-black text-white bg-brand-blue hover:bg-brand-primary py-2.5 px-3 rounded-xl transition shadow shadow-blue-500/10"
          >
            Call Helpline
          </a>
        </div>

        {/* 2. WhatsApp Support (Chat on WhatsApp - using dynamic helpline number) */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-emerald-200 flex flex-col justify-between space-y-3 text-center bg-emerald-50/20">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <MessageCircle className="h-6 w-6 fill-emerald-500 text-white" />
            </div>
            <h3 className="font-black text-sm text-slate-900">WhatsApp Helpline</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Chat & Send Documents</p>
            <p className="text-xs font-black text-emerald-700 mt-2 truncate">{displayWaPhone}</p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 px-3 rounded-xl transition shadow shadow-emerald-500/10 flex items-center justify-center space-x-1.5"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        {/* 3. Email Support (Real-time admin dynamic Gmail) */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200 flex flex-col justify-between space-y-3 text-center">
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="font-black text-sm text-slate-900">Email Support</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Official Helpdesk Response</p>
            <p className="text-xs font-black text-slate-800 mt-2 truncate" title={contactEmail}>{contactEmail}</p>
          </div>
          <a
            href={`mailto:${contactEmail}`}
            className="block w-full text-xs font-black text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-2.5 px-3 rounded-xl transition"
          >
            Send Email
          </a>
        </div>

        {/* 4. Center Location */}
        <div className="bg-white p-5 rounded-2xl shadow-card border border-slate-200 flex flex-col justify-between space-y-3 text-center">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="font-black text-sm text-slate-900">Center Location</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Physical Seva Kendra</p>
            <p className="text-[11px] font-bold text-slate-700 mt-2 line-clamp-2" title={centerAddress}>
              {centerAddress}
            </p>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centerAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-xs font-black text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2.5 px-3 rounded-xl transition"
          >
            View on Map
          </a>
        </div>

      </div>

      {/* Official Help & Grievance Notice from Admin Settings */}
      {settings.helpSupportContent && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-3 text-xs text-slate-700 leading-relaxed">
          <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-slate-900 font-bold mb-1">Official Support Policy & Resolution</strong>
            <span>{settings.helpSupportContent}</span>
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-3">
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
            <Search className="h-5 w-5 text-brand-blue" />
            <span>Track Application or PVC Card</span>
          </h3>
          <p className="text-xs text-slate-600">
            Already applied? Check live progress, view operator remarks, and download approved certificates directly.
          </p>
          <Link
            href="/track"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-blue hover:text-brand-primary"
          >
            <span>Go to Tracking Portal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-card border border-slate-200 space-y-3">
          <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            <span>Support Ticket Desk</span>
          </h3>
          <p className="text-xs text-slate-600">
            Create a support ticket for payment clarification, refund inquiries, or urgent application document corrections.
          </p>
          <Link
            href="/dashboard/support"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Open Support Ticket</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}
