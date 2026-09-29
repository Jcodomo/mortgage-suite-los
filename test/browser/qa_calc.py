"""Income Calculator: known-answer tests, expected values computed here independently of the app."""
import json,sys,math
from playwright.sync_api import sync_playwright
F=sys.argv[1]; R=[]
def chk(name,got,exp,tol=0.005):
    ok = (got is not None) and isinstance(got,(int,float)) and math.isfinite(got) and abs(got-exp)<=tol
    R.append((name,ok,got,exp)); 
def flag(name,ok,detail=''): R.append((name,ok,detail,''))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={'width':1440,'height':1000}).new_page()
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)[:160]))
    pg.goto(f'file://{F}?app=income',wait_until='load'); pg.wait_for_timeout(2500)
    def w2(**kw):
        return pg.evaluate("""(kw)=>{const j=newW2();Object.assign(j,{mode:'manual',incomeType:'irregular',freq:'Hourly',rate:0,hours:0,hireDate:'2020-01-01',ytdThru:'2028-07-01'},kw.top||{});
          for(const y of ['y1','y2','y3'])Object.assign(j[y],kw[y]||{}); Object.assign(j.m,kw.m||{}); Object.assign(j.c,kw.c||{});
          const r=calcW2(j);return {mo:r.mo,mb:r.monthlyBase,parts:r.parts,total:r.total,rec:Object.fromEntries(Object.entries(r.comp).map(([k,v])=>[k,v.rec])),ytd:r.comp.base.ytd,a12:r.comp.base.a12,a24:r.comp.base.a24}}""",kw)
    # months anchor: 2028-07-01 is day 183 of 366 => exactly 6 months
    r=w2(top={'ytdThru':'2028-07-01'}); chk('W2 ytdMonths(2028-07-01)=6.000',r['mo'],6.0,1e-9)
    # pay-frequency conversions, rate 1000 (hourly uses 40 h)
    for fq,exp in [('Weekly',1000*52/12),('Bi-Weekly',1000*26/12),('Semi-Monthly',2000.0),('Monthly',1000.0),('Annually',1000/12)]:
        chk(f'freq {fq} @1000',w2(top={'freq':fq,'rate':1000})['mb'],exp)
    chk('freq Hourly 25x40',w2(top={'freq':'Hourly','rate':25,'hours':40})['mb'],25*40*52/12)
    # averaging methods, base component, mo=6 exactly
    d=dict(y1={'base':30000},y2={'base':54000},y3={'base':48000})
    r=w2(**d,m={'base':'ytd'}); chk('method ytd  = y1/6',r['parts']['base'],30000/6)
    r=w2(**d,m={'base':'ytd12'}); chk('method ytd12= (y1+y2)/18',r['parts']['base'],84000/18)
    r=w2(**d,m={'base':'ytd24'}); chk('method ytd24= (y1+y2+y3)/30',r['parts']['base'],132000/30)
    r=w2(**d,m={'base':'custom'},c={'base':1234.56}); chk('method custom',r['parts']['base'],1234.56)
    r=w2(**d,m={'base':'none'}); chk('method none',r['parts']['base'],0.0)
    # auto recommendation rule (income type irregular so the base-rate shortcut is out of play)
    auto=lambda y1,y2,y3: w2(top={'mode':'auto'},y1={'base':y1},y2={'base':y2},y3={'base':y3})
    r=auto(24000,54000,48000); chk('auto: declining (4000<4500) -> YTD 4000',r['parts']['base'],4000.0); flag('auto declining picks ytd',r['rec']['base']=='ytd',r['rec']['base'])
    r=auto(30000,48000,60000); chk('auto: dip-and-recover -> (y1+y2)/18',r['parts']['base'],78000/18); flag('auto dip picks ytd12',r['rec']['base']=='ytd12',r['rec']['base'])
    r=auto(30000,54000,48000); chk('auto: rising -> 24-mo avg 4400',r['parts']['base'],132000/30); flag('auto rising picks ytd24',r['rec']['base']=='ytd24',r['rec']['base'])
    # conservative property: on declining income auto must never exceed the plain YTD figure
    import random; random.seed(7); viol=0
    for _ in range(200):
        y1,y2,y3=[random.randint(0,120000) for _ in range(3)]
        r=auto(y1,y2,y3); m1,m2=y1/6,y2/12
        if y2>0 and m1<=m2 and r['parts']['base']>y1/6+0.005: viol+=1
    flag('auto conservative on declining income (200 random)',viol==0,f'{viol} violations')
    # edge cases that must never leak NaN/Infinity into the qualifying income
    for label,top,y in [('blank paystub-end date',{'ytdThru':''},{'base':10000}),('hire date after paystub end',{'hireDate':'2030-01-01'},{'base':10000}),
                        ('negative YTD',{},{'base':-5000}),('rate typed as text',{'rate':'abc','freq':'Weekly'},{'base':0}),('huge numbers',{'rate':1e12,'freq':'Weekly'},{'base':1e12})]:
        try:
            r=w2(top={**top},y1=y,m={'base':'ytd'}); ok=all(math.isfinite(v) for v in [r['total'],r['parts']['base']]); flag(f'edge: {label} stays finite',ok,f"total={r['total']}")
        except Exception as e: flag(f'edge: {label} stays finite',False,str(e)[:80])
    # Schedule C known answer
    def schc(**kw): return pg.evaluate("""(kw)=>{const b=newSchC();b.mode=kw.mode||'manual';b.method=kw.method||'avg2';b.rate=kw.rate;Object.assign(b.y1,kw.y1);Object.assign(b.y2,kw.y2);return calcSchC(b)}""",kw)
    y1=dict(net31=60000,depr13=6000,depl12=0,meals=1000,home30=2400,amort=0,miles=10000); y2=dict(net31=50000,depr13=5000,depl12=0,meals=800,home30=2400,amort=0,miles=8000)
    a1=60000+6000-1000+2400+10000*0.30; a2=50000+5000-800+2400+8000*0.30
    r=schc(y1=y1,y2=y2,rate=0.30,method='avg2'); chk('SchC year1 total',r['a1'],a1); chk('SchC year2 total',r['a2'],a2); chk('SchC 24-mo avg',r['monthly'],(a1+a2)/24)
    chk('SchC most-recent',schc(y1=y1,y2=y2,rate=0.30,method='recent')['monthly'],a1/12); chk('SchC lower-of',schc(y1=y1,y2=y2,rate=0.30,method='lower')['monthly'],min(a1,a2)/12)
    chk('SchC auto (rising -> avg)',schc(y1=y1,y2=y2,rate=0.30,mode='auto')['monthly'],(a1+a2)/24)
    y1d=dict(y1,net31=30000); a1d=30000+6000-1000+2400+3000
    chk('SchC auto (declining -> most recent)',schc(y1=y1d,y2=y2,rate=0.30,mode='auto')['monthly'],a1d/12)
    # Schedule E known answers
    def sche(**kw): return pg.evaluate("""(kw)=>{const p=newSchE();Object.assign(p,kw);return calcSchE(p)}""",kw)
    base=dict(method='sche',rents=24000,ins=1800,mortInt=9000,taxes=3600,depr=4000,otherAdd=0,totalExp=22400,pitia=1500,fairDays=365,monthsOverride=0)
    chk('SchE full year',sche(**base)['monthly'],20000/12-1500)
    chk('SchE 182.5 fair days -> 6.0 mo',sche(**{**base,'fairDays':182.5})['monthly'],20000/6-1500)
    chk('SchE months override 12 cap',sche(**{**base,'monthsOverride':99})['monthly'],20000/12-1500)
    chk('SchE lease 75%',sche(method='lease',leaseRent=2000,vacancy=75,pitia=1500)['monthly'],0.0)
    # Other income gross-up, assets, totals & DTI
    chk('Other non-taxable +25% gross-up',pg.evaluate("()=>{const o=newOther();o.amt=1000;o.nonTax=true;o.grossUp=25;return calcOther(o).total}"),1250.0)
    chk('Assets depletion (elig 70%,-fund,-res)/360',pg.evaluate("()=>{S.assets.rows=[{bal:500000,elig:70}];S.assets.fundsToClose=50000;S.assets.reserves=30000;S.assets.divisor=360;S.assets.use=true;return calcAssets().monthly}"),(350000-80000)/360)
    t=pg.evaluate("""()=>{S.w2=[];S.schc=[];S.corp=[];S.sche=[];S.other=[];S.assets.use=false;const j=newW2();Object.assign(j,{use:true,mode:'manual',freq:'Monthly',rate:10000});j.m.base='current';S.w2.push(j);
      S.dti.pi=2000;S.dti.taxes=500;S.dti.ins=100;S.dti.hoa=0;S.dti.mi=0;S.dti.otherHousing=0;S.dti.debts=[{amt:1000}];return calcTotals()}""")
    chk('Totals income',t['income'],10000.0); chk('PITIA',t['pitia'],2600.0); chk('Front DTI 26%',t['front'],0.26,1e-9); chk('Back DTI 36%',t['back'],0.36,1e-9)
    b.close()
bad=[r for r in R if not r[1]]
print(f'Income Calculator known-answer tests: {len(R)-len(bad)} passed, {len(bad)} failed  (page errors: {len(errs)})')
for n,ok,g,e in R:
    if not ok: print('  FAIL',n,'| got',g,'| expected',e)
sys.exit(1 if (bad or errs) else 0)
