"use client"

import { useEffect, useRef } from "react"
import "./welkom.css"

const STAGES = [
  "Het zwembad waar niemand nog in zwemt.",
  "Wij ruimen op. Wij herstellen.",
  "Wij houden het helder.",
  "Stilwater Zwembaden.",
]

const WORK = [
  {
    n: "01",
    title: "Villa De Kreek",
    place: "'t Gooi",
    tag: "Aanleg · 2025",
    blurb:
      "Overloopbad van 14 meter, ingebouwd in een glooiende tuin. Natuursteen rand, RVS skimmers, en een verzonken jacuzzi.",
    img: "/img/pool-villa.webp",
  },
  {
    n: "02",
    title: "Hotel De Linde",
    place: "Oisterwijk",
    tag: "Renovatie · 2025",
    blurb:
      "Wellness-renovatie met nieuwe liner, automatische waterzorg en een uitgebreide service-overeenkomst voor 10 jaar.",
    img: "/img/pool-hotel.webp",
  },
  {
    n: "03",
    title: "Familie Janssen",
    place: "Bilthoven",
    tag: "Aanleg · 2024",
    blurb:
      "Een familiezwembad met automatische afdekking, warmtepomp en LED-verlichting. Volledig geïntegreerd in de tuin.",
    img: "/img/pool-family.webp",
  },
  {
    n: "04",
    title: "Sportclub Park",
    place: "Utrecht",
    tag: "Onderhoud · doorlopend",
    blurb:
      "Wekelijkse waterbalans, technische check en seizoensopening voor het verenigingsbad. Eén aanspreekpunt, 24u-respons.",
    img: "/img/pool-service.webp",
  },
]

const SERVICES = [
  {
    name: "Aanleg",
    blurb:
      "Van eerste tekening tot eerste duik. Skimmer-, overloop- en spabaden — gebouwd door eigen vakmensen.",
    items: [
      "Skimmerbad",
      "Overloopbad",
      "Spa & wellness",
      "Natuurzwembad",
    ],
  },
  {
    name: "Onderhoud",
    blurb:
      "Een service-overeenkomst die het hele jaar doorloopt. Wij komen langs, u zwemt.",
    items: [
      "Wekelijkse service",
      "Waterzorg op maat",
      "Seizoensopening & -sluiting",
      "Filter- en pompcheck",
    ],
  },
  {
    name: "Reparatie",
    blurb:
      "Lekken, drukverlies, technische storingen. Eigen monteurs, eigen onderdelen op voorraad.",
    items: [
      "Lekdetectie",
      "Pomp & filter",
      "Linerrenovatie",
      "Verwarmingstechniek",
    ],
  },
]

const PROCESS = [
  {
    step: "01",
    title: "Kennismaking",
    blurb:
      "We komen vrijblijvend langs, luisteren naar uw plannen en bekijken de tuin. Geen verkooppraatje — wel concrete adviezen.",
  },
  {
    step: "02",
    title: "Ontwerp",
    blurb:
      "Onze ontwerper maakt een 3D-impressie en een detailtekening. U ziet exact hoe het bad in de tuin zal liggen.",
  },
  {
    step: "03",
    title: "Bouw",
    blurb:
      "Eigen team van bouwers, monteurs en tegelzetters. Eén projectleider die u door het hele proces begeleidt.",
  },
  {
    step: "04",
    title: "Oplevering",
    blurb:
      "Wij vullen, balanceren en testen. U krijgt een persoonlijke instructie en een bedieningshandleiding op maat.",
  },
  {
    step: "05",
    title: "Service voor het leven",
    blurb:
      "Onderhoud, controles en reparatie — uitgevoerd door dezelfde mensen die uw bad hebben gebouwd.",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "Stilwater bouwde ons overloopbad in 2017 en doet sindsdien het onderhoud. Eén telefoontje en het is geregeld — zelfs op zondagochtend.",
    name: "Familie Van Dijk",
    role: "Privébad · Hilversum",
  },
  {
    quote:
      "Voor ons hotel was continuïteit cruciaal. Hun service-team heeft het wellness-bad in vier jaar nooit langer dan een dagdeel buiten bedrijf gehad.",
    name: "Marleen de Wit",
    role: "Directeur Hotel De Linde",
  },
  {
    quote:
      "Geen onderaannemers, geen telefoonpaaltjes. De projectleider die ons bad bouwde, neemt nu nog steeds zelf op.",
    name: "Pieter Janssen",
    role: "Privébad · Bilthoven",
  },
]

const FAQ = [
  {
    q: "Hoe lang duurt het bouwen van een nieuw zwembad?",
    a: "Een gemiddeld privébad nemen we ongeveer 8 tot 12 weken in beslag — van eerste schop in de grond tot oplevering. Bij grotere of complexe projecten plannen we 14 tot 20 weken in. Een vooronderzoek (bodem, grondwater) loopt parallel.",
  },
  {
    q: "Doen jullie ook onderhoud aan baden die niet door jullie gebouwd zijn?",
    a: "Zeker. Een groot deel van onze service-portefeuille bestaat uit baden van andere bouwers. We beginnen met een gratis intake-bezoek waarin we techniek, water en eventuele aandachtspunten in kaart brengen.",
  },
  {
    q: "Wat kost een service-overeenkomst?",
    a: "Een standaard wekelijkse service voor een privébad ligt rond €185 per maand, inclusief waterzorg en kleine reparaties. Voor zakelijke baden maken we een offerte op maat — afhankelijk van openingstijden en gebruikersaantallen.",
  },
  {
    q: "Hoe snel zijn jullie bij een storing?",
    a: "Voor klanten met een service-overeenkomst geldt een reactietijd van maximaal 24 uur. Bij urgente lekkages of veiligheidsstoringen gemiddeld binnen 4 uur. We hebben eigen monteurs in dienst — geen onderaannemers.",
  },
  {
    q: "Werken jullie ook in het buitenland?",
    a: "Voor bestaande klanten verzorgen we incidenteel projecten in België en Duitsland. Onze hoofdfocus blijft Nederland — daar leveren we de service waar we voor staan.",
  },
]

