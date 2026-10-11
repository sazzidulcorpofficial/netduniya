import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest Sarkari Naukri & Verified Government Jobs Recruitment 2026 | NetDuniya",
  description: "Real-time verified recruitment notifications from SSC, UPSC, Indian Railways (RRB), Banking (IBPS, SBI), Defence, Police, and Teaching commissions. Free official links and assisted online form filling at NetDuniya Kendra.",
  keywords: [
    "NetDuniya Jobs",
    "Sarkari Naukri 2026",
    "Government jobs recruitment",
    "SSC CGL recruitment 2026",
    "Railway RRB NTPC vacancy",
    "Banking IBPS PO Clerk",
    "Police constable recruitment",
    "Assam government jobs",
    "online form fill up cyber cafe",
  ],
  openGraph: {
    title: "Latest Sarkari Naukri & Government Jobs Recruitment | NetDuniya",
    description: "Verified government jobs notifications with official links and assisted form filling.",
    url: "https://netduniya.in/jobs",
    siteName: "NetDuniya",
    type: "website",
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
