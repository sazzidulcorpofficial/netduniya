import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  runTransaction,
  serverTimestamp,
  type Unsubscribe,
  type DocumentData
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { 
  UserProfile, 
  Service, 
  Category, 
  ServiceApplication, 
  ApplicationStatus,
  Appointment, 
  PVCCardOrder, 
  ShopProduct, 
  ShopOrder, 
  WalletTransaction, 
  PaymentRecord, 
  GovernmentScheme, 
  GovernmentJob,
  ImportantLink, 
  NoticeTicker, 
  BannerItem, 
  FounderData, 
  BlogArticle, 
  SupportTicket, 
  AuditLog, 
  SiteSettings,
  AdminRecord,
  SocialMediaLink 
} from "./types";
import { generateUniqueId } from "./utils";
import { REAL_GOVERNMENT_SCHEMES_100 } from "./data/government-schemes";
import { DIGITAL_SEVA_CATEGORIES, INITIAL_INDIAN_SERVICES } from "./data/indian-services";
import { INITIAL_BLOG_ARTICLES } from "./data/initial-blogs";

/**
 * Strips all undefined values recursively so Firestore setDoc/updateDoc never throws:
 * "Unsupported field value: undefined"
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => cleanFirestoreData(item)) as any;
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        const c = cleanFirestoreData(value);
        if (c !== undefined) {
          cleaned[key] = c;
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// --- DEFAULT SOCIAL MEDIA CHANNELS ---
// Function to verify if a social URL is a real configured link, NOT a generic placeholder or root domain
export function isRealSocialUrl(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim().toLowerCase().replace(/\/+$/, "");
  if (!trimmed) return false;
  const placeholderUrls = [
    "https://facebook.com", "http://facebook.com", "facebook.com", "https://www.facebook.com", "http://www.facebook.com", "www.facebook.com",
    "https://linkedin.com", "http://linkedin.com", "linkedin.com", "https://www.linkedin.com", "http://www.linkedin.com", "www.linkedin.com",
    "https://twitter.com", "http://twitter.com", "twitter.com", "https://www.twitter.com", "http://www.twitter.com", "www.twitter.com",
    "https://x.com", "http://x.com", "x.com", "https://www.x.com", "http://www.x.com", "www.x.com",
    "https://youtube.com", "http://youtube.com", "youtube.com", "https://www.youtube.com", "http://www.youtube.com", "www.youtube.com",
    "https://instagram.com", "http://instagram.com", "instagram.com", "https://www.instagram.com", "http://www.instagram.com", "www.instagram.com",
    "https://t.me", "http://t.me", "t.me",
    "https://whatsapp.com", "http://whatsapp.com", "whatsapp.com", "https://wa.me", "http://wa.me", "wa.me",
    "https://youtube.com/@netduniya", "https://instagram.com/netduniya", "https://facebook.com/netduniya",
    "https://whatsapp.com/channel/netduniya", "https://twitter.com/netduniya", "https://t.me/netduniya",
  ];
  if (placeholderUrls.includes(trimmed)) return false;
  return true;
}

export const DEFAULT_SOCIAL_MEDIA_LINKS: SocialMediaLink[] = [
  {
    id: "youtube",
    name: "YouTube Channel",
    url: "",
    iconType: "youtube",
    bgColor: "bg-red-600",
    isActive: false,
  },
  {
    id: "instagram",
    name: "Instagram Profile",
    url: "",
    iconType: "instagram",
    bgColor: "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500",
    isActive: false,
  },
  {
    id: "facebook",
    name: "Facebook Page",
    url: "",
    iconType: "facebook",
    bgColor: "bg-blue-600",
    isActive: false,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Channel",
    url: "",
    iconType: "whatsapp",
    bgColor: "bg-emerald-600",
    isActive: false,
  },
  {
    id: "twitter",
    name: "Twitter / X",
    url: "",
    iconType: "twitter",
    bgColor: "bg-slate-900",
    isActive: false,
  },
  {
    id: "telegram",
    name: "Telegram Channel",
    url: "",
    iconType: "telegram",
    bgColor: "bg-sky-600",
    isActive: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn Profile",
    url: "",
    iconType: "linkedin",
    bgColor: "bg-sky-700",
    isActive: false,
  }
];

// --- SITE SETTINGS ---
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "Net Duniya",
  tagline: "Your Trusted Digital & E-Governance Services Portal – Barpeta, Assam",
  contactEmail: "netduniya@gmail.com",
  contactPhone: "+91 6001716993",
  whatsappNumber: "916001716993",
  whatsappDefaultMessage: "Hello Net Duniya, I need assistance with an online service.",
  address: "Net Duniya Digital Center, Hajo Daulashal Road, Near Khongra Post Office, Barpeta, Assam 781305",
  workingHours: "8:00 AM – 9:00 PM (Daily)",
  enableShop: true,
  enableAppointments: true,
  enablePVC: true,
  enableWallet: true,
  pvcCardPrice: 50,
  pvcCardOriginalPrice: 99,
  pvcDeliveryFee: 40,
  pvcCardPrices: {
    'Aadhaar Card': 50,
    'PAN Card': 70,
    'Voter ID': 60,
    'Driving Licence': 90,
    'RC PVC Card': 90,
    'Ayushman Card': 60,
    'ABHA Card': 50,
    'Ration Card PVC': 60,
    'APAAR ID Card': 60,
    'E-Shram Card': 50,
    'Custom ID': 80,
  },
  minWalletRecharge: 10,
  maxWalletRecharge: 50000,
  // UPI Payment Configuration (Admin-configurable)
  upiId: "9864761058@ybl",
  upiName: "Net Duniya",
  // Razorpay Gateway Configuration (Admin-configurable live merchant keys)
  razorpayKeyId: "",
  razorpayKeySecret: "",
  // Landing Page Hero (Admin-configurable)
  heroHeadline: "Fast-Track E-Services & Direct Assistance",
  heroSubtitle: "Select an instant service to submit your application, book an appointment, or order premium PVC smart cards with doorstep delivery.",
  // Services Section Titles (Admin-configurable)
  servicesGridTitle: "Government & Citizen Services",
  servicesGridSubtitle: "Complete government & digital services assistance — income certificate, PAN card, driving licence & more",
  digitalSevaTitle: "All Citizen & Digital Seva Services",
  digitalSevaSubtitle: "Select an official service by category to update details, submit government applications, or order verified smart PVC cards.",
  infoCardHeading: "Net Duniya – Government, Banking & Citizen Services Center",
  infoCardDescription: "Online assistance for Aadhaar, PAN Card, Certificates, Ration Card, State & Central Govt Schemes, Job Applications, Driving Licence, PVC Card Printing & Fast Track E-Governance.",
  infoCardBullets: [
    "100% Secure & Fast Online Application Processing",
    "Real-time Application & PVC Card Status Tracking",
    "Assisted Form Filling & Verification by Certified Experts",
    "Direct WhatsApp & Dedicated Ticket Support"
  ],
  aboutUsContent: "Net Duniya is a trusted digital citizen services and e-governance assistance center located at Senga, Chenga, Barpeta, Assam. Established with the mission to bridge the digital divide, we empower citizens and rural entrepreneurs with verified assistance for PAN cards, certificates, government welfare schemes, identity card printing, and e-district portal services.",
  privacyPolicyContent: "Net Duniya respects citizen privacy and is strictly committed to protecting personal information provided for online services. We collect only required details (name, contact, application metadata) to process citizen applications. Data is protected with 256-bit encryption and is never shared with unauthorized third parties.",
  termsConditionsContent: "By accessing Net Duniya portal, citizens and partners agree to standard terms of service. We operate as an authorized facilitation center and assistance provider for citizen services, digital e-governance, and smart PVC card printing. Applications are processed with official government portals.",
  refundPolicyContent: "Net Duniya follows a transparent citizen-friendly refund policy. If an application or order cannot be processed due to a technical error before submission to the government portal, 100% refund is credited back to the customer's wallet or original payment method within 3-5 business days.",
  helpSupportContent: "Net Duniya Customer Care & Grievance Support is available daily (8:00 AM – 9:00 PM). Citizens can reach out via WhatsApp at +91 60017 16993, Email at netduniya@gmail.com, or through our online Support Ticket system for real-time resolution.",
  disclaimerLegalContent: "Net Duniya is a private digital services facilitation and customer assistance center. We assist citizens in submitting forms, verifying documents, and printing cards. Official government fees and departmental guidelines apply as per respective state and central authorities.",
  developerInfoLocked: true,
  socialMediaLinks: DEFAULT_SOCIAL_MEDIA_LINKS,
  updatedAt: Date.now(),
};


export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const docRef = doc(db, "settings", "general");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SiteSettings;
    }
    // Initialize default if missing
    await setDoc(docRef, DEFAULT_SITE_SETTINGS);
    return DEFAULT_SITE_SETTINGS;
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return DEFAULT_SITE_SETTINGS;
  }
}

export function subscribeToSiteSettings(callback: (settings: SiteSettings) => void): Unsubscribe {
  const docRef = doc(db, "settings", "general");
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as SiteSettings);
    } else {
      callback(DEFAULT_SITE_SETTINGS);
    }
  }, (err) => {
    console.error("Site settings subscription error:", err);
    callback(DEFAULT_SITE_SETTINGS);
  });
}

export async function updateSiteSettings(settings: Partial<SiteSettings>, actorId: string, actorName: string): Promise<void> {
  const docRef = doc(db, "settings", "general");
  await setDoc(docRef, { ...settings, updatedAt: Date.now() }, { merge: true });
  await recordAuditLog({
    actorId,
    actorName,
    actorRole: 'admin',
    action: 'update_settings',
    module: 'settings',
    recordId: 'general',
    details: 'Updated global site settings',
  });
}

// --- AUDIT LOGS ---
export async function recordAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<void> {
  try {
    const logId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, "auditLogs", logId);
    await setDoc(docRef, {
      ...log,
      id: logId,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn("Failed to record audit log:", error);
  }
}

export function subscribeToAuditLogs(callback: (logs: AuditLog[]) => void, limitCount = 50): Unsubscribe {
  const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(d => d.data() as AuditLog);
    callback(logs);
  }, (err) => {
    console.error("Error in audit logs subscription:", err);
    callback([]);
  });
}

// --- USER PROFILE & WALLET ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export function subscribeToUserProfile(uid: string, callback: (user: UserProfile | null) => void): Unsubscribe {
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (snap) => {
    callback(snap.exists() ? (snap.data() as UserProfile) : null);
  }, (err) => {
    console.error("Error subscribing to user profile:", err);
    callback(null);
  });
}

export async function createOrUpdateUser(profile: Partial<UserProfile> & { uid: string }): Promise<void> {
  try {
    const docRef = doc(db, "users", profile.uid);
    const now = Date.now();
    const dataToSave = cleanFirestoreData({
      fullName: "NetDuniya User",
      email: "",
      phoneNumber: "",
      role: "user",
      walletBalance: 0,
      isActive: true,
      createdAt: now,
      ...profile,
      updatedAt: now,
      uid: profile.uid,
    });
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    console.error("Error updating user profile (safe fallback):", err);
  }
}

export async function deleteUserProfile(userId: string, actorName = 'admin'): Promise<void> {
  const docRef = doc(db, "users", userId);
  const snap = await getDoc(docRef);
  const userData = snap.exists() ? (snap.data() as UserProfile) : null;
  await deleteDoc(docRef);
  await recordAuditLog({
    actorId: actorName,
    actorName,
    actorRole: 'admin',
    action: 'delete_user',
    module: 'users',
    recordId: userId,
    details: `Permanently deleted user: ${userData?.email || userId} (${userData?.fullName || 'User'})`,
  });
}

export async function checkEmailOrPhoneExists(email?: string, phone?: string, excludeUid?: string): Promise<{ exists: boolean; reason?: string }> {
  try {
    if (email && email.trim()) {
      const emailQ = query(collection(db, "users"), where("email", "==", email.trim().toLowerCase()), limit(5));
      const emailSnap = await getDocs(emailQ);
      const matched = emailSnap.docs.filter(d => !excludeUid || d.id !== excludeUid);
      if (matched.length > 0) {
        return { exists: true, reason: `Account already exists with email '${email.trim()}'.` };
      }
    }
    if (phone && phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 10) {
        const phoneQ = query(collection(db, "users"), where("phoneNumber", "==", phone.trim()), limit(5));
        const phoneSnap = await getDocs(phoneQ);
        const matched = phoneSnap.docs.filter(d => !excludeUid || d.id !== excludeUid);
        if (matched.length > 0) {
          return { exists: true, reason: `Account already exists with mobile number '${phone.trim()}'.` };
        }
      }
    }
    return { exists: false };
  } catch (err) {
    console.error("Error checking unique email or phone:", err);
    return { exists: false };
  }
}

export async function toggleUserBlockStatus(userId: string, isActive: boolean, actorName = 'admin'): Promise<void> {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, {
    isActive,
    updatedAt: Date.now(),
  });
  await recordAuditLog({
    actorId: actorName,
    actorName,
    actorRole: 'admin',
    action: isActive ? 'unblock_user' : 'block_user',
    module: 'users',
    recordId: userId,
    details: `${isActive ? 'Unblocked' : 'Blocked / Suspended'} user ${userId}`,
  });
}

// Wallet Transaction with Firestore Atomic Transaction
export async function executeWalletTransaction(
  userId: string, 
  amount: number, 
  type: 'credit' | 'debit' | 'refund' | 'adjustment', 
  source: WalletTransaction['source'], 
  description: string, 
  referenceId?: string,
  createdBy = 'system'
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const userRef = doc(db, "users", userId);
    const txnId = generateUniqueId('TXN');
    const txnRef = doc(db, "users", userId, "walletTransactions", txnId);

    const result = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("User account not found");
      }
      const userData = userDoc.data() as UserProfile;
      const currentBalance = userData.walletBalance || 0;

      let newBalance = currentBalance;
      if (type === 'credit' || type === 'refund') {
        newBalance = currentBalance + amount;
      } else if (type === 'debit') {
        if (currentBalance < amount) {
          throw new Error("Insufficient wallet balance");
        }
        newBalance = currentBalance - amount;
      } else if (type === 'adjustment') {
        newBalance = currentBalance + amount; // amount can be positive or negative
        if (newBalance < 0) {
          throw new Error("Adjustment results in negative balance");
        }
      }

      const txnData: WalletTransaction = {
        id: txnId,
        userId,
        amount: Math.abs(amount),
        type,
        source,
        referenceId: referenceId || "",
        description,
        balanceAfter: newBalance,
        createdAt: Date.now(),
        createdBy,
      };

      transaction.update(userRef, { 
        walletBalance: newBalance,
        updatedAt: Date.now() 
      });
      transaction.set(txnRef, txnData);

      return { success: true, newBalance };
    });

    return result;
  } catch (error: any) {
    console.error("Wallet transaction failed:", error);
    return { success: false, error: error.message || "Failed to process wallet transaction" };
  }
}

export function subscribeToUserWalletTransactions(userId: string, callback: (txns: WalletTransaction[]) => void): Unsubscribe {
  const q = query(
    collection(db, "users", userId, "walletTransactions"), 
    orderBy("createdAt", "desc"), 
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const txns = snap.docs.map(d => d.data() as WalletTransaction);
    callback(txns);
  }, (err) => {
    console.error("Error subscribing to wallet transactions:", err);
    callback([]);
  });
}

// --- SERVICES & CATEGORIES ---
export function subscribeToCategories(callback: (categories: Category[]) => void): Unsubscribe {
  const q = collection(db, "categories");
  return onSnapshot(q, (snap) => {
    try {
      // 1. Predefined categories map
      const categoryMap = new Map<string, Category>();
      DIGITAL_SEVA_CATEGORIES.forEach(c => {
        categoryMap.set(c.id, {
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.iconName,
          sortOrder: c.sortOrder,
          isActive: true,
          createdAt: 0,
        });
      });

      // 2. Overlay Firestore categories (modifications + newly created categories)
      if (!snap.empty) {
        snap.docs.forEach(d => {
          const cat = { id: d.id, ...d.data() } as Category;
          categoryMap.set(cat.id, cat);
          if (cat.slug) {
            const existingWithSlug = Array.from(categoryMap.values()).find(x => x.slug === cat.slug);
            if (existingWithSlug) {
              categoryMap.set(existingWithSlug.id, { ...existingWithSlug, ...cat });
            }
          }
        });
      }

      // 3. Filter active and sort
      const finalCats = Array.from(categoryMap.values())
        .filter(c => c.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

      callback(finalCats);
    } catch (err) {
      console.error("Error processing categories snapshot:", err);
      callback(DIGITAL_SEVA_CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.iconName,
        sortOrder: c.sortOrder,
        isActive: true,
        createdAt: 0,
      })));
    }
  }, (err) => {
    console.error("Error subscribing to categories (using initial fallback):", err);
    callback(DIGITAL_SEVA_CATEGORIES.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.iconName,
      sortOrder: c.sortOrder,
      isActive: true,
      createdAt: 0,
    })));
  });
}

export async function saveCategory(category: Category): Promise<void> {
  const docRef = doc(db, "categories", category.id);
  const data = cleanFirestoreData({ ...category, updatedAt: Date.now() });
  await setDoc(docRef, data, { merge: true });
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "categories", id));
}

export function subscribeToServices(callback: (services: Service[]) => void, publishedOnly = false): Unsubscribe {
  const q = collection(db, "services");

  return onSnapshot(q, (snap) => {
    try {
      // 1. Start with initial predefined 46+ Indian services
      const serviceMap = new Map<string, Service>();
      INITIAL_INDIAN_SERVICES.forEach(s => {
        serviceMap.set(s.id, s);
      });

      // 2. Overlay Firestore services (real-time modifications made by admin or newly created services)
      if (!snap.empty) {
        snap.docs.forEach(d => {
          const srv = { id: d.id, ...d.data() } as Service;
          if (serviceMap.has(srv.id)) {
            serviceMap.set(srv.id, { ...serviceMap.get(srv.id)!, ...srv });
          } else {
            const matchingInitial = Array.from(serviceMap.values()).find(s => s.slug === srv.slug);
            if (matchingInitial) {
              serviceMap.set(matchingInitial.id, { ...matchingInitial, ...srv });
            } else {
              serviceMap.set(srv.id, srv);
            }
          }
        });
      }

      // 3. Convert to array, filter, and sort
      let allServices = Array.from(serviceMap.values());
      if (publishedOnly) {
        allServices = allServices.filter(s => s.status !== 'disabled');
      }
      allServices.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

      callback(allServices);
    } catch (err) {
      console.error("Error processing services snapshot:", err);
      let fallback = INITIAL_INDIAN_SERVICES;
      if (publishedOnly) {
        fallback = fallback.filter(s => s.status !== 'disabled');
      }
      callback(fallback);
    }
  }, (err) => {
    console.error("Error subscribing to services (using initial fallback):", err);
    let fallback = INITIAL_INDIAN_SERVICES;
    if (publishedOnly) {
      fallback = fallback.filter(s => s.status !== 'disabled');
    }
    callback(fallback);
  });
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const localMatch = INITIAL_INDIAN_SERVICES.find(s => s.slug === slug || s.id === slug);

  const fetchOnline = async (): Promise<Service | null> => {
    try {
      const q = query(collection(db, "services"), where("slug", "==", slug), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0];
        const srvData = { id: docData.id, ...docData.data() } as Service;
        return localMatch ? { ...localMatch, ...srvData } : srvData;
      }
    } catch (e) {
      // ignore
    }

    try {
      const docSnap = await getDoc(doc(db, "services", slug));
      if (docSnap.exists()) {
        const srvData = { id: docSnap.id, ...docSnap.data() } as Service;
        return localMatch ? { ...localMatch, ...srvData } : srvData;
      }
    } catch (e) {
      // ignore
    }

    return null;
  };

  try {
    if (localMatch) {
      // Race online fetch against 500ms timeout so UI never hangs!
      const online = await Promise.race([
        fetchOnline(),
        new Promise<null>(res => setTimeout(() => res(null), 500))
      ]);
      return online || localMatch;
    }

    return await fetchOnline();
  } catch (error) {
    return localMatch || null;
  }
}

export async function saveService(service: Service): Promise<void> {
  const docRef = doc(db, "services", service.id);
  const data = cleanFirestoreData({ ...service, updatedAt: Date.now() });
  await setDoc(docRef, data, { merge: true });
}

export async function deleteService(id: string): Promise<void> {
  await deleteDoc(doc(db, "services", id));
}

// --- APPLICATIONS ---
export async function createServiceApplication(appData: Omit<ServiceApplication, "id" | "createdAt" | "updatedAt" | "timeline">): Promise<ServiceApplication> {
  const id = generateUniqueId('APP');
  const now = Date.now();
  const initialTimeline = [
    {
      id: `TL-${now}-1`,
      status: appData.status,
      title: 'Application Submitted',
      description: 'Your application has been received and is waiting for document verification.',
      timestamp: now,
      actor: appData.userName || 'user',
    }
  ];

  const fullApp: ServiceApplication = {
    ...appData,
    id,
    timeline: initialTimeline,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db, "applications", id);
  await setDoc(docRef, fullApp);
  return fullApp;
}

export function subscribeToUserApplications(userId: string, callback: (apps: ServiceApplication[]) => void): Unsubscribe {
  const q = query(
    collection(db, "applications"), 
    where("userId", "==", userId), 
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }) as ServiceApplication);
    callback(items);
  }, (err) => {
    console.error("Error subscribing to user applications:", err);
    callback([]);
  });
}

export function subscribeToAllApplications(callback: (apps: ServiceApplication[]) => void): Unsubscribe {
  const q = query(collection(db, "applications"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }) as ServiceApplication);
    callback(items);
  }, (err) => {
    console.error("Error subscribing to all applications:", err);
    callback([]);
  });
}

export async function getApplicationById(id: string): Promise<ServiceApplication | null> {
  try {
    const docRef = doc(db, "applications", id);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as ServiceApplication) : null;
  } catch (error) {
    console.error("Error fetching application:", error);
    return null;
  }
}

export async function updateApplicationStatus(
  id: string, 
  status: ServiceApplication['status'], 
  timelineTitle: string, 
  timelineDesc: string, 
  actorName: string,
  adminNotes?: string
): Promise<void> {
  const docRef = doc(db, "applications", id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Application not found");

  const appData = snap.data() as ServiceApplication;
  const now = Date.now();
  const newTimelineItem = {
    id: `TL-${now}-${Math.random().toString(36).substring(2, 6)}`,
    status,
    title: timelineTitle,
    description: timelineDesc,
    timestamp: now,
    actor: actorName,
  };

  const updatedTimeline = [...(appData.timeline || []), newTimelineItem];
  const updatePayload: any = {
    status,
    timeline: updatedTimeline,
    updatedAt: now,
  };
  if (adminNotes !== undefined) {
    updatePayload.adminNotes = adminNotes;
  }

  await updateDoc(docRef, updatePayload);
  await recordAuditLog({
    actorId: actorName,
    actorName,
    actorRole: 'admin',
    action: 'update_application_status',
    module: 'applications',
    recordId: id,
    details: `Changed status to ${status}: ${timelineTitle}`,
  });
}

export async function deleteApplication(id: string): Promise<void> {
  await deleteDoc(doc(db, "applications", id));
}

// --- APPOINTMENTS ---
export async function createAppointment(apt: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Promise<Appointment> {
  const id = generateUniqueId('APT');
  const now = Date.now();
  const fullApt: Appointment = {
    ...apt,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, "appointments", id), fullApt);
  return fullApt;
}

export function subscribeToUserAppointments(userId: string, callback: (apts: Appointment[]) => void): Unsubscribe {
  const q = query(
    collection(db, "appointments"), 
    where("userId", "==", userId), 
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Appointment));
  }, (err) => {
    console.error("Error subscribing to user appointments:", err);
    callback([]);
  });
}

export function subscribeToAllAppointments(callback: (apts: Appointment[]) => void): Unsubscribe {
  const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Appointment));
  }, (err) => {
    console.error("Error subscribing to all appointments:", err);
    callback([]);
  });
}

export async function updateAppointmentStatus(id: string, status: Appointment['status'], adminNotes?: string): Promise<void> {
  const docRef = doc(db, "appointments", id);
  const payload: any = { status, updatedAt: Date.now() };
  if (adminNotes !== undefined) payload.adminNotes = adminNotes;
  await updateDoc(docRef, payload);
}

export async function deleteAppointment(id: string): Promise<void> {
  await deleteDoc(doc(db, "appointments", id));
}

// --- PVC CARD ORDERS ---
export async function createPVCOrder(order: Omit<PVCCardOrder, "id" | "createdAt" | "updatedAt">): Promise<PVCCardOrder> {
  const id = generateUniqueId('PVC');
  const now = Date.now();
  const fullOrder: PVCCardOrder = {
    ...order,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, "pvcOrders", id), fullOrder);
  return fullOrder;
}

export function subscribeToUserPVCOrders(userId: string, callback: (orders: PVCCardOrder[]) => void): Unsubscribe {
  const q = query(collection(db, "pvcOrders"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PVCCardOrder));
  }, (err) => {
    console.error("Error subscribing to user PVC orders:", err);
    callback([]);
  });
}

export function subscribeToAllPVCOrders(callback: (orders: PVCCardOrder[]) => void): Unsubscribe {
  const q = query(collection(db, "pvcOrders"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PVCCardOrder));
  }, (err) => {
    console.error("Error subscribing to all PVC orders:", err);
    callback([]);
  });
}

export async function updatePVCOrderStatus(id: string, status: PVCCardOrder['status'], trackingNumber?: string, courierName?: string): Promise<void> {
  const docRef = doc(db, "pvcOrders", id);
  const payload: any = { status, updatedAt: Date.now() };
  if (trackingNumber) payload.trackingNumber = trackingNumber;
  if (courierName) payload.courierName = courierName;
  await updateDoc(docRef, payload);
}

export async function deletePVCOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, "pvcOrders", id));
}

// --- SHOP PRODUCTS & ORDERS ---
export function subscribeToShopProducts(callback: (products: ShopProduct[]) => void, activeOnly = true): Unsubscribe {
  let q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  if (activeOnly) {
    q = query(collection(db, "products"), where("isActive", "==", true), orderBy("createdAt", "desc"));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ShopProduct));
  }, (err) => {
    console.error("Error subscribing to shop products:", err);
    callback([]);
  });
}

export async function saveShopProduct(product: ShopProduct): Promise<void> {
  await setDoc(doc(db, "products", product.id), product, { merge: true });
}

export async function deleteShopProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

export async function createShopOrder(order: Omit<ShopOrder, "id" | "createdAt" | "updatedAt">): Promise<ShopOrder> {
  const id = generateUniqueId('ORD');
  const now = Date.now();
  const fullOrder: ShopOrder = {
    ...order,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, "orders", id), fullOrder);
  return fullOrder;
}

export function subscribeToUserShopOrders(userId: string, callback: (orders: ShopOrder[]) => void): Unsubscribe {
  const q = query(collection(db, "orders"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ShopOrder));
  }, (err) => {
    console.error("Error subscribing to user shop orders:", err);
    callback([]);
  });
}

export function subscribeToAllShopOrders(callback: (orders: ShopOrder[]) => void): Unsubscribe {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ShopOrder));
  }, (err) => {
    console.error("Error subscribing to all shop orders:", err);
    callback([]);
  });
}

export async function updateShopOrderStatus(id: string, status: ShopOrder['status'], trackingNumber?: string): Promise<void> {
  const docRef = doc(db, "orders", id);
  const payload: any = { status, updatedAt: Date.now() };
  if (trackingNumber) payload.trackingNumber = trackingNumber;
  await updateDoc(docRef, payload);
}

export async function deleteShopOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, "orders", id));
}

// --- GOVERNMENT SCHEMES ---
export function subscribeToSchemes(callback: (schemes: GovernmentScheme[]) => void, publishedOnly = true): Unsubscribe {
  const q = collection(db, "schemes");
  return onSnapshot(q, (snap) => {
    try {
      // 1. Always retain all 161+ predefined government welfare schemes
      const schemeMap = new Map<string, GovernmentScheme>();
      REAL_GOVERNMENT_SCHEMES_100.forEach(s => {
        schemeMap.set(s.id, s);
      });

      // 2. Overlay Firestore schemes (newly added schemes by admin + edited schemes)
      if (!snap.empty) {
        snap.docs.forEach(d => {
          const s = { id: d.id, ...d.data() } as GovernmentScheme & { isDeleted?: boolean };
          if (s.isDeleted || s.status === 'archived') {
            schemeMap.delete(s.id);
          } else {
            schemeMap.set(s.id, s);
          }
        });
      }

      // 3. Filter published and sort
      let list = Array.from(schemeMap.values());
      if (publishedOnly) {
        list = list.filter(s => s.status !== 'draft' && s.status !== 'archived');
      }
      list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      callback(list);
    } catch (err) {
      console.error("Error processing schemes snapshot:", err);
      let list = REAL_GOVERNMENT_SCHEMES_100;
      if (publishedOnly) list = list.filter(s => s.status !== 'draft' && s.status !== 'archived');
      callback(list);
    }
  }, (err) => {
    console.error("Error subscribing to schemes, using 161+ schemes fallback:", err);
    let list = REAL_GOVERNMENT_SCHEMES_100;
    if (publishedOnly) list = list.filter(s => s.status !== 'draft' && s.status !== 'archived');
    callback(list);
  });
}

export async function getSchemeBySlug(slug: string): Promise<GovernmentScheme | null> {
  try {
    const local = REAL_GOVERNMENT_SCHEMES_100.find(s => s.slug === slug || s.id === slug);

    try {
      const q = query(collection(db, "schemes"), where("slug", "==", slug), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0];
        const sch = { id: docData.id, ...docData.data() } as GovernmentScheme;
        return local ? { ...local, ...sch } : sch;
      }
    } catch (e) {
      // ignore offline error
    }

    try {
      const docSnap = await getDoc(doc(db, "schemes", slug));
      if (docSnap.exists()) {
        const sch = { id: docSnap.id, ...docSnap.data() } as GovernmentScheme;
        return local ? { ...local, ...sch } : sch;
      }
    } catch (e) {
      // ignore offline error
    }

    return local || null;
  } catch (error) {
    console.error("Error fetching scheme by slug:", error);
    const local = REAL_GOVERNMENT_SCHEMES_100.find(s => s.slug === slug || s.id === slug);
    return local || null;
  }
}

export async function saveScheme(scheme: GovernmentScheme): Promise<void> {
  const data = cleanFirestoreData({ ...scheme, updatedAt: Date.now() });
  await setDoc(doc(db, "schemes", scheme.id), data, { merge: true });
}

export async function deleteScheme(id: string): Promise<void> {
  const isInitial = REAL_GOVERNMENT_SCHEMES_100.some(s => s.id === id);
  if (isInitial) {
    await setDoc(doc(db, "schemes", id), { id, status: 'archived', isDeleted: true, updatedAt: Date.now() }, { merge: true });
  } else {
    await deleteDoc(doc(db, "schemes", id));
  }
}

// --- 100% VERIFIED GOVERNMENT JOBS ---
export const DEFAULT_GOVERNMENT_JOBS: GovernmentJob[] = [
  {
    id: "job-ssc-cgl-2026",
    title: "SSC Combined Graduate Level (CGL) Recruitment 2026",
    slug: "ssc-cgl-recruitment-2026",
    department: "Staff Selection Commission (Govt of India)",
    state: "Central Govt",
    totalVacancies: "14,582 Posts",
    qualification: "Bachelor Degree in Any Stream",
    salaryScale: "Level 4 to Level 8 (₹25,500 - ₹1,51,100)",
    ageLimit: "18 to 32 Years",
    lastDate: "30 Sep 2026",
    notificationUrl: "https://ssc.gov.in",
    applyUrl: "https://ssc.gov.in",
    isVerified: true,
    status: "active",
    sortOrder: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "job-rrb-ntpc-2026",
    title: "Railway RRB Non-Technical Popular Categories (NTPC)",
    slug: "railway-rrb-ntpc-recruitment-2026",
    department: "Railway Recruitment Control Board (Indian Railways)",
    state: "Central Govt",
    totalVacancies: "11,558 Posts",
    qualification: "12th Pass / Graduate Degree",
    salaryScale: "Level 2 to Level 6 (₹19,900 - ₹92,300)",
    ageLimit: "18 to 33 Years",
    lastDate: "15 Oct 2026",
    notificationUrl: "https://indianrailways.gov.in",
    applyUrl: "https://rrbapply.gov.in",
    isVerified: true,
    status: "active",
    sortOrder: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "job-ibps-po-2026",
    title: "IBPS Probationary Officers (PO/MT) CRP XIV",
    slug: "ibps-po-recruitment-2026",
    department: "Institute of Banking Personnel Selection",
    state: "Central Govt",
    totalVacancies: "4,455 Posts",
    qualification: "Any Graduation Degree from Recognized University",
    salaryScale: "₹52,000 - ₹58,000 Monthly CTC",
    ageLimit: "20 to 30 Years",
    lastDate: "25 Sep 2026",
    notificationUrl: "https://ibps.in",
    applyUrl: "https://ibps.in",
    isVerified: true,
    status: "active",
    sortOrder: 3,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "job-state-police-si-2026",
    title: "State Police Sub-Inspector (SI) & Armed Police",
    slug: "state-police-sub-inspector-2026",
    department: "State Police Recruitment & Promotion Board",
    state: "State Govt",
    totalVacancies: "3,890 Posts",
    qualification: "Graduate Degree + Physical Standards",
    salaryScale: "Level 6 (₹35,400 - ₹1,12,400)",
    ageLimit: "21 to 28 Years",
    lastDate: "05 Oct 2026",
    notificationUrl: "https://edistrict.gov.in",
    applyUrl: "https://police.gov.in",
    isVerified: true,
    status: "active",
    sortOrder: 4,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
];

export function subscribeToJobs(callback: (jobs: GovernmentJob[]) => void, activeOnly = true): Unsubscribe {
  const q = collection(db, "jobs");
  return onSnapshot(q, (snap) => {
    try {
      // 1. Preload verified default jobs
      const jobMap = new Map<string, GovernmentJob>();
      DEFAULT_GOVERNMENT_JOBS.forEach(j => {
        jobMap.set(j.id, j);
      });

      // 2. Overlay Firestore jobs (added or edited by admin)
      if (!snap.empty) {
        snap.docs.forEach(d => {
          const raw = d.data();
          const j = { id: d.id, ...raw } as GovernmentJob & { isDeleted?: boolean };
          if (j.isDeleted || (raw.status as string) === 'archived') {
            jobMap.delete(j.id);
          } else {
            jobMap.set(j.id, j);
          }
        });
      }

      // 3. Filter and sort
      let list = Array.from(jobMap.values());
      if (activeOnly) {
        list = list.filter(j => j.status === 'active');
      }
      list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      callback(list);
    } catch (err) {
      console.error("Error processing jobs snapshot:", err);
      let list = DEFAULT_GOVERNMENT_JOBS;
      if (activeOnly) list = list.filter(j => j.status === 'active');
      callback(list);
    }
  }, (err) => {
    console.error("Error subscribing to jobs, using fallback:", err);
    let list = DEFAULT_GOVERNMENT_JOBS;
    if (activeOnly) list = list.filter(j => j.status === 'active');
    callback(list);
  });
}

export async function saveJob(job: GovernmentJob): Promise<void> {
  const data = cleanFirestoreData({ ...job, updatedAt: Date.now() });
  await setDoc(doc(db, "jobs", job.id), data, { merge: true });
}

export async function deleteJob(id: string): Promise<void> {
  const isDefault = DEFAULT_GOVERNMENT_JOBS.some(j => j.id === id);
  if (isDefault) {
    await setDoc(doc(db, "jobs", id), { id, status: 'expired', isDeleted: true, updatedAt: Date.now() }, { merge: true });
  } else {
    await deleteDoc(doc(db, "jobs", id));
  }
}

// --- IMPORTANT LINKS ---
export function subscribeToImportantLinks(callback: (links: ImportantLink[]) => void, activeOnly = true): Unsubscribe {
  let q = query(collection(db, "importantLinks"), orderBy("sortOrder", "asc"));
  if (activeOnly) {
    q = query(collection(db, "importantLinks"), where("isActive", "==", true), orderBy("sortOrder", "asc"));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ImportantLink));
  }, (err) => {
    console.error("Error subscribing to important links:", err);
    callback([]);
  });
}

export async function saveImportantLink(link: ImportantLink): Promise<void> {
  await setDoc(doc(db, "importantLinks", link.id), link, { merge: true });
}

export async function deleteImportantLink(id: string): Promise<void> {
  await deleteDoc(doc(db, "importantLinks", id));
}

// --- NOTICES & TICKERS ---
export function subscribeToNotices(callback: (notices: NoticeTicker[]) => void, activeOnly = true): Unsubscribe {
  let q = query(collection(db, "notices"), orderBy("priority", "desc"));
  if (activeOnly) {
    q = query(collection(db, "notices"), where("isActive", "==", true), orderBy("priority", "desc"));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as NoticeTicker));
  }, (err) => {
    console.error("Error subscribing to notices:", err);
    callback([]);
  });
}

export async function saveNotice(notice: NoticeTicker): Promise<void> {
  await setDoc(doc(db, "notices", notice.id), notice, { merge: true });
}

export async function deleteNotice(id: string): Promise<void> {
  await deleteDoc(doc(db, "notices", id));
}

// --- BANNERS ---
export function subscribeToBanners(callback: (banners: BannerItem[]) => void, activeOnly = true): Unsubscribe {
  let q = query(collection(db, "banners"), orderBy("sortOrder", "asc"));
  if (activeOnly) {
    q = query(collection(db, "banners"), where("isActive", "==", true), orderBy("sortOrder", "asc"));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as BannerItem));
  }, (err) => {
    console.error("Error subscribing to banners:", err);
    callback([]);
  });
}

export async function saveBanner(banner: BannerItem): Promise<void> {
  await setDoc(doc(db, "banners", banner.id), banner, { merge: true });
}

export async function deleteBanner(id: string): Promise<void> {
  await deleteDoc(doc(db, "banners", id));
}

// --- FOUNDER SECTION ---
export const DEFAULT_FOUNDER_DATA: FounderData = {
  name: "Yasin Khan",
  designation: "Founder & Managing Director, NetDuniya",
  imageUrl: "/images/founder.jpg",
  quote: "Empowering every Indian citizen and rural entrepreneur with seamless digital access, government certifications, and hassle-free online service assistance.",
  description: "NetDuniya was established with the core vision of bridging the digital divide across India. From urgent certificates and banking assistance to government schemes and identity card verification, our platform ensures speed, transparency, and verified assistance.",
  socialLinks: {},
  socialMediaLinks: [],
  isVisible: true,
  updatedAt: Date.now(),
};

function cleanFounderData(data: FounderData): FounderData {
  const cleanedSocial: Record<string, string> = {};
  if (data.socialLinks) {
    Object.entries(data.socialLinks).forEach(([key, val]) => {
      if (typeof val === "string" && isRealSocialUrl(val)) {
        cleanedSocial[key] = val.trim();
      }
    });
  }

  let cleanedLinks: SocialMediaLink[] = [];
  if (Array.isArray(data.socialMediaLinks)) {
    cleanedLinks = data.socialMediaLinks.map(l => ({
      ...l,
      url: isRealSocialUrl(l.url) ? (l.url || "").trim() : "",
      isActive: Boolean(l.isActive && isRealSocialUrl(l.url))
    }));
  }

  return {
    ...data,
    socialLinks: cleanedSocial,
    socialMediaLinks: cleanedLinks,
  };
}

export async function getFounderData(): Promise<FounderData> {
  try {
    const docRef = doc(db, "content", "founder");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return cleanFounderData(snap.data() as FounderData);
    }
    await setDoc(docRef, DEFAULT_FOUNDER_DATA);
    return DEFAULT_FOUNDER_DATA;
  } catch (error) {
    console.error("Error fetching founder data:", error);
    return DEFAULT_FOUNDER_DATA;
  }
}

export function subscribeToFounderData(callback: (founder: FounderData) => void): Unsubscribe {
  const docRef = doc(db, "content", "founder");
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(cleanFounderData(snap.data() as FounderData));
    } else {
      callback(DEFAULT_FOUNDER_DATA);
    }
  }, (err) => {
    console.error("Error subscribing to founder:", err);
    callback(DEFAULT_FOUNDER_DATA);
  });
}

export async function saveFounderData(data: FounderData): Promise<void> {
  await setDoc(doc(db, "content", "founder"), { ...data, updatedAt: Date.now() });
}

function sanitizeSocialMediaList(links: any[]): SocialMediaLink[] {
  if (!Array.isArray(links)) return DEFAULT_SOCIAL_MEDIA_LINKS;
  return links.map(l => {
    const real = isRealSocialUrl(l.url);
    return {
      ...l,
      url: real ? (l.url || "").trim() : "",
      isActive: Boolean(l.isActive && real)
    };
  });
}

// --- SOCIAL MEDIA MANAGEMENT ---
export async function getSocialMediaLinks(): Promise<SocialMediaLink[]> {
  try {
    const docRef = doc(db, "settings", "social_media");
    const snap = await getDoc(docRef);
    if (snap.exists() && Array.isArray(snap.data()?.links)) {
      return sanitizeSocialMediaList(snap.data().links);
    }
    const founderSnap = await getDoc(doc(db, "content", "founder"));
    if (founderSnap.exists() && Array.isArray(founderSnap.data()?.socialMediaLinks)) {
      return sanitizeSocialMediaList(founderSnap.data().socialMediaLinks);
    }
    return DEFAULT_SOCIAL_MEDIA_LINKS;
  } catch (err) {
    console.error("Error fetching social media links:", err);
    return DEFAULT_SOCIAL_MEDIA_LINKS;
  }
}

export function subscribeToSocialMediaLinks(callback: (links: SocialMediaLink[]) => void): Unsubscribe {
  const docRef = doc(db, "settings", "social_media");
  return onSnapshot(docRef, (snap) => {
    if (snap.exists() && Array.isArray(snap.data()?.links)) {
      callback(sanitizeSocialMediaList(snap.data().links));
    } else {
      getDoc(doc(db, "content", "founder")).then((fSnap) => {
        if (fSnap.exists() && Array.isArray(fSnap.data()?.socialMediaLinks)) {
          callback(sanitizeSocialMediaList(fSnap.data().socialMediaLinks));
        } else {
          callback(DEFAULT_SOCIAL_MEDIA_LINKS);
        }
      }).catch(() => {
        callback(DEFAULT_SOCIAL_MEDIA_LINKS);
      });
    }
  }, (err) => {
    console.error("Error subscribing to social media links:", err);
    callback(DEFAULT_SOCIAL_MEDIA_LINKS);
  });
}

export async function saveSocialMediaLinks(links: SocialMediaLink[]): Promise<void> {
  const now = Date.now();
  const safeList = Array.isArray(links) ? links : [];
  // Filter and sanitize before storing - ensuring NO undefined fields exist
  const sanitized = safeList
    .filter(l => Boolean(l && typeof l === 'object'))
    .map(l => {
      const real = isRealSocialUrl(l.url);
      const item: Record<string, any> = {
        id: String(l.id || ""),
        name: String(l.name || ""),
        url: String(l.url || "").trim(),
        iconType: String(l.iconType || "custom"),
        bgColor: String(l.bgColor || "bg-indigo-600"),
        isActive: Boolean(l.isActive && real),
        isCustom: Boolean(l.isCustom)
      };
      if (l.customLogoUrl && typeof l.customLogoUrl === 'string' && l.customLogoUrl.trim()) {
        item.customLogoUrl = l.customLogoUrl.trim();
      }
      return item;
    });

  const cleanedSettingsData = cleanFirestoreData({
    links: sanitized,
    updatedAt: now,
  });

  // 1. Save in settings/social_media
  await setDoc(doc(db, "settings", "social_media"), cleanedSettingsData, { merge: true });

  // 2. Also sync to content/founder document
  const founderRef = doc(db, "content", "founder");
  const founderSnap = await getDoc(founderRef);
  const currentFounder = founderSnap.exists() ? founderSnap.data() : DEFAULT_FOUNDER_DATA;

  // Map links into founder.socialLinks for backward compatibility
  const socialLinksObj: Record<string, string> = { ...(currentFounder?.socialLinks || {}) };
  sanitized.forEach(l => {
    if (['facebook', 'instagram', 'youtube', 'linkedin', 'twitter'].includes(l.id)) {
      socialLinksObj[l.id] = (l.isActive && l.url) ? l.url : "";
    }
  });

  const cleanedFounderData = cleanFirestoreData({
    ...currentFounder,
    socialMediaLinks: sanitized,
    socialLinks: socialLinksObj,
    updatedAt: now,
  });

  await setDoc(founderRef, cleanedFounderData, { merge: true });
}

// --- BLOG ARTICLES ---
export function subscribeToBlogs(callback: (blogs: BlogArticle[]) => void, publishedOnly = true): Unsubscribe {
  const q = collection(db, "blogs");
  return onSnapshot(q, (snap) => {
    if (!snap.empty) {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }) as BlogArticle);
      if (publishedOnly) {
        list = list.filter(b => b.status === "published");
      }
      list.sort((a, b) => (b.publishedAt || b.createdAt || 0) - (a.publishedAt || a.createdAt || 0));
      callback(list);
    } else {
      const fallback = publishedOnly 
        ? INITIAL_BLOG_ARTICLES.filter(b => b.status === "published")
        : INITIAL_BLOG_ARTICLES;
      callback(fallback);
    }
  }, (err) => {
    console.error("Error subscribing to blogs:", err);
    const fallback = publishedOnly 
      ? INITIAL_BLOG_ARTICLES.filter(b => b.status === "published")
      : INITIAL_BLOG_ARTICLES;
    callback(fallback);
  });
}

export async function getBlogBySlug(slug: string): Promise<BlogArticle | null> {
  try {
    const q = query(collection(db, "blogs"), where("slug", "==", slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as BlogArticle;
    }
    const fallback = INITIAL_BLOG_ARTICLES.find(b => b.slug === slug || b.id === slug);
    return fallback || null;
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    const fallback = INITIAL_BLOG_ARTICLES.find(b => b.slug === slug || b.id === slug);
    return fallback || null;
  }
}

export async function seedInitialBlogs(): Promise<number> {
  let count = 0;
  for (const blog of INITIAL_BLOG_ARTICLES) {
    const docRef = doc(db, "blogs", blog.id);
    await setDoc(docRef, { ...blog, updatedAt: Date.now() }, { merge: true });
    count++;
  }
  return count;
}

export async function saveBlog(blog: BlogArticle): Promise<void> {
  await setDoc(doc(db, "blogs", blog.id), { ...blog, updatedAt: Date.now() }, { merge: true });
}

export async function deleteBlog(id: string): Promise<void> {
  await deleteDoc(doc(db, "blogs", id));
}

// --- SUPPORT TICKETS ---
export async function createSupportTicket(ticketData: Omit<SupportTicket, "id" | "createdAt" | "updatedAt">): Promise<SupportTicket> {
  const id = generateUniqueId('TKT');
  const now = Date.now();
  const fullTicket: SupportTicket = {
    ...ticketData,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, "supportTickets", id), fullTicket);
  return fullTicket;
}

export function subscribeToUserTickets(userId: string, callback: (tickets: SupportTicket[]) => void): Unsubscribe {
  const q = query(collection(db, "supportTickets"), where("userId", "==", userId), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportTicket));
  }, (err) => {
    console.error("Error subscribing to user tickets:", err);
    callback([]);
  });
}

export function subscribeToAllTickets(callback: (tickets: SupportTicket[]) => void): Unsubscribe {
  const q = query(collection(db, "supportTickets"), orderBy("updatedAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as SupportTicket));
  }, (err) => {
    console.error("Error subscribing to all tickets:", err);
    callback([]);
  });
}

export async function sendTicketReply(ticketId: string, message: Omit<SupportTicket['messages'][0], "id" | "timestamp">): Promise<void> {
  const docRef = doc(db, "supportTickets", ticketId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Ticket not found");

  const ticket = snap.data() as SupportTicket;
  const now = Date.now();
  const newMessage = {
    ...message,
    id: `MSG-${now}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
  };

  const updatedMessages = [...(ticket.messages || []), newMessage];
  await updateDoc(docRef, {
    messages: updatedMessages,
    status: message.senderRole === 'admin' ? 'in_progress' : 'open',
    updatedAt: now,
  });
}

export async function updateSupportTicketStatus(ticketId: string, status: SupportTicket['status']): Promise<void> {
  const docRef = doc(db, "supportTickets", ticketId);
  await updateDoc(docRef, {
    status,
    updatedAt: Date.now(),
  });
}

// --- PAYMENTS & REFUNDS ---
export async function createPaymentRecord(payment: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">): Promise<PaymentRecord> {
  const id = generateUniqueId('PAY');
  const now = Date.now();
  const fullPayment: PaymentRecord = {
    ...payment,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, "payments", id), fullPayment);
  return fullPayment;
}

// --- UTR VALIDATION & FRAUD PREVENTION ---
export function validateUtrNumber(utr: string): { valid: boolean; error?: string } {
  const clean = (utr || "").trim();
  if (!clean) {
    return { valid: false, error: "Kripya 12-digit UTR / UPI Reference Number darj karein." };
  }
  if (!/^\d{12}$/.test(clean)) {
    return { valid: false, error: "UTR number bilkul 12 anko (12 numeric digits) ka hona chahiye (e.g. 425678901234)." };
  }
  // Disallow repeated identical digits like 111111111111, 000000000000
  if (/^(\d)\1{11}$/.test(clean)) {
    return { valid: false, error: "Galat UTR sequence! Ek jaise anko ka UTR number anyaaya/invalid hai." };
  }
  // Disallow sequential fake digits
  const sequential = ["123456789012", "012345678901", "987654321098", "098765432109"];
  if (sequential.includes(clean)) {
    return { valid: false, error: "Galat sequence number! Kripya apna asali banking app ka 12-digit UTR dalein." };
  }
  return { valid: true };
}

export async function isUtrAlreadyUsed(utr: string): Promise<boolean> {
  const clean = (utr || "").trim();
  if (!clean) return false;
  try {
    const q1 = query(collection(db, "payments"), where("utrNumber", "==", clean), limit(1));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) return true;

    const docRef = doc(db, "utrRegistry", clean);
    const snap2 = await getDoc(docRef);
    if (snap2.exists()) return true;

    return false;
  } catch (error) {
    console.error("Error checking UTR uniqueness:", error);
    return false;
  }
}

export async function registerUtr(utr: string, data: { userId: string; amount: number; purpose: string; referenceId?: string }): Promise<void> {
  const clean = (utr || "").trim();
  if (!clean) return;
  try {
    const docRef = doc(db, "utrRegistry", clean);
    await setDoc(docRef, {
      utr: clean,
      ...data,
      registeredAt: Date.now(),
    });
  } catch (e) {
    console.error("Error registering UTR in registry:", e);
  }
}

export function subscribeToAllPayments(callback: (payments: PaymentRecord[]) => void): Unsubscribe {
  const q = query(collection(db, "payments"), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentRecord));
  }, (err) => {
    console.error("Error subscribing to payments:", err);
    callback([]);
  });
}

export function subscribeToUserPayments(userId: string, callback: (payments: PaymentRecord[]) => void): Unsubscribe {
  const q = query(collection(db, "payments"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() }) as PaymentRecord));
  }, (err) => {
    console.error("Error subscribing to user payments:", err);
    callback([]);
  });
}

export async function processPaymentRefund(
  paymentId: string, 
  refundData: {
    refundUtr?: string;
    refundReason?: string;
    refundAmount?: number;
    adminName?: string;
  }
): Promise<{ success: boolean; newWalletBalance?: number; error?: string }> {
  try {
    const ref = doc(db, "payments", paymentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error("Payment record not found");
    }
    const payment = snap.data() as PaymentRecord;
    const now = Date.now();
    const amountToRefund = refundData.refundAmount ?? payment.amount;
    const utr = refundData.refundUtr?.trim() || `WLT-REF-${now.toString(36).toUpperCase()}`;
    const reason = refundData.refundReason?.trim() || `Refund credited to Citizen Digital Wallet for ${payment.purpose?.replace(/_/g, ' ') || 'Order'}`;

    let newWalletBalance: number | undefined;

    // Direct refund credit to citizen's platform digital wallet
    if (payment.userId) {
      const walletRes = await executeWalletTransaction(
        payment.userId,
        amountToRefund,
        'refund',
        'refund',
        `Refund: ${reason} (Ref: ${payment.referenceId || paymentId})`,
        payment.referenceId || paymentId,
        refundData.adminName || 'Admin'
      );
      if (walletRes.success) {
        newWalletBalance = walletRes.newBalance;
      } else {
        console.warn("Wallet crediting notice:", walletRes.error);
      }
    }

    // Update payment record in Firestore
    await updateDoc(ref, {
      status: 'refunded',
      refundUtr: utr,
      refundReason: reason,
      refundAmount: amountToRefund,
      refundDate: now,
      updatedAt: now,
    });

    // If associated with PVC order or application, update its payment status
    if (payment.referenceId) {
      try {
        const pvcRef = doc(db, "pvcOrders", payment.referenceId);
        const pvcSnap = await getDoc(pvcRef);
        if (pvcSnap.exists()) {
          await updateDoc(pvcRef, {
            paymentStatus: 'refunded',
            status: 'cancelled',
            updatedAt: now,
          });
        }
      } catch (_) {}

      try {
        const appRef = doc(db, "applications", payment.referenceId);
        const appSnap = await getDoc(appRef);
        if (appSnap.exists()) {
          await updateDoc(appRef, {
            paymentStatus: 'refunded',
            status: 'rejected',
            notes: `Refunded ₹${amountToRefund} to citizen digital wallet.`,
            updatedAt: now,
          });
        }
      } catch (_) {}
    }

    return { success: true, newWalletBalance };
  } catch (error: any) {
    console.error("Payment refund failed:", error);
    throw new Error(error.message || "Failed to process refund");
  }
}

// Helper: Synchronize payment collection so that refunded orders/applications immediately reflect in Total Revenue
async function syncPaymentRefund(referenceId: string, amount: number, reason: string, extraRefIds: string[] = []): Promise<void> {
  try {
    const now = Date.now();
    const allSearchIds = [referenceId, ...extraRefIds].filter(id => Boolean(id && typeof id === 'string' && id.trim()));
    let synced = false;

    for (const refId of allSearchIds) {
      // 1. Check referenceId
      const qRef = query(collection(db, "payments"), where("referenceId", "==", refId));
      const snapRef = await getDocs(qRef);
      if (!snapRef.empty) {
        for (const d of snapRef.docs) {
          if (d.data().status !== 'refunded') {
            await updateDoc(d.ref, {
              status: 'refunded',
              refundAmount: amount,
              refundReason: reason,
              refundDate: now,
              updatedAt: now,
            });
            synced = true;
          }
        }
      }

      // 2. Check direct doc ID
      const pRef = doc(db, "payments", refId);
      const pSnap = await getDoc(pRef);
      if (pSnap.exists() && pSnap.data().status !== 'refunded') {
        await updateDoc(pRef, {
          status: 'refunded',
          refundAmount: amount,
          refundReason: reason,
          refundDate: now,
          updatedAt: now,
        });
        synced = true;
      }

      // 3. Check paymentId field if stored as property
      try {
        const qPay = query(collection(db, "payments"), where("paymentId", "==", refId));
        const snapPay = await getDocs(qPay);
        if (!snapPay.empty) {
          for (const d of snapPay.docs) {
            if (d.data().status !== 'refunded') {
              await updateDoc(d.ref, {
                status: 'refunded',
                refundAmount: amount,
                refundReason: reason,
                refundDate: now,
                updatedAt: now,
              });
              synced = true;
            }
          }
        }
      } catch (_) {}
    }

    // If still no payment document existed, create an explicit refunded payment record so total revenue & ledger capture it
    if (!synced && amount > 0) {
      await createPaymentRecord({
        userId: 'system',
        userEmail: 'citizen@netduniya.in',
        userName: 'Citizen Wallet Refund',
        amount: amount,
        currency: 'INR',
        purpose: 'refund',
        referenceId: referenceId,
        paymentMethod: 'wallet',
        status: 'refunded',
        refundAmount: amount,
        refundReason: reason,
        refundDate: now,
      });
    }
  } catch (e) {
    console.warn("syncPaymentRefund warning:", e);
  }
}

// Universal Citizen Wallet Refund: PVC Card Orders
export async function refundPVCOrder(
  orderId: string, 
  options?: { adminName?: string; reason?: string }
): Promise<{ success: boolean; refundedAmount: number; newBalance?: number }> {
  try {
    const ref = doc(db, "pvcOrders", orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error("PVC Order not found in database");
    }
    const order = snap.data() as PVCCardOrder;
    if (order.paymentStatus === 'refunded' || (order as any).isRefunded || (order as any).refundProcessed) {
      throw new Error("This PVC order has already been refunded to citizen wallet. Multiple refunds are strictly disallowed.");
    }
    const amountToRefund = order.totalPrice || order.totalAmount || 0;
    const now = Date.now();
    const reason = options?.reason?.trim() || `Cancelled & Refunded PVC Card (${order.cardType})`;
    const adminName = options?.adminName || 'Admin Staff';

    let newBalance: number | undefined;
    if (order.userId && amountToRefund > 0) {
      const walletRes = await executeWalletTransaction(
        order.userId,
        amountToRefund,
        'refund',
        'refund',
        `PVC Card Refund: ${order.cardType} (${order.id}) - ${reason}`,
        order.id,
        adminName
      );
      if (walletRes.success) {
        newBalance = walletRes.newBalance;
      }
    }

    await updateDoc(ref, {
      status: 'cancelled',
      paymentStatus: 'refunded',
      isRefunded: true,
      refundProcessed: true,
      refundAmount: amountToRefund,
      refundDate: now,
      updatedAt: now,
    });

    // Sync payments collection with multi-identifier resolution so Total Revenue immediately drops
    const extra = [order.paymentId, order.utrNumber, `PVC-${order.cardType}`].filter(Boolean) as string[];
    await syncPaymentRefund(order.id, amountToRefund, reason, extra);

    return { success: true, refundedAmount: amountToRefund, newBalance };
  } catch (err: any) {
    console.error("refundPVCOrder error:", err);
    throw new Error(err.message || "Failed to refund PVC order");
  }
}

// Universal Citizen Wallet Refund: Shop Merchandise Orders
export async function refundShopOrder(
  orderId: string, 
  options?: { adminName?: string; reason?: string }
): Promise<{ success: boolean; refundedAmount: number; newBalance?: number }> {
  try {
    const ref = doc(db, "orders", orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error("Shop Order not found in database");
    }
    const order = snap.data() as ShopOrder;
    if (order.paymentStatus === 'refunded' || (order as any).isRefunded || (order as any).refundProcessed) {
      throw new Error("This shop order has already been refunded to citizen wallet. Multiple refunds are strictly disallowed.");
    }
    const amountToRefund = order.totalAmount || 0;
    const now = Date.now();
    const reason = options?.reason?.trim() || `Cancelled & Refunded Shop Order #${order.id}`;
    const adminName = options?.adminName || 'Admin Staff';

    let newBalance: number | undefined;
    if (order.userId && amountToRefund > 0) {
      const walletRes = await executeWalletTransaction(
        order.userId,
        amountToRefund,
        'refund',
        'refund',
        `Shop Order Refund: #${order.id} - ${reason}`,
        order.id,
        adminName
      );
      if (walletRes.success) {
        newBalance = walletRes.newBalance;
      }
    }

    await updateDoc(ref, {
      status: 'cancelled',
      paymentStatus: 'refunded',
      isRefunded: true,
      refundProcessed: true,
      refundAmount: amountToRefund,
      refundDate: now,
      updatedAt: now,
    });

    // Sync payments collection with multi-identifier resolution so Total Revenue immediately drops
    const extra = [order.paymentId, (order as any).utrNumber].filter(Boolean) as string[];
    await syncPaymentRefund(order.id, amountToRefund, reason, extra);

    return { success: true, refundedAmount: amountToRefund, newBalance };
  } catch (err: any) {
    console.error("refundShopOrder error:", err);
    throw new Error(err.message || "Failed to refund shop order");
  }
}

// Universal Citizen Wallet Refund: Government Service Applications
export async function refundServiceApplication(
  applicationId: string, 
  options?: { adminName?: string; reason?: string }
): Promise<{ success: boolean; refundedAmount: number; newBalance?: number }> {
  try {
    const ref = doc(db, "applications", applicationId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error("Application not found in database");
    }
    const app = snap.data() as ServiceApplication;
    if (app.paymentStatus === 'refunded' || (app as any).isRefunded || (app as any).refundProcessed) {
      throw new Error("This application has already been refunded to citizen wallet. Multiple refunds are strictly disallowed.");
    }
    const amountToRefund = app.feePaid || 0;
    const now = Date.now();
    const reason = options?.reason?.trim() || `Refund for Application #${app.id} (${app.serviceName})`;
    const adminName = options?.adminName || 'Admin Staff';

    let newBalance: number | undefined;
    if (app.userId && amountToRefund > 0) {
      const walletRes = await executeWalletTransaction(
        app.userId,
        amountToRefund,
        'refund',
        'refund',
        `Service Application Refund: #${app.id} (${app.serviceName}) - ${reason}`,
        app.id,
        adminName
      );
      if (walletRes.success) {
        newBalance = walletRes.newBalance;
      }
    }

    const existingTimeline = app.timeline || [];
    const refundTimeline = [
      ...existingTimeline,
      {
        status: 'rejected' as ApplicationStatus,
        title: `Refund Processed (₹${amountToRefund})`,
        description: `₹${amountToRefund} credited directly to Citizen Digital Wallet. Reason: ${reason}`,
        timestamp: now,
        actor: adminName,
      }
    ];

    await updateDoc(ref, {
      status: 'rejected',
      paymentStatus: 'refunded',
      isRefunded: true,
      refundProcessed: true,
      refundAmount: amountToRefund,
      refundDate: now,
      timeline: refundTimeline,
      adminNotes: `${app.adminNotes ? app.adminNotes + ' | ' : ''}Refunded ₹${amountToRefund} to citizen wallet`,
      updatedAt: now,
    });

    // Sync payments collection with multi-identifier resolution so Total Revenue immediately drops
    const extra = [app.paymentId, app.serviceId].filter(Boolean) as string[];
    await syncPaymentRefund(app.id, amountToRefund, reason, extra);

    return { success: true, refundedAmount: amountToRefund, newBalance };
  } catch (err: any) {
    console.error("refundServiceApplication error:", err);
    throw new Error(err.message || "Failed to refund application");
  }
}

// --- FILE UPLOAD TO FIREBASE STORAGE ---
export async function uploadDocument(
  file: File, 
  pathPrefix: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${pathPrefix}/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      url: downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
    };
  } catch (error: any) {
    console.error("Storage upload failed:", error);
    throw new Error(error.message || "Failed to upload file to storage");
  }
}

// --- ADMIN SEEDING / INITIAL SETUP UTILITY ---
export async function seedInitialCategoriesAndServices(): Promise<void> {
  const categories: Category[] = DIGITAL_SEVA_CATEGORIES.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    icon: c.iconName,
    sortOrder: c.sortOrder,
    isActive: true,
    createdAt: Date.now(),
  }));

  for (const cat of categories) {
    await setDoc(doc(db, "categories", cat.id), cat, { merge: true });
  }

  for (const srv of INITIAL_INDIAN_SERVICES) {
    await setDoc(doc(db, "services", srv.id), srv, { merge: true });
  }

  // Initial Important Links
  const initialLinks: ImportantLink[] = [
    { id: "lnk-uidai", name: "UIDAI - Aadhaar Self Service Portal", url: "https://myaadhaar.uidai.gov.in", category: "National", openInNewTab: true, sortOrder: 1, isActive: true, createdAt: Date.now() },
    { id: "lnk-nvsp", name: "Election Commission of India (NVSP/Voters)", url: "https://voters.eci.gov.in", category: "Government", openInNewTab: true, sortOrder: 2, isActive: true, createdAt: Date.now() },
    { id: "lnk-parivahan", name: "Parivahan Sarathi (Driving & Vehicle Portal)", url: "https://parivahan.gov.in", category: "Government", openInNewTab: true, sortOrder: 3, isActive: true, createdAt: Date.now() },
    { id: "lnk-incometax", name: "Income Tax e-Filing & Instant PAN", url: "https://www.incometax.gov.in", category: "Banking", openInNewTab: true, sortOrder: 4, isActive: true, createdAt: Date.now() },
    { id: "lnk-digilocker", name: "DigiLocker - National Digital Document Wallet", url: "https://www.digilocker.gov.in", category: "National", openInNewTab: true, sortOrder: 5, isActive: true, createdAt: Date.now() },
    { id: "lnk-edistrict", name: "State E-District Services Portal", url: "https://edistrict.up.gov.in", category: "Certificate", openInNewTab: true, sortOrder: 6, isActive: true, createdAt: Date.now() },
  ];

  for (const lnk of initialLinks) {
    await setDoc(doc(db, "importantLinks", lnk.id), lnk, { merge: true });
  }

  // Initial Notice Ticker
  const initialNotice: NoticeTicker = {
    id: "notice-1",
    text: "★ Welcome to NetDuniya: Real-time Aadhaar, PAN Card, Citizen Certificates, PVC Card Printing & Online Service Assistance Kendra is Live!",
    priority: 10,
    isActive: true,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, "notices", initialNotice.id), initialNotice, { merge: true });
}

// =========================================================================
// ADMINS COLLECTION GOVERNANCE
// =========================================================================
export async function isFirstAdminUser(): Promise<boolean> {
  try {
    const adminQuery = query(collection(db, "admins"), limit(1));
    const snap = await getDocs(adminQuery);
    if (!snap.empty) return false;

    // Check users collection as backup
    const usersAdminQuery = query(collection(db, "users"), where("role", "in", ["super_admin", "admin"]), limit(1));
    const userSnap = await getDocs(usersAdminQuery);
    return userSnap.empty;
  } catch (err) {
    console.error("Error checking first admin:", err);
    return false;
  }
}

export async function createAdminRecord(adminData: AdminRecord): Promise<void> {
  await setDoc(doc(db, "admins", adminData.uid), adminData, { merge: true });
}

export function subscribeToAllAdmins(callback: (admins: AdminRecord[]) => void): Unsubscribe {
  const q = query(collection(db, "admins"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const admins = snap.docs.map(d => ({ ...d.data(), uid: d.id } as AdminRecord));
    callback(admins);
  }, (err) => {
    console.error("Error subscribing to admins:", err);
    callback([]);
  });
}

export async function getAdminRecord(uid: string): Promise<AdminRecord | null> {
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    if (snap.exists()) {
      return { ...snap.data(), uid: snap.id } as AdminRecord;
    }
    return null;
  } catch (err) {
    console.error("Error fetching admin record:", err);
    return null;
  }
}

export async function getAdminByEmail(email: string): Promise<AdminRecord | null> {
  try {
    if (!email) return null;
    const q = query(collection(db, "admins"), where("email", "==", email.toLowerCase().trim()), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { ...snap.docs[0].data(), uid: snap.docs[0].id } as AdminRecord;
    }
    return null;
  } catch (err) {
    console.error("Error fetching admin by email:", err);
    return null;
  }
}

export async function deleteAdminRecord(uid: string): Promise<void> {
  await deleteDoc(doc(db, "admins", uid));
}

/**
 * Real-time listener for whether at least one admin exists in Firestore.
 * When false, the one-time registration setup page is active.
 * As soon as true, the setup page locks down permanently and only login is available.
 */
