"""Generic control sweep. usage: sweep.py <html> <suite|income> <out.json>"""
import sys,json,re,time
from playwright.sync_api import sync_playwright
F,APP,OUT=sys.argv[1],sys.argv[2],sys.argv[3] if len(sys.argv)>3 else "-"
BAD=re.compile(r'NaN|Infinity|undefined|\[object|null%|\$null')
ROOT='#suite-root' if APP=='suite' else '#calc-root'
FREE=['$550,000','650k','1.2m','6.875%','abc','-5','','0','1e3']
res={'pages':{},'errors':[],'issues':[]}
def log(*a): print(*a,flush=True)
def scan(pg,where):
    t=pg.evaluate(f"()=>document.querySelector('{ROOT}').innerText")
    m=BAD.search(t)
    if m:
        i=m.start(); res['issues'].append(f'{where}: leaked "{m.group(0)}" near: {t[max(0,i-50):i+30]!r}'.replace('\n',' '))
        return True
    return False
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1440,'height':1000}).new_page()
    pg.on('pageerror',lambda e: res['errors'].append(str(e)[:200]))
    pg.goto(f'file://{F}?app={APP}',wait_until='load'); pg.wait_for_timeout(2500)
    if APP=='suite':
        pages=[('file','PROPERTY'),('file','QUOTE'),('loan','MAX MORTGAGE'),('loan','MORTGAGE RATES'),('costs','TAXES & PRORATION'),
               ('underwriting','QUALIFY'),('underwriting','RENTAL'),('underwriting','CREDIT'),('results','DRAFT LE'),('results','SCENARIOS'),('results','SUMMARY'),('results','DOCUMENTS & OCR'),('full','ADVANCED'),('full','CONTRACT & LE')]
        state={'full':False}
        def goto(g,t):
            if g=='full':
                pg.evaluate("(m)=>mortgageSuite.store.setMode(m)",'advanced'); pg.wait_for_timeout(1200); return
            else:
                state['full']=False; pg.locator(f'#v23SuitePrimaryNav button[data-group="{g}"]:visible').first.click(); pg.wait_for_timeout(700)
            pg.locator('#suite-root .tabs .tab:visible',has_text=t).first.click(); pg.wait_for_timeout(1500)
        SCOPE='#screen-body, #suite-root #v8Stage .panel.active, #suite-root #panel-taxes'
    else:
        pages=[('w2',None),('selfemp',None),('sche',None),('va',None),('other',None),('dti',None),('docs',None),('aus',None),('summary',None)]
        def goto(g,t): pg.evaluate(f"()=>switchTab('{g}')"); pg.wait_for_timeout(900)
        SCOPE='.panel.active, [id^=panel-]:not([hidden])'
    for g,t in pages:
        name=t or g; info={'selects':0,'options':0,'inputs':0,'ok':0}
        try: goto(g,t)
        except Exception as e: res['issues'].append(f'{name}: could not open ({str(e)[:60]})'); continue
        for _ in range(6):
            n=pg.evaluate("()=>{const c=[...document.querySelectorAll('#suite-root .card.collapsible.closed > h3')];c.forEach(h=>h.click());return c.length}")
            if not n: break
            pg.wait_for_timeout(250)
        if APP=='income' and g in ('selfemp','sche','other','dti'):
            for btn in pg.locator(f'{ROOT} .panel.active button:visible',has_text=re.compile(r'^\s*\+?\s*Add ',re.I)).all()[:4]:
                try: btn.click(timeout=1500); pg.wait_for_timeout(300)
                except Exception: pass
        CONT=['#suite-root #screen-body','#suite-root #v8Stage .panel.active','#suite-root #panel-taxes'] if APP=='suite' else ['#calc-root .panel.active']
        Q=lambda k: ', '.join(f'{c} {k}:visible' for c in CONT)
        n_sel=pg.locator(Q('select')).count(); n_inp=pg.locator(Q('input')).count()
        info['selects']=n_sel; info['inputs']=n_inp
        # ---- dropdowns: every option, value must stick, nothing may leak
        for i in range(n_sel):
            sel=pg.locator(Q('select')).nth(i)
            if sel.evaluate("e=>e.disabled"): continue
            try: opts=sel.evaluate("e=>[...e.options].map(o=>o.value)"); orig=sel.evaluate("e=>e.value")
            except Exception: continue
            for v in opts:
                try:
                    sel.select_option(value=v,timeout=2000); pg.wait_for_timeout(120); info['options']+=1
                    if scan(pg,f'{name} select#{i}={v!r}'): break
                except Exception as e: res['issues'].append(f'{name} select#{i}={v!r}: {str(e)[:70]}'); break
            try: pg.locator(Q('select')).nth(i).select_option(value=orig,timeout=2000)
            except Exception: pass
        # ---- inputs: freeform variants (number inputs get only valid numerics)
        for i in range(pg.locator(Q('input')).count()):
            inp=pg.locator(Q('input')).nth(i)
            try:
                ty=inp.evaluate("e=>e.type"); ro=inp.evaluate("e=>e.readOnly||e.disabled")
                if ty in ('checkbox','radio','file','button','hidden','date','submit') or ro: continue
                orig=inp.input_value(); variants=['1234.5','0','-5','','99999999'] if ty=='number' else FREE
                for v in variants:
                    inp.fill(v,timeout=2000); inp.press('Tab'); pg.wait_for_timeout(90); info['ok']+=1
                    if scan(pg,f'{name} input#{i}({ty})={v!r}'): break
                pg.locator(Q('input')).nth(i).fill(orig,timeout=2000); pg.locator(Q('input')).nth(i).press('Tab')
            except Exception as e: pass
        res['pages'][name]=info; log(f"{name:20s} selects {info['selects']:3d} ({info['options']:3d} options)  inputs {info['inputs']:3d} ({info['ok']:4d} entries)  issues so far {len(res['issues'])}  errors {len(res['errors'])}")
    b.close()
json.dump(res,open(OUT,'w'),indent=1) if OUT!='-' else None
log('\nTOTAL options exercised:',sum(v['options'] for v in res['pages'].values()),' entries typed:',sum(v['ok'] for v in res['pages'].values()))
log('page errors:',len(res['errors']),res['errors'][:3]); log('leaks/issues:',len(res['issues']))
for x in res['issues'][:25]: log('  -',x)
log('DONE')
sys.exit(1 if (res['issues'] or res['errors']) else 0)
