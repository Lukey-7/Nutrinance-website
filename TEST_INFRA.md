# E2E Test Infra: Nutrinance Single-Page Website

## Test Philosophy
- **Opaque-box & Requirement-driven**: Derived directly from `ORIGINAL_REQUEST.md` and user specifications, evaluating the product as a real user/browser agent.
- **Methodology**: Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Testing, and Real-World Workload Testing.
- **Progressive Testability**: Verification works across DOM inspection, Playwright/Puppeteer browser automation, Node.js JSDOM / HTML parser tests, and visual rendering assertions.

## Feature Inventory & Tier Allocation
| # | Feature | Requirement Source | Tier 1 (Features) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) |
|---|---------|-------------------|:-----------------:|:-----------------:|:----------------------:|
| 1 | Lenis Momentum Scrolling | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Anchor Navigation & Header Offset | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | GSAP & ScrollTrigger Reveals | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 4 | Smooth Accordion Expansion | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 5 | Organic Ambient Motion | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 6 | Tactile Micro-Interactions | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Instagram Community Strip | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 8 | Canonical Instagram Links | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 9 | WhatsApp Floating CTA & Pulse | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 10 | WhatsApp Form & Dynamic Links | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ |
| 11 | Responsive Viewport Integrity | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 12 | Accessibility & ARIA Linkages | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 13 | Prefers-Reduced-Motion Overrides | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |
| 14 | 60fps & Zero-CLS Layout Flow | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ |

## Test Architecture
- **Runner**: Node.js automated test runner (`tests/run-e2e-tests.js`).
- **Harness**: Headless DOM & static analysis engine + browser emulation test cases.
- **Pass/Fail Semantics**: Exit code 0 on all tests passing; detailed JSON / terminal report with failure trace and tier summary.
- **Directory Layout**:
  - `tests/run-e2e-tests.js`: Main test orchestrator & CLI runner.
  - `tests/tier1-feature-coverage.test.js`: Tier 1 Feature Coverage (≥70 tests).
  - `tests/tier2-boundary-corner.test.js`: Tier 2 Boundary & Corner Cases (≥70 tests).
  - `tests/tier3-pairwise-combinations.test.js`: Tier 3 Cross-Feature Interactions (≥14 tests).
  - `tests/tier4-real-world-scenarios.test.js`: Tier 4 End-to-End User Journeys (≥7 tests).

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full New Client Discovery Journey | Navigation `#who` -> Explore `#programs` -> Switch tab to Gain -> Smooth Scroll -> WhatsApp Consultation CTA | High |
| 2 | Women's Health & Hormonal Inquiry | Nav `#women` -> PCOS Card -> Instagram Community Strip Follow -> Book Consultation Form Submission | High |
| 3 | Healthy Recipe Browsing & Macro Check | Nav `#recipes` -> Filter 'Dinner' -> Staggered Card Re-reveal -> Filter 'Dessert' -> Recipe Book WhatsApp Download | Medium |
| 4 | Mobile Navigation & FAQ Interaction | Viewport 390px -> Hamburger open -> Scroll lock check -> Nav click `#faq` -> Close drawer -> Expand accordion smooth animation | High |
| 5 | Accessibility & Motion Sensitivity | `prefers-reduced-motion: reduce` enabled -> Verify Lenis disabled -> Instant anchor jump -> Immediate card opacity -> Marquee stopped | High |
| 6 | Social Proof & Instagram Discovery | Hero 25.9K badge -> Community Strip click -> Footer social link -> Verification of canonical URL and security attributes | Medium |
| 7 | Multi-device Responsive Stress Test | Viewport resizing (360px -> 820px -> 1440px) -> Zero overflow check -> Touch target >=44px -> CLS measurement | High |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥70 test cases (5 per feature across 14 features)
- **Tier 2 (Boundary & Corner)**: ≥70 test cases (5 per feature across 14 features)
- **Tier 3 (Cross-Feature Combinations)**: ≥14 pairwise tests
- **Tier 4 (Real-World Scenarios)**: ≥7 full application journeys
- **Total Suite Minimum**: ≥161 test cases
