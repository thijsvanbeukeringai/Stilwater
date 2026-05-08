# Accreditatie Systeem v2

Herbouw van het bestaande accreditatiesysteem. Het oude systeem werkt en de naming en het datamodel zijn solide. v2 focust op snelheid (Supabase + Vercel, server-first), strakkere UX, en een paar gerichte verbeteringen die in v1 ontbraken of stroef werkten.

Werknaam blijft Accreditatie. Onderdeel van de IMS suite, dus geen aparte branding nodig.

## Uitgangspunt

We hergebruiken het v1 datamodel waar mogelijk. De tabellen `accreditation_groups`, `accreditation_persons`, `accreditation_zones`, `accreditation_item_types`, `accreditation_person_items`, `accreditation_person_zones` en `accreditation_scan_log` blijven. De status flow `draft → approved → checked_in → checked_out` blijft. Twee tokens (invite voor groep, QR voor persoon) blijven. RLS op alle tabellen blijft.

Wat we verbeteren staat onderaan in een aparte sectie zodat het glashelder is wat v2 toevoegt.

## Tech stack

Next.js 15 met App Router, Supabase (Postgres, Auth, Realtime, Storage), Vercel met edge waar zinvol, Tailwind v4 en shadcn/ui. Resend voor mail. `qrcode` voor QR generatie. `@react-pdf/renderer` voor ticket PDFs. Geen state library, geen extra UI framework. Server components by default, client components alleen waar interactie nodig is.

## Performance budget

Dit zijn harde grenzen, geen suggesties. Initial JS bundle per route onder 100kb gzipped. TTFB onder 200ms op Vercel edge cache hits. Dashboard laadt onder 800ms inclusief data. Geen client-side data fetching voor first paint, server components serveren de initiële state. Lijsten met meer dan 100 items virtualiseren we via `@tanstack/react-virtual`. Realtime channels alleen op het check-in scherm en de approval queue, niet op overzichtspagina's.

Aggregaties (totaal aantal lunches per dag, parkeerkaarten per type, etc.) gaan via Postgres views of materialized views, niet via client-side counts. Dit was in v1 een pijnpunt op grote projecten.

## Build team & agents

Voor de bouw werken we met gespecialiseerde agents die elk hun eigen concern bewaken. Per concern is hieronder gedefinieerd wie eigenaar is, welke output ze leveren en welke files onder hun beheer vallen. Bij een PR review pingt de auteur de juiste agent voor de relevante bestanden.

| Agent | Verantwoordelijkheid | Files onder beheer |
|-------|----------------------|--------------------|
| **database** | Schema, migrations, indexes, RLS, materialized view, wristband-merge | `supabase/migrations/*`, `src/lib/db/queries/accreditation.ts` |
| **backend-api** | Server actions, validators, RBAC helper, rate limiting, realtime broadcast | `src/lib/actions/accreditation/*`, `src/lib/validators/accreditation.ts`, `src/middleware.ts` |
| **frontend-web** | Page/component split, data fetching, hooks, optimistic UI, PWA | `src/app/**/accreditation/**`, `src/hooks/useAccreditationChannel.ts`, `next.config.ts` |
| **ui-designer** | Design tokens, component specs, scanner UX, toegankelijkheid | `src/components/accreditation/*`, `globals.css`, Tailwind theme |
| **security** | Threat model, rate limits, RLS audit, audit logging, pre-launch checklist | crosscutting; reviewt elke PR die public endpoints of RLS raakt |
| **testing** | Test stack, fixtures, RLS integration tests, E2E flows, CI gating | `tests/*`, `supabase/seed.sql`, `playwright.config.ts` |
| **devops** | Envs, Vercel runtime per route, migrations pipeline, monitoring, cut-over | `.github/workflows/*`, Vercel project config, env vars |

De concrete kickoff-output van elk agent is per discipline ingebed in de README hieronder onder secties met de naam `<discipline> kickoff`.

## Kerngebruikers en rollen

We hergebruiken de v1 RBAC: `runner`, `planner`, `centralist`, `company_admin`, `super_admin`. Voor accreditatie geldt: super_admin en company_admin configureren projecten, groepen, zones en items. Centralist doet check-in en kan personen goedkeuren. Anonieme groepsleden vullen via invite token het portaal in. Anonieme tickethouders bekijken hun ticket via QR token URL.

## Datamodel

### Wat blijft uit v1

Alle accreditatie-tabellen blijven structureel hetzelfde. De velden zijn beproefd.

`accreditation_groups`: id, project_id, name, contact_name, contact_email, type (`crew | artist | supplier | press | vip | other`), invite_token, item_limits jsonb, max_persons, meal_config jsonb.

`accreditation_persons`: id, project_id, group_id, first_name, last_name, email, role, status, qr_token, checked_in_at, checked_out_at, valid_days text[], approved_days text[], meal_selections jsonb, notes.

`accreditation_zones`: id, project_id, name, color, capacity, sort_order.

`accreditation_item_types`: id, project_id, name, total_available, variants text[], sort_order, plus twee nieuwe velden in v2: `color text` en `category` (`wristband | equipment | parking | other`).

`accreditation_person_items`: id, person_id, item_type_id, quantity, selected_variant, day, issued, issued_at.

`accreditation_person_zones`: koppeltabel.

`accreditation_scan_log`: id, person_id, qr_token, success, action, message, scanned_at.

Project kolommen: `show_days text[]`, `build_days text[]`, `day_meals jsonb`, `day_items jsonb`.

### Wat we toevoegen in v2

Een `accreditation_approval_log` tabel om bij te houden wie wat goedkeurde wanneer. In v1 was er geen audit op approvals, alleen op scans. Velden: id, person_id, action (`approved | rejected | day_added | day_removed`), days text[], by_user_id, reason, created_at.

Een `accreditation_briefings` tabel die aan groepen gekoppeld kan worden, met optionele PDF in Supabase Storage. v1 had iets via een aparte migration `019_briefings_acc_group.sql`; we standaardiseren dit. Velden: id, project_id, group_id (nullable = project-breed), title, content (markdown), file_url, mandatory bool, created_at.

Een `accreditation_briefing_acks` tabel met person_id, briefing_id, acknowledged_at. Voor verplichte briefings.

Een materialized view `accreditation_daily_stats` met per project, per dag de totalen: aantal personen, lunches, diners, ontbijten, nachtsnacks, parkeerkaarten per type, items per type. Wordt elke 60 seconden ververst, of getriggerd bij approve. Dit vervangt client-side aggregatie in dashboards.

Een Postgres function `validate_check_in(qr_token, project_id)` die in één call alle validatiestappen doet (persoon bestaat, status, valid_days, approved_days, dubbele check-in). Geeft een gestructureerde response terug. v1 deed dit in TypeScript wat goed werkt, maar we kunnen één round-trip schelen door dit naar Postgres te tillen. Optioneel; meten of het echt sneller is.

Twee nieuwe project-kolommen: `default_meal_config jsonb` en `default_zone_setup jsonb`. Deze gebruiken we voor "kopieer setup van vorig project", een veelgevraagde feature die in v1 ontbrak.

Een `scope` veld op `accreditation_item_types` met waardes `per_person` of `per_day`. In v1 was dit impliciet via de `day` kolom op `accreditation_person_items`; we maken het expliciet zodat de UI weet of een item één keer of elke dag aangevraagd wordt.

Polsbandjes worden samengevoegd met `accreditation_item_types`. In v1 stonden ze in een aparte `wristbands` tabel onder de crew module. In v2 worden ze gewoon item types met `category = 'wristband'`, `scope = 'per_person'` en een `color` waarde voor visuele identificatie. Dit betekent dat polsbandjes nu volwaardig deel uitmaken van de accreditatie chain: ze tellen mee in groepslimieten, worden uitgegeven bij check-in (issued / issued_at), verschijnen op het ticket en in de Reports. De aparte wristbands tabel wordt gemigreerd naar item_types en daarna gedropt. Bestaande crew-koppelingen worden vertaald naar `accreditation_person_items` rijen.

