# Project: Nutrinance Single-Page Website Enhancement

## Architecture
- **Tech Stack**: Modern semantic HTML5 (`index.html`), CSS3 with modern custom properties & GPU-accelerated compositing (`styles.css`), Vanilla JavaScript ES6+ (`script.js`), and vendor libraries (Lenis v1.3.26, GSAP v3.15.0, ScrollTrigger v3.15.0).
- **Serving & Preview**: Local Node.js HTTP server (`server.js`) on port `5599`, tunnel-capable via `cloudflared.exe`.
- **Data Flow & State**:
  - Global `WHATSAPP_NUMBER` configuration powering 21+ `[data-wa]` DOM links and `#bookForm` URI serializations.
  - Lenis virtual scroll engine driven directly by `gsap.ticker` for single unified 60fps RAF loop.
  - Dynamic anchor routing with sticky header offset computation (`-(headerHeight + 16)`).
  - WAI-ARIA synchronized states for mobile drawer (`#hamburger` / `#nav`), program tabs (`[data-tab]` / `[data-panel]`), recipe filter categories (`[data-filter]` / `[data-cat]`), and FAQ `<details>`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Lenis Smooth Momentum Scrolling | Virtual smooth scrolling on mousewheel, trackpad, and keyboard with GSAP ticker sync, slider scroll containment (`data-lenis-prevent`), and mobile drawer pause/resume | M1 | R1, Survey |
| 2 | Anchor Navigation & Header Offset | Glides smoothly to target sections (`#who`, `#programs`, `#women`, `#recipes`, `#reviews`, `#faq`, `#book`/`#woocommerce`) with dynamic sticky header height compensation | M1 | R1, Survey |
| 3 | GSAP & ScrollTrigger Reveals | Hardware-accelerated batch reveals for recipe cards, program cards, who cards, women cards, step cards, section heads, and badges | M2 | R2, Survey |
| 4 | Smooth Accordion Expansion | WAAPI/GSAP height expansion and collapse for FAQ `<details>` with downstream `ScrollTrigger.refresh()` | M2 | R2, Survey |
| 5 | Organic Ambient Motion | Organic sine floating animations on hero badges and continuous smooth marquee condition ticker | M2 | R2, Survey |
| 6 | Tactile Micro-Interactions | Button hover shine sweep, card elevation/shadow lifts, interactive tab transitions, and recipe filter transitions | M2 | R2, Survey |
| 7 | Instagram Community Strip Banner | Dedicated community strip with `@nutrinance.wellbeing` handle, 25.9K+ follower badge, lifestyle preview cards, and direct follow link | M3 | R3, Survey |
| 8 | Global Instagram Link Consistency | Standardize all Instagram links (header, footer, community banner) to `https://www.instagram.com/nutrinance.wellbeing` with `target="_blank"` and `rel="noopener"` | M3 | R3, Survey |
| 9 | WhatsApp Floating CTA Polish | Entrance slide/fade reveal, subtle radar ripple/pulse animation, desktop hover label expansion, and mobile compact styling | M3 | R3, Survey |
| 10 | WhatsApp Form & Dynamic Links | Standardized URI encoding (`encodeURIComponent`) for 21+ dynamic `[data-wa]` links and structured multi-line `#bookForm` consultation validation | M3 | R3, Survey |
| 11 | Responsive Viewport Integrity | Strict zero horizontal overflow and responsive fluid grid across 360px - 820px and 1440px+ viewports | M4 | R4, Survey |
| 12 | Accessibility & ARIA Enhancements | Program tabs WAI-ARIA tablist/tab/tabpanel markup, form input `<label>` and `aria-invalid` states, high-contrast `:focus-visible` styling | M4 | R4, Survey |
| 13 | Prefers-Reduced-Motion Compliance | Dual-layer compliance: CSS instant visibility/reset and JS motion bypass/Lenis disable under `prefers-reduced-motion: reduce` | M4 | R4, Survey |
| 14 | Performance & Zero-CLS | 60fps GPU compositor rendering (`transform`, `opacity`), zero layout shifts (CLS < 0.1), explicit image dimensions, and lighthouse optimization | M4 | R4, Survey |
| 15 | E2E Testing Suite & Hardening | Automated multi-tier verification (Tiers 1-4) and white-box adversarial coverage hardening (Tier 5) | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Requirement-driven automated test suite across Tiers 1-4, publishing TEST_READY.md | none | DONE |
| M1 | Momentum Scrolling & Navigation | Sourcing Lenis/GSAP vendor assets, initializing Lenis synced to GSAP ticker, smooth anchor navigation with sticky header offset | none | DONE |
| M2 | Motion & Scroll-Driven Reveals | GSAP batch ScrollTrigger reveals, WAAPI smooth FAQ accordion, ambient floating hero badges, button shine and hover dynamics | M1 | DONE |
| M3 | Instagram & WhatsApp Engagement | Dedicated Instagram community strip banner, canonical @nutrinance.wellbeing links, WhatsApp radar pulse, and booking form polish | M1 | DONE |
| M4 | Responsiveness, A11y & Performance | Viewport matrix (360px–820px, 1440px+), zero-overflow, ARIA tabs/forms, high-contrast focus rings, reduced-motion overrides, 60fps/CLS | M2, M3 | DONE |
| M5 | Final Acceptance & Adversarial Hardening | Phase 1: Pass 100% E2E test suite (Tiers 1-4); Phase 2: Tier 5 adversarial testing & coverage audit (Clean Forensic Audit) | M4, E2E | DONE |

