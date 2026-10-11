"use client";

import React, { useEffect, useState } from "react";
import { Quote, Award, ShieldCheck, Sparkles, Building2, Globe } from "lucide-react";
import { 
  subscribeToFounderData, 
  subscribeToSocialMediaLinks, 
  DEFAULT_FOUNDER_DATA,
  DEFAULT_SOCIAL_MEDIA_LINKS,
  isRealSocialUrl
} from "@/lib/firestore-service";
import { FounderData, SocialMediaLink } from "@/lib/types";

// Custom SVG social icons for brand accuracy
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
    </svg>
  );
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.476-.15-.676.15-.201.301-.777.979-.953 1.18-.175.201-.351.226-.652.076-.301-.151-1.27-.468-2.42-1.493-.895-.798-1.5-1.783-1.676-2.084-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.301.301-.502.1-.201.05-.376-.025-.527-.075-.15-.677-1.631-.928-2.235-.245-.588-.493-.509-.676-.518-.175-.009-.376-.01-.577-.01-.201 0-.527.075-.802.376-.276.301-1.054 1.03-1.054 2.513s1.08 2.915 1.23 3.116c.15.201 2.124 3.243 5.145 4.549.719.31 1.28.496 1.718.636.722.23 1.378.197 1.9.12.58-.088 1.78-.727 2.03-1.429.252-.703.252-1.305.176-1.43-.075-.125-.276-.201-.577-.351zm-5.465 7.426h-.008a9.88 9.88 0 01-5.035-1.377l-.361-.214-3.741.982 1-3.647-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.432-9.876 9.88-9.876 2.637 0 5.116 1.028 6.98 2.894a9.824 9.824 0 012.89 6.982c0 5.447-4.432 9.878-9.869 9.878zM12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.11 1.523 5.845L0 24l6.328-1.488A11.938 11.938 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function RenderIcon({ item }: { item: SocialMediaLink }) {
  if (item.customLogoUrl) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={item.customLogoUrl}
        alt={item.name}
        className="h-3.5 w-3.5 rounded object-cover flex-shrink-0 bg-white p-0.5"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://i.ibb.co/SwRRLf7R/file-00000000cf547209bfa39d10d03ef966.png";
        }}
      />
    );
  }

  switch (item.iconType) {
    case "facebook":
      return <FacebookIcon className="h-3.5 w-3.5 flex-shrink-0" />;
    case "instagram":
      return <InstagramIcon className="h-3.5 w-3.5 flex-shrink-0" />;
    case "youtube":
      return <YoutubeIcon className="h-3.5 w-3.5 flex-shrink-0" />;
    case "whatsapp":
      return <WhatsappIcon className="h-3.5 w-3.5 flex-shrink-0" />;
    case "telegram":
      return <TelegramIcon className="h-3.5 w-3.5 flex-shrink-0" />;
    case "linkedin":
      return <LinkedinIcon className="h-3.5 w-3.5 flex-shrink-0" />;
    case "twitter":
      return <TwitterIcon className="h-3.5 w-3.5 flex-shrink-0" />;
    default:
      return <Globe className="h-3.5 w-3.5 flex-shrink-0" />;
  }
}

function getBadgeBg(item: SocialMediaLink): string {
  if (item.bgColor) return item.bgColor;
  switch (item.iconType) {
    case "facebook":
      return "bg-blue-600 hover:bg-blue-700";
    case "instagram":
      return "bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:to-orange-600";
    case "youtube":
      return "bg-red-600 hover:bg-red-700";
    case "whatsapp":
      return "bg-emerald-600 hover:bg-emerald-700";
    case "telegram":
      return "bg-sky-600 hover:bg-sky-700";
    case "linkedin":
      return "bg-sky-700 hover:bg-sky-800";
    case "twitter":
      return "bg-slate-900 hover:bg-slate-800";
    default:
      return "bg-indigo-600 hover:bg-indigo-700";
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

export default function FounderSection() {
  const [founder, setFounder] = useState<FounderData>(DEFAULT_FOUNDER_DATA);
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>(DEFAULT_SOCIAL_MEDIA_LINKS);

  useEffect(() => {
    const unsubFounder = subscribeToFounderData((data) => {
      if (data) setFounder(data);
    });
    const unsubSocial = subscribeToSocialMediaLinks((links) => {
      if (links && links.length > 0) {
        setSocialLinks(links);
      }
    });
    return () => {
      unsubFounder();
      unsubSocial();
    };
  }, []);

  if (!founder.isVisible) return null;

  // Filter only active social media channels configured with a valid REAL link by Admin
  const activeSocialChannels = socialLinks.filter(
    (item) => item.isActive && isRealSocialUrl(item.url)
  );

  return (
    <section className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 my-8 relative overflow-hidden">
      {/* Decorative background accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -z-0 opacity-70" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        
        {/* Founder Photo */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden shadow-elevated border-4 border-white ring-4 ring-brand-blue/20 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={founder.imageUrl || "/images/founder.jpg"}
              alt={founder.name || "Founder, NetDuniya"}
              className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/founder.jpg";
              }}
            />
          </div>

          <div className="mt-3 flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Verified Founder</span>
          </div>
        </div>

        {/* Founder Content */}
        <div className="flex-1 text-center md:text-left space-y-3">
          
          <div className="inline-flex items-center space-x-2 bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider">
            <Award className="h-3.5 w-3.5" />
            <span>FOUNDER — NETDUNIYA</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {founder.name || "Yasin Khan"}
          </h3>

          <p className="text-xs sm:text-sm font-semibold text-brand-accent">
            {founder.designation || "Founder & Managing Director, NetDuniya"}
          </p>

          <div className="relative bg-slate-50 border-l-4 border-brand-accent p-4 rounded-r-lg">
            <Quote className="h-5 w-5 text-amber-500/40 absolute top-2 right-2" />
            <p className="text-xs sm:text-sm italic text-slate-700 font-medium leading-relaxed">
              &ldquo;{founder.quote || DEFAULT_FOUNDER_DATA.quote}&rdquo;
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {founder.description || DEFAULT_FOUNDER_DATA.description}
          </p>

          {/* Sazzidul Corporation Promotional Badge */}
          <div className="pt-2">
            <div className="inline-flex flex-col sm:flex-row items-center gap-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-3 sm:px-4 sm:py-2.5 rounded-xl border border-indigo-500/30 shadow-md">
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <Building2 className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-300">A Digital Initiative & Venture of:</span>
              </div>
              <span className="text-xs sm:text-sm font-black text-amber-300 tracking-wide uppercase flex items-center space-x-1">
                <span>Sazzidul Corporation</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-400 ml-1 inline" />
              </span>
            </div>
          </div>

          {/* Real-time Dynamic Social Channels configured by Admin */}
          {activeSocialChannels.length > 0 && (
            <div className="flex items-center justify-center md:justify-start space-x-2 pt-2 flex-wrap gap-y-2">
              {activeSocialChannels.map((item) => {
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
                    className={`flex items-center space-x-1.5 px-3 py-2 text-white rounded-xl transition shadow-sm text-xs font-bold hover:scale-105 duration-200 cursor-pointer select-none ${getBadgeBg(item)}`}
                    aria-label={item.name}
                    title={`Open ${item.name}`}
                  >
                    <RenderIcon item={item} />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