## Database kickoff

Eigenaar: **database agent**.

### Migratie volgorde

Totaal 6 migrations. Volgorde is hard omdat latere migrations foreign keys vereisen op eerder aangemaakte tabellen.

1. `001_accreditation_core.sql` — alle v1-tabellen + nieuwe kolommen (`scope`, `color`, `category` op `item_types`; `default_meal_config`, `default_zone_setup` op projects). Fundament voor alles.
2. `002_accreditation_indexes.sql` — alle indexes (zie hieronder). Parallel uitvoerbaar na 001 maar zet ze in één file om drift te voorkomen.
3. `003_accreditation_approval_log.sql` — FK naar `accreditation_persons`, dus na 001.
4. `004_accreditation_briefings.sql` — FK naar `accreditation_groups`, dus na 001.
5. `005_accreditation_briefing_acks.sql` — FK naar `persons` én `briefings`, dus na 004.
6. `006_accreditation_daily_stats_mv.sql` — materialized view + pg_cron job, laatste want leest op alle andere tabellen.

Wristband-merge is een aparte migration na productie-validatie (zie hieronder).

### Indexes die v1 mist

```sql
CREATE INDEX CONCURRENTLY idx_acc_persons_project_status
  ON accreditation_persons (project_id, status)
  WHERE status = 'draft';

CREATE INDEX CONCURRENTLY idx_acc_approval_log_person
  ON accreditation_approval_log (person_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_acc_persons_group
  ON accreditation_persons (group_id, status);

CREATE INDEX CONCURRENTLY idx_acc_person_items_issued
  ON accreditation_person_items (person_id, issued)
  WHERE issued = false;

CREATE INDEX CONCURRENTLY idx_acc_briefing_acks_briefing
  ON accreditation_briefing_acks (briefing_id, person_id);

CREATE INDEX CONCURRENTLY idx_acc_person_items_type_day
  ON accreditation_person_items (item_type_id, day);
```

Allemaal `CREATE INDEX CONCURRENTLY` — geen table lock in productie.

### RLS pattern template

```sql
-- Lees: eigen project, via JWT rol-claim
CREATE POLICY "acc_persons_select" ON accreditation_persons
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
        AND role IN ('runner','planner','centralist','company_admin','super_admin')
    )
  );

-- Write: alleen planner/admin of hoger
CREATE POLICY "acc_persons_insert" ON accreditation_persons
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
        AND role IN ('planner','company_admin','super_admin')
    )
  );

-- Anoniem portaal: via invite token, geen auth.uid() beschikbaar
CREATE POLICY "acc_persons_portal_insert" ON accreditation_persons
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT id FROM accreditation_groups
      WHERE invite_token = current_setting('request.jwt.claims', true)::json->>'invite_token'
    )
  );
```

Kopieer dit patroon voor elke tabel. Pas `role IN (...)` aan op wat logisch is per tabel — check-in schrijft `scan_log` als `centralist`, approval_log alleen als `planner` of hoger.

### MV refresh strategie

Keuze: **pg_cron elke 60 seconden + directe refresh na bulk approve**.

```sql
SELECT cron.schedule(
  'refresh_acc_daily_stats',
  '* * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY accreditation_daily_stats$$
);
```

Na de `approve`-server action roep je `REFRESH MATERIALIZED VIEW CONCURRENTLY` direct aan via een RPC call. Geen trigger op `accreditation_persons`: triggers blokkeren de commit en zijn niet veilig bij bulk operations (200+ approvals tegelijk). De cron vangt eventuele misses op. `CONCURRENTLY` vereist een unieke index op de view — voeg `(project_id, dag)` toe als PK-equivalent bij aanmaken.

### Wristband merge migratie

Volgorde zonder data loss:

1. **Stop writes** naar de oude `wristbands` tabel via RLS policy `USING (false)` — geen DROP, nog geen code change.
2. **Backfill**: INSERT bestaande wristband types als rijen in `accreditation_item_types` met `category = 'wristband'`, `scope = 'per_person'`. Map de kleur naar het nieuwe `color` veld.
3. **Koppel crew**: INSERT rijen in `accreditation_person_items` voor elke bestaande crew-wristband koppeling. Zet `issued` en `issued_at` op basis van wat bekend is.
4. **Verifieer telling**: `SELECT COUNT(*) FROM wristbands` moet overeenkomen met aantal nieuwe `person_items` rijen met `category = 'wristband'`.
5. **Deploy nieuwe code** die `accreditation_item_types` leest i.p.v. `wristbands`.
6. **Drop** de `wristbands` tabel in een aparte migration, minstens één deploy later.

Stap 1–4 zijn reversibel. Stap 6 niet — doe dit pas na monitoring in productie.

### Risico's voor de teamlead

- `meal_selections jsonb` op `accreditation_persons` en `item_limits jsonb` op `accreditation_groups` zijn schemaloze velden die de daily_stats MV moet parsen. Spreek de JSON-structuur vast af vóór migration 006, anders breekt de MV bij afwijkende projecten uit v1.
- De `accreditation_pending` realtime channel filtert op `status = 'draft'` server-side. Supabase Realtime respecteert RLS — test expliciet of een `centralist` uit project B géén updates ziet van project A voordat we live gaan.
- De wristband-merge veronderstelt dat de crew module en accreditatie hetzelfde `project_id` delen. Als wristbands in v1 aan een aparte `crew_project_id` hangen, is stap 2 complexer dan beschreven.

## Modules

### Adminbeheer

URL `/project/[projectId]/accreditation`. Tabs: Personen, Groepen, Zones, Items, Project Dagen, Briefings, Approvals, Reports. Layout volgt het IMS dashboard patroon: H1 met subtitel, primaire CTA rechtsboven, stat cards bovenaan met dagsamenvattingen, gevolgd door de actieve tab content.

De Personen tab wordt het zwaartepunt. Lijst gegroepeerd per groep, inklapbaar, met voor elke persoon de status badges (rol, goedkeuringsstatus). Klikken opent het detailpaneel zoals in de bestaande UI: links persoonsgegevens en globale items, rechts dagen met maaltijden en per-dag items. Bulk acties via "Alles · Geen" toggles per dag, en "Opslaan & goedkeuren (X dagen)" als primaire actie.

De Groepen tab beheert groepen met item-limieten en max personen. Per groep zie je het invite token met copy-knop en een send-knop die via Resend de uitnodiging stuurt.

De Zones tab is een eenvoudige CRUD met kleurpicker, naam, capaciteit. Drag-to-reorder voor sort_order.

De Items tab beheert itemtypes met varianten en voorraad. UI moet duidelijk maken welke items per-dag aangevraagd worden (Portofoon) versus globaal (Artist Parking) via het nieuwe `scope` veld. De tab heeft een filter/groepering op `category` zodat polsbandjes, equipment en parkeerkaarten visueel gescheiden zijn. Polsbandjes hebben een verplichte color picker, andere categorieën optioneel.

De Project Dagen tab toont alle dagen tussen de projectperiode in een tijdlijn-layout. Per dag toggle: opbouw, show, afbouw. Per dag inklap: welke maaltijden beschikbaar zijn, welke items beschikbaar zijn. v1 had dit functioneel, v2 maakt het visueler met dag-cards in een grid.

De Briefings tab is nieuw als full-blown module. Briefings aanmaken, koppelen aan groep of project-breed, upload PDF, mandatory flag. Acknowledgment overview per briefing.

### Approval queue (nieuw in v2)

URL `/project/[projectId]/accreditation/approvals`. Eén scherm met alle pending personen over alle groepen heen, sorteerbaar en filterbaar, met keyboard shortcuts (J/K navigeren, A approven, R rejecten, Space om detailpaneel te openen). Voor productie-managers die 200+ aanvragen moeten afhandelen scheelt dit serieus tijd. v1 dwong je om per groep door te klikken.