## Interface Contracts

### M1 (Scroll Engine) ↔ M2 (Motion) / M3 (Integrations) / M4 (A11y)
- Global `window.lenis`: Instance of Lenis available for scroll manipulation (`lenis.scrollTo(el, options)`, `lenis.stop()`, `lenis.start()`).
- GSAP Ticker Synchronization: `gsap.ticker.add((time) => { lenis.raf(time * 1000); })`.
- ScrollTrigger Notification: `lenis.on('scroll', ScrollTrigger.update)`.
- Scroll Containment Contract: Sub-scroll containers must carry `data-lenis-prevent="true"`.
- Dynamic Anchor Routing: Intercepts all `a[href^="#"]` and routes via `lenis.scrollTo(target, { offset: -(header.offsetHeight + 16) })`.

### M2 (Accordion/Tabs/Filters) ↔ ScrollTrigger
- Any height mutation (expanding/collapsing FAQ accordion, tab switching, recipe category filtering) MUST call `ScrollTrigger.refresh()`.

### M3 (WhatsApp & Social) ↔ DOM
- All dynamic WhatsApp links must use `[data-wa]` attribute or `#bookForm` submit listener.
- All Instagram links must target `https://www.instagram.com/nutrinance.wellbeing` with `target="_blank"` and `rel="noopener"`.

### M4 (A11y / Reduced Motion) ↔ Engine
- Media query `window.matchMedia('(prefers-reduced-motion: reduce)')` check:
  - If true: Lenis is NOT instantiated; all `.reveal`, `.who-card`, `.prog-card`, `.women-card`, `.recipe`, `.step`, `.transform` get `.in` or instant full opacity/transform reset.
  - CSS contains `animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important;`.

## Code Layout
- `index.html`: Primary document markup, vendor library inclusions (`assets/vendor/` and CDNs), semantic sections, community banner.
- `styles.css`: CSS tokens, reset, typography, responsive grids, hover micro-interactions, button shine, WhatsApp pulse, `:focus-visible`, reduced-motion overrides.
- `script.js`: Lenis + GSAP orchestration, anchor scroll handler, WAAPI accordion controller, tabs/filter logic, WhatsApp URL serialization, mobile nav drawer.
- `assets/vendor/`: Local vendor fallbacks (`lenis.min.js`, `lenis.css`, `gsap.min.js`, `ScrollTrigger.min.js`).
- `tests/`: Automated test harness, tier test runners, assertion suites (`run-e2e-tests.js`, `tier1` to `tier5` suites).