export default function Welkom() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const blobRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const stageRefs = useRef<(HTMLHeadingElement | null)[]>([])
  const scrollHintRef = useRef<HTMLDivElement>(null)
  const topbarRef = useRef<HTMLElement>(null)
  const videoStageRef = useRef<HTMLDivElement>(null)
  const heroStickyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const v = videoRef.current
    const heroEl = heroRef.current

    let duration = 0
    let videoTarget = 0
    let videoCurrent = 0
    let rafId = 0
    let lastScrollAt = 0
    let running = false
    let lastSeekAt = 0
    const LERP = 0.3

    const tick = () => {
      const sH = window.innerHeight
      const heroH = heroEl?.offsetHeight ?? 0
      const pinEnd = Math.max(1, heroH - sH)

      if (heroEl && stageRefs.current.length) {
        const p = Math.min(1, Math.max(0, window.scrollY / pinEnd))

        // ---- Cream-veil narrative: dark mess → bright clean ----
        // Eased curve so the cream takes hold mid-scroll, not linearly.
        const reveal = p * p * (3 - 2 * p) // smoothstep
        if (videoStageRef.current) {
          videoStageRef.current.style.setProperty("--reveal", reveal.toFixed(3))
        }
        // Hero text color interpolates cream → ink alongside the veil.
        if (heroStickyRef.current) {
          const cream = [244, 232, 210]
          const ink = [26, 38, 48]
          const r = Math.round(cream[0] + (ink[0] - cream[0]) * reveal)
          const g = Math.round(cream[1] + (ink[1] - cream[1]) * reveal)
          const b = Math.round(cream[2] + (ink[2] - cream[2]) * reveal)
          heroStickyRef.current.style.color = `rgb(${r}, ${g}, ${b})`
          heroStickyRef.current.style.setProperty(
            "--hero-quiet",
            `rgba(${r}, ${g}, ${b}, ${(0.55 - reveal * 0.05).toFixed(2)})`,
          )
          heroStickyRef.current.style.setProperty(
            "--hero-rule",
            `rgba(${r}, ${g}, ${b}, ${(0.4 - reveal * 0.1).toFixed(2)})`,
          )
        }

        const stageF = p * (STAGES.length - 1)
        for (let i = 0; i < stageRefs.current.length; i++) {
          const el = stageRefs.current[i]
          if (!el) continue
          const d = stageF - i
          const o = Math.max(0, 1 - Math.abs(d) * 1.2)
          const ty = -d * 60
          const blur = Math.min(8, Math.abs(d) * 6)
          el.style.opacity = o.toFixed(3)
          el.style.transform = `translate3d(0, ${ty}px, 0)`
          el.style.filter = blur > 0.1 ? `blur(${blur}px)` : "none"
        }
        if (scrollHintRef.current) {
          scrollHintRef.current.style.opacity = String(
            Math.max(0, 1 - p * 1.6),
          )
        }
      }

      // ---- Top bar: dark over the still-mess pool, paper as cream takes hold.
      // We tie the toggle to the same `reveal` curve that drives the cream
      // veil — so the menu turns light right as the pool starts to clear.
      if (topbarRef.current) {
        const p = Math.min(1, Math.max(0, window.scrollY / pinEnd))
        const past = p > 0.55 || window.scrollY > pinEnd
        topbarRef.current.classList.toggle("is-paper", past)
      }

      if (v && duration) {
        const p = Math.min(1, Math.max(0, window.scrollY / pinEnd))
        videoTarget = p * (duration - 0.05)

        const diff = videoTarget - videoCurrent
        const now = performance.now()
        if (Math.abs(diff) > 0.002) {
          videoCurrent += diff * LERP
          // ~30fps seek throttle: setting currentTime more often stalls the
          // decoder on iOS Safari and causes visible scroll-stutter.
          if (now - lastSeekAt > 33) {
            v.currentTime = videoCurrent
            lastSeekAt = now
          }
        } else if (videoCurrent !== videoTarget) {
          videoCurrent = videoTarget
          v.currentTime = videoCurrent
        }
      }

      const now = performance.now()
      const stillEasing =
        v && duration ? Math.abs(videoTarget - videoCurrent) > 0.002 : false
      if (now - lastScrollAt < 250 || stillEasing) {
        rafId = requestAnimationFrame(tick)
      } else {
        running = false
      }
    }

    const onScroll = () => {
      lastScrollAt = performance.now()
      if (!running) {
        running = true
        rafId = requestAnimationFrame(tick)
      }
    }

    let cleanupVideo: (() => void) | undefined
    if (v) {
      // iOS Safari needs a play()→pause() priming round before currentTime
      // seeks render frames. Mobile Chrome benefits too. Without this the
      // hero can show a blank/black frame on phones.
      v.muted = true
      v.playsInline = true
      const prime = v.play()
      if (prime && typeof prime.then === "function") {
        prime.then(() => v.pause()).catch(() => {
          // Autoplay blocked; retry on first user interaction.
          const retry = () => {
            v.play().then(() => v.pause()).catch(() => {})
            window.removeEventListener("touchstart", retry)
            window.removeEventListener("pointerdown", retry)
            window.removeEventListener("scroll", retry)
          }
          window.addEventListener("touchstart", retry, { once: true, passive: true })
          window.addEventListener("pointerdown", retry, { once: true })
          window.addEventListener("scroll", retry, { once: true, passive: true })
        })
      } else {
        v.pause()
      }

      const onMeta = () => {
        duration = v.duration || 0
        onScroll()
      }
      if (v.readyState >= 1 && v.duration > 0) onMeta()
      else v.addEventListener("loadedmetadata", onMeta)
      cleanupVideo = () => v.removeEventListener("loadedmetadata", onMeta)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    onScroll()

    const blob = blobRef.current
    let raf = 0
    let onMove: ((e: PointerEvent) => void) | undefined
    if (blob) {
      let tx = window.innerWidth / 2
      let ty = window.innerHeight / 2
      let mx = tx
      let my = ty
      onMove = (e: PointerEvent) => {
        tx = e.clientX
        ty = e.clientY
      }
      const blobTick = () => {
        mx += (tx - mx) * 0.08
        my += (ty - my) * 0.08
        blob.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`
        raf = requestAnimationFrame(blobTick)
      }
      window.addEventListener("pointermove", onMove)
      raf = requestAnimationFrame(blobTick)
    }

    return () => {
      cleanupVideo?.()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (onMove) window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="welkom-root">
      {/* Persistent background video — overlay narrative: dark mess → cream clean */}
      <div ref={videoStageRef} className="video-stage" aria-hidden="true">
        <video
          ref={videoRef}
          src="/hero.mp4"
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
        />
        <div className="lux-tint" />
        <div className="lux-grain" />
        <div className="vignette" />
        <div className="lux-cream-veil" />
        <div className="lux-bloom" />
      </div>

      <div className="blob" ref={blobRef} aria-hidden="true" />

      {/* Top bar */}
      <header
        ref={topbarRef}
        className="topbar fixed top-0 left-0 right-0 z-30 px-6 py-5 md:px-12 md:py-6"
      >
        <nav className="flex items-center justify-between" aria-label="Hoofdnavigatie">
          <a href="#top" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--bg-paper)] focus:text-[var(--ink)] focus:rounded focus:text-sm">
            Naar inhoud
          </a>
          <a href="#top" className="flex items-center gap-3">
            <span className="inline-block size-[7px] rounded-full bg-[var(--gold)]" />
            <span className="serif text-[1.05rem] tracking-tight">Stilwater</span>
            <span className="hidden text-[10px] uppercase tracking-[0.38em] opacity-50 md:inline">
              · Zwembaden
            </span>
          </a>
          <ul className="hidden items-center gap-8 text-[12.5px] tracking-wide opacity-70 md:flex">
            <li><a className="transition-opacity hover:opacity-100" href="#aanpak">Aanpak</a></li>
            <li><a className="transition-opacity hover:opacity-100" href="#realisaties">Realisaties</a></li>
            <li><a className="transition-opacity hover:opacity-100" href="#diensten">Diensten</a></li>
            <li><a className="transition-opacity hover:opacity-100" href="#proces">Proces</a></li>
            <li><a className="transition-opacity hover:opacity-100" href="#over-ons">Over ons</a></li>
            <li><a className="transition-opacity hover:opacity-100" href="#contact">Contact</a></li>
          </ul>
          <a href="#contact" className="btn-luxe on-dark text-[10px]">Offerte aanvragen</a>
        </nav>
      </header>

      <main className="welkom-content" id="top">

        {/* ── Hero — pinned ── */}
        <section
          ref={heroRef}
          className="relative"
          style={{ height: `${(STAGES.length + 0.5) * 100}vh` }}
          aria-labelledby="hero-heading"
        >
          <div
            ref={heroStickyRef}
            className="sticky top-0 flex h-[100svh] items-center justify-center px-6 md:px-12"
          >
            {/* Provenance line — centered. Hairlines hidden on mobile so the
                whole line never exceeds the viewport. */}
            <div className="absolute left-1/2 top-[22vh] flex -translate-x-1/2 items-center gap-4 whitespace-nowrap px-4">
              <span className="hidden h-px w-8 sm:block" style={{ background: "var(--hero-rule, rgba(244,232,210,0.4))" }} aria-hidden="true" />
              <p className="text-[9px] uppercase tracking-[0.32em] sm:text-[10px] sm:tracking-[0.42em]" style={{ color: "var(--hero-quiet, rgba(244,232,210,0.55))" }}>
                Zwembadbouw &amp; service · sinds 1998
              </p>
              <span className="hidden h-px w-8 sm:block" style={{ background: "var(--hero-rule, rgba(244,232,210,0.4))" }} aria-hidden="true" />
            </div>

            {/* Single page heading for screen readers; visual stages are decorative spans */}
            <h1 id="hero-heading" className="sr-only">
              Stilwater Zwembaden — zwembadbouw, onderhoud en service sinds 1998
            </h1>

            {/* Stage text stack — visual narrative, marked as decorative
                so SR users only get the single h1 above. */}
            <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
              {STAGES.map((text, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    stageRefs.current[i] = el as unknown as HTMLHeadingElement | null
                  }}
                  className="serif absolute block max-w-5xl px-6 text-center leading-[0.93] tracking-tight"
                  style={{
                    fontSize: "clamp(1.45rem, 7.4vw, 9rem)",
                    opacity: i === 0 ? 1 : 0,
                    willChange: "opacity, transform, filter",
                  }}
                >
                  {text}
                </span>
              ))}
            </div>

            {/* Scroll indicator — decorative, hidden from AT */}
            <div
              ref={scrollHintRef}
              className="absolute bottom-[6vh] left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
              aria-hidden="true"
            >
              <span className="text-[9px] uppercase tracking-[0.5em]" style={{ color: "var(--hero-quiet, rgba(244,232,210,0.55))" }}>
                Scroll
              </span>
              <span
                className="block h-10 w-px"
                style={{
                  background: "var(--hero-rule, rgba(244,232,210,0.45))",
                  animation: "scroll-hint 1.8s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            §1  THRESHOLD — full-bleed opening image
        ══════════════════════════════════════════════════════ */}
        <section
          className="cinema relative"
          style={{ minHeight: "100svh" }}
          aria-label="Drempelstuk"
        >
          <img
            src="/img/pool-villa.webp"
            alt="Overloopbad ingebouwd in een glooiende tuin in 't Gooi"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Dark scrim for text legibility */}
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{ background: "linear-gradient(to top, rgba(7,18,27,0.55) 0%, transparent 60%)" }}
          />

          {/* Bottom-left: italic word */}
          <p
            className="absolute bottom-[8vh] left-[5vw] serif-italic leading-none"
            style={{ fontSize: "clamp(5rem, 12vw, 11rem)", color: "var(--bg-paper)", opacity: 0.92 }}
          >
            Stilte.
          </p>

          {/* Bottom-right: caption */}
          <p
            className="caption absolute bottom-[8vh] right-[5vw] text-right"
            style={{ color: "rgba(244,232,210,0.65)", fontSize: "0.75rem", letterSpacing: "0.08em" }}
          >
            Villa De Kreek — &#x2019;t Gooi, MMXXV.
          </p>
        </section>

        {/* ══════════════════════════════════════════════════════
            §2  MANIFEST — editorial sentence, cream background
        ══════════════════════════════════════════════════════ */}
        <section
          className="editorial-section relative flex flex-col items-center justify-center text-center"
          style={{ background: "var(--bg-paper)", paddingBlock: "clamp(5rem, 10vh, 9rem)", paddingInline: "clamp(2rem, 8vw, 10rem)" }}
          aria-label="Manifest"
        >
          {/* Centered ornament */}
          <div className="flex items-center gap-5" aria-hidden="true">
            <span className="block h-px w-16" style={{ background: "var(--line-strong)" }} />
            <span className="serif-italic" style={{ color: "var(--gold)", fontSize: "0.95rem" }}>✦</span>
            <span className="block h-px w-16" style={{ background: "var(--line-strong)" }} />
          </div>

          <blockquote
            className="serif mt-10 max-w-[24ch] leading-[1.05] tracking-[-0.025em]"
            style={{ fontSize: "clamp(1.85rem, 3.6vw, 3.1rem)", color: "var(--ink)" }}
          >
            Een zwembad is geen{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>aankoop</em>.
            {" "}Het is een{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>relatie</em>.
          </blockquote>

          <p
            className="serif-italic mt-12"
            style={{ fontSize: "1.05rem", color: "var(--ink)", opacity: 0.92 }}
          >
            Henk de Wilde
          </p>
          <p
            className="mt-1.5 text-[10.5px] uppercase tracking-[0.36em]"
            style={{ color: "var(--ink-quiet, var(--ink-soft))", opacity: 0.55 }}
          >
            Oprichter — sinds 1998
          </p>
        </section>

        {/* ══════════════════════════════════════════════════════
            §3  ŒUVRE INTRO — sparse, cream
        ══════════════════════════════════════════════════════ */}
        <section
          id="realisaties"
          className="editorial-section relative flex flex-col items-center justify-center text-center"
          style={{ background: "var(--bg-paper)", paddingBlock: "clamp(5rem, 10vh, 9rem)", paddingInline: "clamp(2rem, 8vw, 10rem)" }}
          aria-labelledby="oeuvre-heading"
        >
          {/* Centered chapter mark */}
          <div className="flex items-center gap-5" aria-hidden="true">
            <span className="block h-px w-12" style={{ background: "var(--line-strong)" }} />
            <span
              className="serif-italic"
              style={{ color: "var(--gold)", fontSize: "0.78rem", letterSpacing: "0.32em", textTransform: "uppercase" }}
            >
              I &nbsp;·&nbsp; Œuvre
            </span>
            <span className="block h-px w-12" style={{ background: "var(--line-strong)" }} />
          </div>

          <h2
            id="oeuvre-heading"
            className="serif mt-9 leading-[0.98] tracking-[-0.03em]"
            style={{ fontSize: "clamp(2.6rem, 5.8vw, 5.4rem)", color: "var(--ink)", maxWidth: "16ch" }}
          >
            Vier wateren,{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>één hand.</em>
          </h2>

          <p
            className="serif-italic mt-9"
            style={{ fontSize: "1.05rem", lineHeight: 1.75, color: "var(--ink-soft)", maxWidth: "44ch" }}
          >
            Elk project begint met een luistergesprek. Elk bad wordt gebouwd —
            en daarna beheerd — door hetzelfde team.
          </p>

          <p
            className="mt-10 text-[10px] uppercase tracking-[0.42em]"
            style={{ color: "var(--ink-quiet, var(--ink-soft))", opacity: 0.5 }}
          >
            MMXXIV — MMXXVI &nbsp;·&nbsp; Vier realisaties
          </p>
        </section>

        {/* ══════════════════════════════════════════════════════
            §4–7  FOUR WATERS — one full-viewport cinema per project
        ══════════════════════════════════════════════════════ */}
        {WORK.map((item, i) => {
          const isLeft = i % 2 === 0
          return (
            <section
              key={item.n}
              className="cinema relative"
              style={{ minHeight: "100svh" }}
              aria-label={`Realisatie: ${item.title}`}
            >
              <img
                src={item.img}
                alt={`${item.title} in ${item.place}`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />

              {/* Corner scrim — only bottom corners, subtle */}
              <div
                className="absolute inset-0"
                aria-hidden="true"
                style={{
                  background: isLeft
                    ? "radial-gradient(ellipse 60% 40% at 0% 100%, rgba(7,18,27,0.60) 0%, transparent 70%)"
                    : "radial-gradient(ellipse 60% 40% at 100% 0%, rgba(7,18,27,0.55) 0%, transparent 70%)",
                }}
              />

              {/* Project meta — alternates lower-left / upper-right on desktop;
                  always lower-left on mobile so it doesn't fight the caption space. */}
              <div
                className={`absolute bottom-[8vh] left-[5vw] flex flex-col gap-1 ${
                  isLeft
                    ? ""
                    : "md:bottom-auto md:left-auto md:top-[8vh] md:right-[5vw] md:items-end"
                }`}
              >
                <span
                  className="editorial-num serif-italic"
                  style={{ color: "var(--gold)", fontSize: "0.78rem", letterSpacing: "0.14em" }}
                  aria-hidden="true"
                >
                  {item.n}
                </span>
                <h3
                  className="serif leading-none tracking-tight"
                  style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)", color: "var(--bg-paper)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="serif-italic"
                  style={{ fontSize: "0.8rem", color: "rgba(244,232,210,0.62)", letterSpacing: "0.05em" }}
                >
                  {item.place} · {item.tag}
                </p>
              </div>

              {/* Blurb caption — opposite corner. Hidden on mobile (cramped). */}
              <p
                className="caption absolute hidden serif-italic leading-[1.5] md:block"
                style={{
                  ...(isLeft
                    ? { bottom: "8vh", right: "5vw", textAlign: "right" }
                    : { top: "8vh", left: "5vw", textAlign: "left" }),
                  maxWidth: "26ch",
                  fontSize: "0.875rem",
                  color: "rgba(244,232,210,0.70)",
                }}
              >
                {item.blurb}
              </p>
            </section>
          )
        })}

        {/* ══════════════════════════════════════════════════════
            §8  PULL QUOTE I
        ══════════════════════════════════════════════════════ */}
        <section
          className="pullquote relative flex flex-col items-center justify-center text-center"
          style={{ background: "var(--bg-paper)", paddingBlock: "clamp(3rem, 7vh, 6rem)", paddingInline: "clamp(2rem, 8vw, 10rem)" }}
          aria-label="Getuigenis"
        >
          <span
            className="mark serif-italic leading-none select-none"
            style={{ fontSize: "8rem", color: "var(--gold)", opacity: 0.55, lineHeight: 0.6 }}
            aria-hidden="true"
          >
            &#x201C;
          </span>
          <blockquote
            className="serif mt-6 leading-[1.2] tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.8rem)", color: "var(--ink)", maxWidth: "26ch" }}
          >
            {TESTIMONIALS[0].quote}
          </blockquote>
          <figcaption className="mt-10">
            <p
              className="text-[11px] uppercase tracking-[0.38em]"
              style={{ color: "var(--ink-soft)" }}
            >
              {TESTIMONIALS[0].name}
            </p>
            <p
              className="mt-1 serif-italic text-[0.85rem]"
              style={{ color: "var(--ink-quiet, var(--ink-soft))", opacity: 0.6 }}
            >
              {TESTIMONIALS[0].role}
            </p>
          </figcaption>
        </section>

        {/* ══════════════════════════════════════════════════════
            §9  MÉTIER — sticky workshop image, 3 sub-screens
        ══════════════════════════════════════════════════════ */}
        <section
          id="diensten"
          className="relative"
          aria-labelledby="metier-heading"
        >
          {/* Sticky background */}
          <div
            className="sticky top-0 h-[100svh] w-full"
            aria-hidden="true"
            style={{ zIndex: 0 }}
          >
            <img
              src="/img/workshop.webp"
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{ background: "rgba(7,18,27,0.55)" }}
            />
          </div>

          {/* Three overlay screens — stacked, each pulls up over the sticky bg */}
          <div style={{ marginTop: "-100svh", position: "relative", zIndex: 1 }}>
            <h2 id="metier-heading" className="sr-only">Métier — Onze diensten</h2>
            {SERVICES.map((s, i) => (
              <div
                key={s.name}
                className="flex flex-col justify-end"
                style={{
                  minHeight: "100svh",
                  paddingBlock: "clamp(5rem, 10vh, 10rem)",
                  paddingInline: "clamp(2rem, 8vw, 10rem)",
                }}
              >
                <p
                  className="serif-italic"
                  style={{ color: "var(--gold)", fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
                >
                  {["I", "II", "III"][i]} — {s.name}
                </p>
                <h3
                  className="serif mt-4 leading-none tracking-tight"
                  style={{ fontSize: "clamp(3rem, 7vw, 6rem)", color: "var(--bg-paper)" }}
                >
                  {s.name}.
                </h3>
                <p
                  className="serif-italic mt-6 leading-[1.7]"
                  style={{ fontSize: "1.05rem", color: "rgba(244,232,210,0.72)", maxWidth: "38ch" }}
                >
                  {s.blurb}
                </p>
                <ul
                  className="editorial-list mt-8 flex flex-wrap gap-x-6 gap-y-2"
                  style={{ color: "rgba(244,232,210,0.45)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase" }}
                >
                  {s.items.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            §10  METHODE — single editorial spread, 5 verbs as a colophon
        ══════════════════════════════════════════════════════ */}
        <section
          id="proces"
          className="editorial-section relative flex flex-col items-center text-center"
          style={{ background: "var(--bg-paper)", paddingBlock: "clamp(5rem, 11vh, 10rem)", paddingInline: "clamp(2rem, 8vw, 10rem)" }}
          aria-labelledby="methode-heading"
        >
          {/* Centered chapter mark */}
          <div className="flex items-center gap-5" aria-hidden="true">
            <span className="block h-px w-12" style={{ background: "var(--line-strong)" }} />
            <span
              className="serif-italic"
              style={{ color: "var(--gold)", fontSize: "0.78rem", letterSpacing: "0.32em", textTransform: "uppercase" }}
            >
              II &nbsp;·&nbsp; Methode
            </span>
            <span className="block h-px w-12" style={{ background: "var(--line-strong)" }} />
          </div>

          <h2
            id="methode-heading"
            className="serif mt-9 leading-[0.98] tracking-[-0.03em]"
            style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.8rem)", color: "var(--ink)", maxWidth: "20ch" }}
          >
            Vijf bewegingen,{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>één belofte.</em>
          </h2>

          {/* The five verbs as a colophon — single column, hairline-separated, magazine-tight */}
          <ol
            className="mt-16 w-full"
            style={{ maxWidth: "44rem", borderTop: "1px solid var(--line-strong)" }}
          >
            {(() => {
              const verbs = ["Luisteren", "Tekenen", "Bouwen", "Vullen", "Onderhouden"]
              const numerals = ["I", "II", "III", "IV", "V"]
              return PROCESS.map((p, i) => (
                <li
                  key={p.step}
                  className="grid items-baseline gap-x-8 gap-y-3 py-7 text-left md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,18rem)] md:py-9"
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <span
                    className="serif-italic"
                    style={{ color: "var(--gold)", fontSize: "1.1rem", letterSpacing: "0.04em" }}
                    aria-hidden="true"
                  >
                    {numerals[i]}
                  </span>
                  <span
                    className="serif tracking-[-0.025em]"
                    style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "var(--ink)", lineHeight: 1.05 }}
                  >
                    {verbs[i]}.
                  </span>
                  <span
                    className="serif-italic"
                    style={{ fontSize: "0.95rem", color: "var(--ink-soft)", lineHeight: 1.65 }}
                  >
                    {p.blurb}
                  </span>
                </li>
              ))
            })()}
          </ol>
        </section>

        {/* ══════════════════════════════════════════════════════
            §11  PULL QUOTE II
        ══════════════════════════════════════════════════════ */}
        <section
          className="pullquote relative flex flex-col items-end justify-center"
          style={{ background: "var(--bg-paper)", paddingBlock: "clamp(3rem, 7vh, 6rem)", paddingInline: "clamp(2rem, 8vw, 10rem)" }}
          aria-label="Getuigenis"
        >
          <span
            className="mark serif-italic leading-none select-none"
            style={{ fontSize: "8rem", color: "var(--gold)", opacity: 0.55, lineHeight: 0.6 }}
            aria-hidden="true"
          >
            &#x201C;
          </span>
          <blockquote
            className="serif mt-6 text-right leading-[1.2] tracking-tight"
            style={{ fontSize: "clamp(1.4rem, 3vw, 2.5rem)", color: "var(--ink)", maxWidth: "26ch" }}
          >
            {TESTIMONIALS[1].quote}
          </blockquote>
          <figcaption className="mt-10 text-right">
            <p
              className="text-[11px] uppercase tracking-[0.38em]"
              style={{ color: "var(--ink-soft)" }}
            >
              {TESTIMONIALS[1].name}
            </p>
            <p
              className="mt-1 serif-italic text-[0.85rem]"
              style={{ color: "var(--ink-quiet, var(--ink-soft))", opacity: 0.6 }}
            >
              {TESTIMONIALS[1].role}
            </p>
          </figcaption>
        </section>

        {/* ══════════════════════════════════════════════════════
            §12  OVER ONS — 2 screens
        ══════════════════════════════════════════════════════ */}

        {/* Screen A: full-bleed image */}
        <section
          id="over-ons"
          className="cinema relative"
          style={{ minHeight: "100svh" }}
          aria-label="Atelier"
        >
          <img
            src="/img/workshop.webp"
            alt="De werkplaats van Stilwater Zwembaden"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            aria-hidden="true"
            style={{ background: "linear-gradient(to top, rgba(7,18,27,0.45) 0%, transparent 60%)" }}
          />
          <p
            className="chapter-mark absolute bottom-[8vh] left-[5vw] serif-italic"
            style={{ color: "var(--gold)", fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            II — Atelier
          </p>
        </section>

        {/* Screen B: cream bio */}
        <section
          className="editorial-section relative flex flex-col items-center text-center"
          style={{ background: "var(--bg-paper)", paddingBlock: "clamp(5rem, 10vh, 9rem)", paddingInline: "clamp(2rem, 8vw, 10rem)" }}
          aria-label="Over ons"
        >
          {/* Centered chapter mark — matches the rest */}
          <div className="flex items-center gap-5" aria-hidden="true">
            <span className="block h-px w-12" style={{ background: "var(--line-strong)" }} />
            <span
              className="serif-italic"
              style={{ color: "var(--gold)", fontSize: "0.78rem", letterSpacing: "0.32em", textTransform: "uppercase" }}
            >
              III &nbsp;·&nbsp; Atelier
            </span>
            <span className="block h-px w-12" style={{ background: "var(--line-strong)" }} />
          </div>

          <h2
            className="serif mt-9 leading-[0.98] tracking-[-0.03em]"
            style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.8rem)", color: "var(--ink)", maxWidth: "20ch" }}
          >
            Een familiebedrijf,{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>sinds '98.</em>
          </h2>

          {/* Bio — single column, generous serif body, dropcap on first paragraph only */}
          <div className="mt-14 max-w-[58ch] text-left" style={{ color: "var(--ink-soft)" }}>
            <p
              className="serif-italic dropcap"
              style={{ fontSize: "1.06rem", lineHeight: 1.85 }}
            >
              Stilwater werd in 1998 opgericht door Henk de Wilde — voormalig
              waterbouwkundige met een hekel aan zwembaden die na een paar jaar
              al werden doorgegeven aan een derde service-partij.
            </p>
            <p
              className="mt-6 serif-italic"
              style={{ fontSize: "1.06rem", lineHeight: 1.85 }}
            >
              Vandaag werken we met een vast team van veertien mensen vanuit
              onze werkplaats in Utrecht. Ontwerpers, bouwers, monteurs en
              waterspecialisten — allemaal in dienst, allemaal aanspreekbaar.
            </p>
            <p
              className="mt-6 serif-italic"
              style={{ fontSize: "1.06rem", lineHeight: 1.85 }}
            >
              Onze regel is simpel: we leveren geen bad op zonder een
              service-overeenkomst. Niet omdat het móét, maar omdat we geloven
              dat een zwembad pas iets waard is als het ook na tien jaar nog
              perfect water heeft.
            </p>
          </div>

          {/* Facts — single hairline row, four columns, no internal borders */}
          <dl
            className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-y-10 md:grid-cols-4"
            style={{ borderTop: "1px solid var(--line-strong)", paddingTop: "2.5rem" }}
          >
            {[
              { label: "Vestiging", value: "Utrecht" },
              { label: "Team", value: "14 vakmensen" },
              { label: "Aangesloten bij", value: "NVZ · ISSO" },
              { label: "Garantie", value: "tot 25 jaar" },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <dt
                  className="serif-italic"
                  style={{ color: "var(--gold)", fontSize: "0.7rem", letterSpacing: "0.32em", textTransform: "uppercase" }}
                >
                  {f.label}
                </dt>
                <dd
                  className="serif mt-3 tracking-[-0.02em]"
                  style={{ color: "var(--ink)", fontSize: "1.25rem" }}
                >
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ══════════════════════════════════════════════════════
            §13  PULL QUOTE III
        ══════════════════════════════════════════════════════ */}
        <section
          className="pullquote relative flex flex-col items-center justify-center text-center"
          style={{ background: "var(--bg-paper)", paddingBlock: "clamp(3rem, 7vh, 6rem)", paddingInline: "clamp(2rem, 8vw, 10rem)" }}
          aria-label="Getuigenis"
        >
          <span
            className="mark serif-italic leading-none select-none"
            style={{ fontSize: "8rem", color: "var(--gold)", opacity: 0.55, lineHeight: 0.6 }}
            aria-hidden="true"
          >
            &#x201C;
          </span>
          <blockquote
            className="serif mt-6 leading-[1.2] tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.8rem)", color: "var(--ink)", maxWidth: "26ch" }}
          >
            {TESTIMONIALS[2].quote}
          </blockquote>
          <figcaption className="mt-10">
            <p
              className="text-[11px] uppercase tracking-[0.38em]"
              style={{ color: "var(--ink-soft)" }}
            >
              {TESTIMONIALS[2].name}
            </p>
            <p
              className="mt-1 serif-italic text-[0.85rem]"
              style={{ color: "var(--ink-quiet, var(--ink-soft))", opacity: 0.6 }}
            >
              {TESTIMONIALS[2].role}
            </p>
          </figcaption>
        </section>

        {/* ══════════════════════════════════════════════════════
            §14  VRAGEN — single-column editorial FAQ
        ══════════════════════════════════════════════════════ */}
        <section
          className="editorial-section relative flex flex-col items-center text-center"
          style={{ background: "var(--bg-paper)", paddingBlock: "clamp(5rem, 10vh, 9rem)", paddingInline: "clamp(2rem, 8vw, 10rem)" }}
          aria-labelledby="vragen-heading"
        >
          <div className="flex items-center gap-5" aria-hidden="true">
            <span className="block h-px w-12" style={{ background: "var(--line-strong)" }} />
            <span
              className="serif-italic"
              style={{ color: "var(--gold)", fontSize: "0.78rem", letterSpacing: "0.32em", textTransform: "uppercase" }}
            >
              IV &nbsp;·&nbsp; Vragen
            </span>
            <span className="block h-px w-12" style={{ background: "var(--line-strong)" }} />
          </div>
          <h2
            id="vragen-heading"
            className="serif mt-9 leading-[0.98] tracking-[-0.03em]"
            style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.8rem)", color: "var(--ink)", maxWidth: "22ch" }}
          >
            Goede vragen,{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>eerlijk antwoord.</em>
          </h2>

          <div className="faq-magazine mt-16 w-full max-w-3xl text-left">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group border-t"
                style={{ borderColor: "var(--line)" }}
              >
                <summary
                  className="flex cursor-pointer list-none items-baseline justify-between gap-8 py-8"
                  style={{ listStyle: "none" }}
                >
                  <span
                    className="serif-italic leading-snug"
                    style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)", color: "var(--ink)" }}
                  >
                    {f.q}
                  </span>
                  <span
                    className="shrink-0 text-2xl leading-none transition-transform duration-300 group-open:rotate-45"
                    style={{ color: "var(--gold)" }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <div
                  className="pb-8 pl-4 leading-[1.8]"
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--ink-soft)",
                    borderLeft: "1px solid var(--line)",
                  }}
                >
                  {f.a}
                </div>
              </details>
            ))}
            <div style={{ borderTop: "1px solid var(--line)" }} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            §15  CONTACT / INVITATION — dark navy closing chapter
        ══════════════════════════════════════════════════════ */}
        <section
          id="contact"
          className="section-dark relative px-6 py-20 sm:py-28 md:px-12 md:py-44"
        >
          <div className="mx-auto max-w-7xl">

            <p className="reveal eyebrow" style={{ color: "var(--gold-bright)" }}>
              — Plan een bezoek
            </p>
            <h2
              className="reveal serif mt-5 leading-[0.92] tracking-tight"
              style={{
                fontSize: "clamp(3.5rem, 10vw, 10rem)",
                color: "var(--cream-on-dark)",
              }}
            >
              Een zwembad<br />
              <em
                className="serif-italic"
                style={{ color: "var(--gold-bright)", fontStyle: "italic" }}
              >
                voor het leven.
              </em>
            </h2>

            <p
              className="reveal delay-1 mt-12 max-w-lg text-[17px] leading-[1.8] md:text-[19px]"
              style={{ color: "var(--cream-on-dark-soft)" }}
            >
              Of u nu een nieuw bad laat aanleggen of het onderhoud van uw
              huidige bad wilt uitbesteden — we komen vrijblijvend langs en
              denken mee. Geen aanbiedingsdruk, wel een eerlijk plan.
            </p>

            <div className="reveal mt-14 flex flex-wrap gap-4">
              <a href="mailto:hallo@stilwater.nl" className="btn-luxe btn-solid">
                Stuur een mail →
              </a>
              <a
                href="tel:+31302345678"
                className="btn-luxe"
                style={{
                  borderColor: "rgba(244,232,210,0.28)",
                  color: "var(--cream-on-dark)",
                }}
              >
                Bel direct →
              </a>
            </div>

            <hr className="hairline-dark mt-20" />

            {/* Contact — hairline-divided columns, no cards */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3" style={{ borderTop: "1px solid rgba(244,232,210,0.18)" }}>
              <a
                href="mailto:hallo@stilwater.nl"
                className="reveal group block py-9 md:py-10 md:pr-10"
                style={{ borderBottom: "1px solid rgba(244,232,210,0.12)" }}
              >
                <p
                  className="serif-italic"
                  style={{ color: "var(--gold-bright)", fontSize: "0.78rem", letterSpacing: "0.32em", textTransform: "uppercase" }}
                >
                  E-mail
                </p>
                <p
                  className="serif mt-5 tracking-[-0.02em] transition-opacity group-hover:opacity-80"
                  style={{ color: "var(--cream-on-dark)", fontSize: "clamp(1.3rem, 2vw, 1.55rem)" }}
                >
                  hallo@stilwater.nl
                </p>
                <p className="mt-3 serif-italic text-[0.92rem]" style={{ color: "var(--cream-on-dark-quiet)" }}>
                  Antwoord binnen één werkdag.
                </p>
              </a>

              <a
                href="tel:+31302345678"
                className="reveal delay-1 group block py-9 md:py-10 md:px-10 contact-col-middle"
                style={{
                  borderBottom: "1px solid rgba(244,232,210,0.12)",
                }}
              >
                <p
                  className="serif-italic"
                  style={{ color: "var(--gold-bright)", fontSize: "0.78rem", letterSpacing: "0.32em", textTransform: "uppercase" }}
                >
                  Service-lijn — 24/7
                </p>
                <p
                  className="serif mt-5 tracking-[-0.02em] transition-opacity group-hover:opacity-80"
                  style={{ color: "var(--cream-on-dark)", fontSize: "clamp(1.3rem, 2vw, 1.55rem)" }}
                >
                  +31 (0)30 234 56 78
                </p>
                <p className="mt-3 serif-italic text-[0.92rem]" style={{ color: "var(--cream-on-dark-quiet)" }}>
                  Voor klanten met een onderhoudscontract.
                </p>
              </a>

              <div
                className="reveal delay-2 py-9 md:py-10 md:pl-10"
                style={{ borderBottom: "1px solid rgba(244,232,210,0.12)" }}
              >
                <p
                  className="serif-italic"
                  style={{ color: "var(--gold-bright)", fontSize: "0.78rem", letterSpacing: "0.32em", textTransform: "uppercase" }}
                >
                  Atelier — Utrecht
                </p>
                <p
                  className="serif mt-5 tracking-[-0.02em]"
                  style={{ color: "var(--cream-on-dark)", fontSize: "clamp(1.3rem, 2vw, 1.55rem)" }}
                >
                  Industrieweg 42<br />3542 AH
                </p>
                <p className="mt-3 serif-italic text-[0.92rem]" style={{ color: "var(--cream-on-dark-quiet)" }}>
                  Op afspraak — dinsdag t/m zaterdag.
                </p>
              </div>
            </div>

            {/* Footer */}
            <footer
              className="mt-28 grid grid-cols-1 gap-5 border-t pt-10 text-[11px] uppercase tracking-[0.32em] md:grid-cols-3"
              style={{ borderColor: "rgba(244,232,210,0.12)", color: "var(--cream-on-dark-quiet)" }}
            >
              <p>© Stilwater Zwembaden B.V. · KvK 12345678</p>
              <p className="md:text-center">Aangesloten bij NVZ · Garantie tot 25 jaar</p>
              <p className="md:text-right">Privacy · Algemene voorwaarden</p>
            </footer>
          </div>
        </section>

      </main>
    </div>
  )
}
