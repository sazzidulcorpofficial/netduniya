import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Digital Citizen Services & E-Governance Catalog | NetDuniya",
  description: "Browse 30+ official digital citizen services on NetDuniya: Aadhaar mobile link, PAN card, Voter ID, Driving Licence, Jamabandi revenue records, Birth & Caste certificates, Ration card eKYC, and assisted online application filing.",
  keywords: [
    "NetDuniya Services",
    "Digital citizen services",
    "E-Governance catalog",
    "Aadhaar card update online",
    "PAN card apply online",
    "Voter card apply",
    "Driving licence online",
    "Sewa Setu certificates",
    "Jamabandi revenue Assam",
    "Cyber cafe online seva kendra",
  ],
  openGraph: {
    title: "All Digital Citizen Services & E-Governance Catalog | NetDuniya",
    description: "Assisted e-governance applications, verification, and doorstep delivery.",
    url: "https://netduniya.in/services",
    siteName: "NetDuniya",
    type: "website",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
