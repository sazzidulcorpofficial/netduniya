"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Clock,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Wallet,
  Lock,
  Loader2,
  FileCheck,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Fingerprint,
  Info,
  Banknote,
  Send
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getServiceBySlug,
  uploadDocument,
  createServiceApplication,
  executeWalletTransaction,
  createPaymentRecord,
  subscribeToServices,
  subscribeToCategories,
  subscribeToSiteSettings,
  DEFAULT_SITE_SETTINGS
} from "@/lib/firestore-service";
import { Service, DynamicFormField, ApplicationDocument, Category } from "@/lib/types";
import { DIGITAL_SEVA_CATEGORIES, INITIAL_INDIAN_SERVICES } from "@/lib/data/indian-services";
import { formatCurrency } from "@/lib/utils";
import PaymentModal from "@/components/payment/PaymentModal";
import { ServiceIconBadge, getServiceVisuals } from "@/lib/service-icons";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const { user, profile, walletBalance, refreshProfile } = useAuth();

  // State
  const [service, setService] = useState<Service | null>(null);
  const [category, setCategory] = useState<any | null>(null);
  const [categoryServices, setCategoryServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, ApplicationDocument>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('cash');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successAppId, setSuccessAppId] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    const unsub = subscribeToSiteSettings((s) => setSiteSettings(s));
    return () => unsub();
  }, []);

  useEffect(() => {
    let unsubServices: (() => void) | null = null;
    let unsubCategories: (() => void) | null = null;

    async function loadData() {
      if (!slug) return;

      const cleanSlug = slug.toLowerCase();

      // 1. INSTANT LOCAL SYNC RESOLUTION (0ms speed - eliminates loading freeze!)
      const fastMatch = INITIAL_INDIAN_SERVICES.find(
        s => s.slug?.toLowerCase() === cleanSlug || s.id?.toLowerCase() === cleanSlug
      );
      if (fastMatch) {
        setService(fastMatch);
        setCategory(null);
        setLoading(false);
      } else {
        const fastCat = DIGITAL_SEVA_CATEGORIES.find(
          c => c.slug?.toLowerCase() === cleanSlug || c.id?.toLowerCase() === cleanSlug || c.id?.toLowerCase() === `cat-${cleanSlug}`
        );
        if (fastCat) {
          setCategory(fastCat);
          const matching = INITIAL_INDIAN_SERVICES.filter(item => {
            const catId = item.categoryId?.toLowerCase() || "";
            const mSlug = fastCat.slug?.toLowerCase() || "";
            return catId === fastCat.id || catId.includes(mSlug);
          });
          setCategoryServices(matching);
          setLoading(false);
        }
      }

      // 2. Background Firestore verification
      try {
        const s = await getServiceBySlug(slug);
        if (s) {
          setService(s);
          setCategory(null);
          setLoading(false);
          return;
        }
      } catch (e) {
        // Safe fallback
      }

      // 3. Category subscription
      unsubCategories = subscribeToCategories((allCategories) => {
        const matchedCat = allCategories.find(
          c => c.slug?.toLowerCase() === cleanSlug ||
            c.id?.toLowerCase() === cleanSlug ||
            c.id?.toLowerCase() === `cat-${cleanSlug}` ||
            c.name?.toLowerCase() === cleanSlug
        ) || DIGITAL_SEVA_CATEGORIES.find(
          c => c.slug?.toLowerCase() === cleanSlug || c.id?.toLowerCase() === cleanSlug || c.id?.toLowerCase() === `cat-${cleanSlug}`
        );

        if (matchedCat) {
          setCategory(matchedCat);
          unsubServices = subscribeToServices((allServices) => {
            const matching = allServices.filter(item => {
              const catId = item.categoryId?.toLowerCase() || "";
              const catName = item.categoryName?.toLowerCase() || "";
              const mSlug = matchedCat.slug?.toLowerCase() || "";
              const mId = matchedCat.id?.toLowerCase() || "";
              const mName = matchedCat.name?.toLowerCase() || "";
              return catId === mId ||
                catId === `cat-${mSlug}` ||
                catId.includes(mSlug) ||
                catName === mName ||
                catName.includes(mName);
            });
            setCategoryServices(matching);
            setLoading(false);
          }, true);
        } else if (!fastMatch) {
          setService(null);
          setCategory(null);
          setLoading(false);
        }
      });
    }

    loadData();

    return () => {
      if (unsubServices) unsubServices();
      if (unsubCategories) unsubCategories();
    };
  }, [slug]);

  const finalFee = service ? (service.discountPrice || service.price) : 0;

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFileUpload = async (field: DynamicFormField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit. Please upload a smaller document.");
      return;
    }

    setUploadingField(field.name);
    try {
      const uploadRes = await uploadDocument(file, `applications/${slug}`, (prog) => {
        setUploadProgress(prog);
      });

      const docObj: ApplicationDocument = {
        id: `doc-${Date.now()}`,
        fieldName: field.name,
        fileName: uploadRes.fileName,
        fileUrl: uploadRes.url,
        fileSize: uploadRes.fileSize,
        mimeType: uploadRes.mimeType,
        uploadedAt: Date.now(),
      };

      setUploadedDocs(prev => ({ ...prev, [field.name]: docObj }));
      setFormData(prev => ({ ...prev, [field.name]: uploadRes.url }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to upload document");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      router.push(`/login?redirect=/services/${slug}`);
      return;
    }

    if (!service) return;

    // Validate required text/select fields
    for (const field of service.formFields) {
      if (field.required && field.type !== 'file') {
        if (!formData[field.name] || formData[field.name].toString().trim() === '') {
          setErrorMsg(`Please fill required field: ${field.label}`);
          return;
        }
      }
    }

    // Option 2: Online Prepaid opens PaymentModal
    if (finalFee > 0 && paymentMode === 'online') {
      setIsPaymentModalOpen(true);
      return;
    }

    // Option 1: Cash / Pay at Kendra books directly without online payment!
    await handleFinalSubmit({
      paymentId: paymentMode === 'cash' ? `CASH-${Date.now().toString().slice(-6)}` : "FREE",
      method: paymentMode === 'cash' ? "cash" : "wallet",
      amount: finalFee,
    });
  };

  const handleFinalSubmit = async (paymentDetails: {
    paymentId: string;
    method: 'wallet' | 'razorpay' | 'upi' | 'cash';
    amount: number;
    referenceId?: string;
    utrNumber?: string;
  }) => {
    if (!user || !service) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (paymentDetails.amount > 0 && paymentDetails.method !== 'wallet' && paymentDetails.method !== 'cash') {
        await createPaymentRecord({
          userId: user.uid,
          userEmail: user.email || "",
          userName: profile?.fullName || formData['fullName'] || user.email || "Applicant",
          amount: paymentDetails.amount,
          currency: "INR",
          purpose: "service_fee",
          referenceId: service.id,
          utrNumber: paymentDetails.utrNumber,
          status: "success",
        });
      }

      const application = await createServiceApplication({
        userId: user.uid,
        userEmail: user.email || "",
        userName: profile?.fullName || formData['fullName'] || user.email || "Applicant",
        userPhone: profile?.phoneNumber || formData['mobileNumber'] || formData['phone'] || "",
        serviceId: service.id,
        serviceName: service.name,
        serviceSlug: service.slug,
        categoryName: service.categoryName || "Digital Services",
        feePaid: paymentDetails.amount,
        paymentId: paymentDetails.paymentId,
        paymentMethod: paymentDetails.method,
        paymentStatus: paymentDetails.method === 'cash' ? 'pending' : 'success',
        status: 'submitted',
        formData: formData,
        documents: Object.values(uploadedDocs),
      });

      setSuccessAppId(application.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading Screen
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <Loader2 className="h-10 w-10 text-brand-blue animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-600">Loading service information...</p>
      </div>
    );
  }

  // 2. Success Screen
  if (successAppId && service) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 animate-fadeIn">
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-200 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-600 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              Application Successfully Submitted
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              Application ID: <span className="text-brand-blue">{successAppId}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
              Your application for <strong>{service.name}</strong> has been received with fee payment of {formatCurrency(finalFee)}. Our verification team will review your submitted details.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2.5">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Service Name:</span>
              <span className="font-bold text-slate-900">{service.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Estimated Turnaround:</span>
              <span className="font-bold text-emerald-700">{service.processingTime}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Service Fee:</span>
              <span className="font-black text-slate-900">{formatCurrency(finalFee)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Payment Mode:</span>
              <span className={`font-black ${paymentMode === 'cash' ? 'text-amber-700' : 'text-emerald-700'}`}>
                {paymentMode === 'cash' ? 'Pay at Kendra (Offline Cash)' : 'Paid Online (UPI / Wallet)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Documents Status:</span>
              <span className="font-bold text-slate-900">Recorded for Verification</span>
            </div>
          </div>

          {/* WhatsApp Support Assistance */}
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-4 text-left space-y-2">
            <span className="font-black text-xs text-emerald-950 flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600" />
              Document Verification via WhatsApp
            </span>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Aapka Application ID: <strong>{successAppId}</strong> hai. Yadi koi document ya photo bhejna baaki ho, to aap hamare official WhatsApp number par bhej sakte hain.
            </p>
            <a
              href={`https://wa.me/${(() => {
                const target = (siteSettings?.whatsappNumber || siteSettings?.contactPhone || "916001716993").replace(/[^0-9]/g, "");
                return target.length === 10 ? `91${target}` : (target || "916001716993");
              })()}?text=${encodeURIComponent(`Hello NetDuniya, I have submitted Application ID: ${successAppId} for ${service.name}. Please verify my details.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-1.5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow transition active:scale-98"
            >
              <span>Connect on WhatsApp &rarr;</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/track?id=${successAppId}`}
              className="w-full sm:w-auto bg-brand-blue hover:bg-brand-primary text-white font-bold text-xs py-3 px-6 rounded-xl shadow transition"
            >
              Track Application Status
            </Link>
            <Link
              href="/dashboard/applications"
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-6 rounded-xl transition"
            >
              View in My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. CATEGORY HUB VIEW: (e.g. When clicking "Aadhaar Card" -> opens sub-services list)
  if (category) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn px-4 sm:px-6">
        {/* Top Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-brand-blue flex items-center">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Home
          </Link>
          <span>/</span>
          <Link href="/services" className="hover:text-brand-blue">
            All Services
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">{category.name}</span>
        </div>

        {/* Category Hero Banner - Guaranteed Visible & Stunning */}
        <div
          className="rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden border border-slate-700/80 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950"
          style={{ backgroundColor: '#0b132b' }}
        >
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-blue-600/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-sm">
                {category.badgeText || "Official E-Governance"}
              </span>
              {category.hindiName && (
                <span className="text-xs text-slate-300 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  {category.hindiName}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              {category.name} Services & Online Assistance
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed font-normal">
              {category.description || "Fast, verified government document assistance and e-governance processing."} Select a specific sub-service below to fill the assisted application form.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-200">
              <span className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>UIDAI & Govt Verified</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>Fast Track Processing</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <Sparkles className="h-4 w-4 text-sky-400" />
                <span>Real-Time Citizen Help</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Services List Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Available {category.name} Sub-Services
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any service below to proceed with citizen application and document verification.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {categoryServices.length} Services Available
          </span>
        </div>

        {/* Sub-Services Grid - Compact, Modern, High-End Card Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {categoryServices.map((subService) => {
            const priceVal = subService.discountPrice ?? subService.price ?? 0;
            return (
              <div
                key={subService.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-brand-blue p-4 flex flex-col justify-between transition-all duration-200 group relative overflow-hidden"
              >
                {/* Top Subtle Brand Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue via-indigo-500 to-amber-400" />

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase text-brand-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {subService.categoryName || category.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 text-amber-500 mr-1 flex-shrink-0" />
                      {subService.processingTime || "24-48 Hrs"}
                    </span>
                  </div>

                  <div className="flex items-start space-x-2.5 my-1.5">
                    <ServiceIconBadge
                      name={subService.name}
                      categoryId={subService.categoryId}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-brand-blue transition leading-snug line-clamp-2">
                        {subService.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {subService.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Required Documents Micro Chip Preview */}
                  {subService.requiredDocuments && subService.requiredDocuments.length > 0 && (
                    <div className="mt-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">
                        Required Documents:
                      </span>
                      <ul className="text-[10px] text-slate-600 space-y-0.5">
                        {subService.requiredDocuments.slice(0, 2).map((doc, idx) => (
                          <li key={idx} className="flex items-center truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 flex-shrink-0" />
                            <span className="truncate">{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Footer with Compact Price and Apply Button */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Govt / Cafe Fee</span>
                    <span className="text-base font-black text-emerald-700">
                      {priceVal === 0 ? "Free / Portal" : formatCurrency(priceVal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setService(subService);
                      setCategory(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="bg-brand-blue hover:bg-brand-primary text-white text-[11px] font-black py-2 px-3.5 rounded-xl shadow-xs hover:shadow-md transition flex items-center space-x-1.5 cursor-pointer group-hover:scale-102"
                  >
                    <span>Apply Online</span>
                    <ArrowRight className="h-3 w-3 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Smart PVC Card Alternative CTA */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-pink-500 text-white rounded-2xl shadow">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Need High-Quality Smart PVC Card for {category.name}?</h4>
              <p className="text-xs text-slate-600 mt-0.5">Order waterproof plastic smart cards with doorstep courier delivery.</p>
            </div>
          </div>
          <Link
            href="/pvc-card"
            className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-black py-3 px-5 rounded-xl shadow transition flex-shrink-0"
          >
            Order PVC Card (Doorstep) &rarr;
          </Link>
        </div>

      </div>
    );
  }

  // 4. Not Found Screen
  if (!service) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-white rounded-2xl shadow p-8">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Service or Category Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested digital service is currently unpublished or invalid.</p>
        <Link href="/services" className="mt-4 inline-block bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-xl">
          ← Back to All Services
        </Link>
      </div>
    );
  }

  // 5. APPLICATION FORM VIEW (3 Clearly Numbered Steps with Fee at Step 3!)
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn px-4 sm:px-6">

      {/* Top Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/services" className="hover:text-brand-blue flex items-center">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Services
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">{service.name}</span>
      </div>

      {/* Service Overview Hero Banner - Ultra-Premium, Guaranteed 100% Contrast & Visibility */}
      <div
        className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-l-8 border-amber-400 relative overflow-hidden"
        style={{ backgroundColor: '#0b132b' }}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30 backdrop-blur-sm inline-block">
              {service.categoryName || "Citizen Service"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">{service.name}</h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed font-normal">
              {service.shortDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-200 font-semibold">
              <span className="flex items-center bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <Clock className="h-4 w-4 text-amber-400 mr-1.5" />
                Turnaround: <strong className="text-white ml-1">{service.processingTime || "24-48 Hours"}</strong>
              </span>
              <span className="flex items-center bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400 mr-1.5" />
                100% Verified Indian Standard
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center flex-shrink-0 shadow-lg">
            <span className="text-[10px] uppercase tracking-wider text-amber-300 block font-bold">Cyber Cafe Service Fee</span>
            <div className="flex items-baseline justify-center space-x-2 mt-1">
              <span className="text-3xl font-black text-amber-300">{formatCurrency(finalFee)}</span>
              {service.discountPrice && service.discountPrice < service.price && (
                <span className="text-sm text-slate-400 line-through">{formatCurrency(service.price)}</span>
              )}
            </div>
            <span className="text-[10px] text-emerald-300 block mt-1 font-semibold">Includes Form Verification & Filing</span>
          </div>
        </div>
      </div>

      {/* Main Form Box: Organized into 3 Specific Stages */}
      <div className="bg-white rounded-3xl shadow-card border border-slate-200 p-6 sm:p-8">

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* =========================================================================
              STEP 1: CITIZEN INFORMATION & DETAILS (नागरिक विवरण)
             ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-200 pb-3">
              <span className="w-7 h-7 rounded-full bg-brand-blue text-white font-black text-xs flex items-center justify-center shadow-sm">
                1
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Step 1: Citizen Details (नागरिक विवरण)
                </h2>
                <p className="text-xs text-slate-500">
                  Fill the information exactly as written in your official documents.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {service.formFields.filter(f => f.type !== 'file').map((field) => {
                if (field.type === 'select') {
                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      >
                        <option value="">-- Select {field.label} --</option>
                        {field.options?.map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === 'textarea') {
                  return (
                    <div key={field.id} className="sm:col-span-2 space-y-1">
                      <label className="block text-xs font-bold text-slate-800">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <textarea
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.id} className="space-y-1">
                    <label className="block text-xs font-bold text-slate-800">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                    />
                    {field.helpText && <p className="text-[11px] text-slate-400">{field.helpText}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              STEP 2: REQUIRED INDIAN DOCUMENTS (आवश्यक सरकारी दस्तावेज)
             ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-200 pb-3">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                2
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Step 2: Required Documents (आवश्यक दस्तावेज)
                </h2>
                <p className="text-xs text-slate-500">
                  Enter document reference or send copy directly on WhatsApp after form submission.
                </p>
              </div>
            </div>

            {/* Document Checklist Alert */}
            {service.requiredDocuments && service.requiredDocuments.length > 0 && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <span className="text-xs font-black text-emerald-950 flex items-center">
                  <FileCheck className="h-4 w-4 mr-1.5 text-emerald-600" />
                  Required Document Checklist (Govt of India Compliant):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {service.requiredDocuments.map((doc, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Reference Input fields */}
            <div className="space-y-3">
              {service.formFields.filter(f => f.type === 'file').map((field) => (
                <div key={field.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      {field.label} (ID Number / Reference)
                    </label>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded">
                      WhatsApp Verified
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={`Enter ${field.label} reference details`}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-brand-blue focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================================
              STEP 3: GOVERNMENT & PORTAL SERVICE FEE (तीसरे स्थान पर स्पष्ट शुल्क)
             ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-200 pb-3">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                3
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Step 3: Cyber Cafe Fee & Payment (सेवा शुल्क)
                </h2>
                <p className="text-xs text-slate-500">
                  Transparent pricing: Official government processing & verification fee breakdown.
                </p>
              </div>
            </div>

            {/* Highlighted Fee Box (Position 3 as explicitly requested!) */}
            <div className="p-5 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-white rounded-2xl border-2 border-amber-300 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-800 block">
                    Cyber Cafe Service Fee (कुल शुल्क)
                  </span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-3xl font-black text-slate-900">
                      {formatCurrency(finalFee)}
                    </span>
                    {service.discountPrice && service.discountPrice < service.price && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(service.price)}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      All Taxes Included
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-500 block">Expected Delivery:</span>
                  <span className="font-extrabold text-xs text-brand-blue">{service.processingTime}</span>
                </div>
              </div>

              {/* Fee Features List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Document Pre-check</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Instant Tracking ID</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Full WhatsApp Support</span>
                </div>
              </div>

              {/* 2 CHECKOUT PAYMENT MODES AS REQUESTED */}
              <div className="pt-2 border-t border-amber-200/60 space-y-3">
                <span className="text-xs font-black text-slate-900 block">
                  Select Payment Option (भुगतान विधि चुनें):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* OPTION 1: CASH / PAY AT KENDRA */}
                  <label
                    onClick={() => setPaymentMode('cash')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${paymentMode === 'cash'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <Banknote className="h-5 w-5 text-emerald-600" />
                          <span className="text-xs font-black text-slate-900">Cash / Pay at Kendra</span>
                        </div>
                        <input
                          type="radio"
                          name="service_pay_mode"
                          checked={paymentMode === 'cash'}
                          onChange={() => setPaymentMode('cash')}
                          className="accent-emerald-600"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Apply now with zero advance online payment. Pay <strong>{formatCurrency(finalFee)}</strong> directly at our Kendra during document verification or certificate collection.
                      </p>
                    </div>
                    <span className="inline-block mt-3 text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded w-max">
                      ✓ No Online Payment Needed
                    </span>
                  </label>

                  {/* OPTION 2: PREPAID ONLINE (UPI QR / WALLET) */}
                  <label
                    onClick={() => setPaymentMode('online')}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${paymentMode === 'online'
                        ? 'border-brand-blue bg-blue-50/80 shadow-md ring-2 ring-brand-blue/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-5 w-5 text-brand-blue" />
                          <span className="text-xs font-black text-slate-900">Prepaid Online (UPI QR / Wallet)</span>
                        </div>
                        <input
                          type="radio"
                          name="service_pay_mode"
                          checked={paymentMode === 'online'}
                          onChange={() => setPaymentMode('online')}
                          className="accent-brand-blue"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Scan dynamic Bharat UPI QR with PhonePe, Google Pay, Paytm, BHIM or deduct directly from your NetDuniya Wallet.
                      </p>
                    </div>
                    <span className="inline-block mt-3 text-[10px] font-black uppercase text-brand-blue bg-blue-100 px-2 py-0.5 rounded w-max">
                      ⚡ Instant Fast-Track
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Action Button */}
          <div className="pt-2 space-y-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xl transition transform active:scale-98 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 ${paymentMode === 'cash'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800'
                  : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900'
                }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span>Processing Application...</span>
                </>
              ) : paymentMode === 'cash' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Book Application (Pay {formatCurrency(finalFee)} at Kendra)</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Pay Online via UPI QR ({formatCurrency(finalFee)}) & Submit Form</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              🔒 256-Bit SSL Encrypted Submission • NetDuniya National E-Governance Kendra
            </p>
          </div>

        </form>
      </div>

      {/* Checkout Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          amount={finalFee}
          title={`Application: ${service.name}`}
          description={`Government & Portal processing fee for ${service.name}`}
          referenceId={`APP-${Date.now()}`}
          onSuccess={handleFinalSubmit}
        />
      )}

    </div>
  );
}
