/**
 * Milestone 3 Verification Suite (M3: Instagram & WhatsApp Engagement)
 * Tests Instagram Community Banner, Canonical URLs, WhatsApp Floating Radar,
 * Dynamic [data-wa] resolution, and Booking Form Multi-line URI serialization.
 */

const fs = require('fs');
const path = require('path');
const {
  loadHtml,
  loadCss,
  loadJs,
  createBrowserEnvironment,
  parseCssRules,
  expect
} = require('./test-utils');

console.log('============================================================');
console.log('      NUTRINANCE M3 VERIFICATION & INTEGRITY SUITE          ');
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
// SECTION 1: Instagram Community Strip Markup & Components
// -------------------------------------------------------------
console.log('--- 1. Instagram Community Strip & Semantic Markup ---');

runCheck('Dedicated Instagram community section exists with id="community"', () => {
  const env = createBrowserEnvironment();
  const section = env.document.getElementById('community') || env.document.querySelector('.insta-community');
  expect(section).not.toBeNull();
});

runCheck('Community strip contains handle @nutrinance.wellbeing', () => {
  const env = createBrowserEnvironment();
  const handle = env.document.querySelector('.insta-handle');
  expect(handle).not.toBeNull();
  expect(handle.textContent).toContain('@nutrinance.wellbeing');
});

runCheck('Community strip contains follower badge with 25.9K+ Instagram family', () => {
  const env = createBrowserEnvironment();
  const badge = env.document.querySelector('.insta-badge');
  expect(badge).not.toBeNull();
  expect(badge.textContent).toContain('25.9K+ Instagram family');
});

runCheck('Community strip contains value proposition text', () => {
  const env = createBrowserEnvironment();
  const lead = env.document.querySelector('.insta-lead');
  expect(lead).not.toBeNull();
  expect(lead.textContent).toContain('Daily Desi meal plans, portion swaps, hormone balance tips & real client stories');
});

runCheck('Community strip contains 4 lifestyle preview pill tags', () => {
  const env = createBrowserEnvironment();
  const pills = env.document.querySelectorAll('.insta-pill');
  expect(pills.length).toBe(4);
  const textList = pills.map(p => p.textContent);
  expect(textList.some(t => t.includes('100+ Desi Recipes'))).toBeTruthy();
  expect(textList.some(t => t.includes('Hormone Balance Guides'))).toBeTruthy();
  expect(textList.some(t => t.includes('Real Client Transformations'))).toBeTruthy();
  expect(textList.some(t => t.includes('Daily Wellness Q&As'))).toBeTruthy();
});

runCheck('Community strip has Follow on Instagram CTA button with canonical link', () => {
  const env = createBrowserEnvironment();
  const cta = env.document.querySelector('.insta-action a');
  expect(cta).not.toBeNull();
  expect(cta.getAttribute('href')).toBe('https://www.instagram.com/nutrinance.wellbeing');
  expect(cta.getAttribute('target')).toBe('_blank');
  expect(cta.getAttribute('rel')).toBe('noopener');
  expect(cta.textContent).toContain('Follow on Instagram');
});

// -------------------------------------------------------------
// SECTION 2: Canonical Instagram Link Consistency Across Site
// -------------------------------------------------------------
console.log('\n--- 2. Canonical Instagram Link Audit Across Entire Site ---');

runCheck('Every Instagram anchor tag links strictly to https://www.instagram.com/nutrinance.wellbeing', () => {
  const env = createBrowserEnvironment();
  const instaLinks = env.document.querySelectorAll('a[href*="instagram"]');
  expect(instaLinks.length).toBeGreaterThanOrEqual(3);
  instaLinks.forEach(a => {
    expect(a.getAttribute('href')).toBe('https://www.instagram.com/nutrinance.wellbeing');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener');
  });
});

runCheck('Every Instagram anchor tag provides accessible name containing "instagram"', () => {
  const env = createBrowserEnvironment();
  const instaLinks = env.document.querySelectorAll('a[href*="instagram"]');
  instaLinks.forEach(a => {
    const text = a.textContent.trim();
    const aria = a.getAttribute('aria-label') || '';
    const acc = (text + ' ' + aria).toLowerCase();
    expect(acc).toContain('instagram');
  });
});

runCheck('No insecure http or misspelled Instagram URLs in HTML', () => {
  const html = loadHtml();
  expect(html).not.toContain('http://www.instagram');
  expect(html).not.toContain('http://instagram');
  expect(html).not.toContain('nutrinance_wellbeing');
});

// -------------------------------------------------------------
// SECTION 3: WhatsApp Floating CTA & Radar Animation
// -------------------------------------------------------------
console.log('\n--- 3. WhatsApp Floating Button & Animations ---');

runCheck('Floating WhatsApp button is present with accessible label and SVG', () => {
  const env = createBrowserEnvironment();
  const wa = env.document.querySelector('.wa-float');
  expect(wa).not.toBeNull();
  expect(wa.getAttribute('aria-label')).toBe('Chat on WhatsApp');
  expect(wa.querySelector('svg')).not.toBeNull();
  expect(wa.querySelector('span').textContent).toBe('Chat with us');
});

runCheck('CSS defines radar pulse animation (@keyframes waPulse and ::before)', () => {
  const css = parseCssRules();
  expect(css.keyframes.some(k => k.name === 'waPulse')).toBeTruthy();
  expect(css.clean).toContain('.wa-float::before');
  expect(css.clean).toContain('animation:waPulse');
});

