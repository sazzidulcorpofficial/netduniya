"use client";

import React, { useState } from "react";
import { 
  MapPin, 
  Compass, 
  Navigation, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Maximize2,
  Loader2,
  Phone,
  ShieldCheck,
  X
} from "lucide-react";

const SatelliteViewMap = React.memo(function SatelliteViewMap() {
  const [mapType, setMapType] = useState<"hybrid" | "satellite" | "roadmap">("hybrid");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Exact real-time coordinates and verified address for Net Duniya, Hajo Daulashal Road, Senga, Assam 781305
  const directMapsUrl = "https://www.google.com/maps/search/?api=1&query=Net+Duniya,+Hajo+Daulashal+Road,+Senga,+Assam+781305";
  const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=Net+Duniya,+Hajo+Daulashal+Road,+Senga,+Assam+781305";

  // Real-time Satellite Embed centered directly on Net Duniya on Hajo Daulashal Road
  const embedUrl = mapType === "satellite"
    ? "https://maps.google.com/maps?q=Net+Duniya,+Hajo+Daulashal+Road,+Senga,+Assam+781305&t=k&z=18&ie=UTF8&iwloc=A&output=embed"
    : mapType === "roadmap"
    ? "https://maps.google.com/maps?q=Net+Duniya,+Hajo+Daulashal+Road,+Senga,+Assam+781305&t=m&z=17&ie=UTF8&iwloc=A&output=embed"
    : "https://maps.google.com/maps?q=Net+Duniya,+Hajo+Daulashal+Road,+Senga,+Assam+781305&t=h&z=18&ie=UTF8&iwloc=A&output=embed";

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 overflow-hidden flex flex-col h-full animate-fadeIn">
      
      {/* Top Header Strip matching photo */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Compass className="h-5 w-5 text-amber-400 animate-spin" style={{ animationDuration: "25s" }} />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] bg-emerald-500/25 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/40">
                LIVE
              </span>
              <span className="text-[10px] text-slate-300 font-medium">
                Kendra GPS Coordinates
              </span>
            </div>
            <h3 className="text-sm font-black text-amber-300 tracking-wide">
              Net Duniya Satellite Map
            </h3>
          </div>
        </div>

        {/* View Toggle: Hybrid / Satellite / Road Map */}
        <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => {
              setMapType("hybrid");
              setIframeLoaded(false);
            }}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              mapType === "hybrid"
                ? "bg-amber-400 text-slate-950 shadow font-black"
                : "text-slate-300 hover:text-white"
            }`}
            title="Satellite with Road & Landmark Labels"
          >
            Hybrid
          </button>
          <button
            type="button"
            onClick={() => {
              setMapType("satellite");
              setIframeLoaded(false);
            }}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
              mapType === "satellite"
                ? "bg-amber-400 text-slate-950 shadow font-black"
                : "text-slate-300 hover:text-white"
            }`}
            title="High-Resolution Space Imagery"
          >
            🛰️ Space
          </button>
        </div>
      </div>

      {/* Embedded High-Resolution Satellite Map Container */}
      <div className="relative w-full h-[280px] sm:h-[320px] bg-slate-950 overflow-hidden group">
        
        {/* Skeleton Overlay while iframe paints */}
        {!iframeLoaded && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400 z-10 transition-opacity">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting Satellite Orbit...</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Net Duniya &bull; Hajo Daulashal Rd, Senga, Assam</p>
          </div>
        )}

        <iframe
          key={mapType}
          title="Net Duniya Satellite Map"
          src={embedUrl}
          className={`w-full h-full border-0 filter saturate-[1.1] contrast-[1.05] transition-opacity duration-300 ${
            iframeLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="eager"
          onLoad={() => setIframeLoaded(true)}
          allowFullScreen
        />

        {/* Floating Quick Action Overlay matching photo */}
        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-20">
          <a
            href={directMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-950/90 hover:bg-slate-900 text-white text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg shadow-lg border border-white/20 backdrop-blur-sm transition flex items-center space-x-1 hover:scale-105"
            title="Open in Google Maps App"
          >
            <Maximize2 className="h-3 w-3 text-amber-400" />
            <span>Full View</span>
          </a>
        </div>

        {/* Location Pin Badge matching photo */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 text-white px-2.5 py-1.5 rounded-md border border-white/15 text-[10px] font-bold backdrop-blur-xs flex items-center space-x-1.5 pointer-events-none z-20 shadow-md">
          <MapPin className="h-3.5 w-3.5 text-rose-500 animate-bounce" />
          <span>Assam 781305 &bull; Hajo Daulashal Rd</span>
        </div>
      </div>

      {/* Location Details & Directions Bar */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-slate-50/80 border-t border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-900 flex items-center space-x-1.5">
              <MapPin className="h-4 w-4 text-brand-blue" />
              <span>Digital Cyber Cafe & Citizen Kendra</span>
            </h4>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified Location</span>
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
            <strong className="text-slate-950 font-black">Net Duniya Digital Center</strong>, Hajo Daulashal Road, Senga, Khongra, Barpeta, Assam 781305.
          </p>

          <div className="flex items-center space-x-3 text-[11px] text-slate-600 pt-0.5">
            <span className="flex items-center space-x-1 text-slate-900 font-bold">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>8:00 AM – 9:00 PM (Daily)</span>
            </span>
            <span>&bull;</span>
            <span className="text-emerald-700 font-bold">In-Person & Online Support</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
          <a
            href={directMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-brand-blue hover:bg-brand-primary text-white text-xs font-black py-2.5 px-3 rounded-xl shadow transition flex items-center justify-center space-x-1.5 group cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-3 rounded-xl shadow transition flex items-center justify-center space-x-1.5 group cursor-pointer"
          >
            <Navigation className="h-3.5 w-3.5 text-white group-hover:scale-110 transition-transform" />
            <span>Get Directions</span>
          </a>
        </div>
      </div>

    </div>
  );
});

export default SatelliteViewMap;