### Reports en exports (nieuw in v2)

URL `/project/[projectId]/accreditation/reports`. Eén pagina waar alle exports en print-views centraal staan: catering lijst per dag, parkeerkaart lijst, accreditatie lijst per zone, briefing acknowledgment lijst, no-show rapport (approved maar niet ingecheckt). CSV en print-vriendelijke PDF outputs. v1 had losse export buttons door de UI verspreid.

### Zelfbedieningsportaal

URL `/accreditation/[token]`. Geen login, alleen invite token in de URL. Stappen: groepsgegevens bevestigen, personen toevoegen (één voor één of CSV bulk), per persoon de dagen kiezen en per dag de opties. Eindigen met review en indienen.

Het portaal toont real-time de itemlimieten van de groep. Als een groep maximaal 5 Artist Parkings heeft en 4 zijn al verdeeld, kan de Company Manager voor de 5e persoon nog 1 toekennen, daarna is de optie disabled met uitleg.

### Check-in scherm

URL `/project/[projectId]/accreditation/checkin`. Mobile-first, full screen mode op tablets. Bovenaan een grote zoekbalk en een "Scan QR" knop die de camera opent. Daaronder: "Vandaag ingecheckt: X / Y" en een tab-switcher Lijst / Scan / Geschiedenis.

In de Lijst tab zie je alle approved personen voor vandaag, gegroepeerd per groep, met grote tap-targets om handmatig in te checken. Filterbalk: alleen niet-ingecheckt, alle, alleen ingecheckt.

In de Scan tab is de camera fullscreen actief, en bij elke succesvolle scan zie je een overlay met persoonsgegevens, toegewezen zones, items om uit te geven, en een "Items uitgegeven" toggle per item. Bij mislukte scan: rood scherm met de reden uit `validate_check_in`.

Realtime channel `accreditation-persons-${projectId}` zodat alle scanstations sync blijven, identiek aan v1.

### Publieke ticketweergave

URL `/accreditation/ticket/[qrToken]`. Print-vriendelijk, met QR code, naam, rol, groep, goedgekeurde dagen, zones (gekleurde badges), items. Bij print: A6 of A7 voor lanyard, configureerbaar.

Toevoeging in v2: deze pagina werkt offline na eerste laad via een service worker, zodat een crewlid bij slecht netwerk op het terrein zijn ticket nog kan tonen. Apple Wallet / Google Wallet pass kan in een latere fase.

## Werkprocessen

Het registratieproces blijft identiek aan v1: admin maakt groep, stuurt invite, groep registreert leden via portaal als drafts, admin keurt goed (per persoon of bulk), tickets worden actief. Bij approve wordt de telling op de daily_stats view bijgewerkt en optioneel een mail gestuurd via Resend.

Het check-in proces blijft identiek: scan, valideer, mark checked_in, log scan. Items uitgeven gebeurt in dezelfde flow.

Wat we verbeteren is de bulk approval flow via de nieuwe approval queue, en de project setup via "kopieer van vorig project". Bij projectcreatie kun je kiezen "Start vanaf leeg" of "Kopieer van [project]". In dat laatste geval worden zones, item types, day meal config en day item config gekopieerd. Personen en groepen niet. Voor terugkerende festivals (Paaspop, Tomorrowland) is dit een grote tijdwinst.

## Pagina's en URL structuur

```
/accreditation/[token]                                  portaal (publiek)
/accreditation/ticket/[qrToken]                         ticket (publiek)
/project/[projectId]/accreditation                      admin overzicht
/project/[projectId]/accreditation/persons              personen tab
/project/[projectId]/accreditation/groups               groepen tab
/project/[projectId]/accreditation/zones                zones tab
/project/[projectId]/accreditation/items                items tab
/project/[projectId]/accreditation/days                 dagen tab
/project/[projectId]/accreditation/briefings            briefings tab
/project/[projectId]/accreditation/approvals            approval queue (nieuw)
/project/[projectId]/accreditation/checkin              check-in scherm
/project/[projectId]/accreditation/reports              exports en print (nieuw)
```

## Server actions

Alle accreditatie acties blijven server actions. We splitsen de code wel op in modules per concern. v1 had één bestand van ~665 regels; nog te overzien maar groeit. v2 splitsing:

```
src/lib/actions/accreditation/
  persons.ts
  groups.ts
  zones.ts
  items.ts
  checkin.ts
  portal.ts
  briefings.ts
  approvals.ts
  index.ts                  re-exports
```

Alle mutaties valideren we met Zod schemas in `src/lib/validators/accreditation.ts`. Returns zijn altijd `{ success: true, data } | { success: false, error }` voor consistente client handling.

### Server actions kickoff

Eigenaar: **backend-api agent**.

#### Action lijst per module

**persons.ts**
- `getPersons(projectId, filters)` — haalt personen op gefilterd op groep, status en dag, mapped naar DTO.
- `createPerson(projectId, data)` — maakt nieuwe persoon aan als draft, genereert qr_token.
- `updatePerson(personId, data)` — updatet persoonsgegevens, items en dagen.
- `deletePerson(personId)` — verwijdert persoon inclusief person_items en person_zones.
- `bulkUpdatePersonDays(personIds, days)` — zet valid_days op meerdere personen tegelijk.

**groups.ts**
- `createGroup(projectId, data)` — maakt groep aan en genereert invite_token.
- `updateGroup(groupId, data)` — updatet limieten, contact en max_persons.
- `deleteGroup(groupId)` — verwijdert groep mits leeg.
- `sendInvite(groupId)` — verstuurt uitnodiging via Resend naar contact_email.

**zones.ts**
- `upsertZone(projectId, data)` — maakt zone aan of updatet, zet sort_order.
- `deleteZone(zoneId)` — verwijdert zone en koppelrijen in person_zones.
- `reorderZones(projectId, ids)` — schrijft sort_order in volgorde van ids array.

**items.ts**
- `upsertItemType(projectId, data)` — maakt itemtype aan of updatet incl. scope en category.
- `deleteItemType(itemTypeId)` — verwijdert type mits niet uitgegeven.
- `assignItemToPerson(personId, itemTypeId, quantity, variant, day)` — maakt person_item rij aan.

**checkin.ts**
- `checkInByQr(qrToken, projectId)` — valideert en checkt persoon in, logt scan, broadcast.
- `checkInManual(personId, projectId)` — handmatige check-in door centralist zonder QR.
- `markItemsIssued(personItemIds)` — zet issued + issued_at op geselecteerde person_items.
- `checkOut(personId, projectId)` — zet status naar checked_out, logt scan.

**portal.ts**
- `getGroupByToken(token)` — laadt groepsdata incl. limieten voor publieke portaalpagina.
- `submitPortalPersons(token, persons)` — maakt personen aan als drafts vanuit portaalinzending.
- `updatePortalPerson(token, personId, data)` — updatet eigen persoon via portal (token-gated).

**briefings.ts**
- `createBriefing(projectId, data)` — maakt briefing aan optioneel met PDF upload naar Storage.
- `updateBriefing(briefingId, data)` — updatet inhoud, mandatory flag en groepskoppeling.
- `deleteBriefing(briefingId)` — verwijdert briefing en acknowledgments.
- `acknowledgeBriefing(briefingId, personId)` — registreert ack vanuit portaal of checkin.

**approvals.ts**
- `approvePerson(personId, days, reason?)` — keurt persoon goed voor opgegeven dagen, logt naar approval_log, broadcast.
- `rejectPerson(personId, reason)` — zet status rejected, logt reden.
- `bulkApprove(personIds, days)` — batch goedkeuring voor approval queue keyboard flow.

#### Standaard return contract

