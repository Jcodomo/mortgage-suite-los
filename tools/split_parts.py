"""Maintenance tool: split a built single-file app into ordered parts + manifest (lossless)."""
import sys,re,json,pathlib
sys.path.insert(0,str(pathlib.Path(__file__).parent)); from split import scan
src=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2]); out.mkdir(parents=True,exist_ok=True)
html=src.read_text(encoding='utf-8'); parts=scan(html); man=[]
def slug(kind,op,body):
    m=re.search(r'id="([^"]+)"',op)
    if m: return m.group(1)
    for line in body.split('\n'):
        t=re.sub(r'^[\s/*=#\-–—<!>]+','',line).strip()
        if len(t)>3: return re.sub(r'[^a-z0-9]+','-',t.lower())[:44].strip('-') or kind
    return kind
for i,(kind,op,body,cl) in enumerate(parts,1):
    ext={'script':'js','style':'css','markup':'html'}[kind]
    name=f'{i:03d}-{kind}' if kind=='markup' else f'{i:03d}-{kind}-{slug(kind,op,body)}'
    fn=f'{name}.{ext}'; (out/fn).write_text(body,encoding='utf-8',newline='')
    man.append({'file':fn,'kind':kind,'open':op,'close':cl})
(out.parent/'manifest.json').write_text(json.dumps(man,indent=1),encoding='utf-8')
print(len(man),'parts written to',out)
