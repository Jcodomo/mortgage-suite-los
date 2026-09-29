import sys,json,time
from playwright.sync_api import sync_playwright
FILE=sys.argv[1]; TAG=sys.argv[2]; INCOME_Q=sys.argv[3] if len(sys.argv)>3 else '?app=income'
INIT="(()=>{const T={i:0,t:0,mo:0};window.__T=T;const si=setInterval,st=setTimeout;window.setInterval=function(f,t,...a){T.i++;return si.call(this,f,t,...a)};window.setTimeout=function(f,t,...a){T.t++;return st.call(this,f,t,...a)};const M=MutationObserver;window.MutationObserver=function(c){T.mo++;return new M(c)};window.MutationObserver.prototype=M.prototype})();"
out={}
with sync_playwright() as p:
  b=p.chromium.launch()
  for app,q,sel in [('suite','?app=suite&tab=quote','#suite-root .rail .card'),('income',INCOME_Q,'#calc-root .card')]:
    ctx=b.new_context(viewport={'width':1440,'height':900}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)[:120])); pg.add_init_script(INIT)
    cdp=ctx.new_cdp_session(pg); cdp.send('Performance.enable'); get=lambda:{x['name']:x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
    t0=time.time(); pg.goto(f'file://{FILE}{q}',wait_until='load'); load=(time.time()-t0)*1000; ready=None
    for _ in range(80):
        if pg.evaluate(f"()=>!!document.querySelector('{sel}')"): ready=(time.time()-t0)*1000; break
        time.sleep(0.1)
    m0=get(); pg.wait_for_timeout(2000); nt=pg.evaluate("()=>{const n=performance.getEntriesByType('navigation')[0];const f=performance.getEntriesByName('first-contentful-paint')[0];return {dcl:Math.round(n.domContentLoadedEventEnd),fcp:f?Math.round(f.startTime):null,nodes:document.getElementsByTagName('*').length,T:window.__T}}")
    m1=get(); a0=get(); pg.wait_for_timeout(6000); a1=get()            # phase A: just after load
    while time.time()-t0<16: time.sleep(0.5)
    s0=get(); pg.wait_for_timeout(6000); s1=get()                        # phase B: left open
    d=lambda x,y,k:(y[k]-x[k])*1000
    out[app]={'load_ms':round(load),'ready_ms':round(ready) if ready else None,'dcl_ms':nt['dcl'],'fcp_ms':nt['fcp'],'nodes':nt['nodes'],
      'startup_task_ms':round(m1['TaskDuration']*1000),'startup_script_ms':round(m1['ScriptDuration']*1000),'startup_style_ms':round(m1['RecalcStyleDuration']*1000),'startup_layout_ms':round(m1['LayoutDuration']*1000),
      'idle_A_task_ms_per_6s':round(d(a0,a1,'TaskDuration'),1),'idle_B_task_ms_per_6s':round(d(s0,s1,'TaskDuration'),1),'idle_B_script_ms_per_6s':round(d(s0,s1,'ScriptDuration'),1),
      'heap_MB':round(m1['JSHeapUsedSize']/1048576,1),'setInterval':nt['T']['i'],'setTimeout_at_load':nt['T']['t'],'observers':nt['T']['mo'],'page_errors':len(errs),'sample_err':errs[:2]}
    print(app,json.dumps(out[app]),flush=True); ctx.close()
  b.close()
json.dump(out,open(f'perf-{TAG}.json','w'),indent=1); print('DONE',flush=True)
