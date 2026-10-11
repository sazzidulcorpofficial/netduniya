"use client";

import React, { useEffect, useState } from "react";
import { 
  DollarSign, 
  Search, 
  ShieldCheck, 
  ArrowDownLeft, 
  RefreshCw, 
  CheckCircle2, 
  RotateCcw,
  Copy,
  Check,
  CreditCard,
  QrCode,
  Wallet,
  AlertCircle,
  Clock
} from "lucide-react";
import { subscribeToAllPayments, processPaymentRefund, recordAuditLog } from "@/lib/firestore-service";
import { PaymentRecord } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDateTime, getStatusBadgeClass, formatStatusLabel } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const { profile: adminProfile, user: adminUser } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Refund Modal State
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [refundUtr, setRefundUtr] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllPayments((data) => {
      setPayments(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalSuccess = payments.filter(p => p.status === 'success' && !p.refundAmount).reduce((s, p) => s + p.amount, 0);
  const totalRefunded = payments.filter(p => p.status === 'refunded' || Boolean(p.refundAmount)).reduce((s, p) => s + (p.refundAmount || p.amount), 0);

  const filtered = payments.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.id || "").toLowerCase().includes(q) ||
      (p.userEmail || "").toLowerCase().includes(q) ||
      (p.userName || "").toLowerCase().includes(q) ||
      (p.purpose || "").toLowerCase().includes(q) ||
      (p.referenceId || "").toLowerCase().includes(q) ||
      (p.utrNumber || "").toLowerCase().includes(q) ||
      (p.refundUtr || "").toLowerCase().includes(q)
    );
  });

  const handleOpenRefundModal = (p: PaymentRecord) => {
    if (p.status === 'refunded' || Boolean(p.refundAmount)) {
      alert("This payment has already been refunded.");
      return;
    }
    setSelectedPayment(p);
    setRefundUtr("");
    setRefundReason(`Refund for ${p.purpose.replace(/_/g, ' ')} (${p.referenceId})`);
    setRefundModalOpen(true);
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    if (selectedPayment.status === 'refunded' || Boolean(selectedPayment.refundAmount)) {
      alert("This payment has already been refunded.");
      setRefundModalOpen(false);
      return;
    }

    const cleanUtr = refundUtr.trim() || `WLT-REF-${Date.now().toString(36).toUpperCase()}`;

    setRefunding(true);
    try {
      const res = await processPaymentRefund(selectedPayment.id, {
        refundUtr: cleanUtr,
        refundReason: refundReason.trim() || `Refund credited to Citizen Wallet`,
        refundAmount: selectedPayment.amount,
        adminName: adminProfile?.fullName || adminUser?.email || "Admin",
      });

      // Instantly update payments list in local state so refund button closes and revenue recalculates immediately
      setPayments(prev => prev.map(p => p.id === selectedPayment.id ? {
        ...p,
        status: 'refunded',
        refundUtr: cleanUtr,
        refundReason: refundReason.trim() || `Refund credited to Citizen Wallet`,
        refundAmount: selectedPayment.amount,
        refundDate: Date.now()
      } : p));

      await recordAuditLog({
        actorId: adminUser?.uid || "admin",
        actorName: adminProfile?.fullName || "Admin",
        actorRole: adminProfile?.role || "admin",
        action: "payment_refund",
        module: "payments",
        recordId: selectedPayment.id,
        details: `Credited ₹${selectedPayment.amount} to Citizen Wallet (${selectedPayment.userEmail}). Ref: ${cleanUtr}. Reason: ${refundReason}`,
      });

      setFeedbackMsg({
        type: 'success',
        text: `Success! ₹${selectedPayment.amount} credited directly to ${selectedPayment.userName || selectedPayment.userEmail}'s Citizen Digital Wallet (Ref: ${cleanUtr}).`
      });
      setRefundModalOpen(false);
      setTimeout(() => setFeedbackMsg(null), 6000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to process refund: " + (err.message || err));
    } finally {
      setRefunding(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900">Payments, UTR Verification & Refunds</h1>
          <p className="text-xs text-slate-600 font-medium">
            Real-time record of custom UPI QR orders, customer UTR numbers, Razorpay gateways, and instant PhonePe/Google Pay refunds.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Revenue</span>
            <span className="text-lg font-black text-emerald-700">{formatCurrency(totalSuccess)}</span>
          </div>
          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">Total Refunded</span>
            <span className="text-lg font-black text-rose-700">{formatCurrency(totalRefunded)}</span>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2 font-bold ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Payment ID, UTR, email, or purpose..."
          className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none"
        />
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-6 text-center font-bold">Loading payment records...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center border border-dashed rounded-xl font-bold">No payments found.</p>
      ) : (
        <div className="admin-table-container overflow-x-auto w-full border-2 border-slate-300 rounded-xl shadow-xs">
          <table className="min-w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[11px] border-b-2 border-slate-300">
              <tr>
                <th className="p-3 text-slate-900">Payment ID</th>
                <th className="p-3 text-slate-900">Customer</th>
                <th className="p-3 text-slate-900">Purpose / Type</th>
                <th className="p-3 text-slate-900">Amount (₹)</th>
                <th className="p-3 text-slate-900">Method & Customer UTR</th>
                <th className="p-3 text-slate-900">Payment Status</th>
                <th className="p-3 text-slate-900">Date & Time</th>
                <th className="p-3 text-right text-slate-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((p) => {
                const detectedUtr = p.utrNumber || (p.referenceId?.startsWith("UPI-") ? p.referenceId.replace("UPI-", "") : null);
                const isUpi = p.paymentMethod === 'upi' || p.referenceId?.startsWith("UPI-") || !!detectedUtr;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-black text-slate-900">
                      {p.id}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.userName || "Citizen"}</div>
                      <div className="text-[11px] text-slate-500">{p.userEmail}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-black text-slate-900 uppercase text-[10px] bg-slate-200 px-2 py-0.5 rounded-md border border-slate-300">
                        {(p.purpose || 'PAYMENT').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 font-black text-emerald-800 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          {isUpi ? (
                            <span className="bg-purple-100 text-purple-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-purple-300 flex items-center space-x-1">
                              <QrCode className="h-3 w-3" />
                              <span>Custom UPI QR</span>
                            </span>
                          ) : p.paymentMethod === 'wallet' ? (
                            <span className="bg-blue-100 text-blue-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-blue-300 flex items-center space-x-1">
                              <Wallet className="h-3 w-3" />
                              <span>Wallet</span>
                            </span>
                          ) : (
                            <span className="bg-indigo-100 text-indigo-900 font-extrabold text-[10px] px-2 py-0.5 rounded-md border border-indigo-300 flex items-center space-x-1">
                              <CreditCard className="h-3 w-3" />
                              <span>Razorpay</span>
                            </span>
                          )}
                        </div>

                        {/* Customer UTR Number Box */}
                        {detectedUtr ? (
                          <div className="flex items-center space-x-1 bg-purple-50 border border-purple-200 rounded px-2 py-0.5 text-[11px] font-mono font-black text-purple-950">
                            <span className="text-[9px] uppercase tracking-wider text-purple-600 font-bold">UTR:</span>
                            <span>{detectedUtr}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(detectedUtr, p.id)}
                              className="text-purple-600 hover:text-purple-900 cursor-pointer ml-1"
                              title="Copy UTR"
                            >
                              {copiedId === p.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        ) : p.referenceId ? (
                          <div className="text-[10px] font-mono text-slate-600 truncate max-w-[130px]">
                            Ref: {p.referenceId}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3">
                      {p.status === 'refunded' ? (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            Refunded
                          </span>
                          {p.refundUtr && (
                            <div className="text-[10px] font-mono text-rose-700 font-bold">
                              Refund UTR: {p.refundUtr}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${getStatusBadgeClass(p.status)}`}>
                          {formatStatusLabel(p.status)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="p-3 text-right">
                      {p.status === 'success' && !p.refundAmount ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRefundModal(p)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg shadow transition flex items-center space-x-1.5 ml-auto cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Process Refund</span>
                        </button>
                      ) : (p.status === 'refunded' || Boolean(p.refundAmount)) ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md inline-flex items-center space-x-1 ml-auto">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Refund Closed</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= REFUND MODAL ================= */}
      {refundModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 my-auto text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Process Citizen Refund</h3>
                  <p className="text-xs text-slate-500 font-medium">Record real-time PhonePe / Google Pay / UPI refund</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Payment Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Payment ID:</span>
                <span className="font-mono font-black text-slate-900">{selectedPayment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Customer:</span>
                <span className="font-bold text-slate-900">{selectedPayment.userName || "Citizen"} ({selectedPayment.userEmail})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Purpose:</span>
                <span className="font-bold uppercase text-slate-800">{selectedPayment.purpose.replace(/_/g, ' ')}</span>
              </div>
              {selectedPayment.utrNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Original Customer UTR:</span>
                  <span className="font-mono font-bold text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded">
                    {selectedPayment.utrNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-black text-slate-900">Refund Amount:</span>
                <span className="font-black text-rose-700 text-base">{formatCurrency(selectedPayment.amount)}</span>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            {/* Citizen Digital Wallet Credit Notice */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-black text-emerald-900">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <span>Instant Citizen Digital Wallet Deposit</span>
              </div>
              <p className="text-emerald-800 leading-relaxed">
                Refunding will <strong>automatically credit {formatCurrency(selectedPayment.amount)}</strong> directly into the citizen's NetDuniya digital wallet balance. The user can use this balance anytime for booking future services or ordering PVC cards. No external bank transfer is needed!
              </p>
            </div>

            {/* Refund Confirmation Form */}
            <form onSubmit={handleConfirmRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  Refund Reason *
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  placeholder="e.g. Service cancelled, duplicate payment, citizen requested"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  Internal Reference / Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={refundUtr}
                  onChange={(e) => setRefundUtr(e.target.value)}
                  placeholder="Auto-generated wallet refund reference if left empty"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refunding}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{refunding ? "Crediting Wallet..." : "Confirm & Credit Citizen Wallet"}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
