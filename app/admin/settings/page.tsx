"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings,
  Save,
  Database,
  CheckCircle2,
  Phone,
  Mail,
  Loader2,
  QrCode,
  Globe,
  Layout,
  Layers,
  Copy,
  Check,
  ShieldCheck,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  Users,
  KeyRound,
  User,
  AlertTriangle,
  X,
  Shield,
  Clock,
  Sparkles,
  CreditCard,
  Share2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getSiteSettings,
  subscribeToSiteSettings,
  updateSiteSettings,
  seedInitialCategoriesAndServices,
  subscribeToAllAdmins,
  deleteAdminRecord,
  transferSuperAdminRole,
  createOrUpdateUser,
  createAdminRecord,
  recordAuditLog,
  DEFAULT_SITE_SETTINGS
} from "@/lib/firestore-service";
import { SiteSettings, AdminRecord, UserRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const ROLE_OPTIONS: { role: UserRole; label: string; desc: string }[] = [
  { role: "super_admin", label: "Super Administrator", desc: "Full master administrative control, portal settings, and financials." },
  { role: "admin", label: "Operations Admin", desc: "Manages citizen applications, PVC orders, appointments, and support." },
  { role: "service_manager", label: "Service Manager", desc: "Manages services, dynamic forms, categories, and documents." },
  { role: "finance_manager", label: "Finance & Accounts", desc: "Manages citizen wallet top-ups, transaction ledger, and refunds." },
  { role: "content_manager", label: "Content & CMS Editor", desc: "Manages government schemes, alerts, banners, and blog articles." },
  { role: "support_manager", label: "Support Manager", desc: "Manages citizen queries, grievance tickets, and live assistance." },
];

export default function AdminSettingsPage() {
  const { profile, user, isSuperAdmin, refreshProfile, signOut } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Admin & Staff Governance State
  const [adminsList, setAdminsList] = useState<AdminRecord[]>([]);
  const [addAdminModalOpen, setAddAdminModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<UserRole>("admin");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Super Admin Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedSuccessorUid, setSelectedSuccessorUid] = useState<string>("");
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    const unsubSettings = subscribeToSiteSettings((s) => {
      if (s) {
        setSettings(prev => ({ ...DEFAULT_SITE_SETTINGS, ...s }));
      }
    });
    const unsubAdmins = subscribeToAllAdmins((data) => setAdminsList(data));
    return () => {
      unsubSettings();
      unsubAdmins();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    try {
      await updateSiteSettings(settings, user?.uid || "admin", profile?.fullName || "Admin");
      setSuccess("Portal settings saved successfully!");
      setTimeout(() => setSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm("Are you sure you want to initialize default categories, services, notices, and important links? Existing items with different IDs will not be deleted.")) return;
    setSeeding(true);
    try {
      await seedInitialCategoriesAndServices();
      setSuccess("Database initialized with default digital service catalog!");
      setTimeout(() => setSuccess(null), 3500);
    } catch (err) {
      console.error(err);
      alert("Failed to seed database.");
    } finally {
      setSeeding(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(settings.upiId || "");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Create New Administrator
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setAdminError("Please fill out all required fields.");
      return;
    }

    if (newAdminPassword.length < 6) {
      setAdminError("Password must be at least 6 characters.");
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newAdminName.trim(),
          email: newAdminEmail.trim().toLowerCase(),
          password: newAdminPassword,
          phoneNumber: newAdminPhone.trim(),
          role: newAdminRole,
          rules: ["all"],
          creatorName: profile?.fullName || user?.email || "Super Admin",
          creatorId: user?.uid || "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create administrator account.");
      }

      setAddAdminModalOpen(false);
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPhone("");
      setNewAdminPassword("");
      setNewAdminRole("admin");
      setSuccess(`Administrator ${newAdminName} created successfully with role ${newAdminRole}!`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setAdminError(err.message || "Failed to create admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Transfer Super Admin Ownership
  const handleTransferSuperAdmin = async () => {
    if (!selectedSuccessorUid) {
      alert("Please select an administrator to transfer Super Admin ownership to.");
      return;
    }

    const successor = adminsList.find(a => a.uid === selectedSuccessorUid);
    if (!successor) return;

    const confirmText = `⚠️ CRITICAL ACTION: Are you sure you want to transfer MASTER SUPER ADMIN ownership to ${successor.fullName} (${successor.email})?\n\nWARNING: You will IMMEDIATELY LOSE ALL ADMIN ACCESS, your account will become a standard citizen user, and you will be signed out right now.`;
    if (!confirm(confirmText)) return;

    setTransferring(true);
    try {
      await transferSuperAdminRole(user?.uid || "", successor.uid, false);
      await recordAuditLog({
        actorId: user?.uid || "admin",
        actorName: profile?.fullName || "Super Admin",
        actorRole: "super_admin",
        action: "update_setting",
        module: "settings",
        recordId: successor.uid,
        details: `Transferred master Super Admin ownership to ${successor.fullName} (${successor.email}). Previous admin demoted and removed.`,
      });

      setTransferModalOpen(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("netduniya_admin_session_24h");
      }
      alert(`Super Admin ownership successfully transferred to ${successor.fullName}! Your administrator privileges have been revoked. You will now be redirected to the login page.`);
      await signOut();
      window.location.href = "/login";
    } catch (err: any) {
      console.error("Error transferring super admin:", err);
      alert("Failed to transfer super admin: " + err.message);
    } finally {
      setTransferring(false);
    }
  };

  // Delete Administrator
  const handleDeleteAdmin = async (adm: AdminRecord) => {
    if (adm.role === "super_admin" && adminsList.filter(a => a.role === "super_admin").length <= 1) {
      alert("You cannot delete the only Super Administrator on the platform.");
      return;
    }

    if (!confirm(`Are you sure you want to remove administrator privileges from ${adm.fullName} (${adm.email})?`)) return;

    try {
      await deleteAdminRecord(adm.uid);
      await createOrUpdateUser({ uid: adm.uid, role: "user", updatedAt: Date.now() });
      setSuccess(`Removed administrator access for ${adm.fullName}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert("Failed to remove administrator: " + err.message);
    }
  };

  // Generate live UPI QR preview
  const upiId = settings.upiId || DEFAULT_SITE_SETTINGS.upiId || "9864761058@ybl";
  const upiName = settings.upiName || settings.siteName || "Yasin Net Duniya";
  const sampleAmount = 50;
  const upiIntentString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${sampleAmount}&cu=INR&tn=NetDuniyaPayment`;
  const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiIntentString)}`;

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-4 sm:p-6 lg:p-8 space-y-8 text-slate-900">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-black text-slate-900">Portal Configuration & Super Admin Controls</h1>
            <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-300">
              Master Admin
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium mt-1">
            Manage portal identity, contact details, payment UPI ID, website text, PVC prices, and administrative team access.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <Link
            href="/admin/social"
            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2 px-3.5 rounded-lg shadow flex items-center space-x-1.5 transition-colors border border-rose-700"
          >
            <Share2 className="h-4 w-4" />
            <span>Social Media Channels</span>
          </Link>

          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="bg-brand-accent hover:bg-brand-accentHover text-white font-bold text-xs py-2 px-4 rounded-lg shadow flex items-center space-x-1.5 self-start sm:self-auto transition-colors"
          >
            {seeding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Seeding Catalog...</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Seed Initial Database</span>
              </>
            )}
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 font-bold text-xs rounded-xl flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
            <span>✓ {success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-800 font-bold hover:text-black">✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: ADMIN & SUPER ADMIN MANAGEMENT & OWNERSHIP TRANSFER
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border-2 border-slate-300 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-300 pb-3 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                Administrators & Super Admin Governance
              </h2>
              <p className="text-xs text-slate-700 font-medium">
                Create new administrators, manage staff roles, and securely transfer Super Admin master ownership.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setTransferModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 px-3.5 rounded-lg shadow flex items-center space-x-1.5 transition-colors cursor-pointer border border-amber-600"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transfer Super Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { setAdminError(null); setAddAdminModalOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-lg shadow flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>+ Add New Administrator</span>
            </button>
          </div>
        </div>

        {/* Admins List Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center space-x-1.5">
            <Users className="h-4 w-4 text-slate-700" />
            <span>Active Administrators & Assigned Privileges</span>
          </h3>

          <div className="admin-table-container bg-white border border-slate-300 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                <tr>
                  <th className="p-3 text-slate-900">Administrator Name</th>
                  <th className="p-3 text-slate-900">Email Address</th>
                  <th className="p-3 text-slate-900">Mobile / WhatsApp</th>
                  <th className="p-3 text-slate-900">Assigned Role</th>
                  <th className="p-3 text-slate-900">Status</th>
                  <th className="p-3 text-right text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {adminsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-700 font-bold">
                      No administrator records found. Click "+ Add New Administrator" to add staff.
                    </td>
                  </tr>
                ) : (
                  adminsList.map((adm) => {
                    const isSelf = adm.uid === user?.uid;
                    return (
                      <tr key={adm.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-black text-slate-900">
                          <div className="flex items-center space-x-2">
                            <span>{adm.fullName}</span>
                            {isSelf && (
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-300">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-900">{adm.email}</td>
                        <td className="p-3 font-semibold text-slate-900">{adm.phoneNumber || "—"}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${adm.role === 'super_admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                            }`}>
                            {adm.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                            ACTIVE
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(adm)}
                              className="text-rose-700 hover:text-rose-900 font-bold hover:underline inline-flex items-center space-x-1"
                              title="Revoke admin access"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: PORTAL CONFIGURATION FORM (ALL INPUTS BLACK TEXT)
          ═══════════════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSave} className="space-y-8 max-w-4xl">

        {/* ─── Basic Portal Info ─── */}
        <div className="space-y-4 p-5 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2.5">
            <Globe className="h-5 w-5 text-brand-blue" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Portal Identity & Contact Numbers
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">
                Portal Name *
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                required
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">
                Portal Tagline *
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                required
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:border-brand-blue"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">
                Support Phone *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  required
                  className="w-full bg-white border-2 border-slate-300 rounded-lg pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:border-brand-blue"
                />
                <Phone className="h-4 w-4 text-slate-600 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">
                WhatsApp Helpline Number (with country code) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  required
                  placeholder="+91..."
                  className="w-full bg-white border-2 border-slate-300 rounded-lg pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:border-brand-blue"
                />
                <Phone className="h-4 w-4 text-emerald-600 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">
                Official Support Email *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  required
                  className="w-full bg-white border-2 border-slate-300 rounded-lg pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:border-brand-blue"
                />
                <Mail className="h-4 w-4 text-slate-600 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">
                Kendra Physical Address *
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                required
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">
                Working Hours *
              </label>
              <input
                type="text"
                value={settings.workingHours}
                onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                required
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:border-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* ─── UPI Payment Configuration ─── */}
        <div className="space-y-4 p-5 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2.5">
            <QrCode className="h-5 w-5 text-emerald-700" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              UPI Payment Gateway & QR Configuration
            </h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded border border-emerald-300">
              Live QR Auto-Generate
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Your Official UPI ID (VPA) *</label>
                <p className="text-[11px] text-slate-600 mb-1.5 font-medium">Customers pay directly to this UPI address (e.g. 9864761058@ybl, yourkendra@paytm)</p>
                <div className="relative flex items-center gap-2">
                  <input
                    type="text"
                    value={settings.upiId || ""}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                    placeholder="e.g. 9864761058@ybl"
                    className="w-full bg-white border-2 border-emerald-400 focus:border-emerald-600 rounded-lg p-2.5 text-xs sm:text-sm font-mono font-black text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    title="Copy UPI ID"
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition"
                  >
                    {copiedUpi ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-700" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">UPI Merchant Display Name</label>
                <p className="text-[11px] text-slate-600 mb-1.5 font-medium">Business/Owner name shown inside Google Pay, PhonePe, Paytm</p>
                <input
                  type="text"
                  value={settings.upiName || ""}
                  onChange={(e) => setSettings({ ...settings, upiName: e.target.value })}
                  placeholder="e.g. Yasin Net Duniya"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-black text-slate-900"
                />
              </div>

              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-[11px] text-amber-950 space-y-1">
                <p className="font-black">⚡ Real-time Payment Sync:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-amber-900 font-semibold">
                  <li>Change UPI ID here → Click Save Settings</li>
                  <li>QR code regenerates automatically with new UPI details</li>
                  <li>Customers scan and pay directly into your bank</li>
                </ul>
              </div>
            </div>

            {/* Right: Live QR Preview */}
            <div className="bg-emerald-50/50 border-2 border-emerald-300 rounded-2xl p-5 flex flex-col items-center space-y-3">
              <div className="flex items-center space-x-2 text-xs font-black text-emerald-900 uppercase tracking-wide">
                <QrCode className="h-4 w-4 text-emerald-700" />
                <span>Live Dynamic QR Preview</span>
              </div>

              <div className="bg-white p-3 rounded-xl shadow border border-emerald-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={upiId}
                  src={qrPreviewUrl}
                  alt="UPI QR Preview"
                  className="w-36 h-36 rounded-lg"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-[10px] text-slate-600 font-semibold">UPI ID:</p>
                <code className="text-xs font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-300 block">
                  {upiId}
                </code>
                <p className="text-[10px] text-slate-700 font-bold">Display: {upiName}</p>
                <p className="text-[10px] text-emerald-700 font-black">Sample QR: ₹50 Application Verification</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Razorpay Payment Gateway Configuration ─── */}
        <div className="space-y-4 p-5 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2.5">
            <CreditCard className="h-5 w-5 text-blue-700" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Razorpay Payment Gateway (Live Merchant Keys)
            </h2>
            <span className="text-[10px] bg-blue-100 text-blue-900 font-black px-2 py-0.5 rounded border border-blue-300">
              Cards, UPI & NetBanking
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
              <span className="font-black block">🛡️ Real-Time Razorpay Gateway Integration:</span>
              <p className="text-slate-700 leading-relaxed">
                Add your real merchant keys from <a href="https://dashboard.razorpay.com/#/access/api-keys" target="_blank" rel="noreferrer" className="font-black text-blue-700 underline">Razorpay Dashboard &gt; Settings &gt; API Keys</a>. Once saved here, citizens can directly pay via Cards, UPI, NetBanking & Wallets without requiring environment rebuilds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  Razorpay Key ID (Key Id) *
                </label>
                <p className="text-[11px] text-slate-600 mb-1.5 font-medium">Starts with <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">rzp_live_...</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">rzp_test_...</code></p>
                <input
                  type="text"
                  value={settings.razorpayKeyId || ""}
                  onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value.trim() })}
                  placeholder="rzp_live_xxxxxxxxxxxxxx"
                  className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-lg p-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  Razorpay Key Secret (Secret Key) *
                </label>
                <p className="text-[11px] text-slate-600 mb-1.5 font-medium">Merchant Secret Key generated in Razorpay Dashboard</p>
                <input
                  type="password"
                  value={settings.razorpayKeySecret || ""}
                  onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value.trim() })}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-lg p-2.5 text-xs sm:text-sm font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Hero & Services Section Titles ─── */}
        <div className="space-y-4 p-5 bg-white rounded-2xl border-2 border-slate-300 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-2.5">
            <Layout className="h-5 w-5 text-violet-700" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Homepage Titles & Headlines
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">Hero Headline</label>
              <input
                type="text"
                value={settings.heroHeadline || ""}
                onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
                placeholder="e.g. Fast-Track E-Services & Direct Assistance"
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-black text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">Hero Subtitle / Description</label>
              <textarea
                rows={2}
                value={settings.heroSubtitle || ""}
                onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                placeholder="e.g. Select an instant service to submit your application..."
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Services Catalog Title</label>
                <input
                  type="text"
                  value={settings.servicesGridTitle || ""}
                  onChange={(e) => setSettings({ ...settings, servicesGridTitle: e.target.value })}
                  placeholder="e.g. Government & Citizen Services"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Services Catalog Subtitle</label>
                <input
                  type="text"
                  value={settings.servicesGridSubtitle || ""}
                  onChange={(e) => setSettings({ ...settings, servicesGridSubtitle: e.target.value })}
                  placeholder="e.g. Complete government & digital services assistance..."
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Smart PVC Card Pricing ─── */}
        <div className="p-5 bg-amber-50/50 rounded-2xl border-2 border-amber-300 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-300/80 pb-2.5">
            <h3 className="text-sm font-black uppercase text-amber-950">
              Smart PVC Card Pricing & Courier Fees
            </h3>
            <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2.5 py-0.5 rounded border border-amber-400">
              Per-Card Pricing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">Default Offer Price (₹) *</label>
              <input
                type="number"
                min={1}
                value={settings.pvcCardPrice ?? 50}
                onChange={(e) => setSettings({ ...settings, pvcCardPrice: Number(e.target.value) })}
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2 text-xs font-black text-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">Original MRP Price (₹) *</label>
              <input
                type="number"
                min={1}
                value={settings.pvcCardOriginalPrice ?? 99}
                onChange={(e) => setSettings({ ...settings, pvcCardOriginalPrice: Number(e.target.value) })}
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2 text-xs font-black text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1">Doorstep Courier Fee (₹) *</label>
              <input
                type="number"
                min={0}
                value={settings.pvcDeliveryFee ?? 40}
                onChange={(e) => setSettings({ ...settings, pvcDeliveryFee: Number(e.target.value) })}
                className="w-full bg-white border-2 border-slate-300 rounded-lg p-2 text-xs font-black text-slate-900"
              />
            </div>
          </div>

          {/* Individual Card Custom Pricing */}
          <div className="pt-2 border-t border-amber-300/80">
            <h4 className="text-xs font-black text-amber-950 mb-2">
              Individual Card Pricing (हर PVC कार्ड का अलग मूल्य):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'Aadhaar Card', label: 'Aadhaar PVC (₹)', def: 50 },
                { key: 'PAN Card', label: 'PAN Card PVC (₹)', def: 70 },
                { key: 'Voter ID', label: 'Voter ID PVC (₹)', def: 60 },
                { key: 'Driving Licence', label: 'Driving Licence PVC (₹)', def: 90 },
                { key: 'RC PVC Card', label: 'RC Smart Card (₹)', def: 90 },
                { key: 'Ayushman Card', label: 'Ayushman Golden (₹)', def: 60 },
                { key: 'ABHA Card', label: 'ABHA Health Card (₹)', def: 50 },
                { key: 'Ration Card PVC', label: 'Ration Card PVC (₹)', def: 60 },
                { key: 'APAAR ID Card', label: 'APAAR Student ID (₹)', def: 60 },
                { key: 'E-Shram Card', label: 'E-Shram Card (₹)', def: 50 },
                { key: 'Custom ID', label: 'Custom Smart Card (₹)', def: 80 },
              ].map((item) => (
                <div key={item.key} className="bg-white p-2.5 rounded-lg border-2 border-amber-200">
                  <label className="block text-[11px] font-black text-slate-900 mb-1">
                    {item.label}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settings.pvcCardPrices?.[item.key] ?? item.def}
                    onChange={(e) => {
                      const newPrices = { ...(settings.pvcCardPrices || {}) };
                      newPrices[item.key] = Number(e.target.value);
                      setSettings({ ...settings, pvcCardPrices: newPrices });
                    }}
                    className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-black text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Feature Toggles ─── */}
        <div className="p-5 bg-white rounded-2xl border-2 border-slate-300 space-y-3 shadow-sm">
          <h3 className="text-xs font-black uppercase text-slate-900">Module Feature Toggles</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center space-x-2 text-xs font-black text-slate-900 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                checked={settings.enableWallet}
                onChange={(e) => setSettings({ ...settings, enableWallet: e.target.checked })}
                className="w-4 h-4 text-brand-blue rounded"
              />
              <span>Enable Pre-paid Citizen Wallet</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-black text-slate-900 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                checked={settings.enablePVC}
                onChange={(e) => setSettings({ ...settings, enablePVC: e.target.checked })}
                className="w-4 h-4 text-brand-blue rounded"
              />
              <span>Enable Smart PVC Card Ordering</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-black text-slate-900 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                checked={settings.enableAppointments}
                onChange={(e) => setSettings({ ...settings, enableAppointments: e.target.checked })}
                className="w-4 h-4 text-brand-blue rounded"
              />
              <span>Enable Kendra Appointments</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-black text-slate-900 cursor-pointer p-2 rounded-lg hover:bg-slate-50 border border-slate-200">
              <input
                type="checkbox"
                checked={settings.enableShop}
                onChange={(e) => setSettings({ ...settings, enableShop: e.target.checked })}
                className="w-4 h-4 text-brand-blue rounded"
              />
              <span>Enable Digital Hardware Shop</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-blue hover:bg-brand-primary text-white font-black text-sm py-3 px-8 rounded-xl shadow-lg transition flex items-center space-x-2 cursor-pointer active:scale-98"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Saving Portal Settings...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>Save All Portal Settings</span>
            </>
          )}
        </button>

      </form>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: ADD NEW ADMINISTRATOR / STAFF
          ═══════════════════════════════════════════════════════════════════════ */}
      {addAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-300 max-w-lg w-full p-6 space-y-4 my-8 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Add New Administrator / Staff</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddAdminModalOpen(false)}
                className="text-slate-500 hover:text-black font-black text-base"
              >
                ✕
              </button>
            </div>

            {adminError && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Login Email Address *</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="e.g. rahul.admin@netduniya.in"
                  required
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Mobile / WhatsApp</label>
                  <input
                    type="tel"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">Select Administrative Role *</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as UserRole)}
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-black text-slate-900 focus:border-indigo-600"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.role} value={opt.role}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddAdminModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-lg shadow transition flex items-center space-x-1.5"
                >
                  {creatingAdmin ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Create Administrator</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: TRANSFER SUPER ADMIN OWNERSHIP
          ═══════════════════════════════════════════════════════════════════════ */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 max-w-md w-full p-6 space-y-4 my-8 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Transfer Super Admin Ownership</h3>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-500 hover:text-black font-black text-base"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-semibold space-y-1">
              <p className="font-black text-amber-900">⚠️ Master Ownership Warning:</p>
              <p>
                Transferring Super Admin status elevates the chosen administrator to full master ownership with unrestricted control over portal settings, financial adjustments, and team access.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  Select Successor Administrator *
                </label>
                <select
                  value={selectedSuccessorUid}
                  onChange={(e) => setSelectedSuccessorUid(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 text-xs font-black text-slate-900 focus:border-amber-500"
                >
                  <option value="">-- Choose an administrator --</option>
                  {adminsList
                    .filter(a => a.uid !== user?.uid)
                    .map((a) => (
                      <option key={a.uid} value={a.uid}>
                        {a.fullName} ({a.email}) — Current Role: {a.role}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-black text-rose-900">
                  <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>Immediate Admin Revocation & Logout</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                  Upon transferring Super Admin ownership, your account will be <strong>immediately demoted to a regular Citizen account and permanently removed from all administrators</strong>. You will be logged out instantly and will NO LONGER have access to the Admin Panel.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTransferSuperAdmin}
                  disabled={transferring || !selectedSuccessorUid}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {transferring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Confirm & Transfer Super Admin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
