#!/usr/bin/env node
/* Release 24 browser-level regression checks for the generated single file. */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
const FILE=path.resolve(process.argv[2]||'dist/mortgage-suite-los.html');
const SHOT=path.resolve(process.argv[3]||'artifacts/v24-setup.png');
const checks=[],errors=[];function ok(name,value,detail=''){checks.push([name,!!value,detail]);}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.LOS_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'}),page=await browser.newPage({viewport:{width:1600,height:1000}});
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push('console.error: '+m.text());});
 await page.addInitScript(()=>{try{localStorage.clear();}catch(e){}});await page.goto(pathToFileURL(FILE).href);await page.waitForTimeout(3500);
 await page.evaluate(()=>{SHELL.go('suite');mortgageSuite.store.setMode('setup');});await page.waitForTimeout(2200);
 ok('Release stamp',await page.evaluate(()=>document.documentElement.dataset.losRelease==='24'));
 ok('Midnight Terminal is the clean-session default',await page.evaluate(()=>document.documentElement.dataset.v24Theme==='terminal'));
 ok('Ink inputs are the clean-session default',await page.evaluate(()=>document.documentElement.dataset.inputTone==='ink'));
 const colors=await page.evaluate(()=>{const r=getComputedStyle(document.documentElement);return{page:r.getPropertyValue('--v24-page').trim(),card:r.getPropertyValue('--v24-card').trim(),border:r.getPropertyValue('--v24-border').trim(),input:r.getPropertyValue('--v23-field').trim(),inputBorder:r.getPropertyValue('--v23-field-line').trim()};});
 ok('Midnight exact surfaces',JSON.stringify(colors)===JSON.stringify({page:'#111A2B',card:'#182338',border:'#24314A',input:'#0F1829',inputBorder:'#33425F'}),JSON.stringify(colors));
 ok('Scenario bar moved to header',await page.evaluate(()=>!!document.querySelector('#suite-root .topbar > #v24ScenarioBar')));
 ok('Scenario bar is not truncated by width',await page.evaluate(()=>document.getElementById('v24ScenarioBar').getBoundingClientRect().width>=320));
 ok('Loan groups and contextual tabs share one row',await page.evaluate(()=>document.getElementById('v23SuitePrimaryNav').parentElement===document.querySelector('#suite-root .tabs')));
 ok('Context summary is on the tab row',await page.evaluate(()=>document.getElementById('v24ContextSummary').parentElement===document.querySelector('#suite-root .tabs')));
 ok('Old scenario band is absent',await page.evaluate(()=>!document.getElementById('v20Setup')&&getComputedStyle(document.querySelector('#suite-root .toolbar')).display==='none'));
 ok('Four original calculation cards remain',await page.evaluate(()=>document.querySelectorAll('#v24StatStrip > button').length===4));
 ok('Quick edit is first and always expanded',await page.evaluate(()=>document.querySelector('[data-section=setup] > .body').firstElementChild.id==='v24WorksheetQuick'));
 ok('All ten quick fields exist',await page.evaluate(()=>document.querySelectorAll('#v24WorksheetQuick [data-path]').length===10));
 ok('Worksheet rail rows exist',await page.evaluate(()=>document.querySelectorAll('[data-section=setup] .v24-worksheet-row').length>=5));
 ok('ARV warning is visibly linked',await page.evaluate(()=>document.querySelector('#v24WorksheetQuick [data-field=afterRepairValue]').classList.contains('v24-missing')));
 ok('Original duplicate fields are retired',await page.evaluate(()=>document.querySelectorAll('[data-section=setup] .v24-quick-duplicate').length>=8));
 ok('Live summary action exists',await page.evaluate(()=>!!document.getElementById('v24LiveSummary')));
 ok('File and Loan menus are split',await page.evaluate(()=>!!document.getElementById('v23SuiteActions')&&!!document.getElementById('v24LoanTools')));
 const price=page.locator('#v24WorksheetQuick [data-path="basePurchasePrice"]');await price.fill('$550k');await price.dispatchEvent('change');await page.waitForTimeout(1400);
 ok('Freeform purchase price updates the engine',await page.evaluate(()=>mortgageSuite.store.activeInputs.basePurchasePrice===550000),String(await page.evaluate(()=>mortgageSuite.store.activeInputs.basePurchasePrice)));
 ok('As-is auto-sync remains intact',await page.evaluate(()=>mortgageSuite.store.activeInputs.asIsValue===550000),String(await page.evaluate(()=>mortgageSuite.store.activeInputs.asIsValue)));
 const arv=page.locator('#v24WorksheetQuick [data-path="afterRepairValue"]');await arv.fill('700,000');await arv.dispatchEvent('change');await page.waitForTimeout(1400);
 ok('Freeform ARV updates the engine',await page.evaluate(()=>mortgageSuite.store.activeInputs.afterRepairValue===700000));
 ok('ARV amber state clears live',await page.evaluate(()=>!document.querySelector('#v24WorksheetQuick [data-field=afterRepairValue]').classList.contains('v24-missing')));
 const before=await page.evaluate(()=>mortgageSuite.store.outputs.loan.totalLoan),down=page.locator('#v24WorksheetQuick [data-path="finalDownPaymentPct"]');await down.fill('5');await down.dispatchEvent('change');await page.waitForTimeout(1400);const after=await page.evaluate(()=>mortgageSuite.store.outputs.loan.totalLoan);
 ok('Down-payment edit recalculates total loan',before!==after&&after>0,`${before} -> ${after}`);
 await page.evaluate(()=>V24.cycleTheme());ok('Theme cycle changes the full-app theme',await page.evaluate(()=>document.documentElement.dataset.v24Theme==='federal'));
 await page.evaluate(()=>V24.cycleInput());ok('Input cycle changes independently',await page.evaluate(()=>document.documentElement.dataset.inputTone==='paper'));
 await page.evaluate(()=>mortgageSuite.store.setMode('rental'));await page.waitForTimeout(1600);ok('Rental/income-needed live card renders',await page.evaluate(()=>!!document.getElementById('v24QualificationNeeds')));
 fs.mkdirSync(path.dirname(SHOT),{recursive:true});await page.evaluate(()=>{V24.setTheme('terminal');V24.setInput('ink');mortgageSuite.store.setMode('setup');window.scrollTo(0,0);});await page.waitForTimeout(1300);await page.screenshot({path:SHOT,fullPage:true});await browser.close();
 for(const [name,pass,detail] of checks)console.log((pass?'PASS  ':'FAIL  ')+name+(!pass&&detail?' — '+detail:''));const realErrors=errors.filter(x=>!/favicon/i.test(x));if(realErrors.length){console.log('\nPage errors:');realErrors.forEach(x=>console.log('- '+x));}const failed=checks.filter(x=>!x[1]);console.log(`\nv24 browser QA: ${checks.length-failed.length} passed, ${failed.length} failed; ${realErrors.length} page errors`);if(failed.length||realErrors.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
