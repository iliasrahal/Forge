---
name: Forge
description: "Cyclorama dawn — the authenticated app is a matte horizon lit night-to-day, work resting on the line."
colors:
  cobalt: "#4c6ef5"
  cobalt-lit: "#93a8ff"
  rose-dawn: "#ff7db0"
  jade: "#34d9a6"
  amber: "#f0b24a"
  ember: "#ff7a4d"
  sky-top: "#04050a"
  sky-mid: "#13214f"
  sky-horizon: "#1b2d69"
  sky-low: "#06070f"
  panel: "#0c1024"
  panel-raised: "#121838"
  ink: "#eef1fa"
  ink-muted: "#b3bcd8"
  ink-faint: "#8b95bd"
  hairline: "rgb(124 144 226 / 0.22)"
  hairline-strong: "rgb(124 144 226 / 0.42)"
typography:
  display:
    fontFamily: "Anton, 'Arial Narrow', system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.03
    letterSpacing: "0.005em"
  eyebrow:
    fontFamily: "Anton, 'Arial Narrow', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.14em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'cv05', 'ss01'"
  numeric:
    fontFamily: "'Geist Mono', ui-monospace, monospace"
    fontSize: "1rem"
    letterSpacing: "-0.01em"
    fontFeature: "'tnum'"
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    letterSpacing: "0.06em"
rounded:
  control: "1rem"
  panel: "1.5rem"
  hero: "2.25rem"
  capsule: "1.75rem"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
  "2xl": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "1rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.cobalt}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.cobalt-lit}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "1rem 1.5rem"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "1rem"
  panel-hero:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hero}"
    padding: "1.25rem"
  input:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.75rem 1rem"
  input-focus:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.ink}"
  status-pill:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.jade}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.5rem"
  rail-chip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.75rem"
  rail-chip-selected:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
  nav-link:
    textColor: "#7f89ad"
    typography: "{typography.label}"
  nav-link-active:
    textColor: "{colors.ink}"
---

# Design System: Forge

## Overview

**Creative North Star: "The Cyclorama at Dawn"**

The authenticated Forge app is a matte theatre cyclorama lit from night toward day. The background is one continuous vertical gradient — near-black sky at the top, a cobalt band where the light gathers, cold dawn below — and it tracks the real hour of day (nuit / aube / jour / crépuscule). A single cobalt horizon rule crosses the full width and is the only structural division in the entire world. The artisan reads the working day along that line: behind it the finished work sits dim, on the line the in-progress job is lit, ahead toward the light is what is still to come.

The world is dark-first (the theme provider ships `dark` by default and does not follow the OS); a complete light rendition — periwinkle sky, warm dawn seam, white panels — is carried by the same token names and appears only when a member has explicitly chosen light. The personality is calm, spatial and a little cinematic: deep blue-night surfaces that sit flat on the sky rather than floating, hairline structure, condensed all-caps display type cut by a short cobalt tick, and one decisive gradient action. It deliberately rejects the SaaS dashboard: no grid of tinted cards, no side rail, no stat tiles, no blue accent halo.

This system covers the app shell, the `/app` home dashboard, and the CSS world layer (`.forge-app-shell`) that re-skins every authenticated screen by re-mapping the older utility classes underneath it. Deeper screens inherit the layer and were not individually rebuilt. The `/admin` back-office is a separate, older, untouched system and is out of scope here.

**Key Characteristics:**
- One hour-tracking cyclorama gradient behind everything; one cobalt horizon rule as the only divider.
- Deep blue-night panels, flat, with a 2px cobalt top edge and a 1px periwinkle hairline — never a drop shadow.
- Anton uppercase display over a short cobalt tick; Geist body; Geist Mono tabular for every time, amount and reference.
- Cobalt is structure and the active line; rose is arrival / attention; jade is done.
- Primary action is the only cobalt→rose gradient in the UI, uppercase, and the only content element allowed a cast shadow.
- Motion happens once on entry (horizon rises, content lifts toward the light) and again on state change (a local cobalt seam sweeps); full `prefers-reduced-motion` fallback.

## Colors

