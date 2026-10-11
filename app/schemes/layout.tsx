import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "100+ Verified Government Welfare Schemes Directory 2026 | NetDuniya",
  description: "Explore 100+ authentic central and state government welfare schemes in India: PM-Kisan, Ayushman Bharat, PMAY Housing, Sukanya Samriddhi, Mudra loans, Ladli Behna, Orunodoi, and student scholarships with eligibility criteria and official links.",
  keywords: [
    "NetDuniya Schemes",
    "Government schemes directory",
    "PM Kisan Samman Nidhi",
    "Ayushman Bharat PM-JAY",
    "Pradhan Mantri Awas Yojana PMAY",
    "Sukanya Samriddhi Yojana",
    "PM Mudra loan",
    "Orunodoi 3.0 scheme Assam",
    "Sarkari Yojana list 2026",
    "welfare schemes India",
  ],
  openGraph: {
    title: "100+ Verified Government Welfare Schemes Directory | NetDuniya",
    description: "Explore authentic central and state welfare subsidies and schemes on NetDuniya.",
    url: "https://netduniya.in/schemes",
    siteName: "NetDuniya",
    type: "website",
  },
};

export default function SchemesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
