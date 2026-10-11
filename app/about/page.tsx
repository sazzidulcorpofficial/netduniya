"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  Award, 
  Landmark, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Building2,
  Printer,
  Sparkles,
  Zap,
  Clock
} from "lucide-react";
import FounderSection from "@/components/home/FounderSection";
import { subscribeToSiteSettings, DEFAULT_SITE_SETTINGS } from "@/lib/firestore-service";
import { SiteSettings } from "@/lib/types";

export default function AboutPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    const unsub = subscribeToSiteSettings((s) => setSettings(s));
    return () => unsub();
  }, []);

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
      

      {/* Categorized Services Overview */}
      <section className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-10 space-y-8">
        <div className="border-b pb-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-brand-blue" />
            <span>Our Comprehensive Services</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            NetDuniya brings multiple categories of citizen and digital services together under one unified portal:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-200 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-900 flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-blue-700" />
              <span>1. ID Cards & Government Documents</span>
            </h3>
            <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>Aadhaar Card</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>Voter ID Card</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>PAN Card</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>ABHA Card</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>Ayushman Card</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>APAAR ID Card</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>e-Shram Card</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>Driving Licence</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>RC PVC Card</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" /><span>Ration Card PVC</span></li>
            </ul>
          </div>

          <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-emerald-900 flex items-center space-x-2">
              <Landmark className="h-4 w-4 text-emerald-700" />
              <span>2. Government Schemes & Banking</span>
            </h3>
            <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>PM Kisan eKYC</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Orunodoi</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>PMAY Scheme</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Account Opening</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Money Transfer</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>PF Withdrawal</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Udyam Registration</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>E-Khajana</span></li>
            </ul>
          </div>

          <div className="bg-violet-50/60 p-5 rounded-2xl border border-violet-200 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-violet-900 flex items-center space-x-2">
              <FileText className="h-4 w-4 text-violet-700" />
              <span>3. Certificates & Online Forms</span>
            </h3>
            <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" /><span>Income Certificate</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" /><span>Birth Certificate</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" /><span>Jamabandi</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" /><span>Police Verification</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" /><span>HS 1st Year Darpan</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" /><span>BA Samarth Admission</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" /><span>Voter Foli Copy</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" /><span>PUC Certificate</span></li>
            </ul>
          </div>

          <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-200 space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-rose-900 flex items-center space-x-2">
              <Printer className="h-4 w-4 text-rose-700" />
              <span>4. Printing & Digital Services</span>
            </h3>
            <ul className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" /><span>Smart PVC Cards</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" /><span>Xerox & Printout</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" /><span>Passport Photo</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" /><span>Lamination</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" /><span>Bio Data / Resume</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" /><span>Flight & Train Tickets</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" /><span>Mobile Recharge</span></li>
              <li className="flex items-center space-x-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" /><span>DTH & Bill Pay</span></li>
            </ul>
          </div>

        </div>
      </section>

      {/* Mission & Approach */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-slate-200 space-y-3">
          <h3 className="text-lg font-black text-slate-900">Our Mission</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Our mission is to make digital services easier to understand and access, especially for people who may need assistance with online applications and digital processes.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-card border border-slate-200 space-y-3">
          <h3 className="text-lg font-black text-slate-900">Our Approach</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            <li className="flex items-center space-x-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Simple user experience</span></li>
            <li className="flex items-center space-x-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Transparent service info</span></li>
            <li className="flex items-center space-x-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Secure payments</span></li>
            <li className="flex items-center space-x-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Clear application tracking</span></li>
            <li className="flex items-center space-x-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Accessible digital assistance</span></li>
            <li className="flex items-center space-x-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" /><span>Responsive customer support</span></li>
          </ul>
        </div>
      </section>

      {/* Important Notice */}
      <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 space-y-2 text-xs text-amber-950">
        <h3 className="text-sm font-black uppercase tracking-wider text-amber-900">Important Notice</h3>
        <p className="font-semibold">
          NetDuniya is an independent service-assistance platform. It does not claim to be a government department or official government portal.
        </p>
        <p className="text-amber-900">
          Government applications, approvals and decisions remain under the authority of the relevant government department or authorised organisation.
        </p>
      </section>

      {/* Founder Section */}
      <FounderSection />

      {/* Support & Need Help Section – Dynamic from Admin Settings */}
      <section className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-4">
        <h3 className="text-xl font-black text-slate-900">Need Help?</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          {settings.helpSupportContent || "If you have a question regarding: Application status, Payment, Appointment, Service request, Order, Refund, Technical issue, or Account & wallet, please contact NetDuniya through our official support details below:"}
        </p>
        <div className="bg-blue-50/70 p-5 rounded-xl border border-blue-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-800 font-medium">
          <p className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-brand-blue flex-shrink-0" />
            <span><strong>Phone:</strong> {settings.contactPhone || "+91 6001716993"}</span>
          </p>
          <p className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-brand-blue flex-shrink-0" />
            <span><strong>Email:</strong> {settings.contactEmail || "netduniya@gmail.com"}</span>
          </p>
          <p className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-brand-blue flex-shrink-0" />
            <span><strong>Location:</strong> {settings.address || "Senga, Khongra, Barpeta, Assam 781305"}</span>
          </p>
        </div>
        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span><strong>Working Hours:</strong> {settings.workingHours || "8:00 AM – 9:00 PM (Daily)"}</span>
          </div>
          <a
            href={`https://wa.me/${settings.whatsappNumber || "919864761058"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow transition"
          >
            WhatsApp Us →
          </a>
        </div>
        <div className="pt-2 flex justify-center">
          <Link
            href="/services"
            className="bg-brand-accent hover:bg-brand-accentHover text-white font-black text-xs sm:text-sm py-3 px-8 rounded-xl shadow-lg transition flex items-center space-x-1.5"
          >
            <span>Explore All Services</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
