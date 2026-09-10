const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const file = path.resolve(process.argv[2] || 'dist/mortgage-suite-los.html');
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`file:///${file.replace(/\\/g, '/')}`);
  await page.waitForTimeout(2500);
  const result = await page.evaluate(() => {
    const root = document.querySelector('#suite-root');
    const fields = [...root.querySelectorAll('input, select, textarea')];
    return {
      total: fields.length,
      types: fields.reduce((counts, field) => {
        const key = `${field.tagName}:${field.type || ''}`;
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {}),
      freeformNumeric: fields.filter(field => field.tagName === 'INPUT' &&
        (field.inputMode === 'decimal' || field.dataset.v19Freeform)).length,
      remainingNumber: fields.filter(field => field.type === 'number').map(field => ({
        id: field.id,
        name: field.name,
        placeholder: field.placeholder
      })),
      readonly: fields.filter(field => field.readOnly).map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        value: field.value
      })),
      disabled: fields.filter(field => field.disabled).map(field => ({
        tag: field.tagName,
        id: field.id,
        name: field.name,
        type: field.type,
        value: field.value
      }))
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
