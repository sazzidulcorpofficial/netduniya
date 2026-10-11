"use client";

import React, { useEffect, useState } from "react";
import { 
  Wallet, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw,
  Users,
  CreditCard,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  X,
  UserCheck
} from "lucide-react";
import { collection, query, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { 
  executeWalletTransaction, 
  recordAuditLog,
  subscribeToAllPayments,
  toggleUserBlockStatus,
  deleteUserProfile
} from "@/lib/firestore-service";
import { UserProfile, PaymentRecord } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function AdminWalletPage() {
  const { profile: adminProfile, user: adminUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Manage User Modal State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    const q = query(collection(db, "users"), limit(500));
    const unsubUsers = onSnapshot(q, (snap) => {
      const uList = snap.docs.map(d => ({ uid: d.id, ...d.data() }) as UserProfile);
      setUsers(uList);
      if (selectedUser) {
        const updated = uList.find(u => u.uid === selectedUser.uid);
        if (updated) setSelectedUser(updated);
      }
      setLoading(false);
    });

    const unsubPays = subscribeToAllPayments((pList) => {
      setRecentPayments(pList);
    });

    return () => {
      unsubUsers();
      unsubPays();
    };
  }, [selectedUser?.uid]);

  const totalWalletHoldings = users.reduce((sum, u) => sum + (Number(u.walletBalance) || 0), 0);
  const usersWithBalance = users.filter(u => (Number(u.walletBalance) || 0) > 0).length;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.fullName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phoneNumber || "").includes(q) ||
      (u.uid || "").toLowerCase().includes(q)
    );
  });

  const handleOpenManageModal = (u: UserProfile) => {
    setSelectedUser(u);
    setAdjustAmount(100);
    setAdjustType('credit');
    setAdjustReason("Account Recharge");
    setManageModalOpen(true);
  };

  const handleExecuteAdjust = async (e?: React.FormEvent, directAmount?: number, directType?: 'credit' | 'debit') => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    const amt = directAmount !== undefined ? directAmount : adjustAmount;
    const typ = directType !== undefined ? directType : adjustType;
    const rsn = adjustReason.trim() || `Manual ${typ} by ${adminProfile?.fullName || 'Admin'}`;

    if (amt <= 0) {
      alert("Please enter an amount greater than 0.");
      return;
    }

    setAdjusting(true);
    setFeedback(null);
    try {
      const res = await executeWalletTransaction(
        selectedUser.uid,
        amt,
        typ,
        'admin_adjustment',
        rsn,
        undefined,
        adminProfile?.fullName || adminUser?.email || "Admin"
      );

      if (!res.success) {
        throw new Error(res.error || "Adjustment failed");
      }

      await recordAuditLog({
        actorId: adminUser?.uid || "admin",
        actorName: adminProfile?.fullName || "Admin",
        actorRole: adminProfile?.role || "admin",
        action: `wallet_${typ}`,
        module: "wallet",
        recordId: selectedUser.uid,
        details: `Adjusted ₹${amt} (${typ}) for ${selectedUser.email}. New Balance: ₹${res.newBalance}. Reason: ${rsn}`,
      });

      setFeedback({
        type: 'success',
        text: `Success! ${typ === 'credit' ? '+' : '-'}₹${amt} applied. New balance: ${formatCurrency(res.newBalance || 0)}`
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', text: err.message || "Failed to adjust balance" });
    } finally {
      setAdjusting(false);
    }
  };

  const handleToggleBlock = async (u: UserProfile) => {
    const currentlyActive = u.isActive !== false;
    const confirmMsg = currentlyActive
      ? `Suspend and ban account for ${u.fullName || u.email}?`
      : `Reactivate account for ${u.fullName || u.email}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await toggleUserBlockStatus(u.uid, !currentlyActive, adminProfile?.fullName || "Admin");
      setFeedback({
        type: 'success',
        text: currentlyActive ? "Account suspended successfully." : "Account reactivated successfully."
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert("Failed to update status: " + (err.message || err));
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (!window.confirm(`⚠️ PERMANENT ACTION: Delete user account for ${u.fullName || u.email}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteUserProfile(u.uid, adminProfile?.fullName || "Admin");
      setManageModalOpen(false);
      alert("User account deleted successfully.");
    } catch (err: any) {
      alert("Failed to delete user: " + (err.message || err));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-6 space-y-6 animate-fadeIn">
      
      {/* Header Banner - High Contrast Clean White */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-blue font-black text-xs uppercase tracking-wider mb-1">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <span>Master Digital Ledger Node</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Citizen Digital Wallets & Balance Governance
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Manage citizen wallet balances, credit top-ups, deduct service charges, and monitor account status.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-emerald-50 border-2 border-emerald-300 px-5 py-2.5 rounded-2xl text-right shadow-xs">
            <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider block">
              Total Pre-Paid Holding
            </span>
            <span className="text-2xl font-black text-emerald-800">
              {formatCurrency(totalWalletHoldings)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards - High Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="p-3 bg-blue-100 text-brand-blue rounded-xl">
            <Users className="h-6 w-6 text-brand-blue" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-slate-600 block">Registered Wallets</span>
            <span className="text-2xl font-black text-slate-900">{users.length} Users</span>
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
            <Wallet className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-slate-600 block">Funded Active Wallets</span>
            <span className="text-2xl font-black text-emerald-800">{usersWithBalance} Accounts</span>
          </div>
        </div>

        <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 flex items-center space-x-3 shadow-xs">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
            <CreditCard className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-slate-600 block">Recent Transactions</span>
            <span className="text-2xl font-black text-amber-800">{recentPayments.length} Recorded</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search citizen by name, email, or phone number..."
          className="w-full bg-white border-2 border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
        <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2.5 font-bold ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-rose-600" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Responsive Horizontal Scrolling Table */}
      {loading ? (
        <p className="text-xs text-slate-500 font-bold py-8 text-center">Loading citizen wallet directory...</p>
      ) : filteredUsers.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold text-xs">
          No citizen users found matching &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="admin-table-container overflow-x-auto w-full border-2 border-slate-300 rounded-2xl shadow-xs">
          <table className="min-w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[11px] border-b-2 border-slate-300">
              <tr>
                <th className="p-3.5 text-slate-900">Citizen / Customer</th>
                <th className="p-3.5 text-slate-900">Phone Number</th>
                <th className="p-3.5 text-slate-900">Role</th>
                <th className="p-3.5 text-slate-900">Wallet Balance</th>
                <th className="p-3.5 text-slate-900">Account Status</th>
                <th className="p-3.5 text-slate-900">Registered Date</th>
                <th className="p-3.5 text-right text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredUsers.map((u) => {
                const bal = Number(u.walletBalance) || 0;
                const isActive = u.isActive !== false;
                return (
                  <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-black flex items-center justify-center text-xs flex-shrink-0 border border-slate-300">
                          {u.fullName?.charAt(0) || u.email?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-xs">
                            {u.fullName || "Citizen"}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-slate-800">
                      {u.phoneNumber || "—"}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 border border-slate-300 text-slate-800">
                        {u.role ? u.role.replace('_', ' ') : 'CITIZEN'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`inline-block font-black text-xs px-3 py-1 rounded-full ${
                        bal > 0 
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300" 
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      }`}>
                        {formatCurrency(bal)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {isActive ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          <Ban className="h-3 w-3" />
                          <span>Suspended</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-600 font-semibold text-[11px]">
                      {u.createdAt ? formatDateTime(u.createdAt) : "—"}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenManageModal(u)}
                        className="px-3 py-1.5 rounded-xl bg-brand-blue hover:bg-brand-primary text-white font-black text-xs shadow-xs transition inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-amber-300" />
                        <span>View & Manage</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= COMPREHENSIVE VIEW & MANAGE MODAL ================= */}
      {manageModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5 my-auto text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Wallet className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedUser.fullName || "Citizen"} &bull; Wallet Governance
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-black text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* User Info & Available Balance Strip */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500">Citizen UID:</span>
                  <span className="font-mono text-xs font-bold text-slate-900">{selectedUser.uid}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-600">
                  <span>Phone: <strong>{selectedUser.phoneNumber || "Not provided"}</strong></span>
                  <span>&bull;</span>
                  <span>Role: <strong className="uppercase">{selectedUser.role || "Citizen"}</strong></span>
                </div>
              </div>

              <div className="bg-white border-2 border-emerald-300 p-3 rounded-xl text-right sm:min-w-[140px] shadow-xs">
                <span className="text-[10px] font-black uppercase text-emerald-800 block">Available Balance</span>
                <span className="text-2xl font-black text-emerald-700">
                  {formatCurrency(selectedUser.walletBalance || 0)}
                </span>
              </div>
            </div>

            {/* Quick 1-Click Balance Adjustments */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                ⚡ Quick 1-Click Operations:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={adjusting}
                  onClick={() => handleExecuteAdjust(undefined, 50, 'credit')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>+ Add ₹50</span>
                </button>
                <button
                  type="button"
                  disabled={adjusting}
                  onClick={() => handleExecuteAdjust(undefined, 100, 'credit')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>+ Add ₹100</span>
                </button>
                <button
                  type="button"
                  disabled={adjusting}
                  onClick={() => handleExecuteAdjust(undefined, 500, 'credit')}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>+ Add ₹500</span>
                </button>
                <button
                  type="button"
                  disabled={adjusting}
                  onClick={() => handleExecuteAdjust(undefined, 50, 'debit')}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-black py-2 px-2 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <MinusCircle className="h-3.5 w-3.5 text-rose-600" />
                  <span>- Deduct ₹50</span>
                </button>
              </div>
            </div>

            {/* Custom Amount Form */}
            <form onSubmit={(e) => handleExecuteAdjust(e)} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-black uppercase text-slate-900 block">
                Custom Wallet Credit / Debit:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Action Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-black text-slate-900 focus:outline-none"
                  >
                    <option value="credit">Credit (+ Add Money)</option>
                    <option value="debit">Debit (- Deduct Money)</option>
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-black text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-black text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="submit"
                    disabled={adjusting}
                    className={`w-full py-2 px-3 rounded-xl text-white font-black text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 ${
                      adjustType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {adjustType === 'credit' ? <PlusCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
                    <span>{adjusting ? "Processing..." : adjustType === 'credit' ? "Credit Funds" : "Deduct Funds"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">Reason / Note (for citizen passbook)</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Offline cash collected at center / Service fee adjustment"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </form>

            {/* Account Status Governance & Delete */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleToggleBlock(selectedUser)}
                  className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition cursor-pointer border ${
                    selectedUser.isActive !== false
                      ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
                  }`}
                >
                  {selectedUser.isActive !== false ? (
                    <>
                      <Ban className="h-4 w-4 text-amber-600" />
                      <span>Suspend / Ban Account</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                      <span>Reactivate Account</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteUser(selectedUser)}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 text-xs font-black flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  <span>Delete Account</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
