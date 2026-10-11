"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Wallet, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  Lock,
  Clock,
  QrCode,
  Copy,
  Check
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  subscribeToUserWalletTransactions,
  subscribeToSiteSettings,
  DEFAULT_SITE_SETTINGS
} from "@/lib/firestore-service";
import { WalletTransaction, SiteSettings } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import RechargeModal from "@/components/payment/RechargeModal";

function UserWalletContent() {
  const { user, profile, walletBalance } = useAuth();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Auto-open Recharge Modal if ?action=recharge is in URL
  useEffect(() => {
    if (searchParams.get("action") === "recharge") {
      setRechargeModalOpen(true);
    }
  }, [searchParams]);

  // Load site settings (UPI details)
  useEffect(() => {
    const unsub = subscribeToSiteSettings((s) => setSiteSettings(s));
    return () => unsub();
  }, []);

  // Subscribe to user transactions
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserWalletTransactions(user.uid, (txns) => {
      setTransactions(txns);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const merchantUpiId = siteSettings.upiId || DEFAULT_SITE_SETTINGS.upiId || "9864761058@ybl";
  const merchantName = siteSettings.upiName || siteSettings.siteName || "NetDuniya Cyber Cafe";

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Wallet Balance */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-card border-l-8 border-brand-accent flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-400">
            <Wallet className="h-5 w-5" />
            <span className="text-xs uppercase font-extrabold tracking-wider">NetDuniya Digital Wallet</span>
          </div>
          <p className="text-xs text-slate-300">Available Pre-Paid Balance for Instant Service Payments</p>
          <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
            {formatCurrency(walletBalance)}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setRechargeModalOpen(true)}
            className="bg-brand-accent hover:bg-brand-accentHover text-white text-xs sm:text-sm font-black py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Recharge / Add Money</span>
          </button>
        </div>
      </div>

      {/* Inline Quick QR Recharge Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <QrCode className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Instant Dynamic UPI Scan &amp; Pay</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Recharge any amount directly using PhonePe, Google Pay, Paytm, BHIM with zero gateway fee.
              </p>
              <div className="flex items-center space-x-3 mt-3">
                <span className="text-xs font-mono font-bold text-slate-800 bg-white px-3 py-1 rounded-xl border border-amber-200 shadow-2xs">
                  UPI ID: {merchantUpiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-xl transition flex items-center space-x-1"
                >
                  {copiedUpi ? <Check className="h-3 w-3 text-emerald-700" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedUpi ? "Copied!" : "Copy UPI"}</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRechargeModalOpen(true)}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3.5 px-8 rounded-2xl shadow transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95 flex-shrink-0"
          >
            <QrCode className="h-4 w-4" />
            <span>Open UPI QR Scanner &amp; Pay</span>
          </button>
        </div>
      </div>

      {/* Passbook / Ledger Transactions */}
      <div className="bg-white rounded-3xl shadow-card border border-slate-200 p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <History className="h-4 w-4 text-brand-blue" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Wallet Passbook &amp; Transaction History
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{transactions.length} Transactions</span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl space-y-2">
            <Wallet className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No transactions yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your wallet ledger is empty. Click "+ Recharge / Add Money" to add funds and start making instant applications.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setRechargeModalOpen(true)}
                className="inline-flex items-center space-x-1.5 bg-brand-blue text-white text-xs font-bold py-2 px-4 rounded-xl shadow hover:bg-brand-primary transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Recharge Now</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => {
                  const isCredit = txn.type === 'credit' || txn.type === 'refund';
                  const isDebit = txn.type === 'debit';
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-700 text-[11px]">
                        {txn.id}
                      </td>
                      <td className="p-3 text-slate-800">
                        <div className="font-bold">{txn.description}</div>
                        {txn.referenceId && (
                          <span className="text-[10px] text-slate-400 font-mono">Ref: {txn.referenceId}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isCredit
                              ? "bg-emerald-100 text-emerald-800"
                              : isDebit
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          <span>{txn.type}</span>
                        </span>
                      </td>
                      <td className="p-3 font-black text-sm">
                        <span className={isCredit ? "text-emerald-600" : "text-rose-600"}>
                          {isCredit ? "+" : "-"}{formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">
                        {formatCurrency(txn.balanceAfter)}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px]">
                        {formatDateTime(txn.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Universal Direct Recharge Modal */}
      <RechargeModal
        isOpen={rechargeModalOpen}
        onClose={() => setRechargeModalOpen(false)}
        defaultAmount={100}
      />

    </div>
  );
}

export default function UserWalletPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Loading wallet...</div>}>
      <UserWalletContent />
    </Suspense>
  );
}
