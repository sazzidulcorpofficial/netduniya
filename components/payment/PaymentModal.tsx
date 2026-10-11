"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Wallet, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Smartphone,
  Info
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  executeWalletTransaction, 
  subscribeToSiteSettings, 
  DEFAULT_SITE_SETTINGS,
  validateUtrNumber,
  isUtrAlreadyUsed,
  registerUtr
} from "@/lib/firestore-service";
import { SiteSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  description?: string;
  referenceId: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  initialTab?: 'wallet' | 'upi';
  onSuccess: (paymentDetails: {
    paymentId: string;
    method: 'wallet' | 'upi';
    amount: number;
    referenceId?: string;
    utrNumber?: string;
  }) => Promise<void> | void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  title,
  description,
  referenceId,
  userEmail,
  userName,
  userPhone,
  initialTab,
  onSuccess,
}: PaymentModalProps) {
  const { user, profile, walletBalance, refreshProfile } = useAuth();
  const isWalletRecharge = title.toLowerCase().includes("wallet") || referenceId.startsWith("TOPUP") || referenceId.startsWith("WTOP");
  
  const getInitialTab = (): 'wallet' | 'upi' => {
    if (initialTab) return initialTab === 'wallet' ? 'wallet' : 'upi';
    if (isWalletRecharge) return 'upi';
    if (walletBalance >= amount) return 'wallet';
    return 'upi';
  };

  const [activeTab, setActiveTab] = useState<'wallet' | 'upi'>(getInitialTab);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes session
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // Load admin-configured UPI from Firestore
  useEffect(() => {
    const unsub = subscribeToSiteSettings((s) => setSiteSettings(s));
    return () => unsub();
  }, []);

  // Dynamic UPI from Admin Settings
  const merchantUpiId = siteSettings.upiId || DEFAULT_SITE_SETTINGS.upiId || "9864761058@ybl";
  const merchantName = siteSettings.upiName || siteSettings.siteName || "NetDuniya Cyber Cafe";

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setUtrNumber("");
    setTimeLeft(600);
    setActiveTab(getInitialTab());
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, initialTab, amount, walletBalance]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Encoded UPI Intent Link
  const upiIntentString = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`NetDuniya_${referenceId}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentString)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // 1. Process Wallet Payment
  const handleWalletPay = async () => {
    if (!user) {
      setErrorMsg("Please log in to pay with your digital wallet.");
      return;
    }
    if (walletBalance < amount) {
      setErrorMsg(`Insufficient Wallet Balance. Required: ₹${amount}, Available: ₹${walletBalance}. Please recharge or use UPI payment.`);
      return;
    }

    setProcessing(true);
    setErrorMsg(null);
    try {
      const debitRes = await executeWalletTransaction(
        user.uid,
        amount,
        'debit',
        'service_payment',
        `Payment for ${title} (${referenceId})`,
        referenceId,
        profile?.fullName || user.email || 'citizen'
      );

      if (!debitRes.success) {
        throw new Error(debitRes.error || "Wallet debit failed");
      }

      await refreshProfile();
      await onSuccess({
        paymentId: `WAL-${Date.now()}`,
        method: 'wallet',
        amount,
        referenceId,
      });
      onClose();
    } catch (err: any) {
      console.error("Wallet payment error:", err);
      setErrorMsg(err.message || "Failed to process wallet debit. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // 2. Process Instant UPI Payment with UTR confirmation and fraud check
  const handleUpiConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    
    // Step 1: Validate 12-digit format & non-dummy sequence
    const validation = validateUtrNumber(cleanUtr);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Please enter a valid 12-digit UPI UTR number.");
      return;
    }

    setProcessing(true);
    setErrorMsg(null);

    try {
      // Step 2: Uniqueness check across Firestore (one UTR can only be used once!)
      const alreadyUsed = await isUtrAlreadyUsed(cleanUtr);
      if (alreadyUsed) {
        setErrorMsg("Yeh UTR / Reference Number pehle hi use kiya ja chuka hai! Ek UTR number ko kewal ek hi baar use kar sakte hain.");
        setProcessing(false);
        return;
      }

      // Step 3: Register UTR in registry to lock it
      await registerUtr(cleanUtr, {
        userId: user?.uid || "guest",
        amount,
        purpose: title,
        referenceId,
      });

      // Step 4: Callback with verified UPI details
      await onSuccess({
        paymentId: `UPI-${cleanUtr}`,
        method: 'upi',
        amount,
        referenceId,
        utrNumber: cleanUtr,
      });

      onClose();
    } catch (err: any) {
      console.error("UPI Confirmation error:", err);
      setErrorMsg(err.message || "Failed to confirm UPI payment.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-brand-blue to-blue-900 text-white p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shadow">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">Secure Payment Checkout</h2>
              <p className="text-xs text-slate-300">NetDuniya Direct UPI & QR Code Portal</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order Summary Strip */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Payable For</span>
            <span className="text-xs font-black text-slate-900 truncate max-w-[240px] block">{title}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Amount</span>
            <span className="text-xl font-black text-emerald-700">{formatCurrency(amount)}</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Payment Method Tabs */}
        <div className="p-5 space-y-4">
          {!isWalletRecharge && (
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setActiveTab('wallet'); setErrorMsg(null); }}
                className={`py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'wallet'
                    ? "bg-white text-brand-blue shadow-sm font-black ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Wallet className="h-4 w-4 text-amber-500" />
                <span>Digital Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('upi'); setErrorMsg(null); }}
                className={`py-2 px-1 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'upi'
                    ? "bg-white text-brand-blue shadow-sm font-black ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="h-4 w-4 text-emerald-500" />
                <span>UPI QR Code</span>
              </button>
            </div>
          )}

          {/* TAB 1: DIGITAL WALLET */}
          {activeTab === 'wallet' && !isWalletRecharge && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 rounded-2xl border border-white/10 shadow-inner flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
                    Available Wallet Balance
                  </span>
                  <span className="text-2xl font-black text-amber-300">
                    {formatCurrency(walletBalance)}
                  </span>
                </div>
                <div className="p-2.5 rounded-full bg-amber-400/20 text-amber-400">
                  <Wallet className="h-6 w-6" />
                </div>
              </div>

              {walletBalance >= amount ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center space-x-2.5 text-xs text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <strong className="block font-bold">Sufficient Balance Available</strong>
                    <span>Instant 1-click payment from your pre-paid wallet balance.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs text-amber-900">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <strong>Low Wallet Balance</strong>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    You need <strong>{formatCurrency(amount - walletBalance)}</strong> more. Please switch to the <strong>UPI QR Code</strong> tab to pay directly.
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={walletBalance < amount || processing}
                onClick={handleWalletPay}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Debit...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    <span>Pay {formatCurrency(amount)} with Digital Wallet</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: INSTANT UPI QR CODE (Default & Direct) */}
          {activeTab === 'upi' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Timer & Security Banner */}
              <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl font-semibold">
                <span>⏱️ Payment Session Active</span>
                <span className="font-mono font-black text-amber-800">{formattedTime}</span>
              </div>

              {/* QR Code Container */}
              <div className="bg-gradient-to-b from-slate-50 to-white p-4 rounded-2xl border-2 border-slate-200 text-center space-y-3">
                <div className="inline-block p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt={`Scan & Pay ${formatCurrency(amount)}`}
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-black text-slate-900 block">
                    Scan via Any UPI App (GPay, PhonePe, Paytm, BHIM)
                  </span>
                  <div className="text-xl font-black text-brand-blue">
                    {formatCurrency(amount)}
                  </div>
                </div>

                {/* Merchant UPI ID Strip */}
                <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border text-xs">
                  <div className="text-left truncate mr-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">UPI ID:</span>
                    <span className="font-mono font-bold text-slate-900">{merchantUpiId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="bg-white hover:bg-slate-50 text-slate-800 border px-3 py-1.5 rounded-lg font-bold text-xs flex items-center space-x-1 shadow-sm transition flex-shrink-0 cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* UTR Input Form */}
              <form onSubmit={handleUpiConfirm} className="space-y-3 bg-blue-50/60 p-4 rounded-2xl border border-blue-200">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    Enter 12-Digit UPI UTR / Reference No. *
                  </label>
                  <p className="text-[11px] text-slate-600 mb-2">
                    Payment karne ke baad aapke UPI app (Google Pay / PhonePe / Paytm) mein 12-digit UTR number aata hai, yahan darj karein.
                  </p>
                  <input
                    type="text"
                    maxLength={12}
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 425678912345"
                    className="w-full bg-white border-2 border-slate-300 focus:border-brand-blue rounded-xl p-3 text-sm font-mono font-black text-slate-900 outline-none transition text-center tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={processing || utrNumber.length !== 12}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying 12-Digit UTR...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Submit UTR & Confirm {formatCurrency(amount)}</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
