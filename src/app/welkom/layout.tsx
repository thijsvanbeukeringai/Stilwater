import type { Metadata } from "next"
import { Fraunces } from "next/font/google"
import JsonLd from "./jsonld"

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
})

// ---------------------------------------------------------------------------
// Base URL — update to the real production domain before launch.
// All canonical/OG URLs are derived from this single constant.
// ---------------------------------------------------------------------------
const SITE_URL = "https://stilwater.nl"
const PAGE_URL = `${SITE_URL}/welkom`
const OG_IMAGE = `${SITE_URL}/img/pool-villa.webp`

export const metadata: Metadata = {
  // Title template: child routes can compose as "Diensten | Stilwater Zwembaden"
  title: {
    default: "Stilwater Zwembaden — Zwembadbouw & service sinds 1998",
    template: "%s | Stilwater Zwembaden",
  },

  // 150 chars — Dutch, action-oriented, primary keyword in first phrase
  description:
    "Zwembadbouwer in Utrecht voor aanleg, renovatie en onderhoud. Eigen team, tot 25 jaar garantie, 24u service. Vraag vrijblijvend een offerte aan.",

  keywords: [
    "zwembadbouwer",
    "zwembad aanleg",
    "zwembad onderhoud",
    "zwembad renovatie",
    "zwembad service",
    "zwembad Utrecht",
    "privézwembad",
    "overloopbad",
    "skimmerbad",
    "spa wellness",
    "waterzorg",
    "lekdetectie",
    "linerrenovatie",
    "NVZ zwembad",
    "Stilwater Zwembaden",
  ],

  authors: [{ name: "Stilwater Zwembaden", url: SITE_URL }],
  creator: "Stilwater Zwembaden",
  publisher: "Stilwater Zwembaden",

  // Canonical — no trailing slash, lowercase, no query params
  alternates: {
    canonical: PAGE_URL,
  },

  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: PAGE_URL,
    siteName: "Stilwater Zwembaden",
    title: "Stilwater Zwembaden — Zwembadbouw & service sinds 1998",
    description:
      "Onafhankelijke Nederlandse zwembadbouwer voor aanleg, renovatie en service. Eén team voor het hele leven van uw bad — al 25 jaar vanuit Utrecht.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Luxe overloopbad aangelegd door Stilwater Zwembaden in een villentuin",
        type: "image/webp",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Stilwater Zwembaden — Zwembadbouw & service",
    description:
      "Onafhankelijke zwembadbouwer voor aanleg, renovatie en service. Eén team voor het hele leven van uw bad.",
    images: [OG_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // telephone=true lets mobile browsers auto-link phone numbers in the page
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },

  // favicon.ico is served from src/app/favicon.ico; Next.js auto-handles
  // this via the root layout, so no explicit icons entry is needed here.
  // If this layout is ever promoted to root, add:
  // icons: { icon: "/favicon.ico" },
}

export default function WelkomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${fraunces.variable} welkom-shell`}>
      <JsonLd />
      {children}
    </div>
  )
}
