"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Calendar, 
  Layers, 
  Landmark, 
  Users, 
  DollarSign, 
  FileSpreadsheet, 
  BookOpen, 
  HelpCircle, 
  Activity, 
  Settings, 
  ExternalLink, 
  ChevronRight, 
  LogOut,
  Lock,
  ShieldAlert,
  Loader2,
  Mail,
  KeyRound,
  ArrowLeft,
  Sparkles,
  Wallet,
  UserPlus,
  Phone,
  User as UserIcon,
  CheckCircle2,
  Menu,
  X,
  Briefcase,
  Share2
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { 
  createOrUpdateUser, 
  createAdminRecord, 
  isFirstAdminUser,
  subscribeToHasAnyAdmin,
  seedInitialCategoriesAndServices
} from "@/lib/firestore-service";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/orders", label: "PVC & Shop Orders", icon: CreditCard },
  { href: "/admin/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/services", label: "Services & Forms", icon: Layers },
  { href: "/admin/schemes", label: "Govt Schemes", icon: Landmark },
  { href: "/admin/jobs", label: "Govt Jobs", icon: Briefcase },
  { href: "/admin/users", label: "Users & Staff", icon: Users },
  { href: "/admin/wallet", label: "Wallets & Ledger", icon: Wallet },
  { href: "/admin/payments", label: "Payments & Refunds", icon: DollarSign },
  { href: "/admin/social", label: "Social Media", icon: Share2 },
  { href: "/admin/content", label: "CMS & Notices", icon: FileSpreadsheet },
  { href: "/admin/blogs", label: "Blog Articles", icon: BookOpen },
  { href: "/admin/support", label: "Support Tickets", icon: HelpCircle },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: Activity },
  { href: "/admin/settings", label: "Portal Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, isSuperAdmin, loading, signIn, signOut, refreshProfile } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Real-time admin existence state
  const [hasAnyAdmin, setHasAnyAdmin] = useState<boolean | null>(null);

  // Admin Login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [elevating, setElevating] = useState(false);
  const [canBootstrapAdmin, setCanBootstrapAdmin] = useState(true);

  // Real-time listener for admins collection in Firestore
  useEffect(() => {
    const unsub = subscribeToHasAnyAdmin((exists) => {
      setHasAnyAdmin(exists);
    });
    return () => unsub();
  }, []);

  // Check if current user can bootstrap when zero admins exist
  useEffect(() => {
    let isMounted = true;
    if (user && !isAdmin) {
      isFirstAdminUser().then((isFirst) => {
        if (isMounted) setCanBootstrapAdmin(isFirst);
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [user, isAdmin]);

  // 24-Hour Admin Verification Session
  const [is24hVerified, setIs24hVerified] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedExpiry = localStorage.getItem("netduniya_admin_session_24h");
      if (storedExpiry && Date.now() < Number(storedExpiry)) {
        setIs24hVerified(true);
      }
    }
  }, []);

  // When admin signs in or user is admin, persist the 24-hour verification
  useEffect(() => {
    if (user && isAdmin && typeof window !== "undefined") {
      localStorage.setItem("netduniya_admin_session_24h", String(Date.now() + 24 * 60 * 60 * 1000));
      setIs24hVerified(true);
    }
  }, [user, isAdmin]);

  const handleAdminSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("netduniya_admin_session_24h");
    }
    setIs24hVerified(false);
    await signOut();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      if (!adminEmail.trim() || !adminPassword.trim()) {
        throw new Error("Please enter both administrator email and password");
      }
      await signIn(adminEmail.trim(), adminPassword);
      if (typeof window !== "undefined") {
        localStorage.setItem("netduniya_admin_session_24h", String(Date.now() + 24 * 60 * 60 * 1000));
        setIs24hVerified(true);
      }
    } catch (err: any) {
      console.error("Admin sign in failed:", err);
      let msg = "Invalid administrator credentials";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = "Incorrect administrator email or password. Please verify credentials.";
      } else if (err.message) {
        msg = err.message;
      }
      setLoginError(msg);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleBootstrapSuperAdmin = async () => {
    if (!user) return;
    setElevating(true);
    try {
      await createOrUpdateUser({
        uid: user.uid,
        role: "super_admin",
        updatedAt: Date.now(),
      });
      await createAdminRecord({
        uid: user.uid,
        fullName: profile?.fullName || user.displayName || "Super Admin",
        email: user.email || "",
        phoneNumber: profile?.phoneNumber || "",
        role: "super_admin",
        rules: ["all"],
        isActive: true,
        createdBy: "system_bootstrap",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      // Auto seed Indian services
      try {
        await seedInitialCategoriesAndServices();
      } catch (seedErr) {
        console.warn("Auto seed on bootstrap error:", seedErr);
      }
      await refreshProfile();
      alert("Success! Your account has been initialized as Super Administrator.");
      window.location.reload();
    } catch (err: any) {
      alert("Error initializing super admin: " + err.message);
    } finally {
      setElevating(false);
    }
  };

  // 1. Loading state (auth loading or real-time admins check loading)
  // If user is already 24h verified, signed in, or admin, bypass blocking verification screen!
  if ((loading || hasAnyAdmin === null) && !is24hVerified && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-950 text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center shadow-2xl animate-pulse">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-base font-black text-white">Opening Admin Dashboard...</h2>
          <p className="text-xs text-slate-400 mt-1">Connecting securely to NetDuniya administrative node</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated View: Support both First-Time Setup and Admin Sign In
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full my-8 animate-fadeIn relative z-10">
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
            
            {/* Header Banner */}
            <div className="p-6 sm:p-8 text-center space-y-3 border-b border-slate-800 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Lock className="h-8 w-8" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  NetDuniya Admin Portal
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white mt-2">
                  Administrator Sign In
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                  Enter your registered administrator email and password to access the NetDuniya live control panel.
                </p>
              </div>
            </div>

            {/* Form Container */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="space-y-4">
                {loginError && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center space-x-2.5">
                    <ShieldAlert className="h-4 w-4 flex-shrink-0 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Administrator Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@netduniya.in"
                        required
                        autoComplete="username"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                      <Mail className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Master Password *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                      />
                      <KeyRound className="h-4 w-4 text-slate-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm py-3 px-6 rounded-xl shadow-lg transition flex items-center justify-center space-x-2 active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {loggingIn ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                        <span>Authenticating Admin...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 text-slate-950" />
                        <span>Sign In to Dashboard</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-800 pt-4 flex items-center justify-center text-xs text-slate-500">
                <span className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center space-x-1.5">
                  <Lock className="h-3 w-3 text-amber-400" />
                  <span>NetDuniya Central Administrator Portal &bull; Encrypted Session</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 3. User is logged in, but does NOT have admin access
  const masterAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@netduniya.in").toLowerCase();
  const isMasterUser = user?.email?.toLowerCase() === masterAdminEmail;

  if (user && !isAdmin && !isMasterUser && !is24hVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-xl font-black text-white">Administrator Access Required</h1>
            <p className="text-xs text-slate-400 mt-2">
              Signed in as <strong className="text-amber-300">{user.email}</strong>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Your account currently has the role <span className="font-bold text-slate-200">"{profile?.role || 'Citizen User'}"</span> and is not authorized to access administrative controls.
            </p>
          </div>

          {canBootstrapAdmin ? (
            <div className="p-4 bg-amber-950/40 border border-amber-700/50 rounded-2xl space-y-3 text-left">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-black">
                <Sparkles className="h-4 w-4" />
                <span>Initial Platform Setup</span>
              </div>
              <p className="text-xs text-slate-300">
                No administrators exist yet in the database. You can initialize this account as the primary Super Administrator.
              </p>
              <button
                type="button"
                onClick={handleBootstrapSuperAdmin}
                disabled={elevating}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                {elevating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    <span>Initializing Super Admin...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-slate-950" />
                    <span>Initialize as Super Admin</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => signOut()}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out & Switch to Admin Account</span>
              </button>

              <Link
                href="/"
                className="block w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition"
              >
                Return to Public Website
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. Authenticated Administrator: Render complete dedicated Admin Workspace
  const displayName = profile?.fullName || user?.displayName || user?.email || "Administrator";
  const displayRole = isSuperAdmin ? "SUPER ADMIN" : (profile?.role?.toUpperCase() || "ADMIN");

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col animate-fadeIn">
      
      {/* Dedicated Top Administrative Header (Fixed Height, No Joint Scroll) */}
      <header className="h-16 flex-shrink-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3.5">
          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            aria-label="Toggle Admin Navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-amber-400" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/images/logo.png" 
              alt="NetDuniya Logo" 
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/founder.jpg";
              }}
            />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                NetDuniya Admin Portal
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
                {displayRole}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Central E-Governance Administration Node &bull; Digital Cyber Cafe
            </p>
          </div>
        </div>

        {/* Right Admin Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-bold text-white">{displayName}</p>
            <p className="text-[11px] text-slate-400">{user?.email}</p>
          </div>

          <Link
            href="/"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-3 rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
            title="Open Public Website"
          >
            <span className="hidden sm:inline">Website</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleAdminSignOut}
            className="bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Dual-Pane Administrative Container */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Desktop Admin Navigation Sidebar (Fixed Width, Independently Scrollable) */}
        <aside className="hidden lg:flex w-64 xl:w-72 flex-shrink-0 h-full overflow-y-auto bg-slate-900 border-r border-slate-800 p-3 flex-col justify-between space-y-1">
          <div>
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Systems</span>
              </div>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-400/30">
                LIVE
              </span>
            </div>

            <nav className="space-y-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition group ${
                      isActive
                        ? "bg-brand-blue text-white shadow-md border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`h-4 w-4 ${isActive ? "text-amber-300" : "text-slate-400 group-hover:text-slate-200"}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/70" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-3 border-t border-slate-800 text-center mt-4">
            <p className="text-[10px] text-slate-500">
              NetDuniya Digital Cyber Cafe Portal
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <aside className="relative w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between overflow-y-auto shadow-2xl z-10">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-xs font-black text-white">Menu Navigation</span>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {ADMIN_NAV.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                          isActive
                            ? "bg-brand-blue text-white shadow-md border border-blue-500/30"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`h-4 w-4 ${isActive ? "text-amber-300" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/70" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-3 border-t border-slate-800 text-center mt-4">
                <p className="text-[10px] text-slate-500">
                  NetDuniya Digital Cyber Cafe Portal
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* Admin Workspace Content (Independently Scrollable) */}
        <main className="flex-1 h-full overflow-y-auto bg-slate-100 p-3 sm:p-5 lg:p-6 admin-content-area">
          <div className="w-full max-w-[1600px] mx-auto text-slate-900">
            {children}
          </div>
        </main>

      </div>

    </div>
  );
}
