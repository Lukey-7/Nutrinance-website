/**
 * Milestone 4 Verification Suite (M4: Responsiveness, A11y & Performance)
 * Tests WAI-ARIA tablist pattern, keyboard navigation (Arrow keys/Home/End),
 * Form label associations, dynamic aria-invalid states, aria-live region,
 * High-contrast :focus-visible rings, touch targets >=44px, zero horizontal overflow,
 * Dual-layer prefers-reduced-motion compliance, explicit image dimensions, and zero CLS.
 */

const {
  loadHtml,
  loadCss,
  loadJs,
  createBrowserEnvironment,
  parseCssRules,
  expect
} = require('./test-utils');

console.log('============================================================');
console.log('      NUTRINANCE M4 VERIFICATION & INTEGRITY SUITE          ');
console.log('============================================================\n');

let passedCount = 0;
let failedCount = 0;

function runCheck(name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
    failedCount++;
  }
}

// -------------------------------------------------------------
// SECTION 1: WAI-ARIA Tablist Pattern & ARIA Linkages
// -------------------------------------------------------------
console.log('--- 1. WAI-ARIA Tablist Pattern & Linkages ---');

runCheck('Tabs container has role="tablist" and descriptive aria-label', () => {
  const env = createBrowserEnvironment();
  const tablist = env.document.querySelector('.tabs');
  expect(tablist).not.toBeNull();
  expect(tablist.getAttribute('role')).toBe('tablist');
  expect(tablist.getAttribute('aria-label')).toBe('Program categories');
});

runCheck('Tab buttons have role="tab", aria-selected, aria-controls, matching id, and roving tabindex', () => {
  const env = createBrowserEnvironment();
  const lossTab = env.document.getElementById('tab-loss');
  const gainTab = env.document.getElementById('tab-gain');

  expect(lossTab).not.toBeNull();
  expect(lossTab.getAttribute('role')).toBe('tab');
  expect(lossTab.getAttribute('aria-selected')).toBe('true');
  expect(lossTab.getAttribute('aria-controls')).toBe('panel-loss');
  expect(lossTab.getAttribute('tabindex')).toBe('0');

  expect(gainTab).not.toBeNull();
  expect(gainTab.getAttribute('role')).toBe('tab');
  expect(gainTab.getAttribute('aria-selected')).toBe('false');
  expect(gainTab.getAttribute('aria-controls')).toBe('panel-gain');
  expect(gainTab.getAttribute('tabindex')).toBe('-1');
});

runCheck('Tab panels have role="tabpanel", matching id, aria-labelledby, and tabindex="0"', () => {
  const env = createBrowserEnvironment();
  const lossPanel = env.document.getElementById('panel-loss');
  const gainPanel = env.document.getElementById('panel-gain');

  expect(lossPanel).not.toBeNull();
  expect(lossPanel.getAttribute('role')).toBe('tabpanel');
  expect(lossPanel.getAttribute('aria-labelledby')).toBe('tab-loss');
  expect(lossPanel.getAttribute('tabindex')).toBe('0');

  expect(gainPanel).not.toBeNull();
  expect(gainPanel.getAttribute('role')).toBe('tabpanel');
  expect(gainPanel.getAttribute('aria-labelledby')).toBe('tab-gain');
  expect(gainPanel.getAttribute('tabindex')).toBe('0');
});

// -------------------------------------------------------------
// SECTION 2: Keyboard Arrow Navigation on Program Tabs
// -------------------------------------------------------------
console.log('\n--- 2. Keyboard Arrow Navigation on Program Tabs ---');

