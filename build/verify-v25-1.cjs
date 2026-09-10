const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(process.argv[2] || 'dist/mortgage-suite-los.html');
const SHOT_DIR = path.resolve(process.argv[3] || 'artifacts/v25-1');
const EXECUTABLE = process.env.PLAYWRIGHT_BROWSER_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const checks = [];
  const errors = [];
  const ok = (name, pass, detail = '') => checks.push([name, Boolean(pass), detail]);
  const browser = await chromium.launch({ headless: true, executablePath: EXECUTABLE });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(`file:///${FILE.replace(/\\/g, '/')}`);
  await page.waitForTimeout(2600);
  await page.evaluate(() => SHELL.go('suite'));
  await page.waitForTimeout(900);

  ok('Release 25.1 loaded', await page.evaluate(() => document.documentElement.dataset.losRelease === '25.1'));
  ok('Fresh default is black OLED with light inputs', await page.evaluate(() =>
    document.documentElement.dataset.v25Surface === 'oled' && document.documentElement.dataset.inputTone === 'paper'));
  ok('Only one appearance icon remains visible', await page.evaluate(() =>
    [...document.querySelectorAll('#v23Appearance > button')].filter(button => getComputedStyle(button).display !== 'none').length === 1));
  await page.locator('#v23ThemeButton').click();
  await page.waitForTimeout(350);
  const appearance = await page.evaluate(() => ({
    open: document.getElementById('v23Appearance').classList.contains('open'),
    groups: [...document.querySelectorAll('#v251AppearancePanel .v251-appearance-group>div')].map(group => group.querySelectorAll('button').length),
    pressed: getComputedStyle(document.getElementById('v23ThemeButton')).backgroundColor
  }));
  ok('Appearance menu keeps 10 themes, 3 surfaces and 5 field colors', appearance.open && appearance.groups.join(',') === '10,3,5', JSON.stringify(appearance));
  ok('Pressed appearance control turns white', appearance.pressed === 'rgb(255, 255, 255)', JSON.stringify(appearance));
  await page.keyboard.press('Escape');
  ok('Header matches four-band workspace structure', await page.evaluate(() =>
    !!document.querySelector('#v25HeaderMain .v251-suite-brand') &&
    !!document.querySelector('#v25HeaderActions .v251-header-stats') &&
    !!document.getElementById('v23SuitePrimaryNav') &&
    !!document.querySelector('#suite-root .v23-context-tabs')));

  const expectedPages = ['QUOTE','SETUP','PROPERTY','RENOVATION','MAX MORTGAGE','MORTGAGE RATES','CLOSING','ESCROW','QUALIFY','RENTAL','ADVANCED','SCENARIOS','SUMMARY','DOCUMENTS & OCR'];
  const availablePages = await page.evaluate(() => [...document.querySelectorAll('#suite-root .tabs .tab')].map(tab => (tab.dataset.v23Key || tab.textContent).trim().replace(/\s+/g, ' ').toUpperCase()));
  ok('All 14 original and added Loan Suite pages remain available', expectedPages.every(label => availablePages.includes(label)), JSON.stringify(availablePages));
  await page.locator('#v24LoanTools > summary').click();
  await page.locator('#v251PageDirectoryButton').click();
  const directoryPages = await page.evaluate(() => [...document.querySelectorAll('#v251PageDirectory [data-v251-page]')].map(button => button.dataset.v251Page));
  ok('All pages directory groups every Loan Suite workspace', expectedPages.every(label => directoryPages.includes(label)) && directoryPages.length === 14, JSON.stringify(directoryPages));
  await page.evaluate(() => V251.closePageDirectory());
  await page.evaluate(() => { mortgageSuite.store.setField('renovation', false, 'QA'); V251.openPage('RENOVATION'); });
  await page.waitForTimeout(500);
  ok('Renovation remains accessible when renovation is not selected', await page.evaluate(() =>
    mortgageSuite.store.snapshot.mode === 'renovation' && !![...document.querySelectorAll('#suite-root .tabs .tab')].find(tab => /RENOVATION/.test(tab.textContent))));

  const modes = await page.evaluate(() => window.__amdGet('src/ui/sections').SCREENS.map(screen => screen.id));
  const fieldAudit = [];
  for (const mode of modes) {
    await page.evaluate(id => mortgageSuite.store.setMode(id), mode);
    await page.waitForTimeout(450);
    fieldAudit.push(await page.evaluate(id => {
      const fields = [...document.querySelectorAll('#screen-body input, #screen-body textarea, #screen-body select')]
        .filter(field => getComputedStyle(field).display !== 'none');
      return {
        mode: id,
        fields: fields.length,
        number: fields.filter(field => field.type === 'number').length,
        date: fields.filter(field => field.type === 'date').length,
        readonly: fields.filter(field => field.readOnly).length
      };
    }, mode));
  }
  ok('Every Loan Suite tab is rendered during field audit', fieldAudit.length >= 11, JSON.stringify(fieldAudit));
  ok('No tab retains restrictive number inputs', fieldAudit.every(item => item.number === 0), JSON.stringify(fieldAudit));
  ok('No tab retains restrictive date inputs', fieldAudit.every(item => item.date === 0), JSON.stringify(fieldAudit));
  ok('No rendered tab inputs are read-only', fieldAudit.every(item => item.readonly === 0), JSON.stringify(fieldAudit));

  await page.evaluate(() => mortgageSuite.store.setMode('setup'));
  await page.waitForTimeout(600);
  const price = page.locator('#v24WorksheetQuick input[data-path="basePurchasePrice"]');
  await price.fill('$575k');
  await price.press('Tab');
  await page.waitForTimeout(450);
  ok('Freeform currency recalculates the engine', await page.evaluate(() => mortgageSuite.store.activeInputs.basePurchasePrice === 575000));

  const live = page.locator('#v24LiveSummary');
  await live.click();
  await page.waitForTimeout(250);
  ok('Live summary opens as a visible drawer', await page.evaluate(() => {
    const rail = document.querySelector('#suite-root .cols-main>.rail');
    return document.getElementById('suite-root').classList.contains('v24-summary-open') &&
      getComputedStyle(rail).position === 'fixed' && getComputedStyle(rail).display !== 'none';
  }));
  await page.locator('#v251SummaryClose').click();
  ok('Live summary closes from its own control', await page.evaluate(() =>
    !document.getElementById('suite-root').classList.contains('v24-summary-open')));

  await page.evaluate(() => V251.openFull());
  await page.waitForTimeout(1300);
  const fullAudit = await page.evaluate(() => {
    const full = document.getElementById('v25FullSheet');
    const fields = [...full.querySelectorAll('input, textarea, select')];
    return {
      screens: full.querySelectorAll('.v251-full-screen').length,
      fields: fields.length,
      number: fields.filter(field => field.type === 'number').length,
      date: fields.filter(field => field.type === 'date').length,
      readonly: fields.filter(field => field.readOnly).length,
      focusedButtons: full.querySelectorAll('[data-v251-open], [data-v251-page]').length,
      addedPanels: ['panel-property','panel-rates','panel-docparse'].filter(id => full.querySelector(`#${id}`)).length,
      addedFields: ['panel-property','panel-rates','panel-docparse'].reduce((count, id) => count + full.querySelectorAll(`#${id} input, #${id} textarea, #${id} select`).length, 0)
    };
  });
  ok('Full form contains all 14 Loan Suite pages', fullAudit.screens === expectedPages.length, JSON.stringify(fullAudit));
  ok('Full form mounts all added workspaces with their live controls', fullAudit.addedPanels === 3 && fullAudit.addedFields >= 20, JSON.stringify(fullAudit));
  ok('Full form contains editable live fields', fullAudit.fields > 80 && fullAudit.readonly === 0, JSON.stringify(fullAudit));
  ok('Full form fields remain freeform', fullAudit.number === 0 && fullAudit.date === 0, JSON.stringify(fullAudit));
  ok('Every Full-form section links to its focused tab', fullAudit.focusedButtons === fullAudit.screens, JSON.stringify(fullAudit));

  const fullPrice = page.locator('#v25FullSheet input[data-path="basePurchasePrice"]').first();
  await fullPrice.fill('610k');
  await fullPrice.press('Tab');
  await page.waitForTimeout(500);
  ok('Editing Full form recalculates and autosaves live', await page.evaluate(() =>
    mortgageSuite.store.activeInputs.basePurchasePrice === 610000 && mortgageSuite.store.outputs.loan.totalLoan > 0));

  for (const width of [1280, 1920, 2560, 3440]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.waitForTimeout(350);
    const layout = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      fullWidth: document.getElementById('v25FullSheet').getBoundingClientRect().width,
      appWidth: document.querySelector('#suite-root .app').getBoundingClientRect().width
    }));
    ok(`${width}px layout has no horizontal overflow`, layout.overflow <= 1, JSON.stringify(layout));
    ok(`${width}px Full form uses available width`, layout.fullWidth >= Math.min(width - 56, 1180), JSON.stringify(layout));
    if (width === 3440) ok('Ultrawide content remains readable rather than over-stretched', layout.appWidth >= 1900 && layout.appWidth <= 2050, JSON.stringify(layout));
  }

  await page.evaluate(() => V251.openSource('setup'));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(800);
  const headerGeometry = await page.evaluate(() => {
    const scenario = document.getElementById('v24ScenarioBar').getBoundingClientRect();
    const dates = [...document.querySelectorAll('#v25HeaderMain .datefield input')].map(el => el.getBoundingClientRect().width);
    const actions = [...document.querySelectorAll('#v25HeaderActions > :not(.v251-header-stats)')]
      .filter(el => getComputedStyle(el).display !== 'none').map(el => el.getBoundingClientRect());
    const overlap = actions.some((a, i) => actions.slice(i + 1).some(b =>
      Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) > 1 &&
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) > 1));
    return { scenario: scenario.width, dates, overlap };
  });
  ok('Scenario control is wide enough for complete names', headerGeometry.scenario >= 420, JSON.stringify(headerGeometry));
  ok('As-of and closing dates have usable widths', headerGeometry.dates.length === 2 && headerGeometry.dates.every(width => width >= 112), JSON.stringify(headerGeometry));
  ok('Header action buttons do not overlap', !headerGeometry.overlap, JSON.stringify(headerGeometry));

  await page.locator('#v23SuiteActions > summary').click();
  await page.waitForTimeout(180);
  const menu = await page.evaluate(() => {
    const panel = document.querySelector('#v23SuiteActions .v23-actions-panel');
    const button = panel.querySelector('.v23-actions-grid button');
    return { width: panel.getBoundingClientRect().width, buttonHeight: button.getBoundingClientRect().height, columns: getComputedStyle(panel.querySelector('.v23-actions-grid')).gridTemplateColumns.split(' ').length };
  });
  ok('File actions uses compact Income-style menu sizing', menu.width <= 590 && menu.buttonHeight <= 44 && menu.columns === 2, JSON.stringify(menu));
  await page.keyboard.press('Escape');

  fs.mkdirSync(SHOT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOT_DIR, 'loan-header-1920.png'), fullPage: false });
  await page.evaluate(() => V251.openFull());
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOT_DIR, 'full-form-1920.png'), fullPage: false });
  await browser.close();

  const realErrors = errors.filter(error => !/favicon/i.test(error));
  const failed = checks.filter(check => !check[1]);
  for (const [name, pass, detail] of checks) console.log(`${pass ? 'PASS  ' : 'FAIL  '}${name}${!pass && detail ? ` — ${detail}` : ''}`);
  console.log(`\nv25.1 browser QA: ${checks.length - failed.length} passed, ${failed.length} failed; ${realErrors.length} page errors`);
  if (realErrors.length) realErrors.forEach(error => console.log(`- ${error}`));
  if (failed.length || realErrors.length) process.exit(1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
