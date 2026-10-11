import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About NetDuniya — Digital Cyber Cafe & Citizen Seva Kendra",
  description: "Learn more about NetDuniya Digital Kendra in Khongra, Chenga, Barpeta, Assam 781305. Providing fast, reliable citizen documentation, e-governance, banking, and high-definition Smart PVC card delivery.",
  keywords: [
    "About NetDuniya",
    "Netduniya Cyber Cafe",
    "Netduniya Assam",
    "Netduniya Barpeta",
    "Netduniya Chenga",
    "online seva kendra",
  ],
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
