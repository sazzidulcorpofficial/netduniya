import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "E-Governance Guides, Citizen Knowledgebase & Updates | NetDuniya",
  description: "Comprehensive step-by-step application walkthroughs for Aadhaar PVC Cards, PAN Card online apply & correction, Voter e-EPIC download, Ayushman Bharat Golden Card, Parivahan Driving Licence, PF withdrawal, Sewa Setu certificates, and PM Kisan eKYC.",
  keywords: [
    "NetDuniya Blog",
    "Netduniya Guides",
    "Aadhaar PVC card order online",
    "PAN card correction Form 49A",
    "Voter ID card download e-EPIC",
    "Ayushman card 5 lakh free treatment",
    "Driving licence online apply Parivahan",
    "Income certificate Sewa Setu Assam",
    "Passport Seva Kendra appointment",
    "PF withdrawal online Form 31 Form 19",
    "Ration card eKYC NFSA",
    "PM Kisan 18th installment eKYC",
    "Sarkari Yojana application process",
    "Digital cyber cafe services guide",
  ],
  openGraph: {
    title: "NetDuniya E-Governance Guides & Citizen Knowledgebase",
    description: "Official guides and latest citizen service walkthroughs by NetDuniya Cyber Cafe.",
    url: "https://netduniya.in/blog",
    siteName: "NetDuniya",
    type: "website",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
