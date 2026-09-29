import sys,json,math,time
from playwright.sync_api import sync_playwright
F=sys.argv[1]; R=[]
def pmt(P,a,n=360): r=a/12; return P*r/(1-(1+r)**-n)
def chk(n,got,exp,tol=0.01):
    ok=isinstance(got,(int,float)) and math.isfinite(got) and abs(got-exp)<=tol; R.append((n,ok,got,exp))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1440,'height':1000}).new_page()
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:150]))
    pg.goto(f'file://{F}?app=suite&tab=quote',wait_until='load'); pg.wait_for_timeout(2500)
    def sel(path,label): pg.locator(f'#screen-body select[data-path="{path}"]').select_option(label=label); pg.wait_for_timeout(500)
    def field(lbl,val):
        i=pg.locator('#v44PunchIn label',has_text=lbl).locator('input').first; i.fill(str(val)); i.press('Tab'); pg.wait_for_timeout(500)
    def path(pth,val):
        i=pg.locator(f'#screen-body input[data-path="{pth}"]').first; i.fill(str(val)); i.press('Tab'); pg.wait_for_timeout(500)
    out=lambda: pg.evaluate("()=>{const o=mortgageSuite.store.outputs;return {loan:o.loan,pay:o.payment,cash:o.cash,name:mortgageSuite.store.activeInputs.name}}")
    # S1 conventional 20% down
    sel('loanProgram','Conventional'); sel('renovation','No'); field('Purchase price',600000); field('Down payment %',20); path('interestRate',6.5); path('termYears',30)
    o=out(); chk('S1 conv 20%: total loan',o['loan']['totalLoan'],480000); chk('S1 P&I',o['pay']['principalAndInterest'],pmt(480000,.065)); chk('S1 PMI none at 80% LTV',o['pay']['monthlyPmi'],0)
    ltv=pg.evaluate("()=>[...document.querySelectorAll('#screen-body .v35-live-row')].map(e=>e.innerText.replace(/\\s+/g,' ')).find(t=>/^LTV/.test(t))"); R.append(('S1 LTV card reads 80.00%',bool(ltv and '80.00%' in ltv),ltv,'80.00%'))
    # S2 conventional 5% down
    field('Down payment %',5); o=out(); L=570000; chk('S2 conv 5%: loan',o['loan']['totalLoan'],L); chk('S2 P&I',o['pay']['principalAndInterest'],pmt(L,.065))
    rate=o['pay']['pmiRateUsed']; chk('S2 PMI = loan*rate/12 (self-consistent)',o['pay']['monthlyPmi'],L*rate/12,0.02); R.append(('S2 PMI rate plausible 0.2-1.5%',0.002<=rate<=0.015,rate,'0.2-1.5%'))
    # S3 FHA no reno 3.5% down
    sel('loanProgram','FHA'); sel('renovation','No'); field('Purchase price',500000); field('Down payment %',3.5); path('interestRate',6.875)
    o=out(); base=482500; uf=base*0.0175; tot=base+uf
    chk('S3 FHA base loan',o['loan']['maximumBaseLoan'],base); chk('S3 UFMIP 1.75%',o['loan']['ufmip'],uf); chk('S3 total loan',o['loan']['totalLoan'],tot)
    chk('S3 P&I on total',o['pay']['principalAndInterest'],pmt(tot,.06875)); chk('S3 MIP 0.55% on BASE /12',o['pay']['monthlyFhaMip'],base*.0055/12,0.02)
    # live update latency: change price, measure time until the rail total changes
    before=pg.evaluate("()=>document.querySelector('.rail').innerText"); t0=time.time()
    i=pg.locator('#v44PunchIn label',has_text='Purchase price').locator('input').first; i.fill('700000'); i.press('Tab')
    lat=None
    for _ in range(40):
        if pg.evaluate("()=>document.querySelector('.rail').innerText")!=before: lat=(time.time()-t0)*1000; break
        pg.wait_for_timeout(25)
    R.append(('LIVE: rail updates after a price edit',lat is not None,f'{lat:.0f} ms' if lat else 'never','<1000 ms'))
    o=out(); chk('S3b 700k FHA total loan',o['loan']['totalLoan'],700000*.965*1.0175)
    # freeform entry
    for txt,exp in [('$550,000',550000),('650k',650000),('1.2m',1200000)]:
        field('Purchase price',txt); v=pg.evaluate("()=>mortgageSuite.store.activeInputs.basePurchasePrice"); chk(f'freeform {txt!r}',v,exp)
    # 203(k) default scenario numbers (independently verified earlier): reload fresh
    pg.goto(f'file://{F}?app=suite',wait_until='load'); pg.evaluate("()=>localStorage.clear()"); pg.goto(f'file://{F}?app=suite',wait_until='load'); pg.wait_for_timeout(2500)
    o=out(); chk('203k UFMIP 1.75% of base',o['loan']['ufmip'],o['loan']['maximumBaseLoan']*.0175,0.02); chk('203k MIP 0.55% of base /12',o['pay']['monthlyFhaMip'],o['loan']['maximumBaseLoan']*.0055/12,0.02)
    chk('203k P&I',o['pay']['principalAndInterest'],pmt(o['loan']['totalLoan'],.06875),0.02)
    ltv=pg.evaluate("()=>[...document.querySelectorAll('#screen-body .v35-live-row')].map(e=>e.innerText.replace(/\\s+/g,' ')).find(t=>/^LTV/.test(t))")
    R.append(('203k LTV card matches currentLtv',ltv is not None and f"{o['pay']['currentLtv']*100:.2f}%" in ltv,ltv,f"{o['pay']['currentLtv']*100:.2f}%"))
    R.append(('scenario name has no "Unnamed"',not o['name'].startswith('Unnamed'),o['name'],'convention $Loan - LTV% - Rate% - Program'))
    b.close()
bad=[r for r in R if not r[1]]
print(f'Loan Suite math: {len(R)-len(bad)} passed, {len(bad)} failed (page errors {len(errs)})')
for n,ok,g,e in R:
    if not ok: print('  FAIL',n,'| got',g,'| expected',e)
sys.exit(1 if (bad or errs) else 0)