runCheck('ArrowRight navigates from Loss Tab to Gain Tab with focus and active state sync', () => {
  const env = createBrowserEnvironment();
  env.executeScript();

  const lossTab = env.document.getElementById('tab-loss');
  const gainTab = env.document.getElementById('tab-gain');
  const lossPanel = env.document.getElementById('panel-loss');
  const gainPanel = env.document.getElementById('panel-gain');

  // Trigger ArrowRight keydown on lossTab
  lossTab.dispatchEvent({ type: 'keydown', key: 'ArrowRight', preventDefault: () => {} });

  expect(gainTab.classList.contains('is-active')).toBeTruthy();
  expect(gainTab.getAttribute('aria-selected')).toBe('true');
  expect(gainTab.getAttribute('tabindex')).toBe('0');
  expect(gainTab._isFocused).toBeTruthy();

  expect(lossTab.classList.contains('is-active')).toBeFalsy();
  expect(lossTab.getAttribute('aria-selected')).toBe('false');
  expect(lossTab.getAttribute('tabindex')).toBe('-1');

  expect(gainPanel.classList.contains('is-active')).toBeTruthy();
  expect(lossPanel.classList.contains('is-active')).toBeFalsy();
});

runCheck('ArrowRight wraps around from last tab back to first tab', () => {
  const env = createBrowserEnvironment();
  env.executeScript();

  const lossTab = env.document.getElementById('tab-loss');
  const gainTab = env.document.getElementById('tab-gain');

  // Switch to gainTab first
  gainTab.dispatchEvent({ type: 'click', preventDefault: () => {} });
  expect(gainTab.classList.contains('is-active')).toBeTruthy();

  // ArrowRight wraps to lossTab
  gainTab.dispatchEvent({ type: 'keydown', key: 'ArrowRight', preventDefault: () => {} });
  expect(lossTab.classList.contains('is-active')).toBeTruthy();
  expect(lossTab.getAttribute('aria-selected')).toBe('true');
  expect(lossTab._isFocused).toBeTruthy();
});

runCheck('ArrowLeft wraps from first tab to last tab', () => {
  const env = createBrowserEnvironment();
  env.executeScript();

  const lossTab = env.document.getElementById('tab-loss');
  const gainTab = env.document.getElementById('tab-gain');

  lossTab.dispatchEvent({ type: 'keydown', key: 'ArrowLeft', preventDefault: () => {} });
  expect(gainTab.classList.contains('is-active')).toBeTruthy();
  expect(gainTab.getAttribute('aria-selected')).toBe('true');
  expect(gainTab._isFocused).toBeTruthy();
});

runCheck('Home key navigates to first tab and End key navigates to last tab', () => {
  const env = createBrowserEnvironment();
  env.executeScript();

  const lossTab = env.document.getElementById('tab-loss');
  const gainTab = env.document.getElementById('tab-gain');

  // Navigate to End
  lossTab.dispatchEvent({ type: 'keydown', key: 'End', preventDefault: () => {} });
  expect(gainTab.classList.contains('is-active')).toBeTruthy();
  expect(gainTab._isFocused).toBeTruthy();

  // Navigate back to Home
  gainTab.dispatchEvent({ type: 'keydown', key: 'Home', preventDefault: () => {} });
  expect(lossTab.classList.contains('is-active')).toBeTruthy();
  expect(lossTab._isFocused).toBeTruthy();
});

// -------------------------------------------------------------
// SECTION 3: Form Accessibility, Labels & Dynamic aria-invalid
// -------------------------------------------------------------
console.log('\n--- 3. Form Accessibility & Dynamic aria-invalid ---');

runCheck('Form inputs have explicit <label for="..."> matching input id attributes', () => {
  const env = createBrowserEnvironment();
  const form = env.document.getElementById('bookForm');
  expect(form).not.toBeNull();

  const labels = form.querySelectorAll('label');
  expect(labels.length).toBe(4);

  const forAttrs = labels.map(l => l.getAttribute('for'));
  expect(forAttrs).toContain('bName');
  expect(forAttrs).toContain('bAge');
  expect(forAttrs).toContain('bGoal');
  expect(forAttrs).toContain('bNote');
});

runCheck('#bName input has required, aria-required="true", and aria-invalid initialized to "false"', () => {
  const env = createBrowserEnvironment();
  const nameInput = env.document.getElementById('bName');
  expect(nameInput.hasAttribute('required')).toBeTruthy();
  expect(nameInput.getAttribute('aria-required')).toBe('true');
  expect(nameInput.getAttribute('aria-invalid')).toBe('false');
});