A cold near-black-to-cobalt sky, blue-night surfaces, periwinkle-tinted structure, and a tight two-hue signal axis of cobalt and dawn-rose with a three-colour status set. Values below are the dark-first (shipped default) rendition; the light rendition uses the same token names.

### Primary
- **Cobalt** (`#4c6ef5`): The structure colour and the active line. It is the horizon rule, the 2px top edge of every panel and rail chip, the input caret and focus ring, the eyebrow tick, the solid base of the primary action, and the selection highlight. It is the one colour that means "this is the frame".
- **Cobalt Lit** (`#93a8ff`): The readable cobalt for text on dark — secondary-button label, inline links, the "COMPTE RENDU" heading, active nav icon. It is cobalt raised into the type layer, not a second hue.

### Secondary
- **Dawn Rose** (`#ff7db0`): Arrival and attention — the state that is waiting for you. It lights the in-progress rail chip (rose top edge, enlarged), the "En cours" pill, and forms the far end of the primary-action gradient. Used sparingly; it is the warm point the whole gradient travels toward.

### Tertiary
- **Jade** (`#34d9a6`): Done. Completed interventions, success pills, "Terminée".
- **Amber** (`#f0b24a`): Postponed / caution. "Reportée" and warning notices.
- **Ember** (`#ff7a4d`): Cancelled or error. "Annulée", destructive-action text, error panels.

### Neutral
- **Sky Top** (`#04050a`) / **Sky Mid** (`#13214f`) / **Sky Horizon** (`#1b2d69`) / **Sky Low** (`#06070f`): The four stops of the fixed cyclorama gradient, top to bottom. Sky Horizon is hour-variable — it warms and brightens through the dayparts (toward `#2b46b8` at aube, `#3f5fe0` at jour, a rose-leaning `#b5527a` at crépuscule) and the horizon line itself rises up the viewport as the day breaks.
- **Panel** (`#0c1024`): The resting surface colour of every card, sheet and rail chip.
- **Panel Raised** (`#121838`): Inputs, dashed "to complete" zones, and the faint fill behind an enlarged rail chip.
- **Ink** (`#eef1fa`) / **Ink Muted** (`#b3bcd8`) / **Ink Faint** (`#8b95bd`): Text hierarchy — headings and primary text, body copy, and metadata / placeholders respectively.
- **Hairline** (`rgb(124 144 226 / 0.22)`) / **Hairline Strong** (`rgb(124 144 226 / 0.42)`): The translucent periwinkle used for every 1px border and the rail's bottom edge. Structure is always a tinted hairline, never a grey line.

### Named Rules

**The Single Horizon Rule.** Exactly one full-width cobalt rule divides the world, and it is fixed to the viewport behind the content. No other full-width dividers, no boxed sections, no ruled tables. Everything else is separated by space alone.

**The World-Colour Status Rule.** A status is never grey. It is jade (done), rose (in progress / waiting on you), cobalt (informational), amber (postponed), or ember (cancelled / error). Grey status chips from the older code are re-mapped to muted ink on sight.

**The No Second Accent Rule.** The signal axis is cobalt → dawn-rose and nothing else. No third accent, no blue glow halo, and no violet midpoint between cobalt and rose — the gradient passes through lit cobalt, not purple.

## Typography

**Display Font:** Anton (with `'Arial Narrow', system-ui, sans-serif`) — loaded at weight 400 via `next/font`.
**Body Font:** Geist (with `system-ui, sans-serif`).
**Label / Mono Font:** Geist Mono (with `ui-monospace, monospace`).

**Character:** Anton is the letterform of the Forge logo — condensed, heavy, all-caps — carried in as the app's display voice. Against it Geist is quiet and neutral for reading, and Geist Mono gives times and money a fixed tabular rhythm. The pairing is a loud marquee headline over a calm technical body.

