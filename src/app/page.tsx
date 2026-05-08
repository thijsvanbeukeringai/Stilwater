import Link from "next/link"
import {
  ArrowRight,
  Building2,
  UserPlus,
  Inbox,
  ScanLine,
  Ticket,
  Globe2,
} from "lucide-react"
import { PROJECT, PROJECT_ID, GROUPS, PERSONS } from "@/lib/mock/data"

const SAMPLE_INVITE = GROUPS[0].invite_token
const SAMPLE_QR =
  PERSONS.find((p) => p.status === "approved")?.qr_token ?? PERSONS[0].qr_token

const STEPS = [
  {
    n: 1,
    title: "Bedrijf aanmaken",
    description:
      "Maak per bedrijf een aparte groep aan. Productie, cateraar, artiestencrew of pers — ieder bedrijf krijgt eigen limieten en een uitnodigingslink.",
    icon: Building2,
  },
  {
    n: 2,
    title: "Crew toevoegen",
    description:
      "Open een bedrijf en voeg crewleden toe — handmatig óf laat het bedrijf zelf invullen via de publieke link.",
    icon: UserPlus,
  },
  {
    n: 3,
    title: "Per persoon: dagen, items & maaltijden",
    description:
      "Kies welke dagen iemand werkt, welke items nodig zijn (portofoon, headset, oortje, parkeerkaart) en welke maaltijden per dag.",
    icon: ArrowRight,
  },
  {
    n: 4,
    title: "Goedkeuren",
    description:
      "Beoordeel alle aanvragen via de approval queue met keyboard shortcuts (J/K/A/R).",
    icon: Inbox,
  },
  {
    n: 5,
    title: "Check-in op de dag",
    description:
      "Scan QR-codes of check handmatig in. Items worden meteen uitgegeven.",
    icon: ScanLine,
  },
]

export default function Home() {
  const adminUrl = `/companies`

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          IMS Suite — v2 prototype
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Accreditatie
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Actief testproject:{" "}
          <span className="font-medium text-foreground">{PROJECT.name}</span> —{" "}
          {PROJECT.show_days.length} showdagen, {GROUPS.length} bedrijven,{" "}
          {PERSONS.length} crewleden. Alle data is mock; Supabase volgt later.
        </p>
      </header>

      {/* Primary CTA */}
      <Link
        href={adminUrl}
        className="group flex items-center justify-between gap-4 rounded-2xl bg-zinc-900 p-6 text-white shadow-lg transition-transform hover:-translate-y-0.5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Begin hier
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Beheer bedrijven en crew →
          </h2>
          <p className="mt-1 text-sm text-zinc-300">
            Open het beheerpaneel en begin met stap 1: bedrijven aanmaken.
          </p>
        </div>
        <ArrowRight className="size-6 transition-transform group-hover:translate-x-1" />
      </Link>

      {/* Steps */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          De flow
        </h2>
        <ol className="mt-3 space-y-2">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="flex items-start gap-4 rounded-lg border bg-card p-4 shadow-sm"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                {s.n}
              </span>
              <div className="flex-1">
                <h3 className="font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {s.description}
                </p>
              </div>
              <s.icon className="hidden size-5 text-zinc-400 sm:block" />
            </li>
          ))}
        </ol>
      </section>

      {/* Other surfaces */}
      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Andere weergaven
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <SurfaceLink
            href={`/accreditation/${SAMPLE_INVITE}`}
            icon={Globe2}
            title="Publiek portaal"
            description="Wat een bedrijf ziet via hun uitnodigingslink"
          />
          <SurfaceLink
            href={`/accreditation/ticket/${SAMPLE_QR}`}
            icon={Ticket}
            title="Publiek ticket"
            description="Print-vriendelijk ticket met QR"
          />
          <SurfaceLink
            href={`/checkin`}
            icon={ScanLine}
            title="Check-in scherm"
            description="Mobile-first scanner voor centralists"
          />
        </div>
      </section>

      <footer className="mt-12 border-t pt-6 text-xs text-muted-foreground">
        Onderdeel van de IMS suite. Tech: Next.js 16, Tailwind v4, Radix UI.
        Geen live database actief — alle mutaties zijn lokale React-state.
      </footer>
    </main>
  )
}

function SurfaceLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-zinc-300"
    >
      <Icon className="mt-0.5 size-4 text-zinc-500" />
      <div className="flex-1">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
