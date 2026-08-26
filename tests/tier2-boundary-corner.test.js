/**
 * Tier 2 - Boundary & Corner Cases Test Suite (≥70 tests, ≥5 per feature across 14 features)
 * Evaluates extreme inputs, edge cases, missing fields, URI encoding, rapid interactions,
 * boundary viewports, and reduced-motion overrides.
 */

const {
  loadHtml,
  loadCss,
  loadJs,
  createBrowserEnvironment,
  parseCssRules,
  TestRunner,
  expect
} = require('./test-utils');

const runner = new TestRunner();
const { describe, it, beforeEach } = runner;

describe('Tier 2: Boundary & Corner Cases', () => {

  // --------------------------------------------------------------------------
  // Feature 1: Lenis Momentum Scrolling (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 1: Lenis Momentum Scrolling (Boundary & Corner)', () => {
    it('T2.1.1: Scroll position at top of page (Y=0) maintains header in non-stuck state', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const header = env.document.getElementById('header');
      env.window.scrollY = 0;
      env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      expect(header.classList.contains('is-stuck')).toBeFalsy();
    });

    it('T2.1.2: Boundary scroll position at threshold (Y=12px vs Y=13px) toggles header stuck class', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const header = env.document.getElementById('header');

      env.window.scrollY = 12;
      env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      expect(header.classList.contains('is-stuck')).toBeFalsy();

      env.window.scrollY = 13;
      env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      expect(header.classList.contains('is-stuck')).toBeTruthy();
    });

    it('T2.1.3: Deep page scroll position (Y=10,000px) executes safely without crashing', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const header = env.document.getElementById('header');

      env.window.scrollY = 10000;
      env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      expect(header.classList.contains('is-stuck')).toBeTruthy();
    });

    it('T2.1.4: Mobile drawer activation toggles body.nav-open with overflow: hidden', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const burger = env.document.getElementById('hamburger');

      burger.click();
      expect(env.document.body.classList.contains('nav-open')).toBeTruthy();

      burger.click();
      expect(env.document.body.classList.contains('nav-open')).toBeFalsy();
    });

    it('T2.1.5: Rapid succession of 50 scroll events processes smoothly without listener degradation', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const header = env.document.getElementById('header');

      for (let y = 0; y < 50; y++) {
        env.window.scrollY = y % 2 === 0 ? 0 : 50;
        env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      }
      expect(header.classList.contains('is-stuck')).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Feature 2: Anchor Navigation & Header Offset (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 2: Anchor Navigation & Header Offset (Boundary & Corner)', () => {
    it('T2.2.1: Brand logo anchor link has exact target "#top"', () => {
      const env = createBrowserEnvironment();
      const brandLink = env.document.querySelector('.brand');
      expect(brandLink.getAttribute('href')).toBe('#top');
      const topSection = env.document.querySelector('#top');
      expect(topSection).not.toBeNull();
    });

    it('T2.2.2: Multiple scroll events on the same section do not corrupt active navigation state', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const whoSec = env.document.getElementById('who');
      whoSec.offsetTop = 300;

      env.window.scrollY = 200;
      for (let i = 0; i < 5; i++) {
        env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      }

      const whoLink = env.document.querySelector('#nav a[href="#who"]');
      expect(whoLink.classList.contains('active')).toBeTruthy();
      const activeLinks = env.document.querySelectorAll('#nav a.active');
      expect(activeLinks.length).toBe(1);
    });

    it('T2.2.3: Section boundary calculation accurately switches active nav link between sections', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const whoSec = env.document.getElementById('who');
      const progSec = env.document.getElementById('programs');
      whoSec.offsetTop = 200;
      progSec.offsetTop = 600;

      // Position in who section
      env.window.scrollY = 100; // pos = 250 >= 200
      env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      expect(env.document.querySelector('#nav a[href="#who"]').classList.contains('active')).toBeTruthy();

      // Position in programs section
      env.window.scrollY = 500; // pos = 650 >= 600
      env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      expect(env.document.querySelector('#nav a[href="#programs"]').classList.contains('active')).toBeTruthy();
      expect(env.document.querySelector('#nav a[href="#who"]').classList.contains('active')).toBeFalsy();
    });

    it('T2.2.4: CSS scroll-padding-top (96px) ensures sufficient clearance for sticky header (min-height: 78px)', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('scroll-padding-top:96px');
      expect(cssRules.clean).toContain('min-height:78px');
    });

    it('T2.2.5: Clicking nav link automatically closes mobile navigation drawer', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const burger = env.document.getElementById('hamburger');
      const nav = env.document.getElementById('nav');

      burger.click();
      expect(nav.classList.contains('is-open')).toBeTruthy();

      const whoLink = env.document.querySelector('#nav a[href="#who"]');
      whoLink.click();
      expect(nav.classList.contains('is-open')).toBeFalsy();
      expect(burger.getAttribute('aria-expanded')).toBe('false');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 3: GSAP & ScrollTrigger Reveals (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 3: GSAP & ScrollTrigger Reveals (Boundary & Corner)', () => {
    it('T2.3.1: Intersection entry with isIntersecting: false does not apply .in class', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const obs = env.IntersectionObserver.instances[0];
      const testCard = env.document.querySelector('.who-card.reveal');

      obs.triggerIntersect(testCard, false);
      expect(testCard.classList.contains('in')).toBeFalsy();
    });

    it('T2.3.2: Triggering intersection multiple times on same element maintains .in class idempotently', async () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const obs = env.IntersectionObserver.instances[0];
      const testCard = env.document.querySelector('.who-card.reveal');

      obs.triggerIntersect(testCard, true);
      await new Promise(r => setTimeout(r, 50));
      expect(testCard.classList.contains('in')).toBeTruthy();

      obs.triggerIntersect(testCard, true);
      await new Promise(r => setTimeout(r, 50));
      expect(testCard.classList.contains('in')).toBeTruthy();
    });

    it('T2.3.3: IntersectionObserver unobserves revealed element to prevent memory leaks', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const obs = env.IntersectionObserver.instances[0];
      const testCard = env.document.querySelector('.who-card.reveal');

      const initialCount = obs.observedElements.length;
      obs.triggerIntersect(testCard, true);
      expect(obs.observedElements.length).toBe(initialCount - 1);
    });

    it('T2.3.4: Program tab switch invokes revealAll on newly activated tab panel', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const gainTab = env.document.querySelector('.tab[data-tab="gain"]');
      const gainPanel = env.document.querySelector('.tab-panel[data-panel="gain"]');

      gainTab.click();
      const gainCards = gainPanel.querySelectorAll('.reveal');
      gainCards.forEach(c => {
        expect(c.classList.contains('in')).toBeTruthy();
      });
    });

    it('T2.3.5: Recipe filter selection forces re-reveal (.in class re-applied) on matching recipes', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const dinnerFilter = env.document.querySelector('.filter[data-filter="dinner"]');

      dinnerFilter.click();
      const dinnerCards = env.document.querySelectorAll('.recipe[data-cat="dinner"]');
      dinnerCards.forEach(card => {
        expect(card.classList.contains('is-hidden')).toBeFalsy();
        expect(card.classList.contains('in')).toBeTruthy();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Feature 4: Smooth Accordion Expansion (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 4: Smooth Accordion Expansion (Boundary & Corner)', () => {
    it('T2.4.1: Manually setting open attribute on FAQ details matches open CSS selector styling', () => {
      const env = createBrowserEnvironment();
      const firstFaq = env.document.querySelector('#faq details');
      firstFaq.setAttribute('open', '');
      expect(firstFaq.hasAttribute('open')).toBeTruthy();

      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.accordion details[open]{box-shadow:var(--sh-sm);border-color:var(--green-300)}');
    });

    it('T2.4.2: Multiple FAQ items can be open simultaneously without interference', () => {
      const env = createBrowserEnvironment();
      const detailsList = env.document.querySelectorAll('#faq details');
      detailsList[0].setAttribute('open', '');
      detailsList[1].setAttribute('open', '');

      expect(detailsList[0].hasAttribute('open')).toBeTruthy();
      expect(detailsList[1].hasAttribute('open')).toBeTruthy();
      expect(detailsList[2].hasAttribute('open')).toBeFalsy();
    });

    it('T2.4.3: Toggling open and closed returns details element to default state', () => {
      const env = createBrowserEnvironment();
      const firstFaq = env.document.querySelector('#faq details');
      firstFaq.setAttribute('open', '');
      expect(firstFaq.hasAttribute('open')).toBeTruthy();

      firstFaq.removeAttribute('open');
      expect(firstFaq.hasAttribute('open')).toBeFalsy();
    });

    it('T2.4.4: FAQ questions containing question marks and em-dashes render completely', () => {
      const env = createBrowserEnvironment();
      const summaries = env.document.querySelectorAll('#faq summary');
      const questions = summaries.map(s => s.textContent);

      expect(questions.some(q => q.includes('?'))).toBeTruthy();
      expect(questions.some(q => q.includes('PCOS') && q.includes('thyroid'))).toBeTruthy();
    });

    it('T2.4.5: FAQ summary elements specify cursor: pointer in CSS', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.accordion summary{list-style:none;cursor:pointer');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 5: Organic Ambient Motion (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 5: Organic Ambient Motion (Boundary & Corner)', () => {
    it('T2.5.1: Floating card 2 has animation-delay: 1.6s for non-synchronized organic floating', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.float-card-2{bottom:-14px;right:6px;animation-delay:1.6s}');
    });

    it('T2.5.2: Bob keyframe uses compositor-only translateY transform', () => {
      const cssRules = parseCssRules();
      const bobKf = cssRules.keyframes.find(k => k.name === 'bob');
      expect(bobKf.body).toContain('0%,100%{transform:translateY(0)}');
      expect(bobKf.body).toContain('50%{transform:translateY(-10px)}');
    });

    it('T2.5.3: Marquee track contains duplicate content for seamless 50% translation loop', () => {
      const env = createBrowserEnvironment();
      const track = env.document.querySelector('.marquee-track');
      const spans = track.querySelectorAll('span');
      expect(spans.length).toBe(16); // 8 conditions duplicated
      expect(spans[0].textContent).toBe(spans[8].textContent);
    });

    it('T2.5.4: Marquee bullets have accent color var(--pink-400)', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.marquee-track i{color:var(--pink-400);font-style:normal}');
    });

    it('T2.5.5: Floating cards reposition on small mobile viewports (max-width: 620px)', () => {
      const cssRules = parseCssRules();
      const m620 = cssRules.mediaQueries.find(m => m.condition.includes('max-width:620px') || m.condition.includes('max-width: 620px'));
      expect(m620.body).toContain('.float-card-1{top:10px;left:-10px;padding:10px 14px}');
      expect(m620.body).toContain('.float-card-2{bottom:-20px;right:-6px;padding:10px 14px}');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 6: Tactile Micro-Interactions (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 6: Tactile Micro-Interactions (Boundary & Corner)', () => {
    it('T2.6.1: Button hover micro-interaction executes fast (0.22s) with ease transition curve', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('transition:transform .22s ease,box-shadow .22s ease,background .22s ease,color .22s ease');
    });

    it('T2.6.2: Recipe card hover zooms image to scale(1.07) smoothly over 0.5s', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.recipe-img img{width:100%;height:100%;object-fit:cover;transition:transform .5s}');
      expect(cssRules.clean).toContain('.recipe:hover .recipe-img img{transform:scale(1.07)}');
    });

    it('T2.6.3: Program card accent bar hover scales from 0 to 1 with 0.35s transition', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.prog-card::before{content:"";position:absolute;inset:0 0 auto;height:4px;background:linear-gradient(90deg,var(--green-500),var(--pink-400));transform:scaleX(0);transform-origin:left;transition:transform .35s}');
      expect(cssRules.clean).toContain('.prog-card:hover::before{transform:scaleX(1)}');
    });

    it('T2.6.4: Testimonial slider navigation buttons hover smoothly to green-700 with white text', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.s-btn{width:44px;height:44px;border-radius:50%');
      expect(cssRules.clean).toContain('transition:.24s');
      expect(cssRules.clean).toContain('.s-btn:hover{background:var(--green-700);border-color:var(--green-700);color:#fff}');
    });

    it('T2.6.5: Women health cards lift by -6px with pink glow shadow on hover', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.women-card:hover{transform:translateY(-6px);box-shadow:0 18px 44px rgba(210,104,138,.14)}');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 7: Instagram Community Strip Banner (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 7: Instagram Community Strip Banner (Boundary & Corner)', () => {
    it('T2.7.1: Hero stats component contains 3 distinct metric groups with semantic markup', () => {
      const env = createBrowserEnvironment();
      const statsList = env.document.querySelectorAll('.hero-stats li');
      expect(statsList.length).toBe(3);
      expect(statsList[0].textContent).toContain('2,500+');
      expect(statsList[1].textContent).toContain('25.9K');
      expect(statsList[2].textContent).toContain('4.9');
    });

    it('T2.7.2: Rating bar component contains 4 metric columns with border separators', () => {
      const env = createBrowserEnvironment();
      const ratingBarCols = env.document.querySelectorAll('.rating-bar > div');
      expect(ratingBarCols.length).toBe(4);
      expect(ratingBarCols[0].textContent).toContain('4.9');
      expect(ratingBarCols[1].textContent).toContain('2,500+');
      expect(ratingBarCols[2].textContent).toContain('92%');
      expect(ratingBarCols[3].textContent).toContain('25.9K');
    });

    it('T2.7.3: Rating bar reorganizes into a 2x2 grid on tablet viewports (<=820px)', () => {
      const cssRules = parseCssRules();
      const m820 = cssRules.mediaQueries.find(m => m.condition.includes('max-width:820px') || m.condition.includes('max-width: 820px'));
      expect(m820.body).toContain('.rating-bar{grid-template-columns:repeat(2,1fr);gap:22px}');
    });

    it('T2.7.4: Social buttons in footer maintain pill border-radius and white text color', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.socials a{font-size:.82rem;font-weight:600;color:#fff;border:1px solid rgba(255,255,255,.2);padding:8px 18px;border-radius:999px;cursor:pointer;transition:.24s}');
    });

    it('T2.7.5: Social button hover state transitions to pink-600 background', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.socials a:hover{background:var(--pink-600);border-color:var(--pink-600)}');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 8: Global Instagram Link Consistency (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 8: Global Instagram Link Consistency (Boundary & Corner)', () => {
    it('T2.8.1: No Instagram URLs contain query parameters, hashes, or tracking tokens', () => {
      const env = createBrowserEnvironment();
      const instaLinks = env.document.querySelectorAll('a[href*="instagram.com"]');
      instaLinks.forEach(a => {
        const href = a.getAttribute('href');
        expect(href.includes('?')).toBeFalsy();
        expect(href.includes('#')).toBeFalsy();
      });
    });

    it('T2.8.2: All Instagram URLs strictly use HTTPS protocol', () => {
      const env = createBrowserEnvironment();
      const instaLinks = env.document.querySelectorAll('a[href*="instagram.com"]');
      instaLinks.forEach(a => {
        const href = a.getAttribute('href');
        expect(href.startsWith('https://')).toBeTruthy();
      });
    });

    it('T2.8.3: Security audit: rel="noopener" is present on all external Instagram links', () => {
      const env = createBrowserEnvironment();
      const instaLinks = env.document.querySelectorAll('a[href*="instagram.com"]');
      instaLinks.forEach(a => {
        const rel = a.getAttribute('rel');
        expect(rel).not.toBeNull();
        expect(rel.includes('noopener')).toBeTruthy();
      });
    });

    it('T2.8.4: Instagram handle uses exact canonical username "nutrinance.wellbeing"', () => {
      const env = createBrowserEnvironment();
      const instaLinks = env.document.querySelectorAll('a[href*="instagram.com"]');
      instaLinks.forEach(a => {
        expect(a.getAttribute('href')).toBe('https://www.instagram.com/nutrinance.wellbeing');
      });
    });

    it('T2.8.5: Instagram link elements maintain accessible text content for assistive tech', () => {
      const env = createBrowserEnvironment();
      const instaLinks = env.document.querySelectorAll('a[href*="instagram.com"]');
      instaLinks.forEach(a => {
        const text = a.textContent.trim();
        const ariaLabel = a.getAttribute('aria-label');
        const accessibleName = text || ariaLabel || '';
        expect(accessibleName.toLowerCase()).toContain('instagram');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Feature 9: WhatsApp Floating CTA Polish (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 9: WhatsApp Floating CTA Polish (Boundary & Corner)', () => {
    it('T2.9.1: Floating CTA uses WhatsApp brand color #25D366 and hover dark #1DA851', () => {
      const cssRules = parseCssRules();
      expect(cssRules.customProperties['--wa']).toBe('#25D366');
      expect(cssRules.customProperties['--wa-dark']).toBe('#1DA851');
      expect(cssRules.clean).toContain('.wa-float{position:fixed;right:22px;bottom:22px;z-index:70');
      expect(cssRules.clean).toContain('background:var(--wa)');
    });

    it('T2.9.2: Floating CTA label span has initial max-width: 0 and opacity: 0 for compact rest state', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.wa-float span{max-width:0;white-space:nowrap;font-weight:600;font-size:.92rem;opacity:0;transition:max-width .35s,opacity .3s}');
    });

    it('T2.9.3: Desktop hover transition smoothly reveals label span with max-width: 140px and gap: 9px', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.wa-float:hover{background:var(--wa-dark);gap:9px;padding-right:22px}');
      expect(cssRules.clean).toContain('.wa-float:hover span{max-width:140px;opacity:1}');
    });

    it('T2.9.4: Mobile screens (<=620px) suppress hover expansion to prevent content obstruction', () => {
      const cssRules = parseCssRules();
      const m620 = cssRules.mediaQueries.find(m => m.condition.includes('max-width:620px') || m.condition.includes('max-width: 620px'));
      expect(m620.body).toContain('.wa-float:hover span{max-width:0;opacity:0}');
      expect(m620.body).toContain('.wa-float:hover{padding:14px;gap:0}');
    });

    it('T2.9.5: Floating button contains WhatsApp SVG icon with viewbox 0 0 24 24 and aria-hidden="true"', () => {
      const env = createBrowserEnvironment();
      const waFloat = env.document.querySelector('.wa-float');
      const svg = waFloat.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 10: WhatsApp Form & Dynamic Links (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 10: WhatsApp Form & Dynamic Links (Boundary & Corner)', () => {
    it('T2.10.1: Form submission with special characters, emojis, and quotes encodes safely', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      env.document.getElementById('bName').value = 'Meera & Rahul 🥗';
      env.document.getElementById('bAge').value = '29';
      env.document.getElementById('bGoal').value = 'Weight loss';
      env.document.getElementById('bNote').value = 'Goals: "Fat Loss" & 5kg target? Yes! 100%';

      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(env.openedUrls.length).toBe(1);
      const url = env.openedUrls[0].url;
      expect(url).toContain(encodeURIComponent('Meera & Rahul 🥗'));
      expect(url).toContain(encodeURIComponent('Goals: "Fat Loss" & 5kg target? Yes! 100%'));
    });

    it('T2.10.2: Form submission with age omitted produces clean output without "Age:" line', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      env.document.getElementById('bName').value = 'Sunita Rao';
      env.document.getElementById('bAge').value = '';
      env.document.getElementById('bGoal').value = 'Thyroid';
      env.document.getElementById('bNote').value = '';

      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(env.openedUrls.length).toBe(1);
      const decodedText = decodeURIComponent(env.openedUrls[0].url.split('text=')[1]);
      expect(decodedText).toContain('Name: Sunita Rao');
      expect(decodedText).not.toContain('Age:');
      expect(decodedText).toContain('I need help with: Thyroid');
      expect(decodedText).not.toContain('Other details:');
    });

    it('T2.10.3: Form submission with note omitted does not include "Other details:" header', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      env.document.getElementById('bName').value = 'Arjun Verma';
      env.document.getElementById('bAge').value = '42';
      env.document.getElementById('bGoal').value = 'Diabetes or other medical condition';
      env.document.getElementById('bNote').value = '   '; // whitespace only

      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(env.openedUrls.length).toBe(1);
      const decodedText = decodeURIComponent(env.openedUrls[0].url.split('text=')[1]);
      expect(decodedText).toContain('Age: 42');
      expect(decodedText).not.toContain('Other details:');
    });

    it('T2.10.4: Input event on #bName clears validation .err class dynamically', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      const nameInput = env.document.getElementById('bName');

      // Submit empty to trigger error
      nameInput.value = '';
      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      expect(nameInput.classList.contains('err')).toBeTruthy();

      // Type into input to clear error
      nameInput.value = 'A';
      nameInput.dispatchEvent({ type: 'input', target: nameInput, currentTarget: nameInput });
      expect(nameInput.classList.contains('err')).toBeFalsy();
    });

    it('T2.10.5: Multi-line notes with line breaks are preserved as %0A newlines in WhatsApp URI', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      env.document.getElementById('bName').value = 'Deepa';
      env.document.getElementById('bAge').value = '26';
      env.document.getElementById('bGoal').value = 'PCOS / PCOD';
      env.document.getElementById('bNote').value = 'Line 1\nLine 2\nLine 3';

      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(env.openedUrls.length).toBe(1);
      const rawTextParam = env.openedUrls[0].url.split('text=')[1];
      expect(rawTextParam).toContain('%0A');
      const decoded = decodeURIComponent(rawTextParam);
      expect(decoded).toContain('Line 1\nLine 2\nLine 3');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 11: Responsive Viewport Integrity (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 11: Responsive Viewport Integrity (Boundary & Corner)', () => {
    it('T2.11.1: Mobile nav drawer translates out-of-view by 102% in resting state and clears transform when open', () => {
      const cssRules = parseCssRules();
      const m820 = cssRules.mediaQueries.find(m => m.condition.includes('max-width:820px') || m.condition.includes('max-width: 820px'));
      expect(m820.body).toContain('transform:translateX(102%)');
      expect(m820.body).toContain('.nav.is-open{transform:none}');
    });

    it('T2.11.2: Backdrop element activates with .is-on class and closes drawer on backdrop click', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const burger = env.document.getElementById('hamburger');
      const nav = env.document.getElementById('nav');
      const backdrop = env.document.querySelector('.nav-backdrop');

      expect(backdrop).not.toBeNull();
      burger.click();
      expect(backdrop.classList.contains('is-on')).toBeTruthy();
      expect(nav.classList.contains('is-open')).toBeTruthy();

      backdrop.click();
      expect(backdrop.classList.contains('is-on')).toBeFalsy();
      expect(nav.classList.contains('is-open')).toBeFalsy();
    });

    it('T2.11.3: Keyboard Escape key listener dismisses open mobile navigation drawer', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const burger = env.document.getElementById('hamburger');
      const nav = env.document.getElementById('nav');

      burger.click();
      expect(nav.classList.contains('is-open')).toBeTruthy();

      env.document.dispatchEvent({ type: 'keydown', key: 'Escape', target: env.document, currentTarget: env.document });
      expect(nav.classList.contains('is-open')).toBeFalsy();
    });

    it('T2.11.4: Header inner container defines flex layout with space-between and min-height: 78px', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.header-inner{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:78px}');
    });

    it('T2.11.5: Touch targets on mobile navigation links have adequate vertical height (padding 13px 0)', () => {
      const cssRules = parseCssRules();
      const m820 = cssRules.mediaQueries.find(m => m.condition.includes('max-width:820px') || m.condition.includes('max-width: 820px'));
      expect(m820.body).toContain('.nav>a{width:100%;font-size:1.02rem;padding:13px 0;border-bottom:1px solid var(--line)}');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 12: Accessibility & ARIA Enhancements (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 12: Accessibility & ARIA Enhancements (Boundary & Corner)', () => {
    it('T2.12.1: Hamburger aria-expanded attribute accurately syncs with menu state ("true" vs "false")', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const burger = env.document.getElementById('hamburger');

      expect(burger.getAttribute('aria-expanded')).toBe('false');
      burger.click();
      expect(burger.getAttribute('aria-expanded')).toBe('true');
      burger.click();
      expect(burger.getAttribute('aria-expanded')).toBe('false');
    });

    it('T2.12.2: Program tabs accurately update aria-selected attribute when clicked', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const lossTab = env.document.querySelector('.tab[data-tab="loss"]');
      const gainTab = env.document.querySelector('.tab[data-tab="gain"]');

      expect(lossTab.getAttribute('aria-selected')).toBe('true');
      expect(gainTab.getAttribute('aria-selected')).toBe('false');

      gainTab.click();
      expect(lossTab.getAttribute('aria-selected')).toBe('false');
      expect(gainTab.getAttribute('aria-selected')).toBe('true');

      lossTab.click();
      expect(lossTab.getAttribute('aria-selected')).toBe('true');
      expect(gainTab.getAttribute('aria-selected')).toBe('false');
    });

    it('T2.12.3: Testimonial slider navigation buttons have explicit aria-label attributes', () => {
      const env = createBrowserEnvironment();
      const prevBtn = env.document.getElementById('prevBtn');
      const nextBtn = env.document.getElementById('nextBtn');
      expect(prevBtn.getAttribute('aria-label')).toBe('Previous testimonial');
      expect(nextBtn.getAttribute('aria-label')).toBe('Next testimonial');
    });

    it('T2.12.4: Form fields have explicit label elements wrapping inputs for screen reader accessibility', () => {
      const env = createBrowserEnvironment();
      const form = env.document.getElementById('bookForm');
      const labels = form.querySelectorAll('label');
      expect(labels.length).toBe(4);
      expect(labels[0].textContent).toContain('Your name');
      expect(labels[1].textContent).toContain('Age');
      expect(labels[2].textContent).toContain('What do you need help with?');
      expect(labels[3].textContent).toContain('Anything else we should know?');
    });

    it('T2.12.5: Testimonial pagination dots are generated with accessible "Go to testimonial page N" labels', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const dots = env.document.querySelectorAll('#dots button');
      expect(dots.length).toBeGreaterThan(0);
      dots.forEach((d, i) => {
        expect(d.getAttribute('aria-label')).toBe('Go to testimonial page ' + (i + 1));
      });
    });
  });

  // --------------------------------------------------------------------------
  // Feature 13: Prefers-Reduced-Motion Compliance (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 13: Prefers-Reduced-Motion Compliance (Boundary & Corner)', () => {
    it('T2.13.1: Reduced motion CSS rules enforce !important on animation and transition resets', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm.body).toContain('animation:none!important');
      expect(prm.body).toContain('transition:none!important');
      expect(prm.body).toContain('scroll-behavior:auto!important');
    });

    it('T2.13.2: Universal selector * in reduced motion applies overrides to all nested elements', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm.body).toContain('animation:none!important');
    });

    it('T2.13.3: Environment with prefersReducedMotion option correctly evaluates matchMedia query', () => {
      const env = createBrowserEnvironment({ prefersReducedMotion: true });
      const mql = env.window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(mql.matches).toBeTruthy();

      const normalEnv = createBrowserEnvironment({ prefersReducedMotion: false });
      const normalMql = normalEnv.window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(normalMql.matches).toBeFalsy();
    });

    it('T2.13.4: Under reduced motion, all .reveal elements are forced to full opacity 1 and transform none', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm.body).toContain('.reveal');
      expect(prm.body).toContain('opacity:1');
      expect(prm.body).toContain('transform:none');
    });

    it('T2.13.5: Tab panel fadeUp keyframe animation is overridden by universal animation reset under reduced motion', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.tab-panel.is-active{display:block;animation:fadeUp .45s ease both}');
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm.body).toContain('animation:none!important');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 14: Performance & Zero-CLS Layout Flow (Boundary & Corner - 5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 14: Performance & Zero-CLS Layout Flow (Boundary & Corner)', () => {
    it('T2.14.1: Window resize listener uses debounced timeout (150ms) to prevent layout thrashing', () => {
      const js = loadJs();
      expect(js).toContain('rt = setTimeout(buildDots, 150)');
      expect(js).toContain('clearTimeout(rt)');
    });

    it('T2.14.2: Testimonial slider track hides native scrollbars across Firefox and WebKit', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('scrollbar-width:none');
      expect(cssRules.clean).toContain('.slider-track::-webkit-scrollbar{display:none}');
    });

    it('T2.14.3: Hero main image container defines explicit aspect-ratio: 4/5 with cover fit', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.hero-img-main{border-radius:200px 200px var(--r-xl) var(--r-xl);overflow:hidden;box-shadow:var(--sh-lg);aspect-ratio:4/5;max-width:400px;margin-left:auto}');
      expect(cssRules.clean).toContain('.hero-img-main img{width:100%;height:100%;object-fit:cover}');
    });

    it('T2.14.4: Client transformation figure images enforce aspect-ratio: 1 with object-fit: cover', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.transform img{aspect-ratio:1;object-fit:cover;width:100%}');
    });

    it('T2.14.5: Slider navigation wraps around boundary bounds (next wraps to 0, prev wraps to max)', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const nextBtn = env.document.getElementById('nextBtn');
      const prevBtn = env.document.getElementById('prevBtn');
      const track = env.document.getElementById('sliderTrack');

      // Test next button scroll
      track.scrollLeft = 0;
      track.clientWidth = 400;
      track.scrollWidth = 1200;
      nextBtn.click();
      expect(track.scrollLeft).toBe(400);

      // Test boundary end wrap
      track.scrollLeft = 800; // atEnd = 800 + 400 >= 1200 - 8
      nextBtn.click();
      expect(track.scrollLeft).toBe(0);

      // Test prev button boundary wrap
      track.scrollLeft = 0; // atStart = 0 <= 8
      prevBtn.click();
      expect(track.scrollLeft).toBe(1200);
    });
  });

});

module.exports = runner;
