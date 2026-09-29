"""Package check: click through the landing page like a visitor. usage: qa_package.py <folder containing index.html>"""
import sys,os,re,zipfile
from playwright.sync_api import sync_playwright
ROOT=os.path.abspath(sys.argv[1]); fails=[]; n=0
def ck(name,ok,d=''):
    global n; n+=1
    if not ok: fails.append(f'{name} {d}')
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':800}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)[:100]))
    pg.goto(f'file://{ROOT}/index.html',wait_until='load'); pg.wait_for_timeout(500)
    ck('landing has no page errors',not errs,str(errs)); ck('landing title',pg.title()=='Mortgage Suite',pg.title())
    hrefs=pg.evaluate("()=>[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))")
    ck('landing has exactly two app links',len(hrefs)==2,str(hrefs))
    for h in hrefs: ck(f'link target exists: {h}',os.path.exists(os.path.join(ROOT,h)))
    ext=pg.evaluate("()=>performance.getEntriesByType('resource').filter(r=>!r.name.startsWith('file:')).length"); ck('landing makes no external requests',ext==0,str(ext))
    # theme toggle flips and persists
    t0=pg.evaluate("()=>document.documentElement.dataset.theme||''"); pg.click('#tog'); t1=pg.evaluate("()=>document.documentElement.dataset.theme"); ck('theme toggle changes theme',t1 in('light','dark') and t1!=t0,f'{t0}->{t1}')
    pg.reload(); pg.wait_for_timeout(300); ck('theme persists across reload',pg.evaluate("()=>document.documentElement.dataset.theme")==t1)
    # real clicks
    for text,ws,marker in [('Open Loan Suite','suite','#suite-root'),('Open Income Calculator','calc','#calc-root')]:
        pg.goto(f'file://{ROOT}/index.html',wait_until='load'); pg.locator('a.card',has_text=text).click(); pg.wait_for_load_state('load'); pg.wait_for_timeout(3500)
        r=pg.evaluate(f"()=>({{ws:document.body.dataset.shellMode,shown:!!(document.querySelector('{marker}')&&document.querySelector('{marker}').offsetParent),url:location.search}})")
        ck(f'click "{text}" opens the {ws} workspace with no URL params typed',r['ws']==ws and r['shown'],str(r)); ck(f'"{text}" page has no errors',not errs,str(errs))
    # explicit ?app= overrides a launcher's default
    lp=hrefs[0]
    pg.goto(f'file://{ROOT}/{lp}?app=income',wait_until='load'); pg.wait_for_timeout(3000)
    ck('explicit ?app=income beats the launcher default',pg.evaluate("()=>document.body.dataset.shellMode")=='calc')
    pg.goto(f'file://{ROOT}/{lp}?app=suite&tab=escrow',wait_until='load'); pg.wait_for_timeout(3000)
    ck('launcher keeps ?tab= deep links',pg.evaluate("()=>(document.querySelector('#suite-root .tabs .tab.active')||{}).textContent.trim()")=='ESCROW')
    b.close()
print(f'Package click-through: {n-len(fails)}/{n} passed'); [print('  FAIL',f) for f in fails]; sys.exit(1 if fails else 0)
