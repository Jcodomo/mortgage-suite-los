#!/usr/bin/env python3
"""Build dist/ from src/.  usage: python3 build/build.py [--no-minify]
  1. assemble src/parts in manifest order   -> the readable single file
  2. minify JS (terser) + CSS (csso, restructuring off) unless --no-minify
  3. emit the launchers: loan-suite.html / income-calculator.html (same app, workspace defaulted)
  4. emit the landing page index.html (dist/ and repo root)
"""
import sys,json,re,subprocess,pathlib,shutil
ROOT=pathlib.Path(__file__).resolve().parent.parent; sys.path.insert(0,str(ROOT/'tools')); from split import scan
MIN='--no-minify' not in sys.argv; NM=ROOT/'node_modules'
def read(p): return pathlib.Path(p).read_text(encoding='utf-8')
def assemble():
    man=json.loads(read(ROOT/'src/manifest.json'))
    return ''.join(m['open']+read(ROOT/'src/parts'/m['file'])+m['close'] for m in man)
def node(args,inp):
    r=subprocess.run(['node']+args,input=inp,capture_output=True,text=True,timeout=280)
    if r.returncode: sys.exit(f'{args[0]} failed:\n{r.stderr[:600]}')
    return r.stdout
def minify(html):
    out=[]
    for kind,op,body,cl in scan(html):
        if kind=='script' and 'src=' not in op and body.strip() and not re.search(r'type=["\'](?!text/javascript|module)',op):
            body=node([str(NM/'terser/bin/terser'),'--compress','passes=1,keep_fargs=true','--mangle','keep_fnames=true','--keep-fnames','--ecma','2020'],body)
        elif kind=='style' and body.strip():
            body=node(['-e',"const c=require(%r);let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(c.minify(s,{restructure:false,comments:false}).css))"%str(NM/'csso')],body)
        out.append(op+body+cl)
    return ''.join(out)
def variant(html,app):
    """Same app; if the URL names no workspace, open this one. Explicit ?app= always wins."""
    boot=('<script>if(!/[?&]app=/.test(location.search)){try{history.replaceState(null,"",location.pathname+(location.search?location.search+"&":"?")+"app=%s"+location.hash)}catch(e){}}</script>\n'%app)
    i=html.index('<head>')+len('<head>'); return html[:i]+'\n'+boot+html[i+1:] if html[i]=='\n' else html[:i]+boot+html[i:]
def main():
    dist=ROOT/'dist'; dist.mkdir(exist_ok=True)
    html=assemble(); print('assembled',f'{len(html):,}','bytes from',len(json.loads(read(ROOT/"src/manifest.json"))),'parts')
    if MIN: html=minify(html); print('minified ->',f'{len(html):,}','bytes')
    (dist/'mortgage-suite-los.html').write_text(html,encoding='utf-8')
    (dist/'loan-suite.html').write_text(variant(html,'suite'),encoding='utf-8')
    (dist/'income-calculator.html').write_text(variant(html,'income'),encoding='utf-8')
    # Keep the public root entry points as self-contained launchers too.  This
    # makes /loan-suite.html and /income-calculator.html work on GitHub Pages
    # without a redirect or a dependency on a relative dist/ path.
    (ROOT/'loan-suite.html').write_text(variant(html,'suite'),encoding='utf-8')
    (ROOT/'income-calculator.html').write_text(variant(html,'income'),encoding='utf-8')
    (ROOT/'mortgage-suite-los.html').write_text(html,encoding='utf-8')
    land=read(ROOT/'src/landing.html')
    (dist/'index.html').write_text(land,encoding='utf-8')
    # Root launchers are self-contained, so the landing page can use the same
    # stable links whether it is opened from the repository root or dist/.
    (ROOT/'index.html').write_text(land,encoding='utf-8')
    for f in sorted(dist.glob('*.html')): print(f'  {f.relative_to(ROOT)}  {f.stat().st_size:,}')
if __name__=='__main__': main()
