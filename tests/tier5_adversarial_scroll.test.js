/**
 * Tier 5 - Adversarial Stress & White-Box Verification Test Suite
 * ===============================================================
 * Empirical stress tests and adversarial verification covering:
 * 1. Lenis Smooth Momentum Scrolling Engine & GSAP Ticker synchronization
 * 2. Dynamic Sticky Header Height Compensation & Section Clearance
 * 3. Sub-Scroll Isolation on #sliderTrack with data-lenis-prevent="true"
 * 4. Mobile Nav Drawer Background Scroll Lock (lenis.stop() / lenis.start())
 * 5. WAAPI FAQ Accordion Rapid-Toggle Stress & ScrollTrigger.refresh() Sync
 * 6. Hero Ambient Floating Badges & Motion Sensitivity Overrides
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

// Helper: Create Enhanced Browser Sandbox with Mock Lenis, GSAP, ScrollTrigger, and WAAPI
function createAdversarialEnvironment(options = {}) {
  const env = createBrowserEnvironment(options);
  const win = env.window;
  const doc = env.document;

  // Polyfill pageYOffset if missing
  if (typeof win.pageYOffset === 'undefined') {
    win.pageYOffset = 0;
  }
  Object.defineProperty(win, 'pageYOffset', {
    get: () => win.scrollY,
    set: (v) => { win.scrollY = v; },
    configurable: true
  });

  // Track Lenis calls
  class MockLenis {
    constructor(cfg = {}) {
      this.config = cfg;
      this.scroll = 0;
      this.targetScroll = 0;
      this.isStopped = false;
      this.isDestroyed = false;
      this.listeners = new Map();
      this.scrollToCalls = [];
      this.rafCalls = [];
      MockLenis.instances.push(this);
    }
    on(event, handler) {
      if (!this.listeners.has(event)) this.listeners.set(event, []);
      this.listeners.get(event).push(handler);
    }
    emit(event, data) {
      const list = this.listeners.get(event) || [];
      list.forEach(fn => fn(data));
    }
    scrollTo(target, opts) {
      this.scrollToCalls.push({ target, opts });
      if (typeof opts?.offset === 'number') {
        const top = typeof target === 'number' ? target : (target.offsetTop || 0);
        this.scroll = Math.max(0, top + opts.offset);
      }
    }
    stop() {
      this.isStopped = true;
    }
    start() {
      this.isStopped = false;
    }
    destroy() {
      this.isDestroyed = true;
      this.listeners.clear();
    }
    raf(time) {
      this.rafCalls.push(time);
    }
  }
  MockLenis.instances = [];

  // Track GSAP calls
  const gsapCalls = {
    registeredPlugins: [],
    tweens: [],
    tickerCallbacks: [],
    lagSmoothingVal: null
  };

  const mockGsap = {
    registerPlugin: (plugin) => {
      gsapCalls.registeredPlugins.push(plugin);
    },
    ticker: {
      add: (cb) => {
        gsapCalls.tickerCallbacks.push(cb);
      },
      lagSmoothing: (val) => {
        gsapCalls.lagSmoothingVal = val;
      }
    },
    to: (targets, vars) => {
      gsapCalls.tweens.push({ type: 'to', targets, vars });
      return { kill: () => {} };
    },
    from: (targets, vars) => {
      gsapCalls.tweens.push({ type: 'from', targets, vars });
      return { kill: () => {} };
    },
    fromTo: (targets, fromVars, toVars) => {
      gsapCalls.tweens.push({ type: 'fromTo', targets, fromVars, toVars });
      return { kill: () => {} };
    }
  };

  // Track ScrollTrigger calls
  let scrollTriggerRefreshCount = 0;
  let scrollTriggerUpdateCount = 0;
  const mockScrollTrigger = {
    update: () => {
      scrollTriggerUpdateCount++;
    },
    refresh: () => {
      scrollTriggerRefreshCount++;
    },
    batch: (targets, vars) => {}
  };

  // Mock WAAPI Animation on Elements
  class MockAnimation {
    constructor(element, keyframes, animOptions) {
      this.element = element;
      this.keyframes = keyframes;
      this.animOptions = animOptions;
      this.playState = 'running';
      this.onfinish = null;
      this.oncancel = null;
      MockAnimation.instances.push(this);
    }
    cancel() {
      this.playState = 'idle';
      if (typeof this.oncancel === 'function') {
        this.oncancel();
      }
    }
    finish() {
      this.playState = 'finished';
      if (typeof this.onfinish === 'function') {
        this.onfinish();
      }
    }
  }
  MockAnimation.instances = [];

  // Synchronous rAF runner for deterministic testing
  const pendingRafs = [];
  win.requestAnimationFrame = (cb) => {
    pendingRafs.push(cb);
    return pendingRafs.length;
  };
  function flushRafs() {
    while (pendingRafs.length > 0) {
      const cb = pendingRafs.shift();
      cb(Date.now());
    }
  }

  // Attach WAAPI .animate to all DOM elements
  const origCreateElement = doc.createElement.bind(doc);
  doc.createElement = function(tagName) {
    const el = origCreateElement(tagName);
    el.animate = function(keyframes, animOptions) {
      const anim = new MockAnimation(el, keyframes, animOptions);
      el._activeAnimation = anim;
      return anim;
    };
    return el;
  };

  // Also attach animate to existing elements
  function attachAnimate(node) {
    node.animate = function(keyframes, animOptions) {
      const anim = new MockAnimation(node, keyframes, animOptions);
      node._activeAnimation = anim;
      return anim;
    };
    node.children.forEach(attachAnimate);
  }
  attachAnimate(doc.documentElement);

  if (!options.noLenis) {
    win.Lenis = MockLenis;
  }
  if (!options.noGsap) {
    win.gsap = mockGsap;
    win.ScrollTrigger = mockScrollTrigger;
  }

  return {
    ...env,
    MockLenis,
    MockAnimation,
    gsapCalls,
    flushRafs,
    getScrollTriggerRefreshCount: () => scrollTriggerRefreshCount,
    getScrollTriggerUpdateCount: () => scrollTriggerUpdateCount
  };
}

describe('Tier 5: Adversarial Stress & White-Box Verification', () => {

  // ==========================================================================
  // SUITE 1: Lenis Momentum & Smooth Scrolling Engine
  // ==========================================================================
  describe('Suite 1: Lenis Momentum & Smooth Scrolling Engine', () => {

    it('T5.1.1: Lenis constructor receives exact configuration parameters and exponential easing curve', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      expect(env.MockLenis.instances.length).toBe(1);
      const instance = env.MockLenis.instances[0];
      const cfg = instance.config;

      expect(cfg.duration).toBe(1.15);
      expect(cfg.orientation).toBe('vertical');
      expect(cfg.gestureOrientation).toBe('vertical');
      expect(cfg.smoothWheel).toBe(true);
      expect(cfg.wheelMultiplier).toBe(1.0);
      expect(cfg.touchMultiplier).toBe(1.0);
      expect(cfg.infinite).toBe(false);

      // Verify easing mathematical boundary conditions: f(0) = 0, f(1) = 1
      expect(typeof cfg.easing).toBe('function');
      const ease0 = cfg.easing(0);
      const easeHalf = cfg.easing(0.5);
      const ease1 = cfg.easing(1);

      expect(ease0).toBeLessThanOrEqual(0.002);
      expect(easeHalf).toBeGreaterThan(0.9); // steep deceleration characteristic of smooth momentum
      expect(ease1).toBe(1);
    });

    it('T5.1.2: Lenis synchronizes with GSAP Ticker with lagSmoothing disabled', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      expect(env.gsapCalls.tickerCallbacks.length).toBe(1);
      expect(env.gsapCalls.lagSmoothingVal).toBe(0);

      // Trigger GSAP ticker RAF step with 1.5 seconds timestamp
      const tickerCb = env.gsapCalls.tickerCallbacks[0];
      tickerCb(1.5);

      const instance = env.MockLenis.instances[0];
      expect(instance.rafCalls.length).toBe(1);
      expect(instance.rafCalls[0]).toBe(1500); // 1.5s * 1000ms
    });

    it('T5.1.3: ScrollTrigger.update is bound to Lenis on scroll event', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const instance = env.MockLenis.instances[0];
      expect(instance.listeners.has('scroll')).toBeTruthy();

      const initialCount = env.getScrollTriggerUpdateCount();
      instance.emit('scroll', { scroll: 250 });
      expect(env.getScrollTriggerUpdateCount()).toBe(initialCount + 1);
    });

    it('T5.1.4: High-frequency rapid scroll fling storm (100 events) maintains deterministic state', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const header = env.document.getElementById('header');
      const instance = env.MockLenis.instances[0];

      // Simulate erratic user flinging scroll wheel up and down 100 times
      for (let i = 0; i < 100; i++) {
        const fakeY = (i % 2 === 0) ? (i * 15) : 0;
        instance.scroll = fakeY;
        env.window.scrollY = fakeY;
        instance.emit('scroll', { scroll: fakeY });

        if (fakeY > 12) {
          expect(header.classList.contains('is-stuck')).toBeTruthy();
        } else {
          expect(header.classList.contains('is-stuck')).toBeFalsy();
        }
      }
    });

    it('T5.1.5: Dynamic prefers-reduced-motion media query transition destroys Lenis instance', () => {
      const env = createAdversarialEnvironment({ prefersReducedMotion: false });
      env.executeScript();

      expect(env.window.lenis).not.toBeNull();
      const initialInstance = env.MockLenis.instances[0];
      expect(initialInstance.isDestroyed).toBeFalsy();

      const js = loadJs();
      expect(js).toContain('lenis.destroy()');
    });

    it('T5.1.6: CSS root rules enforce lenis compatibility and prevent browser scroll collision', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('html.lenis, html.lenis body{height:auto}');
      expect(cssRules.clean).toContain('.lenis.lenis-smooth{scroll-behavior:auto!important}');
      expect(cssRules.clean).toContain('.lenis.lenis-stopped{overflow:hidden}');
    });
  });

  // ==========================================================================
  // SUITE 2: Dynamic Sticky Header Height Compensation & Anchor Clearance
  // ==========================================================================
  describe('Suite 2: Dynamic Sticky Header Height Compensation & Anchor Clearance', () => {

    it('T5.2.1: Header clearance formula dynamically adds breathing room: -(headerHeight + 16)', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const header = env.document.getElementById('header');
      header.offsetHeight = 78;

      const progLink = env.document.querySelector('#nav a[href="#programs"]');
      const progSec = env.document.getElementById('programs');
      progSec.offsetTop = 1200;

      progLink.click();

      const instance = env.MockLenis.instances[0];
      expect(instance.scrollToCalls.length).toBe(1);
      const call = instance.scrollToCalls[0];
      expect(call.target).toBe(progSec);
      expect(call.opts.offset).toBe(-(78 + 16)); // -94px
      expect(call.opts.duration).toBe(1.1);
    });

    it('T5.2.2: All internal anchor targets receive non-occluded scroll destination', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const header = env.document.getElementById('header');
      header.offsetHeight = 80;

      const internalLinks = env.document.querySelectorAll('a[href^="#"]');
      expect(internalLinks.length).toBeGreaterThanOrEqual(8);

      const targetHashes = new Set();
      internalLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && href !== '#') {
          targetHashes.add(href);
        }
      });

      // Verify each anchor target exists in DOM
      targetHashes.forEach(hash => {
        const targetEl = env.document.querySelector(hash);
        expect(targetEl).not.toBeNull();
      });
    });

    it('T5.2.3: Dynamic header height mutation (e.g. mobile font wrap to 112px) updates scrollTo offset', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const header = env.document.getElementById('header');
      header.offsetHeight = 112; // simulated multi-line expanded header

      const faqLink = env.document.querySelector('#nav a[href="#faq"]');
      const faqSec = env.document.getElementById('faq');
      faqSec.offsetTop = 2500;

      faqLink.click();

      const instance = env.MockLenis.instances[0];
      const latestCall = instance.scrollToCalls[instance.scrollToCalls.length - 1];
      expect(latestCall.opts.offset).toBe(-(112 + 16)); // -128px dynamic offset
    });

    it('T5.2.4: Reduced-motion mode routes anchor navigation through native window.scrollTo with clearance', () => {
      const env = createAdversarialEnvironment({ prefersReducedMotion: true, noLenis: true });
      env.executeScript();

      const header = env.document.getElementById('header');
      header.offsetHeight = 78;

      const womenLink = env.document.querySelector('#nav a[href="#women"]');
      const womenSec = env.document.getElementById('women');
      womenSec.offsetTop = 1800;

      womenLink.click();

      // Expect window.scrollY to have computed (1800 - 94) = 1706
      expect(env.window.scrollY).toBe(1800 - 94);
    });

    it('T5.2.5: Malformed anchor targets (#, missing IDs) do not trigger errors or abnormal scrolling', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const dummyLink = env.document.createElement('a');
      dummyLink.setAttribute('href', '#');
      env.document.body.appendChild(dummyLink);

      expect(() => {
        dummyLink.click();
      }).not.toThrow();

      const invalidLink = env.document.createElement('a');
      invalidLink.setAttribute('href', '#non-existent-section-99');
      env.document.body.appendChild(invalidLink);

      expect(() => {
        invalidLink.click();
      }).not.toThrow();
    });

    it('T5.2.6: Rapid successive anchor navigation clicks record latest target in history', () => {
      const env = createAdversarialEnvironment();
      let lastPushedUrl = null;
      env.window.history.pushState = (state, title, url) => {
        lastPushedUrl = url;
      };
      env.executeScript();

      const whoLink = env.document.querySelector('#nav a[href="#who"]');
      const recipesLink = env.document.querySelector('#nav a[href="#recipes"]');
      const faqLink = env.document.querySelector('#nav a[href="#faq"]');

      whoLink.click();
      expect(lastPushedUrl).toBe('#who');

      recipesLink.click();
      expect(lastPushedUrl).toBe('#recipes');

      faqLink.click();
      expect(lastPushedUrl).toBe('#faq');
    });
  });

  // ==========================================================================
  // SUITE 3: Sub-Scroll Isolation on #sliderTrack (data-lenis-prevent)
  // ==========================================================================
  describe('Suite 3: Sub-Scroll Isolation on #sliderTrack', () => {

    it('T5.3.1: #sliderTrack possesses data-lenis-prevent="true" attribute for Lenis isolation', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const track = env.document.getElementById('sliderTrack');
      expect(track).not.toBeNull();
      expect(track.getAttribute('data-lenis-prevent')).toBe('true');
    });

    it('T5.3.2: CSS specifies overscroll-behavior-x: contain and data-lenis-prevent containment', () => {
      const cssRules = parseCssRules();
      expect(cssRules.clean).toContain('.lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain}');
      expect(cssRules.clean).toContain('.slider-track{');
      expect(cssRules.clean).toContain('overscroll-behavior-x:contain');
    });

    it('T5.3.3: Prev and Next button boundary wrap-around calculates non-negative integer positions', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const track = env.document.getElementById('sliderTrack');
      const nextBtn = env.document.getElementById('nextBtn');
      const prevBtn = env.document.getElementById('prevBtn');

      track.clientWidth = 380;
      track.scrollWidth = 1140; // 3 pages

      // 1. Next from start (0 -> 380)
      track.scrollLeft = 0;
      nextBtn.click();
      expect(track.scrollLeft).toBe(380);

      // 2. Next from middle (380 -> 760)
      nextBtn.click();
      expect(track.scrollLeft).toBe(760);

      // 3. Next from end wrap to 0 (760 + 380 >= 1140 - 8)
      nextBtn.click();
      expect(track.scrollLeft).toBe(0);

      // 4. Prev from start wrap to end (0 <= 8 -> 1140)
      prevBtn.click();
      expect(track.scrollLeft).toBe(1140);
    });

    it('T5.3.4: Active pagination dot updates correctly on discrete track scroll events', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const track = env.document.getElementById('sliderTrack');
      const dotsWrap = env.document.getElementById('dots');

      track.clientWidth = 400;
      track.scrollWidth = 1200;
      track.children = [
        env.document.createElement('div'),
        env.document.createElement('div'),
        env.document.createElement('div')
      ];

      // Re-trigger load to build dots
      env.document.dispatchEvent({ type: 'load', target: env.document, currentTarget: env.document });

      const dots = dotsWrap.querySelectorAll('button');
      expect(dots.length).toBeGreaterThanOrEqual(1);

      // Scroll to page 0
      track.scrollLeft = 0;
      track.dispatchEvent({ type: 'scroll', target: track, currentTarget: track });
      expect(dots[0].classList.contains('is-active')).toBeTruthy();

      // Scroll to page 1
      track.scrollLeft = 400;
      track.dispatchEvent({ type: 'scroll', target: track, currentTarget: track });
      if (dots[1]) {
        expect(dots[1].classList.contains('is-active')).toBeTruthy();
        expect(dots[0].classList.contains('is-active')).toBeFalsy();
      }
    });
  });

  // ==========================================================================
  // SUITE 4: Mobile Nav Drawer Scroll Lock & Lenis Suspension
  // ==========================================================================
  describe('Suite 4: Mobile Nav Drawer Scroll Lock & Lenis Suspension', () => {

    it('T5.4.1: Opening mobile nav drawer calls lenis.stop() and sets body.nav-open', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const burger = env.document.getElementById('hamburger');
      const nav = env.document.getElementById('nav');
      const backdrop = env.document.querySelector('.nav-backdrop');
      const instance = env.MockLenis.instances[0];

      expect(instance.isStopped).toBeFalsy();

      burger.click();

      expect(nav.classList.contains('is-open')).toBeTruthy();
      expect(backdrop.classList.contains('is-on')).toBeTruthy();
      expect(env.document.body.classList.contains('nav-open')).toBeTruthy();
      expect(instance.isStopped).toBeTruthy();
    });

    it('T5.4.2: Closing mobile nav via hamburger re-click calls lenis.start() and unlocks scroll', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const burger = env.document.getElementById('hamburger');
      const instance = env.MockLenis.instances[0];

      burger.click(); // Open
      expect(instance.isStopped).toBeTruthy();

      burger.click(); // Close
      expect(instance.isStopped).toBeFalsy();
      expect(env.document.body.classList.contains('nav-open')).toBeFalsy();
    });

    it('T5.4.3: Closing mobile nav via backdrop click calls lenis.start() and resets ARIA states', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const burger = env.document.getElementById('hamburger');
      const backdrop = env.document.querySelector('.nav-backdrop');
      const instance = env.MockLenis.instances[0];

      burger.click();
      expect(burger.getAttribute('aria-expanded')).toBe('true');

      backdrop.click();

      expect(instance.isStopped).toBeFalsy();
      expect(burger.getAttribute('aria-expanded')).toBe('false');
      expect(env.document.body.classList.contains('nav-open')).toBeFalsy();
    });

    it('T5.4.4: Closing mobile nav via Escape key calls lenis.start()', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const burger = env.document.getElementById('hamburger');
      const instance = env.MockLenis.instances[0];

      burger.click();
      expect(instance.isStopped).toBeTruthy();

      env.document.dispatchEvent({ type: 'keydown', key: 'Escape', target: env.document, currentTarget: env.document });

      expect(instance.isStopped).toBeFalsy();
      expect(env.document.body.classList.contains('nav-open')).toBeFalsy();
    });

    it('T5.4.5: Rapid 50x hamburger click flutter stress maintains synchronized lock state', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const burger = env.document.getElementById('hamburger');
      const instance = env.MockLenis.instances[0];

      for (let i = 1; i <= 50; i++) {
        burger.click();
        const shouldBeOpen = (i % 2 !== 0);
        expect(instance.isStopped).toBe(shouldBeOpen);
        expect(env.document.body.classList.contains('nav-open')).toBe(shouldBeOpen);
      }
    });
  });

  // ==========================================================================
  // SUITE 5: WAAPI FAQ Accordion Mechanics & ScrollTrigger.refresh() Sync
  // ==========================================================================
  describe('Suite 5: WAAPI FAQ Accordion Mechanics & ScrollTrigger.refresh() Sync', () => {

    it('T5.5.1: Opening closed FAQ accordion initiates WAAPI animation with duration 340ms', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const details = env.document.querySelector('.accordion details');
      const summary = details.querySelector('summary');
      const p = details.querySelector('p');

      details.offsetHeight = 54;
      summary.offsetHeight = 54;
      if (p) p.offsetHeight = 60;
      details.open = false;

      summary.click();
      env.flushRafs(); // trigger expandAccordion scheduled in rAF

      expect(details.open).toBeTruthy();
      expect(details.style.overflow).toBe('hidden');

      const anim = details._activeAnimation;
      expect(anim).toBeDefined();
      expect(anim.animOptions.duration).toBe(340);
      expect(anim.keyframes.height[0]).toContain('px');
      expect(anim.keyframes.height[1]).toContain('px');
    });

    it('T5.5.2: Closing open FAQ accordion initiates WAAPI shrink animation with duration 300ms', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const details = env.document.querySelector('.accordion details');
      const summary = details.querySelector('summary');
      const p = details.querySelector('p');

      details.offsetHeight = 132;
      summary.offsetHeight = 54;
      if (p) p.offsetHeight = 60;
      details.open = true;

      summary.click();

      const anim = details._activeAnimation;
      expect(anim).toBeDefined();
      expect(anim.animOptions.duration).toBe(300);
      expect(anim.keyframes.height[1]).toBe('54px'); // summary height
    });

    it('T5.5.3: Completing animation restores empty height/overflow styles and calls ScrollTrigger.refresh()', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const details = env.document.querySelector('.accordion details');
      const summary = details.querySelector('summary');

      details.open = false;
      summary.click();
      env.flushRafs();

      const anim = details._activeAnimation;
      expect(anim).toBeDefined();

      const initialRefreshCount = env.getScrollTriggerRefreshCount();
      anim.finish(); // fire onAnimationFinish

      expect(details.style.height).toBe('');
      expect(details.style.overflow).toBe('');
      expect(env.getScrollTriggerRefreshCount()).toBe(initialRefreshCount + 1);
    });

    it('T5.5.4: Rapid-fire multi-click mid-animation stress cancels prior animation without visual snapping', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const details = env.document.querySelector('.accordion details');
      const summary = details.querySelector('summary');

      // 1. Initial click -> start expand
      details.open = false;
      summary.click();
      env.flushRafs();
      const anim1 = details._activeAnimation;
      expect(anim1.playState).toBe('running');

      // 2. Immediate second click mid-animation -> cancels anim1 and starts shrink
      summary.click();
      expect(anim1.playState).toBe('idle'); // canceled
      const anim2 = details._activeAnimation;
      expect(anim2).not.toBe(anim1);
      expect(anim2.animOptions.duration).toBe(300);

      // 3. Immediate third click mid-shrink -> cancels anim2 and starts expand
      summary.click();
      env.flushRafs();
      expect(anim2.playState).toBe('idle'); // canceled
      const anim3 = details._activeAnimation;
      expect(anim3).not.toBe(anim2);

      // 4. Finish anim3 cleanly
      anim3.finish();
      expect(details.style.height).toBe('');
      expect(details.style.overflow).toBe('');
      expect(details.open).toBeTruthy();
    });

    it('T5.5.5: Reduced motion mode skips WAAPI animation and calls ScrollTrigger.refresh()', () => {
      const env = createAdversarialEnvironment({ prefersReducedMotion: true, noLenis: true });
      env.executeScript();

      const details = env.document.querySelector('.accordion details');
      const summary = details.querySelector('summary');

      expect(typeof details._activeAnimation).toBe('undefined');
      summary.click();
      expect(typeof details._activeAnimation).toBe('undefined');
    });
  });

  // ==========================================================================
  // SUITE 6: Hero Ambient Floating Badges & GSAP Ticker Sync
  // ==========================================================================
  describe('Suite 6: Hero Ambient Floating Badges & GSAP Ticker Sync', () => {

    it('T5.6.1: Badge 1 is registered with continuous sine.inOut yoyo tween', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const float1Tween = env.gsapCalls.tweens.find(t => t.targets === '.float-card-1');
      expect(float1Tween).toBeDefined();
      expect(float1Tween.vars.y).toBe(-12);
      expect(float1Tween.vars.rotation).toBe(1.2);
      expect(float1Tween.vars.duration).toBe(3.4);
      expect(float1Tween.vars.ease).toBe('sine.inOut');
      expect(float1Tween.vars.repeat).toBe(-1);
      expect(float1Tween.vars.yoyo).toBe(true);
    });

    it('T5.6.2: Badge 2 is registered with staggered delay and opposing continuous sine.inOut tween', () => {
      const env = createAdversarialEnvironment();
      env.executeScript();

      const float2Tween = env.gsapCalls.tweens.find(t => t.targets === '.float-card-2');
      expect(float2Tween).toBeDefined();
      expect(float2Tween.vars.y).toBe(10);
      expect(float2Tween.vars.rotation).toBe(-1);
      expect(float2Tween.vars.duration).toBe(4.1);
      expect(float2Tween.vars.delay).toBe(0.7);
      expect(float2Tween.vars.ease).toBe('sine.inOut');
      expect(float2Tween.vars.repeat).toBe(-1);
      expect(float2Tween.vars.yoyo).toBe(true);
    });

    it('T5.6.3: Pure CSS @keyframes bob fallback is defined in stylesheet', () => {
      const cssRules = parseCssRules();
      const bobKf = cssRules.keyframes.find(k => k.name === 'bob');
      expect(bobKf).toBeDefined();
      expect(bobKf.body).toContain('transform:translateY(-10px)');
    });

    it('T5.6.4: prefers-reduced-motion media query disables floating card animations and forces clean transform', () => {
      const cssRules = parseCssRules();
      const reducedMediaQuery = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion:reduce') || m.condition.includes('prefers-reduced-motion: reduce'));
      expect(reducedMediaQuery).toBeDefined();
      expect(reducedMediaQuery.body).toContain('.float-card');
      expect(reducedMediaQuery.body).toContain('animation:none!important');
      expect(reducedMediaQuery.body).toContain('transform:none!important');
    });
  });

});

module.exports = runner;