export function subscribeToHasAnyAdmin(callback: (hasAdmin: boolean) => void): Unsubscribe {
  const adminCol = collection(db, "admins");
  return onSnapshot(adminCol, async (snap) => {
    if (!snap.empty) {
      callback(true);
      return;
    }
    // Backup check in users collection
    try {
      const uQ = query(collection(db, "users"), where("role", "in", ["super_admin", "admin", "agro_admin"]), limit(1));
      const uSnap = await getDocs(uQ);
      callback(!uSnap.empty);
    } catch {
      callback(false);
    }
  }, (err) => {
    console.error("Error subscribing to hasAnyAdmin:", err);
    callback(false);
  });
}

/**
 * Transfer Super Admin ownership to another administrator.
 * When transferred, the transferring admin is IMMEDIATELY demoted to citizen
 * and permanently removed from admins collection so they are no longer an admin.
 */
export async function transferSuperAdminRole(
  currentAdminUid: string,
  successorUid: string,
  _unusedKeepAsAdmin = false
): Promise<void> {
  const now = Date.now();

  // 1. Promote successor in users collection
  await setDoc(doc(db, "users", successorUid), {
    role: "super_admin",
    updatedAt: now,
  }, { merge: true });

  // 2. Fetch successor details
  const succSnap = await getDoc(doc(db, "users", successorUid));
  const succData = succSnap.exists() ? succSnap.data() : null;

  // 3. Promote successor in admins collection
  await setDoc(doc(db, "admins", successorUid), {
    uid: successorUid,
    fullName: succData?.fullName || "Super Admin",
    email: succData?.email?.toLowerCase().trim() || "",
    phoneNumber: succData?.phoneNumber || "",
    role: "super_admin",
    rules: ["all"],
    isActive: true,
    createdBy: `transfer_from_${currentAdminUid}`,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // 4. DEMOTE CURRENT ADMIN IMMEDIATELY TO CITIZEN & DELETE FROM ADMINS COLLECTION
  // As requested: The transferring admin is immediately removed and loses admin access!
  await setDoc(doc(db, "users", currentAdminUid), {
    role: "citizen",
    updatedAt: now,
  }, { merge: true });

  await deleteDoc(doc(db, "admins", currentAdminUid));
}

export async function transferSuperAdminAndSelfDelete(
  currentAdminUid: string,
  successor: { uid: string; fullName: string; email: string; phoneNumber?: string }
): Promise<void> {
  return transferSuperAdminRole(currentAdminUid, successor.uid, false);
}