```typescript
// src/lib/actions/accreditation/_result.ts

export type ActionError =
  | { code: 'UNAUTHORIZED';       message: string }
  | { code: 'NOT_FOUND';          message: string }
  | { code: 'VALIDATION_FAILED';  message: string; fields?: Record<string, string[]> }
  | { code: 'RATE_LIMITED';       message: string; retryAfter?: number }
  | { code: 'INTERNAL';           message: string }

export type ActionResult<T> =
  | { success: true;  data: T }
  | { success: false; error: ActionError }

// Gebruik per action:
export async function approvePerson(
  personId: string,
  days: string[],
): Promise<ActionResult<{ personId: string }>> {
  const session = await requireRole(['centralist', 'company_admin', 'super_admin'])
  if (!session) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Niet geautoriseerd' } }

  const parsed = ApprovePersonSchema.safeParse({ personId, days })
  if (!parsed.success) return {
    success: false,
    error: { code: 'VALIDATION_FAILED', message: 'Ongeldige invoer', fields: parsed.error.flatten().fieldErrors },
  }

  try {
    // ... db mutatie
    return { success: true, data: { personId } }
  } catch {
    return { success: false, error: { code: 'INTERNAL', message: 'Onverwachte fout' } }
  }
}
```

#### Auth/RBAC helper

```typescript
// src/lib/actions/accreditation/_auth.ts
import { auth } from '@/lib/auth'
import type { Role } from '@/types/rbac'

export async function requireRole(allowed: Role[]) {
  const session = await auth()
  if (!session?.user) return null
  if (!allowed.includes(session.user.role)) return null
  return session.user
}
```

#### Rate limiting op publieke endpoints

Kies voor **Vercel middleware** (`src/middleware.ts`), niet in-action. Voordeel: de edge blokkeert voor de action ooit start, dus geen Supabase round-trip bij brute force. Matcher: `['/accreditation/:path*']`. Upstash Ratelimit met sliding window. Bij overschrijding `NextResponse` met status 429 en `Retry-After` header. Tokens zelf zijn hex met hoge entropie — rate limiting is de tweede verdedigingslinie, niet de eerste.

#### Realtime broadcast pattern

Broadcast **alleen** na `approvePerson` en `checkInByQr`/`checkInManual`. Nooit vanuit read-actions.

```typescript
// na approve — channel: accreditation-pending-${projectId}
supabase.channel(`accreditation-pending-${projectId}`)
  .send({ type: 'broadcast', event: 'person_approved',
    payload: { personId, status: 'approved', days, approvedBy: user.id } })

// na check-in — channel: accreditation-persons-${projectId}
supabase.channel(`accreditation-persons-${projectId}`)
  .send({ type: 'broadcast', event: 'checked_in',
    payload: { personId, checkedInAt: new Date().toISOString(), scannedBy: user.id } })
```

De client luistert op het bijbehorende channel en muteert alleen de lokale state voor die `personId` — geen volledige refetch.

#### Open issues voor de teamlead

- **Briefing-blokkade bij check-in**: moeten verplichte briefings die niet ge-acked zijn een harde blokkade geven in `checkInByQr`, of alleen een waarschuwing met override-knop voor de centralist? Dit raakt zowel de UX als de Postgres `validate_check_in` function.
- **Portal rate limiting granulariteit**: rate limiten we op IP of op token? Token-based is strikter (voorkomt enumeratie van personen binnen een groep) maar vereist dat het token uit de URL gelezen wordt in middleware vóór de Supabase token-lookup.
- **MV refresh trigger bij bulk approve**: bij 50 personen tegelijk goedkeuren wil je geen 50 refreshes. Kies expliciet: óf alleen op timer, óf debounce via een Postgres NOTIFY + Inngest job.

## QR en check-in

Token generatie en validatie blijven zoals v1: 16 bytes voor QR, 32 voor invite, allemaal hex via `gen_random_bytes`. De validatieflow draaien we optioneel om naar een Postgres function voor één round-trip, anders blijven we bij de TypeScript implementatie. We meten in productie of de Postgres function meetbaar sneller is op Vercel edge.

Scan log structuur blijft identiek. We voegen wel een index toe op `(project_id, scanned_at DESC)` voor de scan history view.

## Realtime synchronisatie

We gebruiken Supabase realtime alleen op het check-in scherm en de approval queue. Op alle andere pagina's is het overkill en kost het connecties. Channel `accreditation-persons-${projectId}` blijft het patroon.

Voor de approval queue is een nieuwe channel `accreditation-pending-${projectId}` die alleen rijen met `status='draft'` watcht. Filter wordt server-side toegepast, de client krijgt alleen relevante updates.

## Frontend kickoff

Eigenaar: **frontend-web agent**.

### Server vs Client component matrix

| Route | `page.tsx` | Client islands |
|---|---|---|
| `/project/[projectId]/accreditation` (redirect) | Server | — |
| `/persons` | Server | `PersonsGroupList` (virtualisatie >100), `PersonDetailPanel` (optimistic), `BulkApproveBar` |
| `/groups` | Server | `GroupFormDialog`, `InviteTokenCopy`, `SendInviteButton` |
| `/zones` | Server | `ZonesSortableList` (drag-to-reorder), `ColorPickerInput` |
| `/items` | Server | `ItemFormDialog`, `ItemScopeToggle`, `ColorPickerInput` |
| `/days` | Server | `DayGridCard` (toggle per dag, maaltijden) |
| `/briefings` | Server | `BriefingFormDialog`, `AckOverviewTable` |
| `/approvals` | **Client** | `ApprovalQueue` (realtime + keyboard nav), `ApprovalDetailPanel` |
| `/checkin` | **Client** | `QrScanView`, `CheckinPersonRow`, `ItemIssuedToggle` — alles achter `AccreditationCheckinClient.tsx` |
| `/reports` | Server | `ExportButton` per export-type |
| `/accreditation/[token]` | Server shell | `AccreditationPortalClient.tsx` (volledig client, multi-step wizard) |
| `/accreditation/ticket/[qrToken]` | Server | — (statische render, geen interactie nodig) |

### shadcn componenten installeren

```
npx shadcn@latest add badge button card checkbox command dialog
  dropdown-menu form input label popover select separator
  sheet skeleton switch table tabs textarea toast toggle
```

Custom componenten bouwen:
- `AccreditationStatusBadge` — `draft | approved | checked_in | checked_out` met kleur
- `ZoneColorBadge` — pill met `color` uit item_type/zone
- `DayPicker` — checkbox-grid voor `valid_days` / `approved_days`
- `ItemQuantityInput` — number input met per_day/per_person scope-indicator
- `KeyboardShortcutHint` — `⌨ J/K/A/R` tooltip voor approval queue
- `ScanOverlay` — fullscreen check-in resultaat (groen/rood + persoonsinfo)
- `ItemScopeToggle` — `per_person` vs `per_day` segmented control
- `DayGridCard` — dag-card voor de Project Dagen tab

### Data fetching patroon

```ts
// src/app/(project)/project/[projectId]/accreditation/persons/page.tsx
export default async function PersonsPage({ params }) {
  const persons = await getPersonsWithGroups(params.projectId)
  return <PersonsGroupList initialPersons={persons} />
}

// PersonsGroupList.tsx — 'use client'
const [optimisticPersons, addOptimistic] = useOptimistic(initialPersons)
const handleApprove = async (id: string) => {
  addOptimistic(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p))
  await approvePersonAction(id)
}
```

### Realtime hook schets

```ts
// src/hooks/useAccreditationChannel.ts
'use client'
export function useAccreditationChannel(
  projectId: string,
  scope: 'persons' | 'pending'
) {
  const supabase = useSupabaseClient()
  const channel = scope === 'persons'
    ? `accreditation-persons-${projectId}`
    : `accreditation-pending-${projectId}`

  useEffect(() => {
    const sub = supabase
      .channel(channel)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'accreditation_persons',
        filter: scope === 'pending' ? `status=eq.draft` : `project_id=eq.${projectId}`,
      }, (payload) => onPayload(payload))
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [projectId, scope])
}
```

Hook wordt alleen gebruikt in `AccreditationCheckinClient.tsx` en de approval queue — nergens anders.

### Mobile/offline strategie

