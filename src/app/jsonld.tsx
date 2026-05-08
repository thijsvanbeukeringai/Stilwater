// Server component — emits JSON-LD structured data for Stilwater Zwembaden.
// No "use client" directive: renders on the server, output is static HTML.

const BASE_URL = "https://stilwater.nl"

const localBusiness = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
  "@id": `${BASE_URL}/welkom#business`,
  name: "Stilwater Zwembaden",
  alternateName: "Stilwater Zwembaden B.V.",
  description:
    "Onafhankelijke Nederlandse zwembadbouwer voor aanleg, renovatie en service van privé- en zakelijke zwembaden. Eén team voor het hele leven van uw bad — sinds 1998.",
  url: `${BASE_URL}/welkom`,
  telephone: "+31302345678",
  email: "hallo@stilwater.nl",
  foundingDate: "1998",
  numberOfEmployees: { "@type": "QuantitativeValue", value: 14 },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Industrieweg 42",
    postalCode: "3542 AH",
    addressLocality: "Utrecht",
    addressCountry: "NL",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 52.0907,
    longitude: 5.1214,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "17:30",
      description: "Showroom & werkplaats — op afspraak",
    },
  ],
  areaServed: [
    { "@type": "Country", name: "Nederland" },
    { "@type": "Country", name: "België" },
    { "@type": "Country", name: "Duitsland" },
  ],
  serviceType: [
    "Zwembadbouw",
    "Zwembad aanleg",
    "Zwembad renovatie",
    "Zwembad onderhoud",
    "Zwembad service",
    "Waterzorg",
    "Lekdetectie",
    "Linerrenovatie",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Zwembaddiensten",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Zwembad aanleg",
          description:
            "Van eerste tekening tot eerste duik. Skimmer-, overloop- en spabaden gebouwd door eigen vakmensen.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Zwembad onderhoud",
          description:
            "Service-overeenkomst met wekelijkse waterbalans, technische check en seizoensopening. Privébad vanaf €185 per maand.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Zwembad reparatie",
          description:
            "Lekdetectie, pomp & filter, linerrenovatie en verwarmingstechniek. Eigen monteurs, eigen onderdelen op voorraad.",
        },
      },
    ],
  },
  image: `${BASE_URL}/img/pool-villa.webp`,
  logo: `${BASE_URL}/favicon.ico`,
  // Replace these with real social profile URLs before launch
  sameAs: [
    "https://www.linkedin.com/company/stilwater-zwembaden",
    "https://www.instagram.com/stilwaterzwembaden",
    "https://www.facebook.com/stilwaterzwembaden",
  ],
  memberOf: {
    "@type": "Organization",
    name: "NVZ — Nederlandse Vereniging van Zwembadbouwers",
  },
  slogan: "Zwembadbouw & service — sinds 1998",
  priceRange: "€€€",
}

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}#organization`,
  name: "Stilwater Zwembaden",
  url: BASE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/favicon.ico`,
    width: 512,
    height: 512,
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+31302345678",
      contactType: "customer service",
      availableLanguage: ["Dutch", "nl"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        // 24/7 service line for maintenance contract holders
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
    },
    {
      "@type": "ContactPoint",
      email: "hallo@stilwater.nl",
      contactType: "sales",
      availableLanguage: ["Dutch", "nl"],
    },
  ],
  foundingDate: "1998",
  // Replace with real social URLs before launch
  sameAs: [
    "https://www.linkedin.com/company/stilwater-zwembaden",
    "https://www.instagram.com/stilwaterzwembaden",
  ],
}

const faqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Hoe lang duurt het bouwen van een nieuw zwembad?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Een gemiddeld privébad nemen we ongeveer 8 tot 12 weken in beslag — van eerste schop in de grond tot oplevering. Bij grotere of complexe projecten plannen we 14 tot 20 weken in. Een vooronderzoek (bodem, grondwater) loopt parallel.",
      },
    },
    {
      "@type": "Question",
      name: "Doen jullie ook onderhoud aan baden die niet door jullie gebouwd zijn?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zeker. Een groot deel van onze service-portefeuille bestaat uit baden van andere bouwers. We beginnen met een gratis intake-bezoek waarin we techniek, water en eventuele aandachtspunten in kaart brengen.",
      },
    },
    {
      "@type": "Question",
      name: "Wat kost een service-overeenkomst?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Een standaard wekelijkse service voor een privébad ligt rond €185 per maand, inclusief waterzorg en kleine reparaties. Voor zakelijke baden maken we een offerte op maat — afhankelijk van openingstijden en gebruikersaantallen.",
      },
    },
    {
      "@type": "Question",
      name: "Hoe snel zijn jullie bij een storing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Voor klanten met een service-overeenkomst geldt een reactietijd van maximaal 24 uur. Bij urgente lekkages of veiligheidsstoringen gemiddeld binnen 4 uur. We hebben eigen monteurs in dienst — geen onderaannemers.",
      },
    },
    {
      "@type": "Question",
      name: "Werken jullie ook in het buitenland?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Voor bestaande klanten verzorgen we incidenteel projecten in België en Duitsland. Onze hoofdfocus blijft Nederland — daar leveren we de service waar we voor staan.",
      },
    },
  ],
}

export default function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  )
}
