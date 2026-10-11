"use client";

import React, { useEffect, useState } from "react";
import { 
  Share2, 
  Plus, 
  Save, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Eye,
  X,
  Sparkles,
  Globe,
  Image as ImageIcon
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  getSocialMediaLinks, 
  saveSocialMediaLinks, 
  DEFAULT_SOCIAL_MEDIA_LINKS,
  isRealSocialUrl
} from "@/lib/firestore-service";
import { SocialMediaLink } from "@/lib/types";

// Official brand SVG icons for standard platforms
function BrandIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "youtube":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
        </svg>
      );
    case "instagram":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      );
    case "facebook":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case "whatsapp":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.476-.15-.676.15-.201.301-.777.979-.953 1.18-.175.201-.351.226-.652.076-.301-.151-1.27-.468-2.42-1.493-.895-.798-1.5-1.783-1.676-2.084-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.502.1-.201.05-.376-.025-.527-.075-.15-.677-1.631-.928-2.235-.245-.588-.493-.509-.676-.518-.175-.009-.376-.01-.577-.01-.201 0-.527.075-.802.376-.276.301-1.054 1.03-1.054 2.513s1.08 2.915 1.23 3.116c.15.201 2.124 3.243 5.145 4.549.719.31 1.28.496 1.718.636.722.23 1.378.197 1.9.12.58-.088 1.78-.727 2.03-1.429.252-.703.252-1.305.176-1.43-.075-.125-.276-.201-.577-.351zm-5.465 7.426h-.008a9.88 9.88 0 01-5.035-1.377l-.361-.214-3.741.982 1-3.647-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.432-9.876 9.88-9.876 2.637 0 5.116 1.028 6.98 2.894a9.824 9.824 0 012.89 6.982c0 5.447-4.432 9.878-9.869 9.878zM12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.523 5.845L0 24l6.328-1.488A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
      );
    case "telegram":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      );
    case "twitter":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case "linkedin":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    default:
      return <Globe className={className} />;
  }
}

function sanitizeSocialUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^wa\.me\//i.test(url)) return `https://${url}`;
  if (/^t\.me\//i.test(url)) return `https://${url}`;
  return `https://${url}`;
}

