"""Lossless decomposition of the built app into ordered parts.

A real scan for <script>/<style> elements: an element ends at its own
closing tag, so HTML-looking text INSIDE a script string is never
mistaken for markup (a plain regex does exactly that).
"""
import re, json, sys, pathlib, hashlib

def scan(html):
    """Yield ('markup'|'script'|'style', open_tag, body, close_tag) in order."""
    out=[]; i=0; n=len(html); tag=re.compile(r'<(script|style)\b[^>]*>', re.I)
    while True:
        m=tag.search(html,i)
        if not m: out.append(('markup','',html[i:],'')); break
        if m.start()>i: out.append(('markup','',html[i:m.start()],''))
        kind=m.group(1).lower(); close=f'</{kind}>'
        e=html.lower().find(close,m.end())          # first closing tag ends the element (HTML spec)
        if e<0: raise SystemExit(f'unterminated <{kind}> at {m.start()}')
        out.append((kind,m.group(0),html[m.end():e],html[e:e+len(close)]))
        i=e+len(close)
    return out

if __name__=='__main__':
    src=pathlib.Path(sys.argv[1]).read_text(encoding='utf-8')
    parts=scan(src)
    re_join=''.join(o+b+c for _,o,b,c in parts)
    print('lossless round-trip:', re_join==src)
    k={'script':0,'style':0,'markup':0}
    for kind,o,b,c in parts: k[kind]+=1
    print('parts:',k)
    print('inline scripts with src=:', sum(1 for kd,o,b,c in parts if kd=='script' and 'src=' in o))
    for kd,o,b,c in parts:
        if kd=='script' and 'src=' in o: print('   ',o[:130])
        if kd=='markup' and 'stylesheet' in b: 
            for mm in re.finditer(r'<link[^>]+>',b): print('   ',mm.group(0)[:150])