`next-pwa` met beperkte scope. Geen app-wide service worker — alleen de ticket route in de cache. Ticket page server-rendert de statische HTML, service worker cachet de response (`StaleWhileRevalidate`). QR-code image apart gecached (`CacheFirst`). Check-in scherm heeft geen offline-vereiste — camera en realtime vereisen netwerk. PWA manifest met `display: standalone`, `start_url: /accreditation/ticket/`. Apple Wallet pas in fase 3.

### Form library

**react-hook-form + zod resolver.** Portaalwizard en persoonspaneel hebben conditionele validatie (maaltijden per dag, item limieten per groep) die native `<form action>` niet kan uitdrukken zonder duplicatie van de zod schemas die ook in de server actions leven. Beide lagen importeren hetzelfde schema uit `src/lib/validators/accreditation.ts`.

### Open vragen voor de teamlead

- **Approval queue autorisatie**: mag een `centralist` ook approven, of alleen `planner` en hoger? De RBAC beschrijving laat dit open; bepaalt of de approval queue achter middleware moet of niet.
- **Portaalwizard session state**: bij browser refresh is de wizard-state weg. Acceptabel, of slaan we draft-state op in Supabase zodat een groepsbeheerder later verder kan? Raakt het datamodel.
- **`validate_check_in` Postgres function**: als we dit in fase 1 niet bouwen, moeten we de TypeScript fallback zo schrijven dat overstappen later geen breaking change is voor de client. Afstemmen met backend voor de response interface.

## Design kickoff

Eigenaar: **ui-designer agent**. Onderdeel van de IMS suite, geen aparte branding.

### Design tokens

Status kleuren — kleur is nooit de enige statusdrager.

```css
/* CSS variabelen in globals.css, Tailwind theme extension via @theme */
--color-status-draft:       theme('colors.zinc.400');
--color-status-approved:    theme('colors.emerald.500');
--color-status-checked-in:  theme('colors.blue.500');
--color-status-checked-out: theme('colors.zinc.300');
```

Tailwind utility suggesties: `bg-zinc-100 text-zinc-500` (draft), `bg-emerald-100 text-emerald-700` (approved), `bg-blue-100 text-blue-700` (checked_in), `bg-zinc-50 text-zinc-400 line-through` (checked_out).

**Zone kleuren** — door admin gekozen via kleurpicker, opgeslagen als hex in `accreditation_zones.color`. Bij opslaan: bereken contrast van de gekozen hex tegen wit én zwart via WCAG formule, kies automatisch de text-kleur met de hoogste ratio. Minimum 3:1 voor grote badge-tekst (WCAG AA large). UI-waarschuwing als geen enkele aanpassing dit haalt.

**Polsbandje kleuren** — zelfde mechanisme als zones (`accreditation_item_types.color`, category=wristband). Kleurpicker is verplicht. Toon in ZoneBadge en PrintTicket als gekleurde rechthoek met naam.

**Accent** — gebruik de bestaande IMS suite accent variabele (`--color-accent`). Geen nieuwe merkkleur.

### Type scale & spacing

IMS suite standaard: Inter/system-ui, 14px base, line-height 1.5, 4px spacing scale, max prose 65ch — geen afwijkingen.

### Kerncomponenten

- **`StatCard`** — admin overzicht bovenaan. Props: `label`, `value`, `delta?`, `href?`. Variant `highlight` voor kritieke waarden (pending approvals > 0 → amber). Geen interactiviteit zonder `href`.
- **`PersonRow`** — Personen tab + Approval queue. Props: `person`, `showGroup?`, `showDays?`, `onSelect?`. Bevat `StatusBadge`, `RoleBadge`, inline dag-chips. Keyboard-focusable als `onSelect` aanwezig.
- **`DayChip`** — enkelvoudige dag-indicator. Props: `date`, `type: 'show' | 'build' | 'teardown'`, `state: 'available' | 'selected' | 'approved' | 'disabled'`. Compact (28×28px) en large (44×44px touch) varianten.
- **`ZoneBadge`** — gekleurde pill met zone naam. Props: `zone: { name, color }`. Berekent text-kleur automatisch op basis van contrast.
- **`QRScannerOverlay`** — fullscreen camera view. Props: `onResult`, `state: 'idle' | 'success' | 'error' | 'duplicate' | 'wrong_day'`. State stuurt achtergrondkleur, kopij en animatie. Camera fallback: handmatige invoer altijd zichtbaar onderaan.
- **`PrintTicket`** — `@react-pdf/renderer` component. Props: `person`, `format: 'A6' | 'A7'`, `showQR`, `zones`, `items`. Stateless.

### Approval queue keyboard UX

| Shortcut | Actie |
|---|---|
| `J` / `K` | Vorige / volgende persoon |
| `A` | Goedkeuren (alle aangevraagde dagen) |
| `R` | Afwijzen (opent reden-popover) |
| `Space` | Detailpaneel openen/sluiten |
| `Esc` | Detailpaneel sluiten |

**Focus indicator:** 2px `ring-offset-2 ring-blue-500`, zichtbaar op licht en donker. Actieve rij krijgt `bg-blue-50` achtergrond, niet alleen een ring.

**Bevestigings-toast:** Sonner of shadcn/ui Toast. Approve: `"[Naam] goedgekeurd voor 3 dagen"` (groen, 3s). Reject: `"[Naam] afgewezen"` (oranje, 5s, undo-knop). Undo roept `revertApproval(log_id)` aan op `accreditation_approval_log`.

### Scanner UX states

| State | Overlay | Geluid | Haptic | Kopij |
|---|---|---|---|---|
| `success` | Groen (`bg-emerald-500/90`) | beep 440Hz, 150ms | licht (10ms) | "**[Naam]** ingecheckt. Zones: Backstage, Catering." |
| `error` | Rood (`bg-red-600/90`) | dubbele lage toon (220Hz) | zwaar (100ms) | "Onbekende QR code. Probeer opnieuw." |
| `duplicate` | Oranje (`bg-amber-500/90`) | middentoon (330Hz) | middel (30ms) | "**[Naam]** is al ingecheckt om 14:37." |
| `wrong_day` | Rood-oranje (`bg-orange-600/90`) | dubbele lage toon | middel (30ms) | "**[Naam]** is niet geldig vandaag. Geldig op: vr 9 mei." |

Geluid via Web Audio API (geen externe bestanden). Haptic via `navigator.vibrate()` met graceful fallback.

### Toegankelijkheid (harde grenzen)

1. **WCAG AA contrast** — alle tekst op gekleurde badges ≥ 4.5:1 (normaal) of 3:1 (groot, ≥18px bold). Zone- en polsband-kleurpicker blokkeert opslaan bij onvoldoende contrast.
2. **Focus altijd zichtbaar** — geen `outline: none` zonder vervangend `ring`. Geldt voor approval queue shortcuts én DayChip toggles.
3. **Scanner heeft niet-camera fallback** — handmatig QR-token invoerveld is altijd aanwezig op het check-in scherm, niet verborgen achter een toggle.
4. **Kleur is niet de enige statusdrager** — StatusBadge bevat altijd een tekstlabel of icon. ZoneBadge bevat altijd de zone naam.

### Open design vragen

- **Approval queue op mobiel**: keyboard shortcuts zijn desktop-only. Wat is de mobiele interactie? Swipe-acties (links = reject, rechts = approve) of gewoon knoppen?
- **Zone kleurpicker scope**: 10+ zones met vrije hex-kleuren — onderscheidbaar genoeg, of moeten we een curated palette van 12 vaste opties afdwingen?
- **PrintTicket offline**: service worker cached de ticket-pagina, maar `@react-pdf/renderer` genereert de PDF client-side. Past de bundle binnen het 100kb JS budget per route?

## Beveiliging

RLS policies blijven zoals v1. We documenteren ze nu wel inline in de migrations, want in v1 stonden ze verspreid en was het zoeken naar wie wat mag. Pattern: één SQL bestand per tabel met de RLS policies daaronder.