### Hierarchy
- **Display** (Anton 400, 2.25rem, line-height 1.03, letter-spacing 0.005em, UPPERCASE): The hour greeting ("BONSOIR.") and every panel title ("COMPTE RENDU"). Applied to `h1` and `h2` inside the shell. The hero greeting steps up to ~3rem at ≥640px.
- **Eyebrow** (Anton 400, 0.75rem, letter-spacing 0.14em, UPPERCASE): Section kickers such as "RAIL DU JOUR", always preceded by a short cobalt tick.
- **Title** (Geist 700, ~1.5rem, letter-spacing −0.02em): `h3`/`h4` and card names like the client name on the current-intervention panel (which tightens further to −0.04em at hero size).
- **Body** (Geist 400, 1rem, line-height 1.5, `cv05`/`ss01` on): Default paragraph text, set in Ink Muted. Comfortable measure ~60–70ch inside the `max-w-xl` column.
- **Numeric** (Geist Mono, `tabular-nums`, letter-spacing −0.01em): Every `<time>`, monetary amount and document reference — rail hours, "HEURE 10:00", invoice numbers.
- **Label** (Geist 600, 0.7rem, letter-spacing 0.06em, UPPERCASE): Bottom-nav labels. The primary-action label is the same treatment at weight ~650 and letter-spacing 0.02em.

### Named Rules

**The Anton Caps Rule.** Display copy — page and panel headings, section eyebrows — is Anton uppercase and is introduced by a short cobalt tick (a `rounded-full` bar ~36×3px above a heading, ~24×2px before an eyebrow). Titles and body stay Geist; numerals stay Geist Mono. Nothing else is set in Anton.

**The Tabular Numerals Rule.** Any hour, euro amount or reference renders in Geist Mono with `font-variant-numeric: tabular-nums` so columns of figures stay aligned.

## Layout

Phone-first, single centred column. The reading column is `max-w-xl` (36rem); content panels widen to `max-w-2xl`; the day view expands to `max-w-3xl` only while the upcoming-calendar is open; modals and the bottom nav sit at `max-w-md`; the Forge bar at `max-w-lg`. Horizontal gutters are 1rem on phones (enforced at ≤480px) and 1.5rem from the `sm` breakpoint (640px), which carries almost all responsive change.

The vertical rhythm is Tailwind's 0.25rem scale. Sections are separated by 0.75rem (`mb-3`); panel padding is 1rem rising to 1.5rem at ≥640px; internal stacks run 1rem–1.25rem. `main` reserves bottom space for the floating chrome with `padding-bottom: calc(7.5rem + safe-area-inset)`. The day rail is the only horizontally scrolling region; it fades out at its right edge with a mask to signal more. Every bottom-anchored element respects `env(safe-area-inset-bottom)`, and form inputs are forced to 16px at ≤480px to stop iOS zoom.

Tap targets: 2.75rem minimum (`min-h-11`), 3rem for icon buttons, 3.5rem for nav items.

### Named Rules

**The One Column Rule.** Content is a single centred column on the cyclorama. No side rail, no multi-column card grid, no stat-tile row — the day rail is the only horizontal structure, and it scrolls.

## Elevation & Depth

The system is flat. Content surfaces cast no drop shadow: panels ship `background-image: none`, an inset top glow, and a 1px cobalt bottom hairline — that is all. Depth is built four other ways: (1) the fixed cyclorama gradient at `z-index: -2` and the horizon rule at `z-index: -1` sit behind all content; (2) the 2px cobalt top edge plus the inset top glow lift a panel off the sky; (3) opacity recedes finished rail chips to 0.46; (4) the modal scrim is `blur(10px) saturate(1.1)` over near-black, not a shadow.

### Shadow Vocabulary
- **Daybreak cast** (`box-shadow: 0 14px 30px -14px` cobalt at ~65%): The primary action only. Deepens to ~78% and the button rises 1px on hover. This is the single cast shadow permitted on a content element.
- **Chrome float** (layered inset cobalt hairline + `0 -16px 50px` up-glow + `0 26px 70px` down-shadow): The portalled Forge bar and bottom nav only, so they read as resting on the horizon above the page. Not for in-page surfaces.
- **Panel lift** (`inset 0 10px 30px -18px` cobalt + `0 1px 0 0` cobalt): The default panel treatment — an inset dawn glow, not a projected shadow.

### Named Rules

**The No-Float Rule.** In-page surfaces never sit on a drop shadow. If a panel needs to feel raised, it gets a stronger cobalt top edge and inset glow — the light is above it, nothing is under it.

