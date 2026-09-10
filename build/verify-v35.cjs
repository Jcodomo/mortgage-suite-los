const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const FILE = path.resolve(process.argv[2] || 'dist/mortgage-suite-los.html');
const SHOT_DIR = path.resolve(process.argv[3] || 'artifacts/v35-final');
const LANDING = path.resolve(path.dirname(FILE), '..', 'index.html');
const EXECUTABLE = process.env.PLAYWRIGHT_BROWSER_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EXPECTED = ['QUOTE','SETUP','PROPERTY','RENOVATION','MAX MORTGAGE','MORTGAGE RATES','CLOSING','ESCROW','QUALIFY','RENTAL','ADVANCED','SCENARIOS','SUMMARY','DOCUMENTS & OCR'];

(async () => {
  const checks = [];
  const errors = [];
  const ok = (name, pass, detail = '') => checks.push([name, Boolean(pass), detail]);
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: EXECUTABLE });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const landingPage = await context.newPage();
  await landingPage.goto(pathToFileURL(LANDING).href);
  await landingPage.waitForTimeout(300);
  const landing = await landingPage.evaluate(() => ({
    chooser: Boolean(document.querySelector('.chooser')),
    routes: document.querySelectorAll('.routes>a.route').length,
    toggle: Boolean(document.getElementById('modeToggle')),
    loan: document.querySelectorAll('a[href="loan-suite.html"]').length,
    income: document.querySelectorAll('a[href="income-calculator.html"]').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  ok('Landing page is a minimal two-workspace chooser', landing.chooser && landing.routes === 2 && landing.toggle && landing.loan === 1 && landing.income === 1 && landing.overflow <= 1, JSON.stringify(landing));
  await landingPage.locator('#modeToggle').click();
  const landingTheme = await landingPage.evaluate(() => ({ mode: document.documentElement.dataset.mode, surface: localStorage.getItem('los.v25.surface'), input: localStorage.getItem('los.v24.inputTone') }));
  ok('Landing appearance switch carries dark surface and input tone forward', landingTheme.mode === 'dark' && landingTheme.surface === 'dark' && landingTheme.input === 'ink', JSON.stringify(landingTheme));
  await landingPage.waitForTimeout(260);
  await landingPage.screenshot({ path: path.join(SHOT_DIR, 'landing-1920.png'), fullPage: true });
  await landingPage.close();
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => { try { localStorage.clear(); } catch (_) {} });
  await page.goto(pathToFileURL(FILE).href + '?app=suite&tab=setup&release=35-qa');
  await page.waitForTimeout(5200);

  // Pass 1: release integrity, workspaces, freeform fields, and live calculations.
  const release = await page.evaluate(() => ({
    marker: document.documentElement.dataset.losRelease,
    layers: Array.from({ length: 10 }, (_, index) => `V${index + 26}`).filter(name => window[name]).length,
    suite: Boolean(window.mortgageSuite && window.mortgageSuite.store),
    actions: Boolean(window.V35 && document.getElementById('v35Btn'))
  }));
  ok('Release 35 and all ten supplied layers load', release.marker === '35' && release.layers === 10 && release.suite && release.actions, JSON.stringify(release));

  const defaultPage = await context.newPage();
  await defaultPage.goto(pathToFileURL(FILE).href + '?app=suite&release=35-default-qa');
  await defaultPage.waitForTimeout(4200);
  const defaultQuote = await defaultPage.evaluate(() => ({
    mode: mortgageSuite.store.snapshot.mode,
    fields: document.querySelectorAll('#v35QuoteControls [data-v35-quote]').length,
    number: document.querySelectorAll('#v35QuoteControls input[type="number"]').length,
    surface: document.documentElement.dataset.v25Surface,
    theme: document.documentElement.dataset.v24Theme,
    themeOptions: document.querySelector('#v251AppearancePanel .v251-appearance-group')?.querySelectorAll('button').length || 0,
    nav: [...document.querySelectorAll('#v23SuitePrimaryNav>button')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.textContent.trim().replace(/\s+/g,' '))
  }));
  ok('Loan Suite defaults to Quote with four freeform quote controls', defaultQuote.mode === 'quote' && defaultQuote.fields === 4 && defaultQuote.number === 0, JSON.stringify(defaultQuote));
  ok('Fresh sessions default to light mode with five focused themes', defaultQuote.surface === 'light' && defaultQuote.theme === 'ledger' && defaultQuote.themeOptions === 5, JSON.stringify(defaultQuote));
  ok('Documents is a primary workspace immediately after Full', defaultQuote.nav.slice(-2).join('|') === 'Full|Documents', JSON.stringify(defaultQuote.nav));
  for (const [pathName, value] of [['basePurchasePrice','640k'],['zipCode','10001'],['finalDownPaymentPct','5'],['bps.loanAmountOverride','500k']]) {
    const input = defaultPage.locator(`#v35QuoteControls [data-v35-quote="${pathName}"]`);
    await input.fill(value); await input.press('Tab'); await defaultPage.waitForTimeout(180);
  }
  const quoteValues = await defaultPage.evaluate(() => ({
    price: mortgageSuite.store.activeInputs.basePurchasePrice,
    zip: mortgageSuite.store.activeInputs.zipCode,
    down: mortgageSuite.store.activeInputs.finalDownPaymentPct,
    loan: mortgageSuite.store.activeInputs.bps.loanAmountOverride
  }));
  ok('Quote controls update live suite inputs', quoteValues.price === 640000 && quoteValues.zip === '10001' && Math.abs(quoteValues.down - .05) < 1e-9 && quoteValues.loan === 500000, JSON.stringify(quoteValues));

  const rateChip = defaultPage.locator('#v28RateStat');
  if (await rateChip.count() === 1) await rateChip.click();
  await defaultPage.waitForTimeout(120);
  const lightRate = await defaultPage.evaluate(() => {
    const panel = document.getElementById('v29RatePop');
    const input = document.getElementById('v29RateInput');
    if (!panel || !input) return null;
    const p = getComputedStyle(panel), f = getComputedStyle(input);
    return { visible: p.display !== 'none', panelBg: p.backgroundColor, panelText: p.color, fieldBg: f.backgroundColor, fieldText: f.color };
  });
  ok('Light-mode rate menu has readable panel and field contrast', lightRate && lightRate.visible && lightRate.panelBg === 'rgb(255, 255, 255)' && lightRate.panelText !== lightRate.panelBg && lightRate.fieldText !== lightRate.fieldBg, JSON.stringify(lightRate));
  await defaultPage.screenshot({ path: path.join(SHOT_DIR, 'rate-menu-light.png') });
  await defaultPage.evaluate(() => window.V29 && V29.closeRate());

  await defaultPage.locator('#v28nav-documents').click();
  await defaultPage.waitForTimeout(650);
  ok('Primary Documents workspace opens Documents & Worksheets', await defaultPage.evaluate(() => {
    const panel = document.getElementById('panel-v9docs');
    const oldTab = [...document.querySelectorAll('#suite-root .tabs .tab')].find(t => /DOCUMENTS & OCR/i.test(t.textContent));
    return panel && getComputedStyle(panel).display !== 'none' && oldTab && getComputedStyle(oldTab).display === 'none';
  }));

  await defaultPage.evaluate(() => mortgageSuite.store.setMode('renovation'));
  await defaultPage.waitForTimeout(950);
  const renoTabs = await defaultPage.evaluate(() => ({
    buttons: [...document.querySelectorAll('#v35LinkedSubnav button')].map(b => b.textContent.trim()),
    maxHidden: [...document.querySelectorAll('#suite-root .tabs .tab')].filter(t => /MAX MORTGAGE/i.test(t.textContent)).every(t => getComputedStyle(t).display === 'none')
  }));
  ok('Max Mortgage is a Renovation sub-tab', renoTabs.maxHidden && renoTabs.buttons.join('|') === 'Renovation|Max mortgage', JSON.stringify(renoTabs));
  await defaultPage.evaluate(() => mortgageSuite.store.setMode('closing'));
  await defaultPage.waitForTimeout(950);
  const closingTabs = await defaultPage.evaluate(() => ({
    buttons: [...document.querySelectorAll('#v35LinkedSubnav button')].map(b => b.textContent.trim()),
    escrowHidden: [...document.querySelectorAll('#suite-root .tabs .tab')].filter(t => /^ESCROW$/i.test(t.textContent.trim())).every(t => getComputedStyle(t).display === 'none')
  }));
  ok('Escrow is a Closing sub-tab', closingTabs.escrowHidden && closingTabs.buttons.join('|') === 'Closing costs|Taxes & escrow', JSON.stringify(closingTabs));
  await defaultPage.evaluate(() => {
    mortgageSuite.store.setField('renovation', false, 'QA no renovation');
    mortgageSuite.store.setField('afterRepairValue', 0, 'QA no ARV');
    mortgageSuite.store.setField('taxSourceType', 'MLS / Zillow / Redfin Estimate', 'QA source');
  });
  await defaultPage.waitForTimeout(550);
  const warnings = await defaultPage.evaluate(() => mortgageSuite.store.outputs.warnings.map(w => w.code));
  ok('Non-renovation files do not receive an ARV warning', !warnings.includes('MISSING_APPRAISAL_VALUE') && !warnings.includes('ARV_SHORTFALL'), JSON.stringify(warnings));
  ok('MLS/Zillow/Redfin planning tax source is not a warning', !warnings.includes('MISSING_TAX_SOURCE'), JSON.stringify(warnings));
  await defaultPage.evaluate(() => mortgageSuite.store.setMode('advanced'));
  await defaultPage.waitForTimeout(500);
  ok('Advanced includes borrower-facing payment and cost ranges', await defaultPage.evaluate(() => document.querySelectorAll('#v35BorrowerRange button').length === 3));
  await defaultPage.close();

  const pages = await page.evaluate(() => [...document.querySelectorAll('#suite-root .tabs .tab')]
    .map(tab => (tab.dataset.v23Key || tab.textContent).trim().replace(/\s+/g, ' ').toUpperCase()));
  ok('All 14 Loan Suite workspaces remain accessible', EXPECTED.every(label => pages.includes(label)), JSON.stringify(pages));

  const modes = await page.evaluate(() => window.__amdGet('src/ui/sections').SCREENS.map(screen => screen.id));
  const audit = [];
  for (const mode of modes) {
    await page.evaluate(id => mortgageSuite.store.setMode(id), mode);
    await page.waitForTimeout(180);
    audit.push(await page.evaluate(id => {
      const fields = [...document.querySelectorAll('#screen-body input, #screen-body textarea, #screen-body select')]
        .filter(field => getComputedStyle(field).display !== 'none');
      return { id, fields: fields.length, number: fields.filter(f => f.type === 'number').length,
        date: fields.filter(f => f.type === 'date').length, readonly: fields.filter(f => f.readOnly).length };
    }, mode));
  }
  ok('Every rendered Loan Suite screen keeps freeform/editable controls', audit.length >= 11 && audit.every(row => !row.number && !row.date && !row.readonly), JSON.stringify(audit));

  await page.evaluate(() => mortgageSuite.store.setMode('setup'));
  await page.waitForTimeout(500);
  const price = page.locator('#v24WorksheetQuick input[data-path="basePurchasePrice"]').first();
  await price.fill('$575k');
  await price.press('Tab');
  await page.waitForTimeout(650);
  const calc = await page.evaluate(() => ({
    price: mortgageSuite.store.activeInputs.basePurchasePrice,
    totalLoan: mortgageSuite.store.outputs.loan.totalLoan,
    payment: mortgageSuite.store.outputs.payment.totalMonthlyPayment,
    closing: mortgageSuite.store.outputs.closing.buyerClosingCosts
  }));
  ok('Freeform shorthand recalculates loan, payment, and closing outputs', calc.price === 575000 && calc.totalLoan > 0 && calc.payment > 0 && calc.closing >= 0, JSON.stringify(calc));

  await page.evaluate(() => V251.openFull());
  await page.waitForTimeout(1500);
  const full = await page.evaluate(() => {
    const root = document.getElementById('v25FullSheet');
    const fields = [...root.querySelectorAll('input, textarea, select')];
    return { sections: root.querySelectorAll('.v251-full-screen').length, fields: fields.length,
      number: fields.filter(f => f.type === 'number').length, date: fields.filter(f => f.type === 'date').length,
      readonly: fields.filter(f => f.readOnly).length };
  });
  ok('Full form contains all pages and live freeform fields', full.sections === 14 && full.fields > 80 && !full.number && !full.date && !full.readonly, JSON.stringify(full));
  const fullPrice = page.locator('#v25FullSheet input[data-path="basePurchasePrice"]').first();
  await fullPrice.fill('610k');
  await fullPrice.press('Tab');
  await page.waitForTimeout(500);
  ok('Full form edits feed the same calculation engine', await page.evaluate(() => mortgageSuite.store.activeInputs.basePurchasePrice === 610000 && mortgageSuite.store.outputs.loan.totalLoan > 0));
  await page.evaluate(() => V251.openSource('setup'));
  await page.waitForTimeout(850);

  // Pass 2: actions, preserved handlers, nested summary, and generated modal routing.
  await page.locator('#v35Btn').click();
  await page.waitForTimeout(250);
  const menu = await page.evaluate(() => {
    const panel = document.getElementById('v35Panel');
    const rect = panel.getBoundingClientRect();
    const labels = [...panel.querySelectorAll('.v35-item span')].map(n => n.textContent.trim());
    return { labels, width: rect.width, height: rect.height, left: rect.left, right: rect.right,
      top: rect.top, bottom: rect.bottom, parent: panel.parentElement === document.body,
      bg: getComputedStyle(panel.querySelector('.v35-item')).backgroundColor,
      sessions: panel.querySelectorAll('#v35SessionPick').length,
      sessionOptions: panel.querySelectorAll('#v35SessionPick option').length };
  });
  const mustHave = ['Save','Live summary','Full form','Print / Generate','Documents & OCR','PMI Worksheet','Contractor Estimate','Lease','Addendum','Draft LE'];
  ok('Actions is a bounded, dark, body-level panel', menu.parent && menu.left >= 0 && menu.right <= 1920 && menu.top >= 0 && menu.bottom <= 1080 && menu.width <= 560 && menu.bg !== 'rgb(239, 239, 239)', JSON.stringify(menu));
  ok('Actions has one compact previous-session control', menu.sessions === 1 && menu.sessionOptions >= 1, JSON.stringify(menu));
  ok('Actions exposes every essential workflow', mustHave.every(label => menu.labels.some(value => value.toLowerCase() === label.toLowerCase())), JSON.stringify(menu.labels));
  ok('Actions has no duplicate labels', new Set(menu.labels.map(label => label.toUpperCase())).size === menu.labels.length, JSON.stringify(menu.labels));

  const clickAction = async label => {
    if (!(await page.locator('#v35Panel').evaluate(el => el.classList.contains('on')))) await page.locator('#v35Btn').click();
    await page.waitForTimeout(120);
    await page.locator('#v35Panel .v35-item span', { hasText: label }).first().click();
    await page.waitForTimeout(500);
  };
  await clickAction('Live summary');
  const summary = await page.evaluate(() => {
    const cols = document.querySelector('#suite-root .cols-main');
    const rail = cols.querySelector(':scope > .rail');
    const cr = cols.getBoundingClientRect(), rr = rail.getBoundingClientRect();
    const style = getComputedStyle(rail), card = rail.querySelector(':scope > .card'), cardStyle = card && getComputedStyle(card);
    return { open: document.getElementById('suite-root').classList.contains('v24-summary-open'),
      position: getComputedStyle(rail).position, display: getComputedStyle(rail).display,
      inside: rr.left >= cr.left && rr.right <= cr.right + 1, railWidth: rr.width,
      columns: getComputedStyle(cols).gridTemplateColumns, shadow: style.boxShadow,
      background: style.backgroundColor, cardShadow: cardStyle && cardStyle.boxShadow,
      cardBackground: cardStyle && cardStyle.backgroundColor };
  });
  ok('Live summary stays nestled as a frameless sticky column', summary.open && summary.position === 'sticky' && summary.display !== 'none' && summary.inside && summary.railWidth >= 328 && summary.shadow === 'none' && summary.cardShadow === 'none' && summary.background === 'rgba(0, 0, 0, 0)' && summary.cardBackground === 'rgba(0, 0, 0, 0)', JSON.stringify(summary));

  const summaryPrice = page.locator('#suite-root .cols-main>.rail [data-out="Purchase price"]');
  if (await summaryPrice.count() === 1) await summaryPrice.click();
  await page.waitForTimeout(120);
  const editor = await page.evaluate(() => ({
    open: Boolean(document.getElementById('v35RailEditor')),
    field: Boolean(document.querySelector('#v35RailEditor [data-v35-rail-path="basePurchasePrice"]')),
    apply: Boolean(document.querySelector('#v35RailEditor [data-v35-rail-apply]')),
    go: Boolean(document.querySelector('#v35RailEditor [data-v35-rail-go]'))
  }));
  ok('Every right-side result can open a direct-edit or navigate popout', editor.open && editor.field && editor.apply && editor.go, JSON.stringify(editor));
  if (editor.open) {
    await page.screenshot({ path: path.join(SHOT_DIR, 'summary-editor-1920.png'), fullPage: false });
    await page.locator('#v35RailEditor [data-v35-rail-path="basePurchasePrice"]').fill('625k');
    await page.locator('#v35RailEditor [data-v35-rail-apply]').click();
    await page.waitForTimeout(380);
  }
  const summaryEdit = await page.evaluate(() => ({ price: mortgageSuite.store.activeInputs.basePurchasePrice, loan: mortgageSuite.store.outputs.loan.totalLoan, popup: Boolean(document.getElementById('v35RailEditor')) }));
  ok('Direct summary edits use the live calculation engine', summaryEdit.price === 625000 && summaryEdit.loan > 0 && !summaryEdit.popup, JSON.stringify(summaryEdit));
  const railCoverage = await page.evaluate(() => {
    const rail = document.querySelector('#suite-root .cols-main>.rail');
    const rows = [...rail.querySelectorAll('.v35-live-row,.v35-live-block,.v35-live-warnings button,[data-out],[title="Open ARV inputs"]')]
      .filter(row => getComputedStyle(row).display !== 'none');
    const failed = [];
    rows.forEach(row => {
      row.click();
      const editor = document.getElementById('v35RailEditor');
      if (!editor || !editor.querySelector('[data-v35-rail-go]')) failed.push(row.dataset.v35Label || row.dataset.out || row.textContent.trim().slice(0,40));
      if (window.V35) V35.closeRailEditor();
    });
    return { rows: rows.length, failed };
  });
  ok('All visible right-side readings open the shared popout', railCoverage.rows >= 20 && railCoverage.failed.length === 0, JSON.stringify(railCoverage));

  await clickAction('Full form');
  ok('Full form action opens the complete editable sheet', await page.evaluate(() => document.getElementById('suite-root').classList.contains('v251-full-active') && document.querySelectorAll('#v25FullSheet .v251-full-screen').length === 14));
  await page.evaluate(() => V251.openSource('setup'));
  await page.waitForTimeout(450);
  await clickAction('Print / Generate');
  ok('Print / Generate action opens its document chooser', await page.evaluate(() => {
    const modal = document.getElementById('v30GenModal'); return modal && (modal.classList.contains('open') || getComputedStyle(modal).display !== 'none');
  }));
  await page.keyboard.press('Escape');

  // Pass 3: responsive geometry plus a stability sample to catch reorder/flicker loops.
  for (const width of [1024, 1280, 1920, 2560, 3440]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.waitForTimeout(480);
    const geometry = await page.evaluate(() => {
      const cols = document.querySelector('#suite-root .cols-main');
      const rail = cols && cols.querySelector(':scope > .rail');
      const app = document.querySelector('#suite-root .app');
      const action = document.getElementById('v35Btn');
      const rr = rail && rail.getBoundingClientRect(), cr = cols && cols.getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth - innerWidth,
        appWidth: app && app.getBoundingClientRect().width,
        railPosition: rail && getComputedStyle(rail).position,
        railInside: Boolean(rr && cr && rr.left >= cr.left - 1 && rr.right <= cr.right + 1),
        actionVisible: Boolean(action && action.getBoundingClientRect().width > 0 && getComputedStyle(action).display !== 'none') };
    });
    ok(`${width}px layout fits without horizontal overflow`, geometry.overflow <= 2 && geometry.actionVisible, JSON.stringify(geometry));
    ok(`${width}px summary remains in the document frame`, geometry.railInside && (width <= 1180 ? geometry.railPosition === 'static' : geometry.railPosition === 'sticky'), JSON.stringify(geometry));
    if (width === 3440) ok('Ultrawide canvas remains bounded and readable', geometry.appWidth >= 1900 && geometry.appWidth <= 2400, JSON.stringify(geometry));
  }

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(850);
  const stability = await page.evaluate(async () => {
    const bar = document.getElementById('v34Bar');
    const right = document.querySelector('#suite-root .v34-right');
    const rail = document.querySelector('#suite-root .cols-main>.rail');
    let mutations = 0;
    const observer = new MutationObserver(records => { mutations += records.filter(r => r.type === 'childList').length; });
    if (bar) observer.observe(bar, { childList: true, subtree: false });
    if (right) observer.observe(right, { childList: true, subtree: false });
    const samples = [];
    for (let i = 0; i < 12; i += 1) {
      const r = rail.getBoundingClientRect();
      samples.push({ order: [...right.children].map(n => n.id || n.className).join('|'), x: Math.round(r.x), w: Math.round(r.width) });
      await new Promise(resolve => setTimeout(resolve, 210));
    }
    observer.disconnect();
    return { mutations, orders: new Set(samples.map(s => s.order)).size,
      railRects: new Set(samples.map(s => `${s.x}:${s.w}`)).size };
  });
  ok('Header/action ordering is stable with no flicker loop', stability.mutations === 0 && stability.orders === 1 && stability.railRects === 1, JSON.stringify(stability));

  // Income Calculator smoke check: Release 35 must not regress its separate workflow.
  await page.evaluate(() => SHELL.go('calc'));
  await page.waitForTimeout(900);
  const income = await page.evaluate(() => ({
    visible: getComputedStyle(document.getElementById('calc-root')).display !== 'none',
    errors: document.querySelectorAll('#calc-root input[type="number"], #calc-root input[type="date"]').length,
    nav: document.querySelectorAll('#calc-root .tab, #calc-root [data-mode]').length,
    width: document.querySelector('#calc-root main .wrap')?.getBoundingClientRect().width || 0,
    centered: Math.abs((document.querySelector('#calc-root main .wrap')?.getBoundingClientRect().left || 0) - (innerWidth - (document.querySelector('#calc-root main .wrap')?.getBoundingClientRect().width || 0)) / 2) < 2
  }));
  ok('Income Calculator remains centered, narrower, and freeform', income.visible && income.errors === 0 && income.nav > 0 && income.width <= 1321 && income.centered, JSON.stringify(income));
  await page.screenshot({ path: path.join(SHOT_DIR, 'income-1920.png'), fullPage: false });

  await page.evaluate(() => { SHELL.go('suite'); mortgageSuite.store.setMode('setup'); });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(SHOT_DIR, 'suite-1920.png'), fullPage: false });
  await page.locator('#v35Btn').click();
  await page.waitForTimeout(180);
  await page.screenshot({ path: path.join(SHOT_DIR, 'actions-1920.png'), fullPage: false });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 3440, height: 1200 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOT_DIR, 'suite-3440.png'), fullPage: false });

  await browser.close();
  const realErrors = errors.filter(error => !/favicon/i.test(error));
  const failed = checks.filter(check => !check[1]);
  for (const [name, pass, detail] of checks) console.log(`${pass ? 'PASS  ' : 'FAIL  '}${name}${!pass && detail ? ` -- ${detail}` : ''}`);
  console.log(`\nRelease 35 browser QA: ${checks.length - failed.length} passed, ${failed.length} failed; ${realErrors.length} page errors`);
  if (realErrors.length) realErrors.forEach(error => console.log(`- ${error}`));
  if (failed.length || realErrors.length) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