runCheck('Form contains aria-live="polite" region for status and validation messages', () => {
  const env = createBrowserEnvironment();
  const statusEl = env.document.getElementById('formStatus');
  expect(statusEl).not.toBeNull();
  expect(statusEl.getAttribute('aria-live')).toBe('polite');
  expect(statusEl.getAttribute('aria-atomic')).toBe('true');
});

runCheck('Submitting form with empty name sets aria-invalid="true" and announces to aria-live region', () => {
  const env = createBrowserEnvironment();
  env.executeScript();

  const form = env.document.getElementById('bookForm');
  const nameInput = env.document.getElementById('bName');
  const statusEl = env.document.getElementById('formStatus');

  nameInput.value = '';
  form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

  expect(nameInput.getAttribute('aria-invalid')).toBe('true');
  expect(nameInput.classList.contains('err')).toBeTruthy();
  expect(nameInput._isFocused).toBeTruthy();
  expect(statusEl.textContent).toContain('Please enter your name');
});

runCheck('Typing valid name resets aria-invalid to "false" and clears error status', () => {
  const env = createBrowserEnvironment();
  env.executeScript();

  const form = env.document.getElementById('bookForm');
  const nameInput = env.document.getElementById('bName');
  const statusEl = env.document.getElementById('formStatus');

  // Trigger error
  nameInput.value = '';
  form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
  expect(nameInput.getAttribute('aria-invalid')).toBe('true');

  // Type valid value
  nameInput.value = 'Sunita Rao';
  nameInput.dispatchEvent({ type: 'input', target: nameInput, currentTarget: nameInput });

  expect(nameInput.getAttribute('aria-invalid')).toBe('false');
  expect(nameInput.classList.contains('err')).toBeFalsy();
  expect(statusEl.textContent).toBe('');
});

// -------------------------------------------------------------
// SECTION 4: High-Contrast Focus-Visible Styling
// -------------------------------------------------------------
console.log('\n--- 4. High-Contrast Focus-Visible Styling ---');

runCheck('CSS defines high-contrast :focus-visible rules with outline and offset', () => {
  const css = parseCssRules();
  expect(css.clean).toContain(':focus-visible{outline:2px solid var(--green-700);outline-offset:3px}');
});

runCheck('Interactive elements have explicit :focus-visible styling', () => {
  const css = parseCssRules();
  expect(css.clean).toContain('.btn:focus-visible');
  expect(css.clean).toContain('.tab:focus-visible');
  expect(css.clean).toContain('.filter:focus-visible');
  expect(css.clean).toContain('.s-btn:focus-visible');
  expect(css.clean).toContain('.hamburger:focus-visible');
  expect(css.clean).toContain('.book-form input:focus-visible');
  expect(css.clean).toContain('.footer a:focus-visible');
});

// -------------------------------------------------------------
// SECTION 5: Responsive Matrix & Zero Overflow
// -------------------------------------------------------------
console.log('\n--- 5. Responsive Matrix & Zero Overflow ---');

runCheck('html and body enforce overflow-x: clip to guarantee zero horizontal scroll', () => {
  const css = parseCssRules();
  expect(css.clean).toContain('overflow-x:clip');
});

runCheck('Interactive mobile touch targets satisfy minimum 44px height', () => {
  const css = parseCssRules();
  expect(css.clean).toContain('.s-btn{width:44px;height:44px');
  expect(css.clean).toContain('.hamburger{display:none;flex-direction:column;justify-content:center;gap:5px;width:46px;height:44px');
  
  const m820 = css.mediaQueries.find(m => m.condition.includes('max-width:820px') || m.condition.includes('max-width: 820px'));
  expect(m820).toBeDefined();
  expect(m820.body).toContain('.tab{min-height:44px');
  expect(m820.body).toContain('.filter{min-height:44px');
});

runCheck('Debounced window resize listener is registered for layout and ScrollTrigger stability', () => {
  const js = loadJs();
  expect(js).toContain('resizeTimer');
  expect(js).toContain('ScrollTrigger.refresh()');
});

// -------------------------------------------------------------
// SECTION 6: Prefers-Reduced-Motion Dual-Layer Verification
// -------------------------------------------------------------
console.log('\n--- 6. Prefers-Reduced-Motion Dual-Layer Verification ---');

