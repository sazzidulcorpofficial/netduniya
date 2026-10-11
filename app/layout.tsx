import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://netduniya.in"),
  title: {
    default: "NetDuniya — Digital Citizen Services, Cyber Cafe & Online Seva Kendra",
    template: "%s | NetDuniya Cyber Cafe & E-Governance",
  },
  description: "NetDuniya Digital Center — Your trusted National Digital Citizen Services Kendra in Khongra, Chenga, Barpeta, Assam 781305. Fast online assistance for Aadhaar card update, PAN card, Voter ID, Ration card, Jamabandi, Assam E-Khajana, ABHA Health ID, Ayushman Bharat, PM Kisan, Orunodoi, College admissions (Darpan & Samarth), Driving licence, Flight & Railway ticket booking, and high-quality Smart PVC Card doorstep delivery.",
  keywords: [
    "Netduniya",
    "netduniya.in",
    "shop netduniya",
    "netduniya shop",
    "Net Duniya",
    "Net Duniya Cyber Cafe",
    "Netduniya Assam",
    "Netduniya Khongra",
    "Netduniya Chenga",
    "Netduniya Senga",
    "Netduniya Barpeta",
    "Netduniya Hajo road",
    "cyber cafe Chenga",
    "cyber cafe Barpeta",
    "cyber cafe Senga Assam",
    "online seva kendra Assam",
    "digital seva center Barpeta",
    "e-governance center Assam",
    "pvc card order shop netduniya",
    "smart pvc card print netduniya",
    "Aadhaar card mobile update Barpeta",
    "Aadhaar card update Chenga",
    "PAN card apply Assam",
    "Voter ID card Barpeta",
    "Voter foli copy Assam",
    "Jamabandi Dharitree Assam",
    "E-Khajana Assam netduniya",
    "PM Kisan eKYC netduniya",
    "Farmer registry Assam",
    "Orunodoi scheme application",
    "Ayushman card Barpeta",
    "ABHA health card Assam",
    "E-Shram card Assam",
    "APAAR ID card student Assam",
    "HS 1st year Darpan admission netduniya",
    "BA 1st semester Samarth admission",
    "IRCTC train ticket booking cyber cafe",
    "Flight ticket booking Barpeta",
    "Money transfer AEPS mini atm Khongra",
    "Birth certificate apply online",
    "Income certificate SewaSetu Assam",
    "Driving licence Barpeta",
    "RC PVC card Assam",
    "Ration card Assam",
    "Udyam registration online",
    "High quality photo framing xerox",
    "Government schemes directory India"
  ],
  authors: [
    { name: "MD Yasin Khan", url: "https://netduniya.in" },
    { name: "Sazzidul Corporation", url: "https://netduniya.in/developer" }
  ],
  creator: "MD Yasin Khan",
  publisher: "Yasin Net Duniya Digital Citizen Kendra",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "NetDuniya / Yasin Net Duniya — Digital Citizen Services, Cyber Cafe & E-Governance Kendra",
    description: "Official online portal for citizen e-governance applications, smart PVC cards, land records (Jamabandi/E-Khajana), banking, admissions & travel tickets in Assam.",
    url: "https://netduniya.in",
    siteName: "NetDuniya Digital Citizen Kendra",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/logo.png",
        width: 800,
        height: 600,
        alt: "NetDuniya Digital Citizen Kendra Logo",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "NetDuniya / Yasin Net Duniya — Digital Citizen Services & Cyber Cafe",
    description: "Your verified online assistance Kendra for Aadhaar, PAN, Jamabandi, Admissions, PVC Cards and PM schemes.",
    images: ["/images/logo.png"],
  },
  alternates: {
    canonical: "https://netduniya.in",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/logo.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured JSON-LD Data for LocalBusiness / CyberCafe / Store / GovernmentService
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "Store", "ProfessionalService"],
        "@id": "https://netduniya.in/#organization",
        "name": "NetDuniya Digital Center",
        "alternateName": [
          "Netduniya",
          "shop netduniya",
          "netduniya shop",
          "NetDuniya Digital Kendra",
          "NetDuniya Cyber Cafe Khongra"
        ],
        "url": "https://netduniya.in",
        "logo": "https://netduniya.in/images/logo.png",
        "image": "https://netduniya.in/images/logo.png",
        "description": "National Digital Citizen Services Kendra & Cyber Cafe in Assam. Fast online application assistance for Aadhaar, PAN Card, Voter ID, Ration Card, Jamabandi, E-Khajana, College Admissions, Tickets & Smart PVC Cards.",
        "telephone": "+91-6001716993",
        "email": "netduniya@gmail.com",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Hajo Daulashal Road, Senga, Khongra",
          "addressLocality": "Chenga, Barpeta",
          "addressRegion": "Assam",
          "postalCode": "781305",
          "addressCountry": "IN"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 26.27945,
          "longitude": 91.15628
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday"
            ],
            "opens": "08:00",
            "closes": "21:00"
          }
        ],
        "sameAs": [
          "https://www.google.com/maps/search/?api=1&query=26.27945,91.15628"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://netduniya.in/#website",
        "url": "https://netduniya.in",
        "name": "NetDuniya",
        "alternateName": "Shop Netduniya",
        "publisher": {
          "@id": "https://netduniya.in/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://netduniya.in/services?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect to Google Maps for lightning-fast satellite map loading */}
        <link rel="preconnect" href="https://maps.google.com" />
        <link rel="dns-prefetch" href="https://maps.google.com" />
        
        {/* JSON-LD Schema for Google Rich Search & Local Pack Ranking */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-amber-200 selection:text-slate-900">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
