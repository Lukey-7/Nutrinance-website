/**
 * Tier 4 - Real-World Application Scenarios (≥7 tests)
 * Evaluates comprehensive multi-step user journeys and end-to-end workflows:
 * - Full New Client Discovery Journey
 * - Women's Health & Hormonal Inquiry Journey
 * - Healthy Recipe Browsing & Macro Check Journey
 * - Mobile Navigation & FAQ Interaction Journey
 * - Accessibility & Motion Sensitivity Journey
 * - Social Proof & Brand Trust Journey
 * - End-to-End Consultation Booking Journey
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

describe('Tier 4: Real-World Application Scenarios', () => {

  it('Scenario 1: Full New Client Discovery Journey', () => {
    const env = createBrowserEnvironment();
    env.executeScript();

    // Step 1: User observes top announcement bar
    const topbar = env.document.querySelector('.topbar');
    expect(topbar).not.toBeNull();
    expect(topbar.textContent).toContain('free 15-min discovery call on WhatsApp');

    // Step 2: User inspects hero copy and CTAs
    const heroCopy = env.document.querySelector('.hero-copy');
    expect(heroCopy).not.toBeNull();
    const heroWaCta = heroCopy.querySelector('[data-wa]');
    expect(heroWaCta.getAttribute('href')).toContain('https://wa.me/' + env.getWhatsAppNumber());

    // Step 3: User navigates to #who and reads family-oriented diet offerings
    const whoCards = env.document.querySelectorAll('.who-card');
    expect(whoCards.length).toBe(4);
    const whoTitles = whoCards.map(c => c.querySelector('h3').textContent);
    expect(whoTitles).toContain('Women');
    expect(whoTitles).toContain('Men');
    expect(whoTitles).toContain('Kids');
    expect(whoTitles).toContain('Toddlers');

    // Step 4: User scrolls to #programs, switches to weight gain tab, and selects a program
    const gainTab = env.document.querySelector('.tab[data-tab="gain"]');
    gainTab.click();
    const gainPanel = env.document.querySelector('.tab-panel[data-panel="gain"]');
    expect(gainPanel.classList.contains('is-active')).toBeTruthy();

    const gainCards = gainPanel.querySelectorAll('.prog-card');
    expect(gainCards.length).toBe(3);
    const kidsGainCard = gainCards[0];
    expect(kidsGainCard.textContent).toContain('Weight Gain for Kids');

    const enquireLink = kidsGainCard.querySelector('[data-wa]');
    expect(enquireLink.getAttribute('href')).toContain(encodeURIComponent('Hi! I am interested in the Weight Gain plan for Kids.'));
  });

  it('Scenario 2: Women\'s Health & Hormonal Inquiry Journey', () => {
    const env = createBrowserEnvironment();
    env.executeScript();

    // Step 1: User clicks on Women's Health in nav
    const womenLink = env.document.querySelector('#nav a[href="#women"]');
    expect(womenLink).not.toBeNull();
    expect(womenLink.textContent).toContain("Women's Health");

    // Step 2: User reviews the 6 hormonal conditions
    const womenSection = env.document.getElementById('women');
    expect(womenSection).not.toBeNull();
    const conditionCards = womenSection.querySelectorAll('.women-card');
    expect(conditionCards.length).toBe(6);

    const conditionTitles = conditionCards.map(c => c.querySelector('h3').textContent);
    expect(conditionTitles).toContain('PCOS & PCOD');
    expect(conditionTitles).toContain('Thyroid Health');
    expect(conditionTitles).toContain('Pregnancy Nutrition');
    expect(conditionTitles).toContain('Post-Pregnancy Care');
    expect(conditionTitles).toContain('Period & Gut Health');
    expect(conditionTitles).toContain('Menopause & After');

    // Step 3: User clicks "Talk about my hormones" CTA
    const hormoneCta = womenSection.querySelector('.women-cta [data-wa]');
    expect(hormoneCta).not.toBeNull();
    const href = hormoneCta.getAttribute('href');
    expect(href).toContain('https://wa.me/' + env.getWhatsAppNumber());
    const decodedHref = decodeURIComponent(href);
    expect(decodedHref).toContain('talk about a women');
    expect(decodedHref).toContain('PCOS / thyroid / pregnancy');
    expect(hormoneCta.getAttribute('target')).toBe('_blank');
    expect(hormoneCta.getAttribute('rel')).toBe('noopener');

    // Step 4: User discovers Instagram social profile link in footer
    const instaLink = env.document.querySelector('.footer .socials a[href*="instagram.com"]');
    expect(instaLink.getAttribute('href')).toBe('https://www.instagram.com/nutrinance.wellbeing');
    expect(instaLink.getAttribute('target')).toBe('_blank');
    expect(instaLink.getAttribute('rel')).toBe('noopener');
  });

  it('Scenario 3: Healthy Recipe Browsing & Macro Check Journey', () => {
    const env = createBrowserEnvironment();
    env.executeScript();

    // Step 1: User visits recipe section
    const recipeSec = env.document.getElementById('recipes');
    expect(recipeSec).not.toBeNull();

    // Step 2: User switches to 'Breakfast' filter and checks macros
    const breakfastBtn = recipeSec.querySelector('.filter[data-filter="breakfast"]');
    breakfastBtn.click();
    const breakfastCards = recipeSec.querySelectorAll('.recipe[data-cat="breakfast"]');
    expect(breakfastCards.length).toBe(4);

    const chillaCard = breakfastCards[0];
    expect(chillaCard.querySelector('h3').textContent).toContain('Moong Dal Chilla');
    const chillaMeta = chillaCard.querySelectorAll('.recipe-meta li');
    expect(chillaMeta.map(m => m.textContent)).toContain('210 kcal');
    expect(chillaMeta.map(m => m.textContent)).toContain('High protein');

    // Step 3: User switches to 'Dinner' filter and checks comfort meal
    const dinnerBtn = recipeSec.querySelector('.filter[data-filter="dinner"]');
    dinnerBtn.click();
    const dinnerCards = recipeSec.querySelectorAll('.recipe[data-cat="dinner"]');
    expect(dinnerCards.length).toBe(4);

    const khichdiCard = dinnerCards.find(c => c.textContent.includes('Khichdi'));
    expect(khichdiCard).toBeDefined();
    expect(khichdiCard.textContent).toContain('Millet Khichdi');
    expect(khichdiCard.textContent).toContain('300 kcal');

    // Step 4: User requests full recipe book on WhatsApp
    const recipeCta = recipeSec.querySelector('.recipe-cta [data-wa]');
    expect(recipeCta.getAttribute('href')).toContain(encodeURIComponent('Hi Nutrinance! Can you send me the Nutrinance weight-loss recipe book?'));
  });

  it('Scenario 4: Mobile Navigation & FAQ Interaction Journey', () => {
    const env = createBrowserEnvironment({ innerWidth: 390 });
    env.executeScript();

    // Step 1: Mobile user opens hamburger menu
    const burger = env.document.getElementById('hamburger');
    const nav = env.document.getElementById('nav');
    const backdrop = env.document.querySelector('.nav-backdrop');

    expect(burger.getAttribute('aria-expanded')).toBe('false');
    burger.click();
    expect(burger.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList.contains('is-open')).toBeTruthy();
    expect(env.document.body.classList.contains('nav-open')).toBeTruthy();
    expect(backdrop.classList.contains('is-on')).toBeTruthy();

    // Step 2: User clicks FAQ link in drawer
    const faqNavLink = nav.querySelector('a[href="#faq"]');
    expect(faqNavLink).not.toBeNull();
    faqNavLink.click();

    // Drawer should auto-close and scroll-lock released
    expect(nav.classList.contains('is-open')).toBeFalsy();
    expect(env.document.body.classList.contains('nav-open')).toBeFalsy();
    expect(burger.getAttribute('aria-expanded')).toBe('false');

    // Step 3: User explores FAQ questions
    const faqSec = env.document.getElementById('faq');
    const allDetails = faqSec.querySelectorAll('details');
    expect(allDetails.length).toBe(6);

    // User opens first FAQ (Rice & roti question)
    const firstFaq = allDetails[0];
    expect(firstFaq.querySelector('summary').textContent).toContain('Will I have to give up rice, roti and my regular food?');
    firstFaq.setAttribute('open', '');
    expect(firstFaq.hasAttribute('open')).toBeTruthy();
    expect(firstFaq.querySelector('p').textContent).toContain('Nutrinance plans are built around desi food');
  });

  it('Scenario 5: Accessibility & Motion Sensitivity Audit Journey', () => {
    const env = createBrowserEnvironment({ prefersReducedMotion: true });
    env.executeScript();

    // Step 1: Verify matchMedia reflects reduced-motion preference
    const mql = env.window.matchMedia('(prefers-reduced-motion: reduce)');
    expect(mql.matches).toBeTruthy();

    // Step 2: Verify CSS reduces all animations and transitions
    const cssRules = parseCssRules();
    const prm = cssRules.mediaQueries.find(m => m.condition.includes('prefers-reduced-motion'));
    expect(prm).toBeDefined();
    expect(prm.body).toContain('animation:none!important');
    expect(prm.body).toContain('transition:none!important');
    expect(prm.body).toContain('scroll-behavior:auto!important');

    // Step 3: Verify ARIA semantics across interactive elements
    expect(env.document.querySelector('.tabs').getAttribute('role')).toBe('tablist');
    expect(env.document.getElementById('nav').getAttribute('aria-label')).toBe('Main');
    expect(env.document.getElementById('hamburger').hasAttribute('aria-expanded')).toBeTruthy();
    expect(env.document.querySelector('.marquee').getAttribute('aria-hidden')).toBe('true');

    // Step 4: Verify all images have alt attributes
    const imgs = env.document.querySelectorAll('img');
    imgs.forEach(img => {
      expect(img.hasAttribute('alt')).toBeTruthy();
      expect(img.getAttribute('alt').length).toBeGreaterThan(0);
    });
  });

  it('Scenario 6: Social Proof & Brand Trust Journey', () => {
    const env = createBrowserEnvironment();
    env.executeScript();

    // Step 1: Verify hero trust stats
    const heroStats = env.document.querySelector('.hero-stats');
    expect(heroStats.textContent).toContain('2,500+');
    expect(heroStats.textContent).toContain('Happy clients');
    expect(heroStats.textContent).toContain('25.9K');
    expect(heroStats.textContent).toContain('Instagram family');
    expect(heroStats.textContent).toContain('4.9');
    expect(heroStats.textContent).toContain('Average rating');

    // Step 2: Verify rating bar statistics
    const ratingBar = env.document.querySelector('.rating-bar');
    expect(ratingBar.textContent).toContain('92%');
    expect(ratingBar.textContent).toContain('Stay past month three');

    // Step 3: Verify client transformation figures
    const transforms = env.document.querySelectorAll('.transform');
    expect(transforms.length).toBe(3);
    expect(transforms[0].textContent).toContain('-12 kg in 6 months');
    expect(transforms[0].textContent).toContain('PCOS weight loss');
    expect(transforms[1].textContent).toContain('-8 inches off the waist');
    expect(transforms[2].textContent).toContain('+6 kg healthy weight');

    // Step 4: Verify footer canonical social links
    const footerInsta = env.document.querySelector('.footer a[href*="instagram.com"]');
    expect(footerInsta.getAttribute('href')).toBe('https://www.instagram.com/nutrinance.wellbeing');
    expect(footerInsta.getAttribute('target')).toBe('_blank');
    expect(footerInsta.getAttribute('rel')).toBe('noopener');
  });

  it('Scenario 7: End-to-End Consultation Booking Journey', () => {
    const env = createBrowserEnvironment();
    env.executeScript();

    const form = env.document.getElementById('bookForm');
    expect(form).not.toBeNull();
    const nameInput = env.document.getElementById('bName');
    const ageInput = env.document.getElementById('bAge');
    const goalSelect = env.document.getElementById('bGoal');
    const noteTextarea = env.document.getElementById('bNote');

    // Step 1: User submits empty form -> Validation error occurs
    nameInput.value = '';
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });
    expect(nameInput.classList.contains('err')).toBeTruthy();
    expect(nameInput._isFocused).toBeTruthy();
    expect(env.openedUrls.length).toBe(0);

    // Step 2: User enters valid form data
    nameInput.value = 'Pooja Sharma';
    nameInput.dispatchEvent({ type: 'input', target: nameInput, currentTarget: nameInput });
    expect(nameInput.classList.contains('err')).toBeFalsy();

    ageInput.value = '31';
    goalSelect.value = 'PCOS / PCOD';
    noteTextarea.value = 'Struggling with irregular periods and weight gain for 2 years.\nBlood reports ready.';

    // Step 3: User submits form -> WhatsApp opens with multi-line formatted message
    form.dispatchEvent({ type: 'submit', preventDefault: () => {} });

    expect(env.openedUrls.length).toBe(1);
    const opened = env.openedUrls[0];
    expect(opened.target).toBe('_blank');
    expect(opened.features).toBe('noopener');

    const expectedPhone = env.getWhatsAppNumber();
    expect(opened.url.startsWith('https://wa.me/' + expectedPhone + '?text=')).toBeTruthy();

    const decoded = decodeURIComponent(opened.url.split('text=')[1]);
    expect(decoded).toContain('Hi Nutrinance! I would like to book a consultation.');
    expect(decoded).toContain('Name: Pooja Sharma');
    expect(decoded).toContain('Age: 31');
    expect(decoded).toContain('I need help with: PCOS / PCOD');
    expect(decoded).toContain('Other details: Struggling with irregular periods and weight gain for 2 years.\nBlood reports ready.');
    expect(decoded).toContain('Looking forward to hearing from you!');
  });

});

module.exports = runner;
