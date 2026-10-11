import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Kendra Appointment Slot — Zero Wait Time Desk Assistance | NetDuniya",
  description: "Skip queues and book a priority appointment slot at NetDuniya Digital Kendra for Aadhaar update verification, urgent PAN documentation, certificates, passport assistance, or driving licence checks.",
  keywords: [
    "NetDuniya Appointment",
    "Book kendra appointment",
    "Aadhaar appointment online",
    "Cyber cafe appointment slot",
    "priority citizen service desk",
  ],
};

export default function AppointmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
