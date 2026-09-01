# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are independent artisans and owners of small trade businesses in
France, principally in the building trades the product names explicitly:
plombier-chauffagiste, électricien, peintre bâtiment, menuisier, plus an "Autre"
option for other trades. They work on the move — on site, between jobs, in the
van — and reach the product mostly from a phone, often one-handed. The job they
are doing is running the administrative side of the business: scheduling
interventions, keeping client records, producing devis and factures, writing
intervention reports, and replying to clients, without giving up field time.

Secondary audiences, both confirmed in the code:

- Team members invited into a shared workspace, holding a role of OWNER, ADMIN,
  or READ_ONLY.
- Platform staff operating the `/admin` back-office, with a staff role of
  SUPPORT, ADMIN, or SUPER_ADMIN.

## Product Purpose

Forge turns what an artisan says or types into structured business records and
finished professional documents. It exists because trade admin — devis,
factures, comptes rendus, client follow-up — consumes time that belongs on the
job. Success is the artisan clearing the day's paperwork in minutes, from the
field, by speaking or typing plainly, while the client receives correct,
professional documents.

## Positioning

The differentiating mechanism is conversational capture by voice or text as the
primary interface to the entire workflow. One plain sentence — "Crée une
intervention demain à 10 h", or "J'ai remplacé le robinet d'arrêt, changé le
joint et vérifié l'étanchéité" — is parsed into the right entity and the right
action (create, search, open, update, start, finish, send, download) across
interventions, clients, quotes, and invoices, and an unstructured field note
becomes a four-part compte rendu: Intervention réalisée, Diagnostic, Travaux
effectués, Recommandation. Neighbouring trade-admin tools are built around
forms; Forge is built around the spoken sentence and the unbroken chain
intervention → compte rendu → facture/devis → envoi au client.

## Operating Context

- **The end-to-end chain.** Intervention (scheduled, optionally assigned to a
  team member; status PLANIFIEE / EN_COURS / TERMINEE / ANNULEE; real start and
  finish times; end date for long jobs) → compte rendu (the four sections
  above) → devis (status BROUILLON / ENVOYE / ACCEPTE / REFUSE; line items
  grouped by category; unique reference) → facture (status BROUILLON / ENVOYEE
  / PAYEE / EN_RETARD / ANNULEE; created from an accepted devis or a completed
  intervention; unique reference; due date) → PDF generation → email to the
  client, sent with a saved email signature.
- **Assistant inputs:** voice, text, and photos. The assistant also drafts a
  professional client reply, in the right tone, from an inbound client message.
- **Clients:** particulier or professionnel; temporary auto-created clients
  versus saved ones; archived clients retained for history. Client data belongs
  to the workspace and survives a member leaving.
- **Workspaces:** every account has a Personal workspace. Users may create Team
  workspaces (becoming OWNER) or join one by email invitation, and switch
  between workspaces. Read-only team membership is free.
- **Billing lifecycle:** a 1-month free trial (subscriptionStatus TRIAL). Full
  access requires a personal subscription. A team whose members are all on the
  free tier enters a grace period and is deleted at its grace expiry unless a
  member subscribes.
- **Back-office** at `/admin` for platform staff: users, teams, staff, and an
  append-only audit log. Staff actions include triggering password-reset
  emails, editing users, changing subscriptions, exporting user data, and
  deleting users and teams.
- **Auth:** email and phone (both unique), bcrypt passwords, sessions,
  password-reset and account-activation tokens. An admin-issued temporary
  password forces a change on next login.
- **Locale and units:** French (`fr`) throughout, Europe/Paris timezone, euro
  currency, monetary amounts stored in cents.
- **Legal surfaces:** Conditions Générales d'Utilisation, Politique de
  confidentialité, and an About page.

## Capabilities and Constraints

- Built on a heavily modified Next.js (pinned at 16.2.10) whose APIs,
  conventions, and file structure deliberately diverge from public Next.js;
  `AGENTS.md` instructs reading the bundled docs under
  `node_modules/next/dist/docs/` before writing framework code. React 19,
  Tailwind CSS v4, Prisma 7 on PostgreSQL, `next-themes` for light and dark.
  The deploy build step runs database migrations.
- The assistant's scope is bounded. Intents: clientReply, quote, invoice,
  client, intervention, unknown. Actions include create, search, open, update,
  start, finish, send, download, deleteAll. Anything outside this set resolves
  to "unknown". Assistant requests are rate-limited.
- Responsive web with a mobile bottom navigation. There is no native app.
- **Open decision:** the historic team roles MANAGER and TECHNICIAN remain in
  the schema only until their presence in production can be audited; they are
  not part of the intended role model (which is OWNER / ADMIN / READ_ONLY).

## Brand Commitments

- The product name is **Forge** in all prose, UI, and documents. **myforge**
  is only the domain and email-sender identity — not a second product name, and
  it should not appear in copy. The current logo assets are
  `public/myforge-logo-dark.png`, `public/myforge-logo-light.png`,
  `public/myforge-email-symbol.png`, and the favicon set (`?v=myforge-2`),
  rendered through the `ForgeLogo` and `ForgeSymbol` components.
- Voice: French, **vouvoiement** ("vous") as the standard address for artisans;
  professional and plain-spoken. Existing "tu" strings (for example in pricing
  feature copy) are inconsistencies to correct, not the intended voice.
- Standing descriptor: "L'assistant administratif des artisans" /
  "La solution intelligente pour les artisans" /
  "De la demande client à la facture, Forge simplifie votre quotidien."

## Evidence on Hand

Forge is pre-launch. There are no real customers, testimonials, usage figures,
case studies, or press to cite, and future work must not fabricate social
proof, customer logos, or metrics. Landing-page examples — the robinet d'arrêt
intervention, the sample client "Charles Xavier", the animated compte rendu —
are illustrative and must never be presented as real.

Pricing is real and specific:

- **Standard — 29,99 € / month** per full-access user: complete personal
  workspace, Forge assistant by text and voice, one team (created or joined) of
  up to 5 people.
- **Pro — 49,99 € / month:** everything in Standard, multiple teams, teams of
  more than 5 people.
- 1 month free, no commitment; the trial can be converted early.

## Product Principles

1. **The sentence is the interface.** Every capability must be reachable by
   speaking or typing plainly from the field. Forms are the fallback, not the
   entry point.
2. **Protect field time.** Judge every flow by how few taps and how little
   attention it costs between two jobs, on a phone, one-handed.
3. **One unbroken chain.** Intervention, compte rendu, devis, facture, and
   client send are stages of a single flow; never make the artisan re-enter
   what an earlier stage already knew.
4. **The client always receives professional work.** Whatever the artisan
   mutters, what reaches the client is correctly structured and correctly
   worded.
5. **Personal first, team when needed.** The individual artisan's workspace is
   the default and the constant; team sharing is an addition that never
   complicates solo use.

## Accessibility & Inclusion

No formal standard (such as a WCAG level) has been set as a product
requirement. Primary use is one-handed, on a phone, in the field — sometimes in
poor light or with gloves — so target sizes and contrast are first-order
concerns, not polish. Practices already in the build and worth preserving: full
`prefers-reduced-motion` support, French `lang`, a 16px minimum for form-input
text on mobile to prevent iOS zoom, and safe-area-inset padding.
