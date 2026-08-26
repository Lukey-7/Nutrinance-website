const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

console.log('==============================================');
console.log('      NUTRINANCE M1 VERIFICATION SUITE       ');
console.log('==============================================\n');

let allOk = true;
const rootDir = path.resolve(__dirname, '..');

// 1. Check Files
console.log('--- 1. Checking File Existence & Sizes ---');
const files = [
  'index.html',
  'styles.css',
  'script.js',
  'assets/vendor/lenis.min.js',
  'assets/vendor/lenis.css',
  'assets/vendor/gsap.min.js',
  'assets/vendor/ScrollTrigger.min.js'
];

files.forEach(f => {
  const fullPath = path.join(rootDir, f);
  if (fs.existsSync(fullPath)) {
    const stat = fs.statSync(fullPath);
    console.log(`[PASS] ${f} exists (${stat.size} bytes)`);
  } else {
    console.error(`[FAIL] Missing file: ${f}`);
    allOk = false;
  }
});

// 2. Syntax Check
console.log('\n--- 2. Checking JavaScript Syntax ---');
try {
  const scriptContent = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');
  new Function(scriptContent);
  console.log('[PASS] script.js passes syntax validation');
} catch (e) {
  console.error('[FAIL] script.js syntax error:', e.message);
  allOk = false;
}

// 3. index.html Markup Assertions
console.log('\n--- 3. Checking index.html Markup ---');
const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const htmlChecks = [
  { name: 'lenis.css inclusion', pattern: /href=["']assets\/vendor\/lenis\.css["']/ },
  { name: 'gsap.min.js inclusion', pattern: /src=["']assets\/vendor\/gsap\.min\.js["']/ },
  { name: 'ScrollTrigger.min.js inclusion', pattern: /src=["']assets\/vendor\/ScrollTrigger\.min\.js["']/ },
  { name: 'lenis.min.js inclusion', pattern: /src=["']assets\/vendor\/lenis\.min\.js["']/ },
  { name: 'script.js inclusion', pattern: /src=["']script\.js["']/ },
  { name: 'sliderTrack data-lenis-prevent="true"', pattern: /id=["']sliderTrack["'][^>]*data-lenis-prevent=["']true["']/ },
  { name: 'Lenis CDN fallback script', pattern: /cdn\.jsdelivr\.net\/npm\/lenis@1\.3\.26/ },
  { name: 'GSAP CDN fallback script', pattern: /cdn\.jsdelivr\.net\/npm\/gsap@3\.15\.0/ }
];

htmlChecks.forEach(c => {
  if (c.pattern.test(html)) {
    console.log(`[PASS] ${c.name}`);
  } else {
    console.error(`[FAIL] Missing or invalid: ${c.name}`);
    allOk = false;
  }
});

// 4. styles.css Rules
console.log('\n--- 4. Checking styles.css Rules ---');
const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
const cssChecks = [
  { name: 'html.lenis / html.lenis body rules', pattern: /html\.lenis/ },
  { name: '.lenis.lenis-smooth rule', pattern: /\.lenis\.lenis-smooth/ },
  { name: '.slider-track overscroll-behavior-x contain', pattern: /overscroll-behavior-x\s*:\s*contain/ },
  { name: 'prefers-reduced-motion: reduce overrides', pattern: /prefers-reduced-motion\s*:\s*reduce/ }
];

cssChecks.forEach(c => {
  if (c.pattern.test(css)) {
    console.log(`[PASS] ${c.name}`);
  } else {
    console.error(`[FAIL] Missing or invalid: ${c.name}`);
    allOk = false;
  }
});

// 5. script.js Logic Assertions
console.log('\n--- 5. Checking script.js Logic Requirements ---');
const js = fs.readFileSync(path.join(rootDir, 'script.js'), 'utf8');
const jsChecks = [
  { name: 'prefers-reduced-motion media query check', pattern: /matchMedia\(["']\(prefers-reduced-motion:\s*reduce\)["']\)/ },
  { name: 'Lenis constructor instantiation with duration 1.15', pattern: /new\s+Lenis\(\{[\s\S]*duration:\s*1\.15/ },
  { name: 'GSAP ScrollTrigger registration', pattern: /gsap\.registerPlugin\(ScrollTrigger\)/ },
  { name: 'Lenis on scroll ScrollTrigger.update', pattern: /instance\.on\(["']scroll["'],\s*ScrollTrigger\.update\)|lenis\.on\(["']scroll["'],\s*ScrollTrigger\.update\)/ },
  { name: 'GSAP Ticker raf loop synchronization', pattern: /gsap\.ticker\.add\(/ },
  { name: 'GSAP ticker lagSmoothing(0)', pattern: /gsap\.ticker\.lagSmoothing\(0\)/ },
  { name: 'Dynamic sticky header offset computation', pattern: /targetOffset\s*=\s*-\(headerHeight\s*\+\s*16\)/ },
  { name: 'Lenis scrollTo call with dynamic offset', pattern: /lenis\.scrollTo\(targetElement,\s*\{[\s\S]*offset:\s*targetOffset/ },
  { name: 'Mobile drawer lenis.stop() on open', pattern: /window\.lenis\.stop\(\)/ },
  { name: 'Mobile drawer lenis.start() on close', pattern: /window\.lenis\.start\(\)/ },
  { name: 'sliderTrack data-lenis-prevent attribute enforcement', pattern: /setAttribute\(["']data-lenis-prevent["'],\s*["']true["']\)/ }
];

jsChecks.forEach(c => {
  if (c.pattern.test(js)) {
    console.log(`[PASS] ${c.name}`);
  } else {
    console.error(`[FAIL] Missing or invalid: ${c.name}`);
    allOk = false;
  }
});

console.log('\n==============================================');
console.log(`OVERALL STATUS: ${allOk ? 'SUCCESS (ALL TESTS PASSED)' : 'FAILURE'}`);
console.log('==============================================');

process.exit(allOk ? 0 : 1);
