import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citizen Digital Utility Tools — Exam Photo Resizer, Age Calculator & IFSC Finder | NetDuniya",
  description: "Free fast online citizen utilities: Government exam photo and signature resizer (SSC, UPSC, Banking), exact date of birth age calculator, 12-digit Aadhaar Verhoeff checksum validator, PAN format verifier, all bank IFSC code finder, and cheque amount number to words converter.",
  keywords: [
    "NetDuniya tools",
    "photo resizer for sarkari exam",
    "signature resizer online kb",
    "SSC exam photo resizer",
    "UPSC admit card signature crop",
    "exact age calculator online",
    "DOB calculator for govt jobs",
    "Aadhaar Verhoeff checksum validator",
    "PAN card format checker",
    "IFSC code lookup all banks",
    "cheque amount number to words converter",
    "rupees in words calculator",
    "online cyber cafe tools",
    "citizen utility portal India",
  ],
  openGraph: {
    title: "Citizen Digital Utility Tools | NetDuniya",
    description: "100% Free, secure, in-browser digital tools for government exam applications and citizen documentation.",
    url: "https://netduniya.in/tools",
    siteName: "NetDuniya",
    type: "website",
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
