import sys,time,subprocess
from playwright.sync_api import sync_playwright
F=sys.argv[1]; fails=[]; n=0
def ck(name,ok,d=''):
    global n; n+=1
    if not ok: fails.append(f'{name} {d}')
with sync_playwright() as p:
    b=p.chromium.launch()
    # 1. every deep link responds and lands in the right workspace/panel
    for q,ws,panel in [('?app=suite','suite',None),('?app=income','calc','panel-w2'),('?app=suite&tab=w2','suite',None),('?app=income&tab=w2','calc','panel-w2'),
                       ('?app=income&tab=dti','calc','panel-dti'),('?app=income&tab=summary','calc','panel-summary'),('?app=suite&tab=escrow','suite',None),('?app=suite&tab=zzz','suite',None),('?app=income&tab=zzz','calc','panel-w2')]:
        pg=b.new_context(viewport={'width':1440,'height':900}).new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:100]))
        try:
            pg.goto(f'file://{F}{q}',wait_until='load',timeout=15000); pg.wait_for_timeout(3000)
            r=pg.evaluate("()=>({ws:document.body.dataset.shellMode,panels:[...document.querySelectorAll('#calc-root [id^=panel-]')].filter(e=>e.offsetParent).map(e=>e.id)})")
            ck(f'deep link {q} workspace',r['ws']==ws,r['ws']); 
            if panel: ck(f'deep link {q} panel',panel in r['panels'],str(r['panels']))
            ck(f'deep link {q} no page errors',not errs,str(errs))
        except Exception as e: ck(f'deep link {q} responsive',False,str(e)[:60])
        pg.close()
    # 2. click pacing: no dropped tab clicks
    for w in (1200,400,150,30):
        pg=b.new_context(viewport={'width':1440,'height':900}).new_page(); pg.goto(f'file://{F}?app=suite',wait_until='load'); pg.wait_for_timeout(2500)
        for g,t in [('costs','ESCROW'),('file','QUOTE'),('loan','RENOVATION'),('file','PROPERTY'),('file','QUOTE'),('underwriting','CREDIT'),('file','SETUP')]:
            pg.locator(f'#v23SuitePrimaryNav button[data-group="{g}"]:visible').first.click(); pg.wait_for_timeout(w)
            pg.locator('#suite-root .tabs .tab:visible',has_text=t).first.click(); pg.wait_for_timeout(1800 if w<500 else w)
            a=pg.evaluate("()=>(document.querySelector('#suite-root .tabs .tab.active')||{}).textContent.trim().toUpperCase()"); ck(f'click pace {w}ms {g}>{t}',a==t,a)
        pg.close()
    # 3. tab-through must not change the file (stale-value + renovation regressions)
    pg=b.new_context(viewport={'width':1440,'height':1000}).new_page(); pg.goto(f'file://{F}?app=suite&tab=quote',wait_until='load'); pg.wait_for_timeout(2500)
    pg.locator('#screen-body select[data-path="renovation"]').select_option(label='No'); pg.wait_for_timeout(800)
    snap=lambda: pg.evaluate("()=>{const i=mortgageSuite.store.activeInputs;return [i.renovation,i.asIsValue,i.basePurchasePrice,Math.round(mortgageSuite.store.outputs.loan.totalLoan)].join('|')}")
    s0=snap(); pg.locator('#v44PunchIn label',has_text='Purchase price').locator('input').first.click()
    for _ in range(9): pg.keyboard.press('Tab'); pg.wait_for_timeout(200)
    pg.wait_for_timeout(1200); s1=snap(); ck('tabbing through fields changes nothing',s0==s1,f'{s0} -> {s1}'); pg.close()
    b.close()
print(f'Navigation/regression: {n-len(fails)}/{n} passed'); [print('  FAIL',f) for f in fails]
sys.exit(1 if (fails) else 0)