Anonieme toegang via tokens blijft. We voegen wel rate limiting toe op de portaal- en ticket-endpoints om brute force op tokens te voorkomen. Vercel middleware met een simpele in-memory store voor v1, Upstash Redis als we het serieus willen schalen.

### Security kickoff

Eigenaar: **security agent**.

#### Threat model (top 5, hoogste impact eerst)

1. **QR token brute force / enumeratie** — 16 bytes hex is sterk, maar zonder rate limiting kan een aanvaller bij grote events tickets hijacken. *Mitigatie: per-IP en globale rate limit op `/accreditation/ticket/*`, plus alarm bij >50 mislukte token-lookups per minuut.*
2. **Invite token leak via referrer / shared URL** — invite token in URL belandt in browserhistorie, screenshots, mail forwards. *Mitigatie: token-expiry op `accreditation_groups.invite_expires_at`, `Referrer-Policy: no-referrer`, regenerate-knop voor admin.*
3. **IDOR via `project_id` in server actions** — actions die `project_id` uit de body trusten kunnen cross-tenant data lekken. *Mitigatie: altijd `project_id` afleiden uit RLS-context of geverifieerde membership-check, nooit uit client input.*
4. **Realtime channel lek** — `accreditation-persons-${projectId}` zonder filter geeft een ingelogde anon user andermans project mee. *Mitigatie: server-side row filter via RLS op de Realtime publication, en channel-auth via `realtime.channel_authorize`.*
5. **PII exposure via ticket URL** — naam, e-mail, rol staan op `/accreditation/ticket/[qrToken]`; gedeelde URL = volledige PII lek. *Mitigatie: minimale data op publieke ticket (geen e-mail, geen telefoon), `noindex`, korte cache, QR-rotatie bij verlies.*

#### Rate limits (per IP per minuut, Upstash)

| Endpoint | Limiet | Burst |
|---|---|---|
| `/accreditation/[token]` (portal GET) | 30 | 10 |
| `/accreditation/[token]` (POST submit) | 10 | 3 |
| `/accreditation/ticket/[qrToken]` | 60 | 20 |
| `validate_check_in` (scan) | 120 per device-token | 30 |
| `/auth/login` (admin) | 5 | 2, lockout 15 min na 10 fails |
| Resend invite mail | 3 per groep per uur | — |

Globale circuit breaker: 1000 req/min/IP over alle public routes.

#### Token rotatie en revocatie

- **Invite token**: expireert standaard 14 dagen na aanmaak of bij `project.show_days[0] - 1`. Auto-revoke zodra groep status `submitted` heeft. Admin kan handmatig regenereren (oude direct ongeldig).
- **QR token**: roteer bij melding van verlies via admin actie `regenerate_qr_token(person_id)`; oude token wordt geblacklist in `accreditation_revoked_tokens` (lookup voor scan). Auto-revoke bij `checked_out` + `project.show_days[-1] + 7d`.
- Rotatie logt verplicht een rij in `accreditation_approval_log` met action `token_rotated`.

#### RLS gotchas

1. **Service role omzeilt RLS** — server actions die per ongeluk `supabaseAdmin` gebruiken voor user-acties lekken alles. *Mitigatie: lint-rule die `serviceRoleClient` alleen toestaat in `lib/db/admin/*`, en altijd expliciete tenant-check eerst.*
2. **Realtime ignores RLS by default op INSERT-payloads** — anon kan bij verkeerde publication payloads van andere projecten zien. *Mitigatie: `ALTER PUBLICATION supabase_realtime ... WITH (publish='update')` + `realtime.rls` filter, getest met een tweede project in staging.*
3. **JOIN cross-tenant leak via views** — een view zonder `security_invoker` draait als owner en omzeilt RLS van onderliggende tabellen. *Mitigatie: `CREATE VIEW ... WITH (security_invoker = true)` op `accreditation_daily_stats` en alle aggregatieviews.*

#### Audit logging — `accreditation_approval_log`

Verplichte velden: `id`, `person_id`, `project_id`, `action`, `days[]`, `by_user_id`, `actor_role`, `reason`, `ip_address inet`, `user_agent text`, `request_id uuid`, `created_at`. Acties uitbreiden met `token_rotated`, `qr_revoked`, `briefing_ack_overridden`. Append-only via trigger (`BEFORE UPDATE/DELETE: RAISE`). Bewaartermijn 24 maanden, daarna anonimiseren (hash `by_user_id`, drop IP).

#### Pre-launch security checklist