runCheck('CSS defines entrance animation (@keyframes waFloatIn)', () => {
  const css = parseCssRules();
  expect(css.keyframes.some(k => k.name === 'waFloatIn')).toBeTruthy();
  expect(css.clean).toContain('animation:waFloatIn');
});

runCheck('CSS defines hover expansion on desktop and compact circular mode on mobile <=620px', () => {
  const css = parseCssRules();
  expect(css.clean).toContain('.wa-float:hover span{max-width:140px;opacity:1}');
  const m620 = css.mediaQueries.find(m => m.condition.includes('max-width:620px') || m.condition.includes('max-width: 620px'));
  expect(m620).toBeDefined();
  expect(m620.body).toContain('.wa-float:hover span{max-width:0;opacity:0}');
});

// -------------------------------------------------------------
// SECTION 4: Dynamic [data-wa] Resolution
// -------------------------------------------------------------
console.log('\n--- 4. Dynamic [data-wa] Resolution ---');

runCheck('All [data-wa] elements dynamically resolve to valid wa.me URI with target="_blank" and rel="noopener"', () => {
  const env = createBrowserEnvironment();
  env.executeScript();
  const waElements = env.document.querySelectorAll('[data-wa]');
  expect(waElements.length).toBeGreaterThanOrEqual(21);
  const phone = env.getWhatsAppNumber();
  expect(phone).toBe('919999999999');

  waElements.forEach(el => {
    const href = el.getAttribute('href');
    expect(href.startsWith(`https://wa.me/${phone}?text=`)).toBeTruthy();
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.getAttribute('rel')).toBe('noopener');
  });
});

// -------------------------------------------------------------
// SECTION 5: #bookForm Validation & Multi-Line Encoding
// -------------------------------------------------------------
console.log('\n--- 5. Booking Form Validation & Multi-Line URL Encoding ---');

runCheck('Empty name submission flags #bName with .err and focuses input without opening window', () => {
  const env = createBrowserEnvironment();
  env.executeScript();
  const form = env.document.getElementById('bookForm');
  const nameInput = env.document.getElementById('bName');
  nameInput.value = '   ';

  form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
  expect(nameInput.classList.contains('err')).toBeTruthy();
  expect(nameInput._isFocused).toBeTruthy();
  expect(env.openedUrls.length).toBe(0);
});

runCheck('Typing in #bName dismisses .err class', () => {
  const env = createBrowserEnvironment();
  env.executeScript();
  const nameInput = env.document.getElementById('bName');
  nameInput.classList.add('err');

  nameInput.dispatchEvent({ type: 'input', target: nameInput, currentTarget: nameInput });
  expect(nameInput.classList.contains('err')).toBeFalsy();
});

runCheck('Valid form submission encodes name, age, goal, and notes into structured multi-line WhatsApp URL', () => {
  const env = createBrowserEnvironment();
  env.executeScript();
  const form = env.document.getElementById('bookForm');
  env.document.getElementById('bName').value = 'Pooja Sharma';
  env.document.getElementById('bAge').value = '28';
  env.document.getElementById('bGoal').value = 'PCOS / PCOD';
  env.document.getElementById('bNote').value = 'Suffering from bloating & irregular cycles 🥗';

  form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

  expect(env.openedUrls.length).toBe(1);
  const opened = env.openedUrls[0];
  expect(opened.target).toBe('_blank');
  expect(opened.features).toBe('noopener');

  const rawUrl = opened.url;
  expect(rawUrl).toContain('https://wa.me/919999999999?text=');
  expect(rawUrl).toContain(encodeURIComponent('Pooja Sharma'));
  expect(rawUrl).toContain(encodeURIComponent('Age: 28'));
  expect(rawUrl).toContain(encodeURIComponent('I need help with: PCOS / PCOD'));
  expect(rawUrl).toContain(encodeURIComponent('Suffering from bloating & irregular cycles 🥗'));
});

// -------------------------------------------------------------
// SECTION 6: Responsive & Motion Overrides
// -------------------------------------------------------------
console.log('\n--- 6. Responsive & Motion Overrides ---');

runCheck('CSS includes responsive layout collapse for Instagram box on tablet (960px) and mobile (620px)', () => {
  const css = parseCssRules();
  const m960 = css.mediaQueries.find(m => m.condition.includes('max-width:960px') || m.condition.includes('max-width: 960px'));
  expect(m960).toBeDefined();
  expect(m960.body).toContain('.insta-box{flex-direction:column');

  const m620 = css.mediaQueries.find(m => m.condition.includes('max-width:620px') || m.condition.includes('max-width: 620px'));
  expect(m620).toBeDefined();
  expect(m620.body).toContain('.insta-box{padding:26px 20px');
});

runCheck('prefers-reduced-motion overrides ensure .insta-box is visible without transition/animation', () => {
  const css = parseCssRules();
  const prm = css.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
  expect(prm).toBeDefined();
  expect(prm.body).toContain('.insta-box');
  expect(prm.body).toContain('opacity:1!important');
  expect(prm.body).toContain('transform:none!important');
});

console.log('\n============================================================');
console.log(`TOTAL CHECKS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log(`OVERALL M3 STATUS: ${failedCount === 0 ? 'ALL CHECKS PASSED PERFECTLY' : 'FAILURE DETECTED'}`);
console.log('============================================================\n');

process.exit(failedCount === 0 ? 0 : 1);
