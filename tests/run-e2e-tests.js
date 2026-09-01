#!/usr/bin/env node
/**
 * Master E2E & Component Test Runner for Nutrinance Single-Page Website
 * Executes Tiers 1 through 6 comprehensively and prints formatted test reports.
 */

const tier1Runner = require('./tier1-feature-coverage.test');
const tier2Runner = require('./tier2-boundary-corner.test');
const tier3Runner = require('./tier3-pairwise-combinations.test');
const tier4Runner = require('./tier4-real-world-scenarios.test');
const tier5IntegrationsRunner = require('./tier5_adversarial_integrations.test');
const tier5ScrollRunner = require('./tier5_adversarial_scroll.test');
const serverEntrypointRunner = require('./server-entrypoint.test');

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

async function runAllTiers() {
  console.log(`\n${ANSI.bold}${ANSI.cyan}============================================================${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}   NUTRINANCE AUTOMATED E2E & BEHAVIORAL TEST SUITE          ${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.cyan}============================================================${ANSI.reset}\n`);

  const startTime = Date.now();
  const tiers = [
    { name: 'Tier 1: Feature Coverage (Base & Semantic)', runner: tier1Runner, min: 70 },
    { name: 'Tier 2: Boundary & Corner Cases', runner: tier2Runner, min: 70 },
    { name: 'Tier 3: Cross-Feature Pairwise Combinations', runner: tier3Runner, min: 14 },
    { name: 'Tier 4: Real-World Application Scenarios', runner: tier4Runner, min: 7 },
    { name: 'Tier 5A: Adversarial Integrations & WhatsApp/Instagram Hardening', runner: tier5IntegrationsRunner, min: 30 },
    { name: 'Tier 5B: Adversarial Scroll Engine, WAAPI & GSAP Hardening', runner: tier5ScrollRunner, min: 30 },
    { name: 'Tier 6: Universal Serverless & Static HTTP Entrypoint', runner: serverEntrypointRunner, min: 37 }
  ];

  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;
  const allFailures = [];
  const tierReports = [];

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    console.log(`${ANSI.bold}Running ${tier.name}...${ANSI.reset}`);
    const tStart = Date.now();
    const result = await tier.runner.run();
    const duration = Date.now() - tStart;

    grandTotal += result.total;
    grandPassed += result.passed;
    grandFailed += result.failed;

    if (result.failures && result.failures.length > 0) {
      allFailures.push(...result.failures);
    }

    const passedMin = result.passed >= tier.min;
    const tierPassed = result.failed === 0 && passedMin;

    tierReports.push({
      tierNumber: i + 1,
      name: tier.name,
      total: result.total,
      passed: result.passed,
      failed: result.failed,
      duration,
      status: tierPassed ? `${ANSI.green}PASS${ANSI.reset}` : `${ANSI.red}FAIL${ANSI.reset}`
    });

    const statusBadge = tierPassed
      ? `${ANSI.green}✔ PASSED${ANSI.reset}`
      : `${ANSI.red}✖ FAILED${ANSI.reset}`;
    console.log(`  └─ ${statusBadge} (${result.passed}/${result.total} passed in ${duration}ms)\n`);
  }

  const totalDuration = Date.now() - startTime;

  // Print Summary Table
  console.log(`${ANSI.bold}${ANSI.white}------------------------------------------------------------${ANSI.reset}`);
  console.log(`${ANSI.bold}                      TEST SUITE SUMMARY                    ${ANSI.reset}`);
  console.log(`${ANSI.bold}${ANSI.white}------------------------------------------------------------${ANSI.reset}`);
  console.log(`Tier   Status   Passed / Total   Min Req   Duration   Tier Name`);
  console.log(`------------------------------------------------------------`);

  tierReports.forEach(tr => {
    const tierNumStr = `T${tr.tierNumber}`.padEnd(6);
    const statusStr = tr.status.padEnd(16);
    const ratioStr = `${tr.passed}/${tr.total}`.padEnd(16);
    const minReqStr = `${tiers[tr.tierNumber - 1].min}`.padEnd(10);
    const durStr = `${tr.duration}ms`.padEnd(10);
    console.log(`${tierNumStr} ${statusStr} ${ratioStr} ${minReqStr} ${durStr} ${tr.name}`);
  });

  console.log(`${ANSI.bold}${ANSI.white}------------------------------------------------------------${ANSI.reset}`);
  console.log(`${ANSI.bold}Grand Total: ${grandPassed}/${grandTotal} tests passed (${grandFailed} failed) in ${totalDuration}ms${ANSI.reset}\n`);

  if (allFailures.length > 0) {
    console.error(`${ANSI.bold}${ANSI.red}FAILURES ENCOUNTERED (${allFailures.length}):${ANSI.reset}`);
    allFailures.forEach((f, idx) => {
      console.error(`\n${idx + 1}) ${ANSI.bold}${f.suiteName} > ${f.testName}${ANSI.reset}`);
      console.error(`   ${ANSI.red}${f.error}${ANSI.reset}`);
      if (f.stack) {
        console.error(`   ${ANSI.dim}${f.stack.split('\n').slice(1, 4).join('\n   ')}${ANSI.reset}`);
      }
    });
    console.log(`\n${ANSI.red}${ANSI.bold}TEST SUITE FAILED${ANSI.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${ANSI.green}${ANSI.bold}✔ ALL TIERS PASSED PERFECTLY! 100% SUCCESS RATE (${grandPassed}/${grandTotal})${ANSI.reset}\n`);
    process.exit(0);
  }
}

if (require.main === module) {
  runAllTiers().catch(err => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
  });
}

module.exports = { runAllTiers };
