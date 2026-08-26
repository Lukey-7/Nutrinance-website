# Original User Request

## 2026-08-26T10:39:26+05:30

Enhance the Nutrinance single-page website with buttery-smooth momentum scrolling (Lenis), premium scroll-driven reveals (GSAP / ScrollTrigger), tactile micro-interactions, and integrated Instagram (@nutrinance.wellbeing) and WhatsApp engagement features.

Working directory: c:\Users\hp\Favorites\Test-site
Integrity mode: development

## Requirements

### R1. Smooth Momentum Scrolling
Integrate Lenis smooth scrolling for high-end, buttery-smooth page navigation across modern desktop and mobile browsers, ensuring native scroll anchor links (`#who`, `#programs`, `#women`, `#recipes`, `#reviews`, `#faq`, `#woocommerce`/`#book`) glide smoothly to target sections with sticky header height compensation.

### R2. High-Fidelity Motion & Scroll-Driven Reveals
Implement GSAP and ScrollTrigger (or hardware-accelerated CSS + JS animation pipelines) to create:
- Staggered entrances for recipe cards, program cards, and benefits.
- Elegant fade-up transitions for section headings and badge elements.
- Fluid hover dynamics with subtle scale, shadow elevation, and shine on CTA buttons and cards.
- Smooth expansion animations for FAQ accordions and tab panels.

### R3. Instagram & Social Community Integration
Feature @nutrinance.wellbeing prominently:
- Add a dedicated Instagram community strip / callout banner with follower count badge and direct follow link.
- Ensure all Instagram links point to https://www.instagram.com/nutrinance.wellbeing with target="_blank" and rel="noopener".
- Verify WhatsApp floating button and consultation forms have smooth pulse/entrance animations.

### R4. Accessibility, Responsiveness & Performance
- Ensure strict compliance with prefers-reduced-motion: reduce (instantly showing elements and disabling smooth scroll for users who request reduced motion).
- Prevent layout shifts (CLS < 0.1) and ensure smooth 60fps rendering on both mobile and desktop screens.
- Keep codebase lightweight and fast-loading.

## Acceptance Criteria

### Animation & Smooth Scroll Polish
- [ ] Lenis smooth scroll operates smoothly on mousewheel, trackpad, and keyboard navigation.
- [ ] Section anchor links in the header and navigation scroll smoothly to the exact section position without jumping.
- [ ] Hero floating badges and background elements have organic, subtle floating animations.
- [ ] Cards in the "Who We Help", "Programs", and "Recipes" sections animate into view with staggered reveals.
- [ ] FAQ accordions animate open and closed smoothly without abrupt snapping.

### Social Media & Links
- [ ] Instagram link in header, footer, and community banner reliably opens https://www.instagram.com/nutrinance.wellbeing.
- [ ] WhatsApp consultation buttons, floating chat, and booking form function smoothly with encoded messages.

3## Quality & Responsive Integrity
- [ ] Zero layout&jitter or horizontal scroll overflow on mobile viewports (360px - 820px) and wide screens (1440px+).
- [ ] Changes committed cleanly to the repository.