- [ ] RLS policies aanwezig en getest op elke `accreditation_*` tabel (anon, runner, planner, centralist, company_admin)
- [ ] Service role key alleen in server-only modules; CI grep faalt bij client import
- [ ] Rate limiting via Upstash actief op alle public endpoints, met monitoring alert
- [ ] Security headers: CSP `default-src 'self'`, HSTS, `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy`
- [ ] Cookies `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefix voor session cookies
- [ ] Zod validatie op elke server action; geen unchecked `project_id` uit client
- [ ] Realtime channels getest met cross-project anon user — geen leak
- [ ] `accreditation_approval_log` trigger blokkeert UPDATE/DELETE; IP en UA gelogd
- [ ] Token entropy geverifieerd (`gen_random_bytes`, niet `Math.random`); brute force test 10k req
- [ ] Dependency audit clean (`pnpm audit --prod`), Resend webhook signature verified
- [ ] Pen-test op IDOR: probeer `project_id` swap op elke action; CSV bulk import sanitized tegen formula injection (`=`, `+`, `-`, `@` prefix)

## Test strategie

Eigenaar: **testing agent**.

### Stack

Vitest + Testing Library voor unit en component tests (ESM-native, sneller dan Jest, jest-compatibele API). Playwright voor E2E. Geen uitzondering nodig: matcht de Next.js 15 App Router setup zonder extra configuratie.

### Wat testen we waar

| Laag | Wat | Tool | Omgeving |
|---|---|---|---|
| Unit | Zod validators in `validators/accreditation.ts` | Vitest | Geen I/O |
| Unit | `validate_check_in` logica (TS-variant) | Vitest | Geen I/O |
| Unit | Token generatie helpers | Vitest | Geen I/O |
| Integration | Server actions (`persons.ts`, `checkin.ts`, `approvals.ts`) | Vitest + Supabase client | `supabase start` lokaal |
| Integration | RLS policies per tabel | Vitest | `supabase start`, anon key + service role key |
| Component | Portaalstappen, check-in overlay, approval queue UI | Testing Library + Vitest | JSDOM, MSW voor fetches |
| Component | Ticket render (`/accreditation/ticket/[qrToken]`) | Testing Library + Vitest | JSDOM |
| E2E | Kritieke flows (zie onder) | Playwright | Lokale Next.js + `supabase start` |

RLS integration tests draaien altijd twee keer: één keer als `anon` (verwacht geblokkeerd) en één keer als `service_role` (verwacht toegestaan). Een unit test met gemockte Supabase client test de mock, niet de policy.

### Kritieke E2E flows (prioriteitsvolgorde)

1. **Portaalregistratie** — anonieme gebruiker opent invite-token URL, voegt 2 personen toe met dagen en items, dient in; personen staan daarna als `draft` in de DB.
2. **Bulk approve via approval queue** — centralist keurt 3 draft-personen goed via keyboard shortcut A; status wordt `approved`, approval_log heeft 3 rijen.
3. **QR check-in succesvol** — scanner opent check-in scherm, scant geldige QR token voor vandaag; persoon gaat naar `checked_in`, scan_log heeft succes-entry, realtime update zichtbaar.
4. **QR check-in geblokkeerd** — scanner scant een token voor de verkeerde dag; rood scherm met foutmelding uit `validate_check_in`, geen statuswijziging.
5. **Ticket print-view** — geldige qrToken URL laadt ticket met naam, zones, items; A6 print-stylesheet actief bij `window.print()`.

### Test data fixtures

Keuze: **één SQL seed script onder `supabase/seed.sql`**. RLS integration tests en Playwright E2E hebben allebei een bekende databasestaat nodig vóór elke run. Een TS factory pattern werkt alleen als de Supabase client al draait en vereist extra boilerplate. Het seed script wordt uitgevoerd via `supabase db reset --seed` en zet een deterministisch testproject neer: 1 project, 2 groepen (crew + artist), 3 zones, 4 item types (incl. 1 wristband), 5 personen (mix van statussen), geldige invite tokens en QR tokens als constanten zodat E2E tests er hardcoded naar kunnen verwijzen.

### CI gating

**Blokkeert elke merge:** alle unit tests, component tests, RLS integration tests, E2E flows 1 t/m 3 (registratie, approve, check-in succes).

**Alleen nightly:** volledige E2E suite incl. flows 4 en 5, performance budget check (Lighthouse CI, TTFB assertions), seed + reset cycle test om migraties te valideren.

### Coverage doelen

| Laag | Doel | Toelichting |
|---|---|---|
| Validators (`validators/accreditation.ts`) | 100% | Pure functies, geen excuus |
| Server actions | 80% | Happy path + voornaamste foutpaden |
| DB queries (`db/queries/accreditation.ts`) | 70% | Kritieke queries gedekt via integration |
| Component render | 60% | Gedrag en error states, geen snapshot rot |
| E2E happy paths | 5 flows | Getal telt, percentage niet |

Coverage als smoke alarm, niet als doel. Een validator op 98% met een ontbrekende unicode-edge case is slechter dan 100% met alle Zod `.refine()` branches gedekt.

## Deployment & operations

Eigenaar: **devops agent**.

### Environments

| Env | Doel | Supabase project | Domein |
|-----|------|-----------------|--------|
| **local** | Development | `accreditatie-dev` (gratis tier volstaat) | `localhost:3000` |
| **preview** | Per PR, automatisch via Vercel | `accreditatie-dev` (read-only migrations) | `accreditatie-<hash>.vercel.app` |
| **staging** | QA vóór release, production-like data | `accreditatie-staging` (aparte instance) | `staging.accreditatie.jouwdomein.nl` |
| **production** | Live | `accreditatie-prod` | `accreditatie.jouwdomein.nl` |

Preview deployments delen de dev-database. Staging en prod krijgen elk een volledig aparte Supabase instance. Nooit dev/prod databases mengen.

### Required environment variables

| Variabele | Scope | Waarvoor |
|-----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser + server) | Supabase project URL voor client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser + server) | Anonieme RLS-toegang voor portaal en ticket |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Admin-mutaties in server actions (bypass RLS waar nodig) |
| `SUPABASE_DB_URL` | **Server only** | Directe Postgres connection voor migrations vanuit CI |
| `RESEND_API_KEY` | **Server only** | Mail via Resend (invite, goedkeuring) |
| `RESEND_FROM_ADDRESS` | **Server only** | Afzenderadres, bv. `noreply@accreditatie.jouwdomein.nl` |
| `UPSTASH_REDIS_REST_URL` | **Server only** | Rate limiting op portaal- en ticket-endpoints |
| `UPSTASH_REDIS_REST_TOKEN` | **Server only** | Auth voor Upstash Redis |
| `NEXT_PUBLIC_APP_URL` | Public | Absolute base URL voor QR-links in mails en tickets |
| `SENTRY_DSN` | **Server only** | Error reporting (upload source maps in build) |
| `SENTRY_AUTH_TOKEN` | Build-time only | Source map upload tijdens `vercel build` |

Lokaal: `.env.local`, nooit in git. Per Vercel environment (preview / staging / prod) aparte waarden via Vercel dashboard of CLI. Doppler als single source of truth zodra het team groeit.

### Vercel project config

- **Node version:** 20.x
- **Build command:** `pnpm build`
- **Output:** `standalone` (Next.js 15 default op Vercel)
- **Package manager:** pnpm (zet `ENABLE_EXPERIMENTAL_COREPACK=1`)

**Runtime keuzes per route:**

| Route | Runtime | Reden |
|-------|---------|-------|
| `/accreditation/[token]` | **Edge** | Portaal is publiek, geen service role nodig, lage latency prioriteit |
| `/accreditation/ticket/[qrToken]` | **Edge** | Publieke read, snelle response, service worker caching |
| `/project/[projectId]/accreditation/checkin` | **Edge** | Realtime-UI, token validatie via anon key |
| Server actions (`checkin.ts`, `approvals.ts`, `persons.ts`) | **Node.js** | Gebruiken `SUPABASE_SERVICE_ROLE_KEY`, edge ondersteunt geen service role veilig |
| API routes voor Resend webhooks | **Node.js** | Payload parsing, geheimen |

Stel runtime in via `export const runtime = 'edge'` per route segment. Default blijft Node.js; alleen expliciet opt-in naar edge.

### Database migrations workflow

1. **Lokaal:** schrijf migration in `supabase/migrations/`, test met `supabase db reset`.
2. **PR:** GitHub Actions draait `supabase db diff --linked` om te verifiëren dat de migration schoon is.
3. **Staging deploy:** na merge naar `main` draait CI `supabase migration up --linked` tegen het staging project vóór de Vercel deploy start.
4. **Productie deploy:** aparte job, getriggerd na goedkeuring van staging deploy, voert `supabase migration up --linked` uit tegen prod. Vercel deployment start pas na succesvolle migratie.
5. Migrations draaien nooit vanaf een laptop. Alle output wordt gelogd als CI artifact. Rollback = nieuwe migration, nooit `db push` terug.

### Monitoring & alerting

- **Errors:** Sentry (server + client). Source maps uploaden bij build. Release tagging per deploy. Alert bij error rate > 5/min over 5 minuten.
- **Logs:** Vercel Log Drains naar BetterStack of Axiom. Zoekbaar op `requestId`, `projectId`, `personId`. Check-in failures en rate limit hits krijgen log level `warn`.
- **Uptime:** BetterStack synthetic check op `/` en `/accreditation/ticket/healthcheck`. Alert bij 2 opeenvolgende failures.
- **Specifieke alerts:**
  - Rate limit hits > 50/min op portaal → Slack alert (mogelijke brute force).
  - Scan failures spike > 20% van scans in 5 min → Slack alert (hardware of UX probleem op evenement).
  - Materialized view `accreditation_daily_stats` refresh ouder dan 3 minuten → alert (cron of trigger kapot).
  - Supabase Realtime disconnects > 3x per minuut op check-in scherm → alert.
- **Vercel Analytics:** aan voor Core Web Vitals per route. TTFB-afwijking op check-in scherm is early warning voor edge config problemen.

### Backup & disaster recovery

Supabase Pro biedt Point-in-Time Recovery (PITR) met 1-seconde granulariteit tot 7 dagen. Volstaat voor v1 en v2.

- **RPO:** 1 minuut (PITR). Acceptabel; accreditatiedata van de afgelopen 60 seconden herbouwen is haalbaar via scan logs.
- **RTO:** 15–30 minuten voor een PITR restore naar nieuw project + Vercel env var swap. Documenteer de restore-procedure in een runbook vóór de eerste live productie-dag.
- Nachtelijke `pg_dump` export naar Cloudflare R2 als extra laag (geen egress-kosten). Eenvoudig via Supabase Edge Function + cron, of `pg_dump` vanuit GitHub Actions scheduled job.

### Launch / cut-over plan v1 → v2

**Aanpak: parallel run met feature flag, geen big bang.**

1. **Fase 1 (dev/staging):** v2 draait naast v1. Zelfde Supabase prod database (read-only vanuit v2 staging), zodat de data klopt maar v2 nog niet schrijft.
2. **Feature flag per project** via een kolom `v2_enabled bool` op de `projects` tabel (of PostHog). Zet aan per project; intern testproject eerst, daarna een klein live project.
3. **Cutover per project:** als v2 stabiel is voor een project, zet `v2_enabled = true`. Verwijder de v1 routes voor dat project. Geen DNS-switch nodig; beide versies leven op hetzelfde domein.
4. **Wristband merge migration:** risicovolste stap (data migratie van `wristbands` naar `item_types`). Aparte gereviewd migration op een onderhoudsvenster, vóór de feature flag flip voor projecten met wristbands.
5. **Volledige cutover:** als alle actieve projecten op v2 draaien, v1 code archiveren. Geen hard deadline; pragmatisch per projectcyclus.

## Bestandsstructuur

```
src/
  app/
    accreditation/
      [token]/
        page.tsx
        AccreditationPortalClient.tsx
      ticket/[qrToken]/
        page.tsx
    (project)/project/[projectId]/
      accreditation/
        layout.tsx                  tab nav
        page.tsx                    redirect naar /persons
        persons/page.tsx
        groups/page.tsx
        zones/page.tsx
        items/page.tsx
        days/page.tsx
        briefings/page.tsx
        approvals/page.tsx          nieuw
        reports/page.tsx            nieuw
        checkin/
          page.tsx
          AccreditationCheckinClient.tsx
  lib/
    actions/accreditation/
      persons.ts
      groups.ts
      zones.ts
      items.ts
      checkin.ts
      portal.ts
      briefings.ts
      approvals.ts
      index.ts
    validators/accreditation.ts
    db/queries/accreditation.ts     reusable queries
  types/accreditation.ts
