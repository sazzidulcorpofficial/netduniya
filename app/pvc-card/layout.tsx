import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Smart PVC Plastic Cards Online — Aadhaar, PAN, Voter, DL & RC | NetDuniya",
  description: "Order high-definition, waterproof Smart PVC Cards online with UIDAI compliant QR codes, thermal lamination, unbreakable plastic body, and fast speed post delivery. Options for Aadhaar PVC, PAN card, Voter ID, Driving Licence, RC, Ayushman, and ABHA card.",
  keywords: [
    "NetDuniya PVC card",
    "order PVC Aadhaar card online",
    "smart PVC plastic card print",
    "waterproof Aadhaar card print",
    "PAN card PVC print online",
    "Voter ID card PVC online",
    "Driving licence PVC smart card",
    "Vehicle RC PVC smart card",
    "Ayushman Bharat PVC golden card",
    "ABHA health card PVC",
    "APAAR student ID card",
    "Ration card PVC print",
    "doorstep speed post delivery PVC",
    "cyber cafe PVC card maker",
  ],
  openGraph: {
    title: "Order Smart PVC Plastic Cards Online | NetDuniya",
    description: "High-definition waterproof thermal printed PVC smart cards delivered across India.",
    url: "https://netduniya.in/pvc-card",
    siteName: "NetDuniya",
    type: "website",
  },
};

export default function PVCCardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
