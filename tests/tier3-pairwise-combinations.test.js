/**
 * Tier 3 - Cross-Feature Combinations Test Suite (≥14 tests)
 * Evaluates pairwise interactions across modules:
 * - Lenis Scrolling + Sticky Header
 * - Anchor Navigation + Header Offset
 * - Mobile Drawer + Scroll Lock
 * - Program Tabs + ScrollTrigger Reveal
 * - Recipe Filter + Batch Card Reveal
 * - Booking Form + WhatsApp URL Generation
 * - Testimonial Slider + Pagination Dots
 * - Reduced Motion Overrides + Navigation & Motion
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

describe('Tier 3: Cross-Feature Combinations', () => {

  it('T3.01: Pairwise - Lenis Scrolling + Sticky Header State Sync', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const header = env.document.getElementById('header');

    // Resting state (top)
    env.window.scrollY = 0;
    env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
    expect(header.classList.contains('is-stuck')).toBeFalsy();

    // Scroll past threshold
    env.window.scrollY = 40;
    env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
    expect(header.classList.contains('is-stuck')).toBeTruthy();

    // Scroll back to top
    env.window.scrollY = 0;
    env.document.dispatchEvent({ type: 'scroll', target: env.document, currentTarget: env.document });
    expect(header.classList.contains('is-stuck')).toBeFalsy();
  });

  it('T3.02: Pairwise - Anchor Navigation + Sticky Header Clearance Offset', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const progLink = env.document.querySelector('#nav a[href="#programs"]');
    expect(progLink).not.toBeNull();

    const cssRules = parseCssRules();
    expect(cssRules.clean).toContain('scroll-padding-top:96px');
    expect(cssRules.clean).toContain('position:sticky');
  });

  it('T3.03: Pairwise - Mobile Hamburger Drawer Open + Body Scroll Lock', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const burger = env.document.getElementById('hamburger');
    const nav = env.document.getElementById('nav');
    const backdrop = env.document.querySelector('.nav-backdrop');

    burger.click();
    expect(nav.classList.contains('is-open')).toBeTruthy();
    expect(burger.classList.contains('is-open')).toBeTruthy();
    expect(backdrop.classList.contains('is-on')).toBeTruthy();
    expect(env.document.body.classList.contains('nav-open')).toBeTruthy();
    expect(burger.getAttribute('aria-expanded')).toBe('true');
  });

  it('T3.04: Pairwise - Mobile Drawer Link Click + Auto Close & Unlock', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const burger = env.document.getElementById('hamburger');
    const nav = env.document.getElementById('nav');
    const backdrop = env.document.querySelector('.nav-backdrop');

    burger.click();
    expect(nav.classList.contains('is-open')).toBeTruthy();

    const womenLink = env.document.querySelector('#nav a[href="#women"]');
    expect(womenLink).not.toBeNull();
    womenLink.click();

    expect(nav.classList.contains('is-open')).toBeFalsy();
    expect(backdrop.classList.contains('is-on')).toBeFalsy();
    expect(env.document.body.classList.contains('nav-open')).toBeFalsy();
    expect(burger.getAttribute('aria-expanded')).toBe('false');
  });

  it('T3.05: Pairwise - Program Tabs Switch + Panel Activation + Reveal Synchronization', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const lossTab = env.document.querySelector('.tab[data-tab="loss"]');
    const gainTab = env.document.querySelector('.tab[data-tab="gain"]');
    const lossPanel = env.document.querySelector('.tab-panel[data-panel="loss"]');
    const gainPanel = env.document.querySelector('.tab-panel[data-panel="gain"]');

    expect(lossTab.classList.contains('is-active')).toBeTruthy();
    expect(lossPanel.classList.contains('is-active')).toBeTruthy();
    expect(gainTab.classList.contains('is-active')).toBeFalsy();
    expect(gainPanel.classList.contains('is-active')).toBeFalsy();

    gainTab.click();

    expect(lossTab.classList.contains('is-active')).toBeFalsy();
    expect(lossPanel.classList.contains('is-active')).toBeFalsy();
    expect(gainTab.classList.contains('is-active')).toBeTruthy();
    expect(gainPanel.classList.contains('is-active')).toBeTruthy();

    const gainCards = gainPanel.querySelectorAll('.reveal');
    gainCards.forEach(c => {
      expect(c.classList.contains('in')).toBeTruthy();
    });
  });

  it('T3.06: Pairwise - Recipe Category Filtering + Re-reveal Animation Reset', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const breakfastFilter = env.document.querySelector('.filter[data-filter="breakfast"]');
    const dinnerFilter = env.document.querySelector('.filter[data-filter="dinner"]');
    const allRecipes = env.document.querySelectorAll('.recipe');

    breakfastFilter.click();
    allRecipes.forEach(c => {
      const isBreakfast = c.getAttribute('data-cat') === 'breakfast';
      if (isBreakfast) {
        expect(c.classList.contains('is-hidden')).toBeFalsy();
        expect(c.classList.contains('in')).toBeTruthy();
      } else {
        expect(c.classList.contains('is-hidden')).toBeTruthy();
      }
    });

    dinnerFilter.click();
    allRecipes.forEach(c => {
      const isDinner = c.getAttribute('data-cat') === 'dinner';
      if (isDinner) {
        expect(c.classList.contains('is-hidden')).toBeFalsy();
        expect(c.classList.contains('in')).toBeTruthy();
      } else {
        expect(c.classList.contains('is-hidden')).toBeTruthy();
      }
    });
  });

  it('T3.07: Pairwise - Recipe Book CTA Click + Dynamic WhatsApp URL Serialization', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const recipeCta = env.document.querySelector('.recipe-cta [data-wa]');
    expect(recipeCta).not.toBeNull();

    const href = recipeCta.getAttribute('href');
    expect(href).toContain('https://wa.me/' + env.getWhatsAppNumber());
    expect(href).toContain(encodeURIComponent('Hi Nutrinance! Can you send me the Nutrinance weight-loss recipe book?'));
    expect(recipeCta.getAttribute('target')).toBe('_blank');
    expect(recipeCta.getAttribute('rel')).toBe('noopener');
  });

  it('T3.08: Pairwise - FAQ Accordion Expansion + Details Styling & Indicator Transition', () => {
    const env = createBrowserEnvironment();
    const faq = env.document.querySelector('#faq details');
    expect(faq.hasAttribute('open')).toBeFalsy();

    faq.setAttribute('open', '');
    expect(faq.hasAttribute('open')).toBeTruthy();

    const cssRules = parseCssRules();
    expect(cssRules.clean).toContain('.accordion details[open]');
    expect(cssRules.clean).toContain('.accordion details[open] summary::after{content:"\\2013"}');
  });

  it('T3.09: Pairwise - Booking Form Validation Error + Dynamic Error Dismissal on Input', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const form = env.document.getElementById('bookForm');
    const nameInput = env.document.getElementById('bName');

    nameInput.value = '';
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    expect(nameInput.classList.contains('err')).toBeTruthy();
    expect(nameInput._isFocused).toBeTruthy();
    expect(env.openedUrls.length).toBe(0);

    nameInput.value = 'Aarti Shah';
    nameInput.dispatchEvent({ type: 'input', target: nameInput, currentTarget: nameInput });
    expect(nameInput.classList.contains('err')).toBeFalsy();
  });

  it('T3.10: Pairwise - Booking Form Valid Submission + WhatsApp Window Launch', () => {
    const env = createBrowserEnvironment();
    env.executeScript();
    const form = env.document.getElementById('bookForm');
    env.document.getElementById('bName').value = 'Nisha Patel';
    env.document.getElementById('bAge').value = '32';
    env.document.getElementById('bGoal').value = 'PCOS / PCOD';
    env.document.getElementById('bNote').value = 'Irregular cycles and fatigue';

    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    expect(env.openedUrls.length).toBe(1);
    const opened = env.openedUrls[0];
    expect(opened.target).toBe('_blank');
    expect(opened.features).toBe('noopener');
    expect(opened.url).toContain(encodeURIComponent('Name: Nisha Patel'));
    expect(opened.url).toContain(encodeURIComponent('Age: 32'));
    expect(opened.url).toContain(encodeURIComponent('I need help with: PCOS / PCOD'));
    expect(opened.url).toContain(encodeURIComponent('Other details: Irregular cycles and fatigue'));
  });

  it('T3.11: Pairwise - Testimonial Slider Pagination + Navigation Click', () => {
    const env = createBrowserEnvironment();
    const track = env.document.getElementById('sliderTrack');
    track.clientWidth = 400;
    track.scrollWidth = 1200;
    env.executeScript();

    const nextBtn = env.document.getElementById('nextBtn');
    const prevBtn = env.document.getElementById('prevBtn');
    const dotsWrap = env.document.getElementById('dots');

    const dots = dotsWrap.querySelectorAll('button');
    expect(dots.length).toBe(3);

    nextBtn.click();
    expect(track.scrollLeft).toBe(400);

    nextBtn.click();
    expect(track.scrollLeft).toBe(800);

    prevBtn.click();
    expect(track.scrollLeft).toBe(400);
  });

  it('T3.12: Pairwise - Prefers-Reduced-Motion + Anchor Smooth Scroll Override', () => {
    const cssRules = parseCssRules();
    expect(cssRules.clean).toContain('scroll-behavior:smooth');

    const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
    expect(prm.body).toContain('scroll-behavior:auto!important');
  });

  it('T3.13: Pairwise - Prefers-Reduced-Motion + Tab Panel Keyframe Animation Override', () => {
    const cssRules = parseCssRules();
    expect(cssRules.clean).toContain('animation:fadeUp .45s ease both');

    const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
    expect(prm.body).toContain('animation:none!important');
  });

  it('T3.14: Pairwise - Mobile Breakpoint (<=620px) + WhatsApp Floating Button Compact Mode', () => {
    const cssRules = parseCssRules();
    const m620 = cssRules.mediaQueries.find(m => m.condition.includes('max-width:620px') || m.condition.includes('max-width: 620px'));
    expect(m620.body).toContain('.wa-float{right:14px;bottom:14px;padding:14px}');
    expect(m620.body).toContain('.wa-float:hover span{max-width:0;opacity:0}');
  });

});

module.exports = runner;