export default function AdminSocialMediaPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Custom Modal State
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customLogoUrl, setCustomLogoUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customEditingId, setCustomEditingId] = useState<string | null>(null);

  useEffect(() => {
    getSocialMediaLinks().then((data) => {
      // Merge with default channels if any are missing
      const existingIds = new Set(data.map(d => d.id));
      const merged = [...data];
      DEFAULT_SOCIAL_MEDIA_LINKS.forEach(def => {
        if (!existingIds.has(def.id)) {
          merged.push(def);
        }
      });
      setLinks(merged);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLinks(DEFAULT_SOCIAL_MEDIA_LINKS);
      setLoading(false);
    });
  }, []);

  const handleUpdateUrl = (id: string, url: string) => {
    setLinks(prev => prev.map(item => item.id === id ? { ...item, url } : item));
  };

  const handleToggleActive = (id: string) => {
    setLinks(prev => prev.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSuccess(null);
    try {
      const sanitized: SocialMediaLink[] = (links || []).map(l => {
        const item: SocialMediaLink = {
          id: String(l.id || ""),
          name: String(l.name || ""),
          url: sanitizeSocialUrl(l.url) || "",
          iconType: (l.iconType || "custom") as any,
          bgColor: String(l.bgColor || "bg-indigo-600"),
          isActive: Boolean(l.isActive),
          isCustom: Boolean(l.isCustom),
          customLogoUrl: (l.customLogoUrl && typeof l.customLogoUrl === 'string' && l.customLogoUrl.trim()) 
            ? sanitizeSocialUrl(l.customLogoUrl.trim()) 
            : ""
        };
        return item;
      });
      setLinks(sanitized);
      await saveSocialMediaLinks(sanitized);
      setSuccess("All social media links updated & synchronized successfully across NetDuniya!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to save social media links: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddCustom = () => {
    setCustomEditingId(null);
    setCustomName("");
    setCustomLogoUrl("");
    setCustomUrl("");
    setCustomModalOpen(true);
  };

  const handleSaveCustom = () => {
    if (!customName.trim()) {
      alert("Please enter a name for the social media channel.");
      return;
    }
    if (!customUrl.trim()) {
      alert("Please enter a valid destination link URL.");
      return;
    }

    const cleanUrl = sanitizeSocialUrl(customUrl);
    const cleanLogo = customLogoUrl.trim() ? sanitizeSocialUrl(customLogoUrl) : "";

    if (customEditingId) {
      // Edit existing
      setLinks(prev => prev.map(item => {
        if (item.id === customEditingId) {
          return {
            ...item,
            name: customName.trim(),
            url: cleanUrl,
            customLogoUrl: cleanLogo,
          };
        }
        return item;
      }));
    } else {
      // Add new custom
      const newId = `custom_${Date.now()}`;
      const newItem: SocialMediaLink = {
        id: newId,
        name: customName.trim(),
        url: cleanUrl,
        iconType: "custom",
        customLogoUrl: cleanLogo,
        bgColor: "bg-indigo-600",
        isActive: true,
        isCustom: true,
      };
      setLinks(prev => [...prev, newItem]);
    }

    setCustomModalOpen(false);
  };

  const handleDeleteCustom = (id: string) => {
    if (!confirm("Are you sure you want to remove this custom social media channel?")) return;
    setLinks(prev => prev.filter(item => item.id !== id));
  };

  const standardLinks = links.filter(l => !l.isCustom && l.iconType !== "custom");
  const customLinks = links.filter(l => l.isCustom || l.iconType === "custom");
  const activeCount = links.filter(l => l.isActive && isRealSocialUrl(l.url)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-blue" />
        <span className="ml-3 font-bold text-slate-700 text-sm">Loading Social Media Settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow">
              <Share2 className="h-5 w-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Social Media Channels & Handles
            </h1>
            <span className="text-[11px] bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200">
              {activeCount} Active on Website
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Pre-configured with official logos for YouTube, Instagram, Facebook, WhatsApp, Telegram, etc. Add custom links with real icons.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          <button
            type="button"
            onClick={handleOpenAddCustom}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs rounded-xl border border-indigo-200 transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>+ Add Custom Social Media</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 bg-brand-accent hover:bg-brand-accentHover text-white font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving All...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save All Changes</span>
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

      {/* SECTION 1: Standard Official Platforms */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Official Platforms (Pre-Configured Logos)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Toggle switch ON and enter your link
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standardLinks.map((item) => {
            const isFilled = Boolean(item.url?.trim());
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.isActive && isFilled 
                    ? "bg-slate-50/70 border-slate-300 shadow-sm" 
                    : "bg-white border-slate-200 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${item.bgColor || "bg-slate-800"}`}>
                      <BrandIcon type={item.iconType} className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">{item.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                    </div>
                  </div>

                  {/* Enable / Disable Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      onChange={() => handleToggleActive(item.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    <span className="ml-2 text-[11px] font-bold text-slate-600">
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                  </label>
                </div>

                {/* Input Field with Test Link */}
                <div className="relative mt-2">
                  <input
                    type="url"
                    value={item.url || ""}
                    onChange={(e) => handleUpdateUrl(item.id, e.target.value)}
                    placeholder={`https://${item.id}.com/yourhandle`}
                    className="w-full bg-white border border-slate-300 focus:border-brand-blue rounded-lg py-2 pl-3 pr-20 text-xs font-mono font-bold text-slate-900 shadow-inner"
                  />
                  {item.url?.trim() && (
                    <a
                      href={sanitizeSocialUrl(item.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof window !== "undefined") {
                          window.open(sanitizeSocialUrl(item.url), "_blank", "noopener,noreferrer");
                          e.preventDefault();
                        }
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold transition flex items-center space-x-1"
                      title="Open link in new tab"
                    >
                      <span>Test</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Custom Social Media Channels */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Custom Social Media Channels ({customLinks.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleOpenAddCustom}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add another custom channel</span>
          </button>
        </div>

        {customLinks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-2">
            <ImageIcon className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No custom social media channels added yet</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Want to add Threads, Pinterest, Discord, a Help Blog, or another service? Click the button below to specify a custom name, image URL, and link!
            </p>
            <button
              type="button"
              onClick={handleOpenAddCustom}
              className="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition"
            >
              + Add Custom Social Media
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customLinks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {item.customLogoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.customLogoUrl}
                        alt={item.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-300 bg-white p-0.5 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://i.ibb.co/SwRRLf7R/file-00000000cf547209bfa39d10d03ef966.png";
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                        <Globe className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-black text-slate-900">{item.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">Custom Channel</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={() => handleToggleActive(item.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteCustom(item.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete custom channel"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={item.url || ""}
                    onChange={(e) => handleUpdateUrl(item.id, e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white border border-slate-300 focus:border-brand-blue rounded-lg py-1.5 pl-3 pr-20 text-xs font-mono font-bold text-slate-900 shadow-inner"
                  />
                  {item.url?.trim() && (
                    <a
                      href={sanitizeSocialUrl(item.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof window !== "undefined") {
                          window.open(sanitizeSocialUrl(item.url), "_blank", "noopener,noreferrer");
                          e.preventDefault();
                        }
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition flex items-center space-x-1"
                    >
                      <span>Test</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Public Website Live Display Preview */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg border border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-amber-400">
          <Eye className="h-4 w-4" />
          <span>Live Frontend Preview (Founder / NetDuniya Section)</span>
        </div>
        <p className="text-xs text-slate-400">
          Here is how your verified social media badges will look to citizens visiting the NetDuniya homepage:
        </p>

        <div className="pt-2 flex flex-wrap gap-2.5 items-center">
          {links.filter(l => l.isActive && isRealSocialUrl(l.url)).length === 0 ? (
            <span className="text-xs text-slate-500 italic">No social media links are currently active with a verified URL.</span>
          ) : (
            links.filter(l => l.isActive && isRealSocialUrl(l.url)).map(item => {
              const targetUrl = sanitizeSocialUrl(item.url);
              return (
                <a
                  key={item.id}
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== "undefined" && targetUrl) {
                      window.open(targetUrl, "_blank", "noopener,noreferrer");
                      e.preventDefault();
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-white rounded-xl transition shadow-sm text-xs font-bold hover:scale-105 duration-200 cursor-pointer select-none ${item.bgColor || "bg-slate-800 hover:bg-slate-700"}`}
                >
                  {item.customLogoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.customLogoUrl} alt={item.name} className="h-3.5 w-3.5 rounded object-cover" />
                  ) : (
                    <BrandIcon type={item.iconType} className="h-3.5 w-3.5" />
                  )}
                  <span>{item.name}</span>
                  <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                </a>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: Add / Edit Custom Social Media */}
      {customModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-300 p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {customEditingId ? "Edit Custom Social Media" : "Add Custom Social Media"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-black text-slate-900 mb-1">
                  Social Platform Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Threads, Pinterest, Discord, Helpline"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">
                  Logo / Icon Image URL
                </label>
                <input
                  type="url"
                  value={customLogoUrl}
                  onChange={(e) => setCustomLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">Provide a direct image URL (PNG/SVG/JPG) for the brand logo.</p>

                {customLogoUrl?.trim() && (
                  <div className="mt-2 p-2 bg-slate-50 border rounded-lg flex items-center space-x-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={customLogoUrl}
                      alt="Preview"
                      className="w-6 h-6 rounded object-cover border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://i.ibb.co/SwRRLf7R/file-00000000cf547209bfa39d10d03ef966.png";
                      }}
                    />
                    <span className="text-[11px] text-slate-600 font-bold">Logo Preview</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-black text-slate-900 mb-1">
                  Target Destination URL (Where user lands upon click) *
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://threads.net/@yourhandle"
                  className="w-full bg-white border-2 border-slate-300 rounded-lg p-2.5 font-mono font-bold text-slate-900 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setCustomModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-lg shadow transition cursor-pointer"
              >
                Save Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
