/**
 * Tier 1 - Feature Coverage Test Suite (≥70 tests, ≥5 per feature across 14 features)
 * Evaluates semantic structure, initial state, DOM attributes, CSS rules, and base behaviors.
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

describe('Tier 1: Feature Coverage', () => {

  // --------------------------------------------------------------------------
  // Feature 1: Lenis Smooth Momentum Scrolling (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 1: Lenis Momentum Scrolling', () => {
    it('T1.1.1: HTML root has smooth scrolling and scroll padding top configured', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('scroll-behavior:smooth');
      expect(cssRules.clean).toContain('scroll-padding-top:96px');
    });

    it('T1.1.2: Body element has overflow-x hidden and antialiased font smoothing', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('overflow-x:hidden');
      expect(cssRules.clean).toContain('-webkit-font-smoothing:antialiased');
    });

    it('T1.1.3: Window scroll event is bound with passive listener flag', () => {
      const js = loadJs();
      expect(js).toContain('window.addEventListener("scroll"');
      expect(js).toContain('passive: true');
    });

    it('T1.1.4: Testimonial slider track has smooth scroll behavior and x-axis scroll snap', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('overflow-x:auto');
      expect(cssRules.clean).toContain('scroll-snap-type:x mandatory');
      expect(cssRules.clean).toContain('scroll-behavior:smooth');
    });

    it('T1.1.5: Sticky header updates state synchronously on scroll past threshold', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const header = env.document.getElementById('header');
      expect(header.classList.contains('is-stuck')).toBeFalsy();

      env.window.scrollY = 25;
      env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
      expect(header.classList.contains('is-stuck')).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Feature 2: Anchor Navigation & Header Offset (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 2: Anchor Navigation & Header Offset', () => {
    it('T1.2.1: All primary nav anchor links target valid section IDs in the DOM', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const navLinks = env.document.querySelectorAll('#nav a[href^="#"]');
      expect(navLinks.length).toBeGreaterThan(4);
      navLinks.forEach(link => {
        const hash = link.getAttribute('href');
        const targetSection = env.document.querySelector(hash);
        expect(targetSection).toBeDefined();
        expect(targetSection).not.toBeNull();
      });
    });

    it('T1.2.2: Brand logo link points to #top with accessible home label', () => {
      const env = createBrowserEnvironment();
      const brand = env.document.querySelector('.brand');
      expect(brand).not.toBeNull();
      expect(brand.getAttribute('href')).toBe('#top');
      expect(brand.getAttribute('aria-label')).toBe('Nutrinance home');
    });

    it('T1.2.3: Sticky header CSS specifies sticky positioning with top 0 and high z-index', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('position:sticky');
      expect(cssRules.clean).toContain('top:0');
      expect(cssRules.clean).toContain('z-index:60');
    });

    it('T1.2.4: Active navigation state highlights current section on scroll position', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const whoSec = env.document.getElementById('who');
      whoSec.offsetTop = 300;
      env.window.scrollY = 200;
      env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });

      const whoLink = env.document.querySelector('#nav a[href="#who"]');
      expect(whoLink.classList.contains('active')).toBeTruthy();
    });

    it('T1.2.5: Hero explore CTA anchor link points to #programs', () => {
      const env = createBrowserEnvironment();
      const heroExplore = env.document.querySelector('.hero-actions a[href="#programs"]');
      expect(heroExplore).not.toBeNull();
      expect(heroExplore.textContent).toContain('Explore programs');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 3: GSAP & ScrollTrigger Reveals (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 3: GSAP & ScrollTrigger Reveals', () => {
    it('T1.3.1: Key section headings, hero copy, and content blocks carry .reveal class', () => {
      const env = createBrowserEnvironment();
      const reveals = env.document.querySelectorAll('.reveal');
      expect(reveals.length).toBeGreaterThan(20);
      expect(env.document.querySelector('.hero-copy').classList.contains('reveal')).toBeTruthy();
      expect(env.document.querySelector('.hero-media').classList.contains('reveal')).toBeTruthy();
    });

    it('T1.3.2: Content cards (who, programs, women, steps, recipes) carry .reveal class', () => {
      const env = createBrowserEnvironment();
      const whoCards = env.document.querySelectorAll('.who-card.reveal');
      const progCards = env.document.querySelectorAll('.prog-card.reveal');
      const womenCards = env.document.querySelectorAll('.women-card.reveal');
      const stepCards = env.document.querySelectorAll('.step.reveal');
      const recipes = env.document.querySelectorAll('.recipe.reveal');

      expect(whoCards.length).toBe(4);
      expect(progCards.length).toBeGreaterThan(10);
      expect(womenCards.length).toBe(6);
      expect(stepCards.length).toBe(4);
      expect(recipes.length).toBe(16);
    });

    it('T1.3.3: IntersectionObserver registers all .reveal elements on page load', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const instances = env.IntersectionObserver.instances;
      expect(instances.length).toBeGreaterThan(0);
      const observer = instances[0];
      expect(observer.observedElements.length).toBeGreaterThan(20);
    });

    it('T1.3.4: CSS defines initial hidden state for .reveal (opacity 0, translateY offset)', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.reveal{opacity:0;transform:translateY(22px)}');
    });

    it('T1.3.5: CSS defines active visible state for .reveal.in with cubic-bezier transition', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.reveal.in{opacity:1;transform:none');
      expect(cssRules.clean).toContain('cubic-bezier(.22,.8,.3,1)');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 4: Smooth Accordion Expansion (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 4: Smooth Accordion Expansion', () => {
    it('T1.4.1: FAQ section contains semantic accordion container and details elements', () => {
      const env = createBrowserEnvironment();
      const faqSec = env.document.getElementById('faq');
      expect(faqSec).not.toBeNull();
      const detailsList = faqSec.querySelectorAll('details');
      expect(detailsList.length).toBe(6);
    });

    it('T1.4.2: FAQ items are closed by default (none carry open attribute)', () => {
      const env = createBrowserEnvironment();
      const detailsList = env.document.querySelectorAll('#faq details');
      detailsList.forEach(d => {
        expect(d.hasAttribute('open')).toBeFalsy();
      });
    });

    it('T1.4.3: Every FAQ item contains a summary element with clear question text', () => {
      const env = createBrowserEnvironment();
      const summaries = env.document.querySelectorAll('#faq summary');
      expect(summaries.length).toBe(6);
      summaries.forEach(s => {
        expect(s.textContent.trim().length).toBeGreaterThan(10);
      });
    });

    it('T1.4.4: Every FAQ item contains a paragraph with substantive answer text', () => {
      const env = createBrowserEnvironment();
      const answers = env.document.querySelectorAll('#faq details p');
      expect(answers.length).toBe(6);
      answers.forEach(p => {
        expect(p.textContent.trim().length).toBeGreaterThan(20);
      });
    });

    it('T1.4.5: CSS defines visual styling for open details and accordion indicators', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.accordion details[open]');
      expect(cssRules.clean).toContain('.accordion summary::after{content:"+"');
      expect(cssRules.clean).toContain('.accordion details[open] summary::after{content:"\\2013"}');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 5: Organic Ambient Motion (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 5: Organic Ambient Motion', () => {
    it('T1.5.1: Hero section contains floating badges float-card-1 and float-card-2', () => {
      const env = createBrowserEnvironment();
      const fc1 = env.document.querySelector('.float-card-1');
      const fc2 = env.document.querySelector('.float-card-2');
      expect(fc1).not.toBeNull();
      expect(fc2).not.toBeNull();
      expect(fc1.textContent).toContain('Desi meal plans');
      expect(fc2.textContent).toContain('Daily WhatsApp support');
    });

    it('T1.5.2: Hero background contains decorative ambient gradient blobs', () => {
      const env = createBrowserEnvironment();
      const blob1 = env.document.querySelector('.blob-1');
      const blob2 = env.document.querySelector('.blob-2');
      expect(blob1).not.toBeNull();
      expect(blob2).not.toBeNull();
    });

    it('T1.5.3: CSS defines bob keyframe animation for floating cards with infinite loop', () => {
      const cssRules = parseCssRules();
      const bobKf = cssRules.keyframes.find(k => k.name === 'bob');
      expect(bobKf).toBeDefined();
      expect(bobKf.body).toContain('translateY(-10px)');
      expect(cssRules.clean).toContain('animation:bob 5s ease-in-out infinite');
    });

    it('T1.5.4: Marquee ticker exists with aria-hidden="true" and repeating condition tags', () => {
      const env = createBrowserEnvironment();
      const marquee = env.document.querySelector('.marquee');
      expect(marquee).not.toBeNull();
      expect(marquee.getAttribute('aria-hidden')).toBe('true');
      const track = marquee.querySelector('.marquee-track');
      expect(track).not.toBeNull();
      expect(track.textContent).toContain('Weight Loss');
      expect(track.textContent).toContain('PCOS & PCOD Care');
      expect(track.textContent).toContain('Thyroid Support');
    });

    it('T1.5.5: CSS defines slide keyframe animation for continuous marquee translation', () => {
      const cssRules = parseCssRules();
      const slideKf = cssRules.keyframes.find(k => k.name === 'slide');
      expect(slideKf).toBeDefined();
      expect(slideKf.body).toContain('translateX(-50%)');
      expect(cssRules.clean).toContain('animation:slide 34s linear infinite');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 6: Tactile Micro-Interactions (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 6: Tactile Micro-Interactions', () => {
    it('T1.6.1: Button hover styles specify translateY lift and smooth transitions', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.btn:hover{transform:translateY(-2px)}');
      expect(cssRules.clean).toContain('transition:transform .22s ease');
    });

    it('T1.6.2: Who We Help cards elevate on hover with box-shadow and border-color change', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.who-card:hover{transform:translateY(-8px)');
      expect(cssRules.clean).toContain('box-shadow:var(--sh)');
    });

    it('T1.6.3: Program cards feature gradient top accent bar scaling on hover', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.prog-card::before');
      expect(cssRules.clean).toContain('transform:scaleX(0)');
      expect(cssRules.clean).toContain('.prog-card:hover::before{transform:scaleX(1)}');
    });

    it('T1.6.4: Program tab buttons transition smoothly into active state with shadow', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.tab.is-active{background:var(--green-700)');
      expect(cssRules.clean).toContain('box-shadow:0 10px 24px rgba(31,90,64,.22)');
    });

    it('T1.6.5: Recipe filter buttons transition smoothly into active state with pink accent', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.filter.is-active{background:var(--pink-600)');
      expect(cssRules.clean).toContain('box-shadow:0 8px 20px rgba(210,104,138,.26)');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 7: Instagram Community Strip Banner (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 7: Instagram Community Strip Banner', () => {
    it('T1.7.1: Hero stats section displays 25.9K Instagram family metric', () => {
      const env = createBrowserEnvironment();
      const heroStats = env.document.querySelector('.hero-stats');
      expect(heroStats).not.toBeNull();
      expect(heroStats.textContent).toContain('25.9K');
      expect(heroStats.textContent).toContain('Instagram family');
    });

    it('T1.7.2: Testimonial rating bar displays 25.9K Instagram community metric', () => {
      const env = createBrowserEnvironment();
      const ratingBar = env.document.querySelector('.rating-bar');
      expect(ratingBar).not.toBeNull();
      expect(ratingBar.textContent).toContain('25.9K');
      expect(ratingBar.textContent).toContain('Instagram community');
    });

    it('T1.7.3: Footer contains dedicated social link for Instagram', () => {
      const env = createBrowserEnvironment();
      const footerSocial = env.document.querySelector('.footer .socials a[href*="instagram.com"]');
      expect(footerSocial).not.toBeNull();
      expect(footerSocial.textContent).toContain('Instagram');
    });

    it('T1.7.4: Instagram social link carries explicit aria-label for accessibility', () => {
      const env = createBrowserEnvironment();
      const instaLink = env.document.querySelector('.socials a[href*="instagram.com"]');
      expect(instaLink.getAttribute('aria-label')).toBe('Instagram');
    });

    it('T1.7.5: CSS defines pill button styling and hover state for social links', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.socials a{');
      expect(cssRules.clean).toContain('border-radius:999px');
      expect(cssRules.clean).toContain('.socials a:hover{background:var(--pink-600)');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 8: Global Instagram Link Consistency (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 8: Global Instagram Link Consistency', () => {
    it('T1.8.1: All Instagram links match canonical URL https://www.instagram.com/nutrinance.wellbeing', () => {
      const env = createBrowserEnvironment();
      const instaLinks = env.document.querySelectorAll('a[href*="instagram"]');
      expect(instaLinks.length).toBeGreaterThan(0);
      instaLinks.forEach(a => {
        expect(a.getAttribute('href')).toBe('https://www.instagram.com/nutrinance.wellbeing');
      });
    });

    it('T1.8.2: All Instagram links specify target="_blank"', () => {
      const env = createBrowserEnvironment();
      const instaLinks = env.document.querySelectorAll('a[href*="instagram"]');
      instaLinks.forEach(a => {
        expect(a.getAttribute('target')).toBe('_blank');
      });
    });

    it('T1.8.3: All Instagram links specify rel="noopener" for reverse tab-napping protection', () => {
      const env = createBrowserEnvironment();
      const instaLinks = env.document.querySelectorAll('a[href*="instagram"]');
      instaLinks.forEach(a => {
        expect(a.getAttribute('rel')).toBe('noopener');
      });
    });

    it('T1.8.4: No insecure http:// or misspelled Instagram URLs exist in HTML', () => {
      const html = loadHtml();
      expect(html).not.toContain('http://www.instagram');
      expect(html).not.toContain('http://instagram');
      expect(html).not.toContain('nutrinance_wellbeing'); // must use dot notation
    });

    it('T1.8.5: Instagram links open in a new tab when clicked in browser sandbox', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const instaLink = env.document.querySelector('.socials a[href*="instagram.com"]');
      expect(instaLink.getAttribute('target')).toBe('_blank');
      expect(instaLink.getAttribute('rel')).toBe('noopener');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 9: WhatsApp Floating CTA Polish (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 9: WhatsApp Floating CTA Polish', () => {
    it('T1.9.1: Floating WhatsApp button exists with aria-label="Chat on WhatsApp"', () => {
      const env = createBrowserEnvironment();
      const waFloat = env.document.querySelector('.wa-float');
      expect(waFloat).not.toBeNull();
      expect(waFloat.getAttribute('aria-label')).toBe('Chat on WhatsApp');
    });

    it('T1.9.2: Floating button contains WhatsApp SVG icon and "Chat with us" text label', () => {
      const env = createBrowserEnvironment();
      const waFloat = env.document.querySelector('.wa-float');
      expect(waFloat.querySelector('svg')).not.toBeNull();
      expect(waFloat.querySelector('span').textContent).toBe('Chat with us');
    });

    it('T1.9.3: CSS positions floating CTA with fixed coordinates and high z-index', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.wa-float{position:fixed');
      expect(cssRules.clean).toContain('right:22px;bottom:22px;z-index:70');
    });

    it('T1.9.4: CSS defines desktop hover expansion for floating label with max-width transition', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.wa-float:hover span{max-width:140px;opacity:1}');
      expect(cssRules.clean).toContain('transition:max-width .35s,opacity .3s');
    });

    it('T1.9.5: CSS restricts floating CTA label expansion on mobile screens (max-width: 620px)', () => {
      const cssRules = parseCssRules();
      const mobileMedia = cssRules.mediaQueries.find(m => m.condition.includes('max-width:620px') || m.condition.includes('max-width: 620px'));
      expect(mobileMedia).toBeDefined();
      expect(mobileMedia.body).toContain('.wa-float:hover span{max-width:0;opacity:0}');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 10: WhatsApp Form & Dynamic Links (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 10: WhatsApp Form & Dynamic Links', () => {
    it('T1.10.1: All [data-wa] elements receive dynamic wa.me URLs with phone number and text', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const waElements = env.document.querySelectorAll('[data-wa]');
      expect(waElements.length).toBeGreaterThan(15);
      const phone = env.getWhatsAppNumber();
      waElements.forEach(el => {
        const href = el.getAttribute('href');
        expect(href).not.toBeNull();
        expect(href.startsWith('https://wa.me/' + phone)).toBeTruthy();
        expect(el.getAttribute('target')).toBe('_blank');
        expect(el.getAttribute('rel')).toBe('noopener');
      });
    });

    it('T1.10.2: Global WHATSAPP_NUMBER is defined and matches digits-only format', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const phone = env.getWhatsAppNumber();
      expect(phone).not.toBeNull();
      expect(typeof phone).toBe('string');
      expect(/^\d{10,14}$/.test(phone)).toBeTruthy();
    });

    it('T1.10.3: Booking form contains all required fields: name, age, goal, note', () => {
      const env = createBrowserEnvironment();
      const form = env.document.getElementById('bookForm');
      expect(form).not.toBeNull();
      expect(form.querySelector('#bName')).not.toBeNull();
      expect(form.querySelector('#bAge')).not.toBeNull();
      expect(form.querySelector('#bGoal')).not.toBeNull();
      expect(form.querySelector('#bNote')).not.toBeNull();
    });

    it('T1.10.4: Booking form submission opens WhatsApp window with formatted multi-line payload', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      env.document.getElementById('bName').value = 'Kavita Patel';
      env.document.getElementById('bAge').value = '34';
      env.document.getElementById('bGoal').value = 'PCOS / PCOD';
      env.document.getElementById('bNote').value = 'Need diet plan for irregular cycles';

      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(env.openedUrls.length).toBe(1);
      const opened = env.openedUrls[0];
      expect(opened.url).toContain('https://wa.me/' + env.getWhatsAppNumber() + '?text=');
      expect(opened.url).toContain(encodeURIComponent('Kavita Patel'));
      expect(opened.url).toContain(encodeURIComponent('Age: 34'));
      expect(opened.url).toContain(encodeURIComponent('PCOS / PCOD'));
      expect(opened.target).toBe('_blank');
      expect(opened.features).toBe('noopener');
    });

    it('T1.10.5: Submitting booking form without name triggers .err validation class and stops submit', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      const nameInput = env.document.getElementById('bName');
      nameInput.value = '';

      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(env.openedUrls.length).toBe(0);
      expect(nameInput.classList.contains('err')).toBeTruthy();
      expect(nameInput._isFocused).toBeTruthy();
    });
  });

  // --------------------------------------------------------------------------
  // Feature 11: Responsive Viewport Integrity (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 11: Responsive Viewport Integrity', () => {
    it('T1.11.1: Document has mobile viewport meta tag configured', () => {
      const env = createBrowserEnvironment();
      const meta = env.document.querySelector('meta[name="viewport"]');
      expect(meta).not.toBeNull();
      expect(meta.getAttribute('content')).toContain('width=device-width');
      expect(meta.getAttribute('content')).toContain('initial-scale=1');
    });

    it('T1.11.2: Container elements enforce max-width constraint (1180px) and inline padding', () => {
      const cssRules = parseCssRules();
      expect(cssRules.customProperties['--max']).toBe('1180px');
      expect(cssRules.clean).toContain('.container{width:100%;max-width:var(--max);margin-inline:auto;padding-inline:24px}');
    });

    it('T1.11.3: CSS defines standard responsive breakpoints at 1080px, 960px, 820px, and 620px', () => {
      const cssRules = parseCssRules();
      const conditions = cssRules.mediaQueries.map(m => m.condition.replace(/\s+/g, ''));
      expect(conditions.some(c => c.includes('max-width:1080px'))).toBeTruthy();
      expect(conditions.some(c => c.includes('max-width:960px'))).toBeTruthy();
      expect(conditions.some(c => c.includes('max-width:820px'))).toBeTruthy();
      expect(conditions.some(c => c.includes('max-width:620px'))).toBeTruthy();
    });

    it('T1.11.4: Hamburger button display is none on desktop and flex on mobile <=820px', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.hamburger{display:none');
      const mobile820 = cssRules.mediaQueries.find(m => m.condition.includes('max-width:820px') || m.condition.includes('max-width: 820px'));
      expect(mobile820).toBeDefined();
      expect(mobile820.body).toContain('.hamburger{display:flex}');
    });

    it('T1.11.5: Content grids collapse into single column layouts on small mobile <=620px', () => {
      const cssRules = parseCssRules();
      const mobile620 = cssRules.mediaQueries.find(m => m.condition.includes('max-width:620px') || m.condition.includes('max-width: 620px'));
      expect(mobile620).toBeDefined();
      expect(mobile620.body).toContain('.who-grid,.women-grid,.steps,.transform-grid,.recipe-grid{grid-template-columns:1fr}');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 12: Accessibility & ARIA Enhancements (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 12: Accessibility & ARIA Enhancements', () => {
    it('T1.12.1: HTML element specifies lang="en" and document contains title and description', () => {
      const env = createBrowserEnvironment();
      expect(env.document.documentElement.getAttribute('lang')).toBe('en');
      const title = env.document.querySelector('title');
      const metaDesc = env.document.querySelector('meta[name="description"]');
      expect(title).not.toBeNull();
      expect(title.textContent).toContain('Nutrinance');
      expect(metaDesc).not.toBeNull();
    });

    it('T1.12.2: Main navigation has aria-label="Main" and hamburger has aria-controls="nav"', () => {
      const env = createBrowserEnvironment();
      const nav = env.document.getElementById('nav');
      const burger = env.document.getElementById('hamburger');
      expect(nav.getAttribute('aria-label')).toBe('Main');
      expect(burger.getAttribute('aria-controls')).toBe('nav');
      expect(burger.getAttribute('aria-label')).toBe('Open menu');
    });

    it('T1.12.3: Hamburger button has aria-expanded attribute initialized to "false"', () => {
      const env = createBrowserEnvironment();
      const burger = env.document.getElementById('hamburger');
      expect(burger.getAttribute('aria-expanded')).toBe('false');
    });

    it('T1.12.4: Program tabs container has role="tablist" and tab buttons have role="tab"', () => {
      const env = createBrowserEnvironment();
      const tablist = env.document.querySelector('.tabs');
      expect(tablist.getAttribute('role')).toBe('tablist');
      const tabs = tablist.querySelectorAll('.tab');
      expect(tabs.length).toBe(2);
      tabs.forEach(tab => {
        expect(tab.getAttribute('role')).toBe('tab');
        expect(tab.hasAttribute('aria-selected')).toBeTruthy();
      });
    });

    it('T1.12.5: Images have descriptive alt attributes and decorative SVGs have aria-hidden="true"', () => {
      const env = createBrowserEnvironment();
      const imgs = env.document.querySelectorAll('img');
      expect(imgs.length).toBeGreaterThan(10);
      imgs.forEach(img => {
        expect(img.hasAttribute('alt')).toBeTruthy();
        expect(img.getAttribute('alt').trim().length).toBeGreaterThan(0);
      });

      const svgs = env.document.querySelectorAll('svg');
      svgs.forEach(svg => {
        expect(svg.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Feature 13: Prefers-Reduced-Motion Compliance (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 13: Prefers-Reduced-Motion Compliance', () => {
    it('T1.13.1: CSS stylesheet contains @media (prefers-reduced-motion: reduce) block', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion:reduce') || m.condition.includes('prefers-reduced-motion: reduce'));
      expect(prm).toBeDefined();
    });

    it('T1.13.2: Reduced-motion CSS turns off CSS animations (!important)', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm.body).toContain('animation:none!important');
    });

    it('T1.13.3: Reduced-motion CSS turns off CSS transitions (!important)', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm.body).toContain('transition:none!important');
    });

    it('T1.13.4: Reduced-motion CSS sets scroll-behavior to auto (!important)', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm.body).toContain('scroll-behavior:auto!important');
    });

    it('T1.13.5: Reduced-motion CSS forces .reveal elements to opacity 1 and transform none', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm.body).toContain('.reveal');
      expect(prm.body).toContain('opacity:1');
      expect(prm.body).toContain('transform:none');
    });
  });

  // --------------------------------------------------------------------------
  // Feature 14: Performance & Zero-CLS Layout Flow (5 tests)
  // --------------------------------------------------------------------------
  describe('Feature 14: Performance & Zero-CLS Layout Flow', () => {
    it('T1.14.1: Hero main image uses loading="eager" while below-fold images use loading="lazy"', () => {
      const env = createBrowserEnvironment();
      const heroMainImg = env.document.querySelector('.hero-img-main img');
      expect(heroMainImg.getAttribute('loading')).toBe('eager');

      const lazyImgs = env.document.querySelectorAll('img[loading="lazy"]');
      expect(lazyImgs.length).toBeGreaterThan(15);
    });

    it('T1.14.2: Brand logo images declare explicit width and height attributes', () => {
      const env = createBrowserEnvironment();
      const logos = env.document.querySelectorAll('.brand img, .footer-brand img');
      expect(logos.length).toBe(2);
      logos.forEach(logo => {
        expect(logo.getAttribute('width')).toBe('220');
        expect(logo.getAttribute('height')).toBe('98');
      });
    });

    it('T1.14.3: Preconnect resource hints are configured for Google Fonts origins', () => {
      const env = createBrowserEnvironment();
      const preconnects = env.document.querySelectorAll('link[rel="preconnect"]');
      expect(preconnects.length).toBe(2);
      const hrefs = preconnects.map(l => l.getAttribute('href'));
      expect(hrefs).toContain('https://fonts.googleapis.com');
      expect(hrefs).toContain('https://fonts.gstatic.com');
    });

    it('T1.14.4: Footer copyright year dynamically renders current year', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const yearSpan = env.document.getElementById('year');
      expect(Number(yearSpan.textContent)).toBe(new Date().getFullYear());
    });

    it('T1.14.5: Recipe media containers use CSS aspect-ratio: 4/3 to prevent layout shifts', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.recipe-img{position:relative;aspect-ratio:4/3');
    });
  });

});

module.exports = runner;