supabase/
  migrations/
    [timestamp]_accreditation_core.sql
    [timestamp]_accreditation_briefings.sql
    [timestamp]_accreditation_approval_log.sql
    [timestamp]_accreditation_daily_stats_view.sql
    [timestamp]_accreditation_item_scope.sql
    [timestamp]_accreditation_wristband_merge.sql
```

## Wat we van v1 leren en anders doen

Een paar concrete verbeteringen op basis van de v1 implementatie. v1 had geen audit op approvals; v2 wel via `accreditation_approval_log`. v1 deed aggregaties client-side in de stat cards; v2 doet dit via een materialized view. v1 had geen approval queue voor bulk handling; v2 voegt deze toe met keyboard shortcuts. v1 had geen "kopieer setup" optie bij projectcreatie; v2 wel via `default_meal_config` en `default_zone_setup`. v1 had item scope (per_person vs per_day) impliciet in de `day` kolom; v2 maakt dit expliciet met een `scope` veld. v1 had losse export buttons door de UI verspreid; v2 centraliseert in een Reports pagina. v1 had geen rate limiting op publieke endpoints; v2 wel. v1 had alle server actions in één bestand; v2 splitst per concern. v1 had polsbandjes in een aparte wristbands tabel los van accreditatie; v2 voegt ze samen met item_types via een category veld, zodat polsbandjes meetellen in limieten, op tickets verschijnen en bij check-in formeel worden uitgegeven.

Wat we expliciet hetzelfde laten: de status flow, de tabel structuur, de naming, de twee-token-aanpak, de realtime channel structuur, de RBAC rollen, de meal types enum (4 vaste types). Dit werkt en breken levert geen waarde op.

## Roadmap

Fase 1 herbouwt de v1 functionaliteit op de nieuwe Next.js 15 + Supabase setup, met de architecturale verbeteringen (materialized view, action split, validators). Resultaat: feature parity met v1 maar sneller en onderhoudbaarder.

Fase 2 voegt de v2 features toe: approval queue, briefings module, kopieer setup, reports pagina, approval audit log.

Fase 3 is offline ticket support (service worker), wallet passes, en mogelijk een crewlid portal voor briefing acknowledgments en eigen profiel inzien.

Fase 4 is integraties: koppeling met IMS controlroom (zien wie er op terrein is), met StageTimer (artiesten als persons importeren), en met ArtistAdvance (tour crew automatisch als groep aanmaken).

## Open vragen

Of de Postgres function voor check-in validatie inderdaad meetbaar sneller is dan de TS implementatie. Antwoord pas na meten in productie.

Of we briefing acknowledgments verplicht moeten kunnen blokkeren aan check-in. Voorstel: ja, met override-knop voor centralist.

Of we per project de meal types willen kunnen overriden (bijvoorbeeld een evenement zonder ontbijt). Voorstel: nee, vier vaste types maar per dag aan/uit zetten via `day_meals` is genoeg.

Of we voor zeer grote projecten (5000+ personen) een aparte read-replica strategie nodig hebben. Antwoord pas als we dat schaalniveau halen, niet preventief over-engineeren.

## Sprint 0 — kickoff checklist

Concrete tickets om dag 1 te kunnen starten. In volgorde, één eigenaar per ticket.

**Repo & infra (devops)**
- [ ] Next.js 15 repo aanmaken met pnpm, Tailwind v4, shadcn/ui geïnstalleerd
- [ ] `accreditatie-dev`, `accreditatie-staging`, `accreditatie-prod` Supabase projecten
- [ ] Vercel project gekoppeld, env vars per environment ingericht
- [ ] GitHub Actions workflow voor migrations (lint → staging → prod)
- [ ] Sentry project + DSN per environment

**Datamodel (database)**
- [ ] Migration `001_accreditation_core.sql` schrijven en reviewen
- [ ] RLS pattern template aftekenen met security agent
- [ ] `supabase/seed.sql` met deterministisch testproject

**Server actions (backend-api)**
- [ ] `_result.ts`, `_auth.ts` en Zod validators uitrollen
- [ ] `requireRole` helper getest tegen alle 5 rollen
- [ ] `src/middleware.ts` met Upstash Ratelimit

**Frontend (frontend-web)**
- [ ] App Router skeleton met `(project)` layout en accreditation tab nav
- [ ] shadcn componentenset geïnstalleerd
- [ ] `useAccreditationChannel` hook werkend tegen testproject
- [ ] PWA manifest + service worker scope op ticket route

**Design (ui-designer)**
- [ ] Status- en zone-tokens in `globals.css` + Tailwind theme
- [ ] `StatusBadge`, `ZoneBadge`, `DayChip`, `StatCard` componenten af
- [ ] Kleurpicker met contrast-validatie

**Tests (testing)**
- [ ] Vitest + Playwright config in repo
- [ ] Eerste E2E flow (portaalregistratie) draaiend tegen seed
- [ ] CI gating: PR-blokkers benoemd

**Security (security)**
- [ ] Threat model gereviewd door teamlead
- [ ] Rate limit config en alert thresholds afgetekend
- [ ] Pre-launch checklist als template GitHub issue

## Definition of Done per fase

**Fase 1 — feature parity** is klaar als:
- Alle v1 admin-flows werken in v2 (groep, zone, item, persoon, dag, briefing CRUD).
- Portaal en check-in scherm minstens de v1 functionaliteit dekken.
- E2E flows 1 t/m 3 groen, RLS integration tests groen.
- Performance budget gehaald (`100kb JS / route`, dashboard <800ms).
- Eén live festival of tour op v2 gedraaid in staging.

**Fase 2 — v2-features** is klaar als:
- Approval queue met keyboard shortcuts en realtime sync werkt.
- Briefings module incl. mandatory ack en blocker-flow op check-in.
- Reports pagina met alle exports (CSV + print PDF).
- `default_meal_config`/`default_zone_setup` "kopieer setup" flow live.
- `accreditation_approval_log` audit trail compleet en immutable.

**Fase 3 — offline & wallet** is klaar als:
- Ticket pagina laadt en rendert offline na eerste bezoek.
- Apple Wallet + Google Wallet pass downloadbaar vanaf ticket.
- Crewlid portal voor eigen briefing acks en profiel.

**Fase 4 — integraties** is klaar als:
- Controlroom toont live aanwezigheid uit accreditatie.
- StageTimer importeert artiesten als `accreditation_persons`.
- ArtistAdvance stuurt tour crew automatisch een groep met invite.