**The One Cast Shadow Rule.** The cobalt daybreak cast belongs to the primary action and nothing else. Secondary buttons, panels, chips and inputs have no `box-shadow` beyond an inset.

## Shapes

Generous, consistent rounding: controls (buttons, inputs, rail chips) at 1rem, panels at 1.5rem, the current-intervention hero panel at 2.25rem, the nav capsule at 1.75rem, and pills / icon buttons / the cobalt tick fully round (9999px). Every border is a 1px periwinkle hairline (`hairline` / `hairline-strong`). The recurring geometry is twofold: a **2px solid cobalt top edge** on every panel and rail chip (the "arête d'aube"), and a **short cobalt bar** set above or before every display heading. There are no inner dividers — the single horizon rule and the rail's cobalt-tinted bottom edge are the only lines allowed to span a region.

### Named Rules

**The Cobalt Top Edge Rule.** A resting panel or rail chip carries a 2px cobalt border-top and a 1px periwinkle hairline on its other three sides. On a clickable panel the top edge brightens to full cobalt on hover; on the in-progress rail chip it turns rose.

## Components

### Buttons
- **Shape:** 1rem radius (`rounded-2xl`), full-width on phones, auto width from `sm`.
- **Primary:** The cobalt→rose gradient bar — `linear-gradient(90deg, cobalt-lit 0%, cobalt 44%, rose-dawn 100%)` over a solid cobalt fallback, white text, UPPERCASE, letter-spacing 0.02em, weight ~650, padding ~1rem 1.5rem, plus the daybreak cast shadow. Words never hyphenate or break mid-word. On phones ≤430px the tracking relaxes and size drops to 0.9rem.
- **Hover / Focus:** Rises 1px (`translateY(-1px)`), shadow deepens; 180ms `cubic-bezier(0.22, 1, 0.36, 1)`. Disabled drops the gradient for flat slate.
- **Secondary:** Cobalt hairline border (`cobalt` at ~70%), Cobalt Lit label, transparent fill, no shadow. Used for "Prolonger", "Modifier".
- **Destructive:** Same ghost shape with an Ember border and Ember label.

### Chips (day rail — signature)
- **Style:** `panel` fill, 1rem radius, 1px hairline, a cobalt-tinted 2px top edge; `min-width` ~7rem; content is a Geist Mono time over a truncated subject and a status pill.
- **State — upcoming (default):** Sober, Ink Muted text, half-strength cobalt top edge that goes full cobalt on hover.
- **State — done / cancelled:** `opacity: 0.46`, top edge falls back to plain hairline — "switched off, behind the line".
- **State — in progress (`data-selected`):** Rose 2px top edge, rose-tinted border, faint cobalt fill, `transform: scale(1.04)` from its bottom edge — "lit, enlarged up off the line".

### Status Pills
- **Style:** Fully round, tiny (`0.7rem`), `0.125rem 0.5rem` padding. Background is the world colour at ~15–18% over transparent; text is the saturated world colour; border is `currentColor` at ~40%.
- **Mapping:** jade = done, rose = in progress, cobalt = informational, amber = postponed, ember = cancelled / error. Never grey.

### Cards / Containers
- **Corner Style:** 1.5rem panels; 2.25rem for the current-intervention hero.
- **Background:** `panel`; inputs and recessed zones use `panel-raised`.
- **Shadow Strategy:** None projected — inset dawn glow + 1px cobalt bottom hairline (see Elevation).
- **Border:** 1px periwinkle hairline on three sides, 2px cobalt top edge.
- **Internal Padding:** 1rem, rising to 1.5rem at ≥640px.
- **Compte-rendu panel:** The four-part report (Intervention réalisée / Diagnostic / Travaux effectués / Recommandation) renders as one panel with an Anton-caps title and small uppercase sub-labels down a left cobalt keyline.

### Inputs / Fields
- **Style:** `panel-raised` fill, `hairline-strong` border, 1rem radius, Ink text, Ink Faint placeholder, cobalt caret. No shadow at rest.
- **Focus:** Border goes cobalt, plus a `0 0 0 3px` cobalt-at-24% ring — a crisp ring, not a blur glow. 160ms ease.
- **Mobile:** 16px minimum text at ≤480px.

