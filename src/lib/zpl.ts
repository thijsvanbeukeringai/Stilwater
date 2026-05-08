/**
 * Genereert ZPL-code voor een Zebra-geprint polsbandje.
 *
 * Label: 254 × 25 mm (2032 × 200 dots @ 8 dpmm).
 *
 * Veilige print-zone:
 *   - Eerste 20 mm (160 dots) links blijft leeg — deze "tail" verdwijnt onder
 *     de sluiting wanneer de band gesloten wordt.
 *   - Laatste 12 mm (96 dots) rechts blijft ook leeg — bevestiging.
 *   - Effectieve breedte: 1776 dots (~222 mm) tussen 160 en 1936.
 *
 * Indeling van links (na tail) naar rechts:
 *   - Project naam (klein, top)
 *   - Persoonsnaam (heel groot)
 *   - Rol + bedrijf (klein)
 *   - Zone-nummers in grote blokken
 *   - QR-code (rechts, gescand bij check-in)
 *
 * Test deze ZPL visueel via https://labelary.com/viewer.html
 */
const TAIL_MARGIN = 160 // 20 mm — verdwijnt onder de sluiting
const RIGHT_MARGIN = 96 // 12 mm — bevestigingsuiteinde

export function generateWristbandZpl(opts: {
  person: { first_name: string; last_name: string; role?: string }
  group?: { name: string }
  project: { name: string }
  zones: { name: string; number?: number; color?: string }[]
  qr_token: string
}): string {
  const { person, group, project, zones, qr_token } = opts
  const fullName = `${person.first_name} ${person.last_name}`.toUpperCase()
  const numberedZones = zones
    .filter((z) => z.number !== undefined)
    .sort((a, b) => (a.number! - b.number!))

  // ZPL: caret/tilde/backslash zijn control chars in field data.
  const sanitize = (s: string) =>
    s.replace(/[\^~\\]/g, "").replace(/\s+/g, " ").trim()

  // Alles links van de print-zone start op TAIL_MARGIN.
  const x0 = TAIL_MARGIN

  const lines: string[] = []
  lines.push("^XA")
  lines.push("^CI28") // UTF-8
  lines.push("^PW2032") // print width 254 mm
  lines.push("^LL200") // label length 25 mm
  lines.push("^LH0,0")
  lines.push("^PR4") // print speed
  lines.push("^MD15") // darkness

  // Stippellijntje als visuele aanduiding van de tail-marge (optioneel; kan
  // weggehaald worden voor productie). 4 dots breed, doorzichtig grijs.
  lines.push(`^FO${TAIL_MARGIN - 2},20^GB1,160,1^FS`)

  // Project naam — links bovenaan binnen de print-zone
  lines.push(`^FO${x0},15^A0N,22,22^FD${sanitize(project.name.toUpperCase())}^FS`)

  // Persoonsnaam — groot, breed bedrukt
  lines.push(
    `^FO${x0},45^A0N,80,80^FB1080,1,0,L,0^FD${sanitize(fullName)}^FS`
  )

  // Rol + bedrijf onder de naam
  const subtitle = [person.role, group?.name].filter(Boolean).join(" · ")
  if (subtitle) {
    lines.push(
      `^FO${x0},140^A0N,30,30^FB1080,1,0,L,0^FD${sanitize(subtitle)}^FS`
    )
  }

  // Zone-nummer blokken in het midden — elke zone in eigen omkaderd vak.
  // Start na de naam-zone op x=1280; QR komt rechts daarvan.
  if (numberedZones.length > 0) {
    const zoneStartX = 1280
    lines.push(`^FO${zoneStartX},15^A0N,18,18^FDZONES^FS`)
    let x = zoneStartX
    numberedZones.slice(0, 5).forEach((z) => {
      lines.push(`^FO${x},40^GB80,120,3^FS`)
      lines.push(
        `^FO${x},60^A0N,80,80^FB80,1,0,C,0^FD${sanitize(String(z.number))}^FS`
      )
      x += 90
    })
  }

  // QR code — net binnen de rechter marge
  const qrX = 2032 - RIGHT_MARGIN - 130
  lines.push(`^FO${qrX},30^BQN,2,7^FDLA,${sanitize(qr_token)}^FS`)

  // Identifier strip onderaan (visuele check, niet kritiek)
  lines.push(
    `^FO${x0},180^A0N,14,14^FD${sanitize(qr_token.slice(0, 16))}^FS`
  )

  lines.push("^XZ")
  return lines.join("\n")
}

/**
 * URL naar labelary.com voor een visuele preview van een ZPL string.
 * Defaults zijn afgestemd op een 254×25mm wristband (10×1 inch).
 */
export function labelaryPreviewUrl(
  zpl: string,
  opts: { width?: number; height?: number; dpmm?: 6 | 8 | 12 | 24 } = {}
): string {
  const { width = 10, height = 1, dpmm = 8 } = opts
  const encoded = encodeURIComponent(zpl)
  return `https://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${width}x${height}/0/${encoded}`
}
