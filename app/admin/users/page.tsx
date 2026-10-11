"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Wallet, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  Edit3, 
  CheckCircle2, 
  History,
  UserPlus,
  Lock,
  Mail,
  Phone,
  User,
  Loader2,
  Trash2,
  Ban,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  AlertTriangle,
  X,
  Eye,
  KeyRound,
  Shield
} from "lucide-react";
import { 
  collection, 
  query, 
  limit, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { 
  executeWalletTransaction, 
  createOrUpdateUser, 
  recordAuditLog,
  deleteUserProfile,
  toggleUserBlockStatus,
  deleteAdminRecord,
  transferSuperAdminAndSelfDelete,
  checkEmailOrPhoneExists
} from "@/lib/firestore-service";
import { UserProfile, WalletTransaction, UserRole } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const STAFF_ROLES: { role: UserRole; label: string; desc: string }[] = [
  { role: "super_admin", label: "Super Administrator", desc: "Full administrative control, settings, user management, and financials." },
  { role: "admin", label: "Operations Admin", desc: "Manages citizen applications, PVC orders, appointments, and support." },
  { role: "service_manager", label: "Service Manager", desc: "Manages services, dynamic forms, categories, and documents." },
  { role: "finance_manager", label: "Finance & Accounts", desc: "Manages citizen wallet top-ups, transaction ledger, and refunds." },
  { role: "content_manager", label: "Content & CMS Editor", desc: "Manages government schemes, alerts, banners, and blog articles." },
  { role: "agro_admin", label: "Regional Cyber Cafe Staff", desc: "Assists local citizens with daily registration and document uploads." },
];

export default function AdminUsersPage() {
  const { profile: adminProfile, user: adminUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'citizens' | 'staff'>('citizens');
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected User for Modals
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Quick Wallet Modal State
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Edit Role Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [savingEdit, setSavingEdit] = useState(false);

  // Create Staff Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<UserRole>("admin");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Subscribe to Users collection
  useEffect(() => {
    const q = query(collection(db, "users"), limit(500));
    const unsub = onSnapshot(q, (snap) => {
      const uList = snap.docs.map(d => ({ uid: d.id, ...d.data() }) as UserProfile);
      setUsers(uList);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Helper: Format safe user display name (Never "Unnamed User"!)
  const getDisplayName = (u: UserProfile, isStaff = false) => {
    if (u.fullName && u.fullName.trim() && u.fullName.toLowerCase() !== "unnamed user") {
      return u.fullName.trim();
    }
    if (u.email && u.email.includes("@")) {
      const prefix = u.email.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return isStaff ? "Admin Staff" : "Verified Citizen";
  };

  // Helper: Check if user is staff/admin
  const isStaffRole = (role?: string) => {
    return ['super_admin', 'admin', 'service_manager', 'finance_manager', 'content_manager', 'agro_admin'].includes(role || '');
  };

  // Filter Citizens vs Staff
  const citizensList = users.filter(u => !isStaffRole(u.role));
  const staffList = users.filter(u => isStaffRole(u.role));

  const currentList = activeTab === 'citizens' ? citizensList : staffList;

  const filtered = currentList.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const name = getDisplayName(u, activeTab === 'staff').toLowerCase();
    return (
      name.includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phoneNumber || "").includes(q) ||
      (u.uid || "").toLowerCase().includes(q)
    );
  });

  // Open Wallet Modal
  const handleOpenWalletModal = (u: UserProfile) => {
    setSelectedUser(u);
    setAdjustAmount(100);
    setAdjustType('credit');
    setAdjustReason("Account Recharge");
    setWalletModalOpen(true);
  };

  // Execute Wallet Adjustment
  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || adjustAmount <= 0) return;

    setAdjusting(true);
    try {
      const res = await executeWalletTransaction(
        selectedUser.uid,
        adjustAmount,
        adjustType === 'credit' ? 'adjustment' : 'debit',
        'admin_adjustment',
        adjustReason.trim() || `Manual ${adjustType} by ${adminProfile?.fullName || 'Admin'}`,
        undefined,
        adminProfile?.fullName || adminUser?.email || "Admin"
      );

      if (!res.success) throw new Error(res.error || "Transaction failed");

      await recordAuditLog({
        actorId: adminUser?.uid || "admin",
        actorName: adminProfile?.fullName || "Admin",
        actorRole: adminProfile?.role || "admin",
        action: `wallet_${adjustType}`,
        module: "users",
        recordId: selectedUser.uid,
        details: `${adjustType.toUpperCase()} of ₹${adjustAmount} to ${selectedUser.email}. Balance: ₹${res.newBalance}`,
      });

      alert(`Success: ₹${adjustAmount} ${adjustType === 'credit' ? 'credited' : 'deducted'}. New balance: ₹${res.newBalance}`);
      setWalletModalOpen(false);
    } catch (err: any) {
      alert("Wallet adjustment failed: " + (err.message || err));
    } finally {
      setAdjusting(false);
    }
  };

  // Toggle Block Status
  const handleToggleBlock = async (u: UserProfile) => {
    const currentlyActive = u.isActive !== false;
    const name = getDisplayName(u);
    const confirmMsg = currentlyActive
      ? `Block and suspend account for ${name} (${u.email})?`
      : `Unblock and restore account for ${name} (${u.email})?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await toggleUserBlockStatus(u.uid, !currentlyActive, adminProfile?.fullName || "Admin");
    } catch (err: any) {
      alert("Failed to update status: " + (err.message || err));
    }
  };

  // Delete User
  const handleDelete = async (u: UserProfile) => {
    const isTargetAdmin = isStaffRole(u.role);
    const name = getDisplayName(u, isTargetAdmin);

    if (u.uid === adminUser?.uid) {
      alert("You cannot delete your own logged-in admin account directly here.");
      return;
    }

    if (isTargetAdmin && !isSuperAdmin) {
      alert("Only Super Administrator can remove administrative accounts.");
      return;
    }

    const confirmMsg = isTargetAdmin
      ? `Revoke admin privileges and permanently remove admin account for ${name} (${u.email})?`
      : `Permanently delete user profile for ${name} (${u.email})?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteUserProfile(u.uid, adminProfile?.fullName || "Admin");
      if (isTargetAdmin) {
        await deleteAdminRecord(u.uid);
      }
    } catch (err: any) {
      alert("Failed to delete user: " + (err.message || err));
    }
  };

  // Open Edit Role Modal
  const handleOpenEditRole = (u: UserProfile) => {
    setSelectedUser(u);
    setEditRole(u.role || "user");
    setEditModalOpen(true);
  };

  // Save Role
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSavingEdit(true);
    try {
      await createOrUpdateUser({
        uid: selectedUser.uid,
        role: editRole,
        updatedAt: Date.now()
      });
      alert(`Role for ${getDisplayName(selectedUser)} updated to ${editRole}`);
      setEditModalOpen(false);
    } catch (err: any) {
      alert("Failed to update role: " + (err.message || err));
    } finally {
      setSavingEdit(false);
    }
  };

  // Create New Staff / Admin with Duplicate Email & Phone Validation
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreatingStaff(true);

    try {
      // 1. Validate unique email and phone
      const check = await checkEmailOrPhoneExists(newStaffEmail, newStaffPhone);
      if (check.exists) {
        setCreateError(check.reason || "An account with this email or mobile number already exists.");
        setCreatingStaff(false);
        return;
      }

      // 2. Call backend create user API
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newStaffName.trim(),
          email: newStaffEmail.trim().toLowerCase(),
          password: newStaffPassword,
          role: newStaffRole,
          rules: ["all"],
          phoneNumber: newStaffPhone.trim(),
          creatorName: adminProfile?.fullName || "Super Admin",
          creatorId: adminUser?.uid || "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create administrator account");
      }

      alert(`Success! Administrator ${newStaffName} (${newStaffEmail}) created successfully.`);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPassword("");
      setNewStaffPhone("");
      setCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err.message || "Failed to register staff account");
    } finally {
      setCreatingStaff(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-4 sm:p-6 space-y-6">
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center space-x-2">
            <Users className="h-5 w-5 text-brand-blue" />
            <span>User & Staff Administration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage citizen customer accounts, staff privileges, digital wallet balances, and account security.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'staff' && (
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreateModalOpen(true);
              }}
              className="bg-brand-accent hover:bg-brand-accentHover text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Register Administrator</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs: Citizens vs Staff */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('citizens')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'citizens'
                ? "bg-brand-blue text-white shadow"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Registered Citizens ({citizensList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'staff'
                ? "bg-slate-900 text-white shadow"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Administrators & Staff ({staffList.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab === 'citizens' ? 'citizens' : 'admins'} by name, email, or phone...`}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* ================= TAB 1: REGISTERED CITIZENS TABLE ================= */}
      {activeTab === 'citizens' && (
        <div className="admin-table-container overflow-x-auto w-full border-2 border-slate-300 rounded-xl shadow-xs">
          <table className="min-w-full whitespace-nowrap text-left text-xs">
            <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[11px] border-b-2 border-slate-300">
              <tr>
                <th className="p-3.5 text-slate-900">Citizen Name</th>
                <th className="p-3.5 text-slate-900">Email Address</th>
                <th className="p-3.5 text-slate-900">Mobile Number</th>
                <th className="p-3.5 text-slate-900">Role</th>
                <th className="p-3.5 text-slate-900">Wallet Balance</th>
                <th className="p-3.5 text-slate-900">Status</th>
                <th className="p-3.5 text-slate-900">Joined Date</th>
                <th className="p-3.5 text-right text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand-blue" />
                    Loading citizen records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No citizens found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const displayName = getDisplayName(u, false);
                  const isBlocked = u.isActive === false;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900">{displayName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                        {u.email || "No Email"}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {u.phoneNumber || "—"}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Citizen User
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-emerald-700">
                        {formatCurrency(u.walletBalance || 0)}
                      </td>
                      <td className="p-3.5">
                        {isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            BLOCKED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenWalletModal(u)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition inline-flex items-center space-x-1 cursor-pointer"
                          title="Adjust Digital Wallet"
                        >
                          <Wallet className="h-3.5 w-3.5" />
                          <span>Wallet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleBlock(u)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition inline-flex items-center space-x-1 cursor-pointer ${
                            isBlocked
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                          title={isBlocked ? "Unblock Citizen" : "Block Citizen"}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          <span>{isBlocked ? "Unblock" : "Block"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition inline-flex items-center space-x-1 cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TAB 2: ADMINISTRATORS & STAFF TABLE ================= */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="admin-table-container overflow-x-auto w-full border-2 border-slate-300 rounded-xl shadow-xs">
            <table className="min-w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[11px] border-b-2 border-slate-300">
                <tr>
                  <th className="p-3.5 text-slate-900">Administrator Name</th>
                  <th className="p-3.5 text-slate-900">Email Address</th>
                  <th className="p-3.5 text-slate-900">Mobile Phone</th>
                  <th className="p-3.5 text-slate-900">Administrative Role</th>
                  <th className="p-3.5 text-slate-900">Permissions / Modules</th>
                  <th className="p-3.5 text-slate-900">Status</th>
                  <th className="p-3.5 text-slate-900">Created Date</th>
                  <th className="p-3.5 text-right text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filtered.map((u) => {
                  const displayName = getDisplayName(u, true);
                  const isBlocked = u.isActive === false;
                  const isSuper = u.role === 'super_admin';

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSuper ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{displayName}</span>
                            {u.uid === adminUser?.uid && (
                              <span className="text-[9px] font-bold text-blue-600">(You)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {u.phoneNumber || "—"}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isSuper 
                            ? "bg-rose-100 text-rose-800 border border-rose-200" 
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {u.role ? u.role.replace('_', ' ') : 'ADMIN'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {isSuper ? "Full Platform Authority" : "Assigned Administrative Modules"}
                      </td>
                      <td className="p-3.5">
                        {isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            AUTHORIZED
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRole(u)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-brand-blue font-bold hover:bg-blue-100 transition inline-flex items-center space-x-1 cursor-pointer"
                          title="Change Admin Role"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Role</span>
                        </button>
                        {u.uid !== adminUser?.uid && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Remove Admin"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= QUICK WALLET ADJUST MODAL ================= */}
      {walletModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Wallet Management</h3>
                <p className="text-xs text-slate-500">
                  Citizen: <strong>{getDisplayName(selectedUser)}</strong> &bull; Current Balance: <span className="font-black text-emerald-700">{formatCurrency(selectedUser.walletBalance || 0)}</span>
                </p>
              </div>
              <button 
                onClick={() => setWalletModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    adjustType === 'credit'
                      ? "bg-emerald-600 text-white border-emerald-600 shadow"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  + Add Credit (Recharge)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    adjustType === 'debit'
                      ? "bg-rose-600 text-white border-rose-600 shadow"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  - Deduct (Debit)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (INR) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Reference *</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Cash collected at center, Online refund, Correction"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className={`px-4 py-2 rounded-lg text-white font-bold text-xs shadow transition disabled:opacity-50 ${
                    adjustType === 'credit' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {adjusting ? "Processing..." : `Confirm ${adjustType === 'credit' ? 'Credit' : 'Debit'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT ROLE MODAL ================= */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Change Account Privileges</h3>
                <p className="text-xs text-slate-500">
                  User: <strong>{getDisplayName(selectedUser, true)}</strong> ({selectedUser.email})
                </p>
              </div>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="user">Citizen (Regular User)</option>
                  {STAFF_ROLES.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label} ({r.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs shadow disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Update Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CREATE STAFF MODAL ================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <UserPlus className="h-4 w-4 text-brand-blue" />
                  <span>Register Administrator / Staff Account</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Enforces unique email and mobile phone check. Staff can immediately login at /admin.
                </p>
              </div>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaffSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Sazzidul Islam"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="staff@netduniya.in"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="e.g. +91 98647 61058"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Role *</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Master Password *</label>
                  <input
                    type="password"
                    value={newStaffPassword}
                    onChange={(e) => setNewStaffPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStaff}
                  className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs shadow flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {creatingStaff ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Register Administrator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
