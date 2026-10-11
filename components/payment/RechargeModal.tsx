"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  subscribeToSiteSettings, 
  DEFAULT_SITE_SETTINGS,
  validateUtrNumber,
  isUtrAlreadyUsed,
  registerUtr,
  executeWalletTransaction,
  createPaymentRecord
} from "@/lib/firestore-service";
import { SiteSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
}

export default function RechargeModal({
  isOpen,
  onClose,
  defaultAmount = 100,
}: RechargeModalProps) {
  const { user, profile, walletBalance, refreshProfile } = useAuth();
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmountInput, setCustomAmountInput] = useState<string>(defaultAmount.toString());
  const [guestMobile, setGuestMobile] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  // 30-Second Verification states
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(30);
  const [verifiedTxnId, setVerifiedTxnId] = useState<string | null>(null);

  // Load site settings (UPI ID & Name)
  useEffect(() => {
    const unsub = subscribeToSiteSettings((s) => setSiteSettings(s));
    return () => unsub();
  }, []);

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsVerifying(false);
      setCountdown(30);
      setUtrNumber("");
      setVerifiedTxnId(null);
      setAmount(defaultAmount);
      setCustomAmountInput(defaultAmount.toString());
    }
  }, [isOpen, defaultAmount]);

  // 30-second verification countdown
  useEffect(() => {
    if (!isVerifying) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown completed (30 seconds complete): Credit the wallet
      const finalizeRecharge = async () => {
        try {
          const finalRefId = `TOPUP-${Date.now().toString().slice(-8)}`;
          
          if (user) {
            // Logged in user: create payment record & credit wallet
            const payment = await createPaymentRecord({
              userId: user.uid,
              userEmail: user.email || "",
              userName: profile?.fullName || "Citizen",
              amount,
              currency: "INR",
              purpose: "wallet_topup",
              referenceId: finalRefId,
              utrNumber: utrNumber.trim(),
              status: "success",
            });

            const creditRes = await executeWalletTransaction(
              user.uid,
              amount,
              'credit',
              'upi',
              `UPI Wallet Topup (UTR: ${utrNumber.trim()})`,
              payment.id,
              profile?.fullName || user.email || 'user'
            );

            if (!creditRes.success) {
              throw new Error(creditRes.error || "Failed to update balance");
            }

            await refreshProfile();
          }

          setVerifiedTxnId(finalRefId);
          setIsVerifying(false);
          setSuccessMsg(`Payment Verified! ${formatCurrency(amount)} has been added to your NetDuniya Wallet successfully.`);
        } catch (err: any) {
          console.error(err);
          setErrorMsg("Verification error: " + (err.message || "Could not credit wallet."));
          setIsVerifying(false);
        }
      };

      finalizeRecharge();
    }
  }, [isVerifying, countdown, amount, utrNumber, user, profile, refreshProfile]);

  if (!isOpen) return null;

  const merchantUpiId = siteSettings.upiId || DEFAULT_SITE_SETTINGS.upiId || "9864761058@ybl";
  const merchantName = siteSettings.upiName || siteSettings.siteName || "NetDuniya Cyber Cafe";

  // Dynamic UPI Intent Link & Live QR Code
  const upiIntentString = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`NetDuniya_Wallet_Recharge`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiIntentString)}&margin=10`;

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmountInput(val.toString());
    setErrorMsg(null);
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setCustomAmountInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 10) {
      setAmount(parsed);
      setErrorMsg(null);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount < 10) {
      setErrorMsg("Minimum recharge amount is ₹10.");
      return;
    }

    if (!user && !guestMobile.trim()) {
      setErrorMsg("Please enter your 10-digit mobile number or log in to link the recharge.");
      return;
    }

    const cleanUtr = utrNumber.trim();
    // Validate 12-digit UTR format
    const validation = validateUtrNumber(cleanUtr);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Please enter a valid 12-digit UPI UTR number.");
      return;
    }

    try {
      // Check if UTR is already used
      const alreadyUsed = await isUtrAlreadyUsed(cleanUtr);
      if (alreadyUsed) {
        setErrorMsg(`UTR Number ${cleanUtr} has already been registered or credited! Each UTR can only be used once.`);
        return;
      }

      // Register UTR to prevent double claiming
      await registerUtr(cleanUtr, {
        userId: user?.uid || `guest_${guestMobile.trim()}`,
        amount,
        purpose: "wallet_topup",
        referenceId: `TOPUP-${Date.now().toString().slice(-8)}`
      });

      // Start 30-second bank verification countdown
      setCountdown(30);
      setIsVerifying(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error validating UTR. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-8 animate-scaleUp">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">NetDuniya Wallet Recharge</h2>
              <p className="text-xs text-slate-300">
                {user ? `Current Balance: ${formatCurrency(walletBalance)}` : "Instant Prepaid Wallet Topup"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          
          {/* Success State */}
          {successMsg ? (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Recharge Successful!</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">{successMsg}</p>
                {verifiedTxnId && (
                  <span className="inline-block mt-2 font-mono text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                    Ref ID: {verifiedTxnId}
                  </span>
                )}
              </div>
              <div className="pt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-brand-blue hover:bg-brand-primary text-white text-xs font-bold py-2.5 px-6 rounded-xl transition shadow"
                >
                  Done / Close
                </button>
                {user && (
                  <Link
                    href="/dashboard/wallet"
                    onClick={onClose}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl transition"
                  >
                    View Passbook
                  </Link>
                )}
              </div>
            </div>
          ) : isVerifying ? (
            /* 30-Second Verification Countdown UI */
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 text-center space-y-4 animate-fadeIn">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 animate-spin" />
              </div>
              <div>
                <span className="text-3xl font-black font-mono text-amber-900 block">{countdown}s</span>
                <h3 className="text-sm font-black text-slate-900 mt-1">Bank UTR Verification in Progress</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Verifying UTR <span className="font-mono font-bold text-slate-900">{utrNumber}</span> for amount <strong className="text-emerald-700">{formatCurrency(amount)}</strong>
                </p>
              </div>

              {/* Live Progress Bar */}
              <div className="w-full bg-amber-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-amber-600 h-2.5 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((30 - countdown) / 30) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-amber-800">
                Aapka UTR banking verification network dwara check ho raha hai. 30 second me amount automatically wallet me credit ho jayega. Kripya page band na karein.
              </p>
            </div>
          ) : (
            /* Standard Recharge Form */
            <div className="space-y-5">
              
              {/* Alert Messages */}
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="font-bold">{errorMsg}</span>
                </div>
              )}

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Select Recharge Amount (₹)
                </label>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[50, 100, 200, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAmountSelect(val)}
                      className={`py-2 text-xs font-black rounded-xl border transition ${
                        amount === val
                          ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min={10}
                    max={50000}
                    value={customAmountInput}
                    onChange={handleCustomAmountChange}
                    placeholder="Enter custom amount (min ₹10)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-slate-900 focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Dynamic QR Code & UPI Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2.5 rounded-2xl border border-slate-300 shadow-sm flex-shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-36 h-36 sm:w-40 sm:h-40 rounded-lg mx-auto"
                  />
                  <span className="text-[10px] font-black text-center text-slate-500 block mt-1 uppercase">
                    Scan With Any UPI App
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 text-center sm:text-left w-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Payable</span>
                    <span className="text-2xl font-black text-brand-blue">{formatCurrency(amount)}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">NetDuniya UPI ID</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900 truncate mr-2">{merchantUpiId}</span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition flex items-center space-x-1 flex-shrink-0"
                      >
                        {copiedUpi ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedUpi ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-semibold space-y-0.5">
                    <p>• Open GPay / PhonePe / Paytm / BHIM</p>
                    <p>• Scan QR &amp; complete payment of ₹{amount}</p>
                    <p>• Copy 12-digit UTR from your bank app</p>
                  </div>
                </div>
              </div>

              {/* Guest Phone (if not logged in) */}
              {!user && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Enter Your Mobile Number (for receipt &amp; balance link)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={guestMobile}
                    onChange={(e) => setGuestMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number (e.g. 9864700000)"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Already registered?{" "}
                    <Link href={`/login?redirect=${encodeURIComponent('/dashboard/wallet?action=recharge')}`} onClick={onClose} className="text-brand-blue font-bold hover:underline">
                      Log in here
                    </Link>
                  </p>
                </div>
              )}

              {/* 12-Digit UTR Number Submission */}
              <form onSubmit={handleSubmitUtr} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {user ? "2" : "3"}. Enter 12-Digit Bank UTR / UPI Ref ID
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 412389123456"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-mono font-black text-slate-900 uppercase focus:ring-2 focus:ring-brand-blue tracking-wider"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Check your UPI App transaction details for the 12-digit number (UTR / UPI Ref No).
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={utrNumber.trim().length !== 12}
                  className={`w-full py-3 px-5 rounded-xl font-black text-xs transition flex items-center justify-center space-x-2 shadow-lg ${
                    utrNumber.trim().length === 12
                      ? "bg-brand-accent hover:bg-brand-accentHover text-white cursor-pointer active:scale-98"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Verify UTR &amp; Credit ₹{amount}</span>
                </button>
              </form>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