### Navigation
- **Style:** A portalled bottom capsule — `max-w-md`, 1.75rem radius, deep-indigo fill, cobalt hairline, `backdrop-blur-xl`, floated up from the frame edge with safe-area padding. Four items (Accueil, Clients, Devis, Factures) in a 4-col grid.
- **Typography:** Geist 600, 0.7rem, UPPERCASE, letter-spacing 0.06em, with a Lucide icon above.
- **States:** default `#7f89ad` → hover `#c7cef0` (icon nudges up) → active Ink, active icon Cobalt Lit and stroke-weight up, plus a short cobalt→rose underline seam (`::after`, insets 28%, 2px, `rounded-full`). No halo.

### Forge bar (signature)
- **Style:** The always-present assistant input — portalled, fixed above the nav, `max-w-xl`, 1.5rem radius (floating variant), deep-indigo fill, cobalt hairline, `backdrop-blur-xl`, `h-20`, with the chrome-float shadow so it rests on the horizon.
- **Contents:** A borderless text input with a rotating placeholder ("Dites ce que vous avez fait…"), then round 3rem icon buttons — camera and mic as cobalt ghost circles, send as a cobalt→rose gradient circle.
- **Voice/loading:** Mic swaps to a spinner while listening; the input placeholder narrates state ("Je t'écoute…", "Analyse de ta demande…").

### Horizon & sky (signature)
- The `.forge-app-shell::before` paints the fixed night→cobalt→dawn gradient plus a fine grain (SVG `feTurbulence` at `overlay`); `::after` is the 2px cobalt horizon rule with a soft cobalt/dawn glow, positioned at `--horizon-y` (60vh nuit → 30vh jour).
- **Motion:** `forge-horizon-rise` lifts the rule in once on load (900ms). `forge-lever` lifts each `main` child up 8px with a brief brightness/saturation dip, staggered 60/120/180/240ms. `forge-seam-sweep` runs a local cobalt hairline up ~14px and back to nothing when a content section (re)mounts on a state change. Button transitions 180ms, inputs 160ms.

### Named Rules

**The Rail Reads Left-to-Right Rule.** The day rail runs earliest to latest. Finished work is dim behind the line (opacity 0.46), the in-progress job is lit rose and scaled up, upcoming work is sober with a half cobalt edge. Selecting a chip re-lights it and re-sweeps the content seam.

**The Horizon Rises Once Rule.** Entrance motion is the horizon lifting and content rising toward the light — once. There is no idle loop, no parallax, no ambient drift. Under `prefers-reduced-motion` all of it collapses to opacity only and the seam is held at zero.

## Do's and Don'ts

### Do:
- **Do** lead every screen with an Anton-caps heading over a short cobalt tick; keep titles and body in Geist and all figures in Geist Mono `tabular-nums`.
- **Do** give panels the 2px cobalt top edge, a 1px periwinkle hairline, and a flat body — inset glow only, no projected shadow.
- **Do** carry status in a world colour — jade done, rose in progress / waiting on you, cobalt informational, amber postponed, ember cancelled or error.
- **Do** make the primary action the cobalt→rose gradient bar in uppercase, and let it be the only gradient and the only content element with a cast shadow.
- **Do** keep one full-width cobalt horizon rule as the sole divider; separate everything else with space.
- **Do** animate only on entry (horizon rise + staggered content lift) and on state change (local cobalt seam sweep), and ship the opacity-only `prefers-reduced-motion` path.
- **Do** respect `env(safe-area-inset-bottom)` on every bottom-anchored element and hold form inputs at 16px on small screens.

### Don't:
- **Don't** float content on drop shadows or lay cards on a tinted grid of tiles — this world has no dashboard cards.
- **Don't** add a second accent, a blue glow halo, or a violet midpoint between cobalt and rose.
- **Don't** use a neutral grey for a status.
- **Don't** introduce extra full-width rules, a side rail, or stat tiles.
- **Don't** set display copy in anything but Anton uppercase, or numerals in a proportional face.
- **Don't** add idle or looping motion, parallax, or scroll effects — the horizon rises once.
- **Don't** rely on the bottom-chrome indigo reacting to the theme; it is fixed dusk furniture, not a token.