runCheck('CSS @media (prefers-reduced-motion: reduce) sets animation and transition to none (!important)', () => {
  const css = parseCssRules();
  const prm = css.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
  expect(prm).toBeDefined();
  expect(prm.body).toContain('animation:none!important');
  expect(prm.body).toContain('transition:none!important');
  expect(prm.body).toContain('scroll-behavior:auto!important');
});

runCheck('All animated content elements render at opacity 1 and transform none under reduced motion', () => {
  const css = parseCssRules();
  const prm = css.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
  expect(prm.body).toContain('.reveal');
  expect(prm.body).toContain('.float-card');
  expect(prm.body).toContain('.recipe');
  expect(prm.body).toContain('.who-card');
  expect(prm.body).toContain('.prog-card');
  expect(prm.body).toContain('.women-card');
  expect(prm.body).toContain('.step');
  expect(prm.body).toContain('.transform');
  expect(prm.body).toContain('.insta-box');
  expect(prm.body).toContain('opacity:1!important');
  expect(prm.body).toContain('transform:none!important');
});

runCheck('JS engine skips Lenis instantiation and reveals all elements immediately when prefers-reduced-motion is active', () => {
  const env = createBrowserEnvironment({ prefersReducedMotion: true });
  env.executeScript();

  expect(env.window.lenis).toBeNull();
  const reveals = env.document.querySelectorAll('.reveal');
  reveals.forEach(el => {
    expect(el.classList.contains('in')).toBeTruthy();
  });
});

// -------------------------------------------------------------
// SECTION 7: Performance & Zero-CLS Layout Dimensions
// -------------------------------------------------------------
console.log('\n--- 7. Performance & Zero-CLS Layout Dimensions ---');

runCheck('All images have explicit intrinsic dimensions (width and height) or aspect ratios', () => {
  const env = createBrowserEnvironment();
  const images = env.document.querySelectorAll('img');
  expect(images.length).toBeGreaterThanOrEqual(22);

  const heroMain = env.document.querySelector('.hero-img-main img');
  expect(heroMain.getAttribute('width')).toBe('400');
  expect(heroMain.getAttribute('height')).toBe('500');

  const heroFood = env.document.querySelector('.hero-img-sub img');
  expect(heroFood.getAttribute('width')).toBe('172');
  expect(heroFood.getAttribute('height')).toBe('172');

  const recipeImgs = env.document.querySelectorAll('.recipe-img img');
  expect(recipeImgs.length).toBe(16);
  recipeImgs.forEach(img => {
    expect(img.getAttribute('width')).toBe('400');
    expect(img.getAttribute('height')).toBe('300');
  });

  const transformImgs = env.document.querySelectorAll('.transform img');
  expect(transformImgs.length).toBe(3);
  transformImgs.forEach(img => {
    expect(img.getAttribute('width')).toBe('360');
    expect(img.getAttribute('height')).toBe('360');
  });
});

runCheck('CSS specifies explicit aspect-ratio on media containers to prevent layout shift (CLS < 0.1)', () => {
  const css = parseCssRules();
  expect(css.clean).toContain('.recipe-img{position:relative;aspect-ratio:4/3');
  expect(css.clean).toContain('.hero-img-main{border-radius:200px 200px var(--r-xl) var(--r-xl);overflow:hidden;box-shadow:var(--sh-lg);aspect-ratio:4/5');
  expect(css.clean).toContain('.hero-img-sub{position:absolute;left:0;bottom:34px;width:172px;aspect-ratio:1');
  expect(css.clean).toContain('.transform img{aspect-ratio:1');
});

// -------------------------------------------------------------
// FINAL SUMMARY
// -------------------------------------------------------------
console.log('\n------------------------------------------------------------');
console.log(`M4 Tests Summary: ${passedCount} passed, ${failedCount} failed (${passedCount + failedCount} total)`);
console.log('------------------------------------------------------------\n');

if (failedCount > 0) {
  console.error(`✖ ${failedCount} test(s) failed in M4 verification.`);
  process.exit(1);
} else {
  console.log('✔ ALL M4 VERIFICATION CHECKS PASSED PERFECTLY!\n');
  process.exit(0);
}
