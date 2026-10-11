"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth, db } from "./firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { UserProfile, UserRole } from "./types";
import { 
  getUserProfile, 
  createOrUpdateUser, 
  subscribeToUserProfile,
  isFirstAdminUser,
  createAdminRecord,
  getAdminRecord,
  getAdminByEmail
} from "./firestore-service";
import { AdminRecord } from "./types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  adminRecord: AdminRecord | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isAgroAdmin: boolean;
  walletBalance: number;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  adminRecord: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  isAgroAdmin: false,
  walletBalance: 0,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to sync admin rights directly from Firestore admins collection
  const syncAdminStatus = async (uid: string, email: string, userProfile?: UserProfile | null) => {
    try {
      let adm = await getAdminRecord(uid);
      if (!adm && email) {
        adm = await getAdminByEmail(email);
      }
      setAdminRecord(adm);

      // If in admins collection, ensure role is mirrored
      if (adm && userProfile && userProfile.role !== adm.role) {
        await createOrUpdateUser({ uid, role: adm.role });
      }
    } catch (err) {
      console.warn("Error syncing admin status from Firestore:", err);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Query Firestore admins collection directly (no env var required)
        await syncAdminStatus(currentUser.uid, currentUser.email || "");

        // Subscribe to user's profile in real-time
        unsubscribeProfile = subscribeToUserProfile(currentUser.uid, async (userProfile) => {
          if (userProfile) {
            // Check if user is blocked
            if (userProfile.isActive === false && userProfile.role === 'user') {
              fbSignOut(auth);
              setProfile(null);
              setUser(null);
              setAdminRecord(null);
              alert("Your account has been suspended by the administrator. Please contact support at netduniya@gmail.com.");
              setLoading(false);
              return;
            }

            setProfile(userProfile);
            await syncAdminStatus(currentUser.uid, currentUser.email || "", userProfile);
          } else {
            // Create user profile in Firestore
            let adm = await getAdminRecord(currentUser.uid);
            if (!adm && currentUser.email) {
              adm = await getAdminByEmail(currentUser.email);
            }
            const assignedRole: UserRole = adm ? adm.role : 'user';

            const newProfile: UserProfile = {
              uid: currentUser.uid,
              fullName: currentUser.displayName || currentUser.email?.split('@')[0] || "NetDuniya User",
              email: currentUser.email || "",
              phoneNumber: currentUser.phoneNumber || "",
              role: assignedRole,
              walletBalance: 0,
              isActive: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await createOrUpdateUser(newProfile);
            setProfile(newProfile);
            setAdminRecord(adm);
          }
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setProfile(null);
        setAdminRecord(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const userProfile = await getUserProfile(cred.user.uid);
      if (userProfile && userProfile.isActive === false && userProfile.role === 'user') {
        await fbSignOut(auth);
        throw new Error("This account has been blocked or suspended by administrator. Please contact support.");
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, phone?: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await updateProfile(cred.user, { displayName: fullName });

      // Check if there are any existing super_admin or admin accounts in Firestore
      let isFirstAdmin = false;
      try {
        isFirstAdmin = await isFirstAdminUser();
      } catch (err) {
        console.warn("Error checking admin status:", err);
      }

      const isSuper = isFirstAdmin;
      const initialProfile: UserProfile = {
        uid: cred.user.uid,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phone?.trim() || "",
        role: isSuper ? 'super_admin' : 'user',
        walletBalance: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await createOrUpdateUser(initialProfile);

      // If Super Admin, write to the dedicated admins collection
      if (isSuper) {
        try {
          await createAdminRecord({
            uid: cred.user.uid,
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phoneNumber: phone?.trim() || "",
            role: 'super_admin',
            rules: ['all'],
            isActive: true,
            createdBy: 'system_bootstrap',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        } catch (adminErr) {
          console.warn("Error registering admin record:", adminErr);
        }
      }

      setProfile(initialProfile);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await fbSignOut(auth);
      setProfile(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      if (p) setProfile(p);
    }
  };

  // Dynamic Firestore-driven roles + Instant Master Admin Recognition
  const masterAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@netduniya.in").toLowerCase();
  const isMasterAdmin = user?.email?.toLowerCase() === masterAdminEmail;

  // Fully authorized admin check across Firestore records, collections, and master email
  const isAdmin = isMasterAdmin || 
    Boolean(adminRecord) || 
    ['super_admin', 'admin', 'agro_admin', 'service_manager', 'finance_manager', 'content_manager', 'support_manager'].includes(profile?.role || '') ||
    ['super_admin', 'admin', 'agro_admin', 'service_manager', 'finance_manager', 'content_manager', 'support_manager'].includes(adminRecord?.role || '');

  // Any authorized admin on the portal possesses complete Super Admin administrative permissions
  const isSuperAdmin = isMasterAdmin || isAdmin || profile?.role === 'super_admin' || profile?.role === 'admin' || adminRecord?.role === 'super_admin' || adminRecord?.role === 'admin';
  const isAgroAdmin = profile?.role === 'agro_admin' || adminRecord?.role === 'agro_admin';
  const walletBalance = profile?.walletBalance || 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        adminRecord,
        loading,
        isAdmin,
        isSuperAdmin,
        isAgroAdmin,
        walletBalance,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
