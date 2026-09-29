
/* ==================================================================
   XLSX WRITER  —  styled workbooks, no library
   SheetJS community cannot write cell formatting, so the workbook is
   assembled here: OOXML parts zipped with the STORE method (no
   compression, so no deflate dependency and no CDN). That buys full
   control over fills, fonts, borders, merges and column widths, which
   is what makes the export read like the NMB worksheet instead of a
   grid of numbers.
   ================================================================== */

/* ---------- zip (store) ---------- */
const CRC_T = (()=>{ const t=new Uint32Array(256);
  for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1 ? 0xEDB88320 ^ (c>>>1) : c>>>1; t[n]=c>>>0; }
  return t; })();
function crc32(u8){ let c = 0xFFFFFFFF;
  for (let i=0;i<u8.length;i++) c = CRC_T[(c ^ u8[i]) & 0xFF] ^ (c>>>8);
  return (c ^ 0xFFFFFFFF) >>> 0; }

function zipStore(files){
  const enc = new TextEncoder();
  const parts = [], central = [];
  let offset = 0;
  files.forEach(f=>{
    const name = enc.encode(f.name);
    const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc  = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0, true);
    lh.setUint16(8, 0, true);                                  /* stored */
    lh.setUint16(10, 0, true); lh.setUint16(12, 0x2821, true); /* fixed timestamp — reproducible */
    lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true);
    cd.setUint16(8, 0, true); cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true); cd.setUint16(14, 0x2821, true);
    cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + data.length;
  });
  const cdSize = central.reduce((n,p)=>n+p.length, 0);
  const eo = new DataView(new ArrayBuffer(22));
  eo.setUint32(0, 0x06054b50, true);
  eo.setUint16(8, files.length, true); eo.setUint16(10, files.length, true);
  eo.setUint32(12, cdSize, true); eo.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(eo.buffer)], {type:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}

/* ---------- style registry ---------- */
const XE = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

/* NMB palette, read off the workbook's theme colours */
const NC = {
  band  :'FF595959',   /* Employment Record #n  */
  band2 :'FF808080',   /* Salary/Hourly, OT/Bonus/Commission */
  band3 :'FF404040',   /* For Information Only */
  head  :'FFD9D9D9',   /* table header row */
  row   :'FFF2F2F2',   /* year label cells */
  blue  :'FFD9E2F3',   /* amount used */
  lblue :'FFDEEBF7',   /* monthly / monthly YTD */
  green :'FFE2EFDA',   /* annual / borrower income */
  yellow:'FFFFE699',   /* base only annual */
  tan   :'FFFDE9D9',
  white :'FFFFFFFF',
  text  :'FF262626',
  red   :'FFC00000'
};
const FMT = {money:164, num2:165, pct:166, date:167, int:168, pct2:169, pct3:170};

function styleBook(){
  const fonts = [], fills = [{},{gray:1}], borders = [{}], xfs = [], map = {};
  const idx = (arr, obj)=>{ const k = JSON.stringify(obj);
    let i = arr.findIndex(x=>JSON.stringify(x)===k);
    if (i < 0){ arr.push(obj); i = arr.length-1; } return i; };
  fonts.push({sz:11, name:'Calibri'});
  function xf(sp){
    const key = JSON.stringify(sp);
    if (map[key] != null) return map[key];
    const fi = idx(fonts, {sz:sp.sz||11, b:!!sp.b, i:!!sp.i, color:sp.color||null, name:'Calibri'});
    const li = sp.fill ? idx(fills, {fg:sp.fill}) : 0;
    const bi = sp.bord ? idx(borders, {s:sp.bord}) : 0;
    xfs.push({fi, li, bi, fmt:sp.fmt||0, h:sp.h||null, v:sp.v||'center', wrap:!!sp.wrap, indent:sp.indent||0});
    return (map[key] = xfs.length - 1);
  }
  xf({});                                        /* 0 = default */
  return {fonts, fills, borders, xfs, xf, map,
    xml(){
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="7">
<numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0.00"/>
<numFmt numFmtId="165" formatCode="0.00"/>
<numFmt numFmtId="166" formatCode="0.00%"/>
<numFmt numFmtId="167" formatCode="mm\\-dd\\-yy"/>
<numFmt numFmtId="168" formatCode="0"/>
<numFmt numFmtId="169" formatCode="0.00&quot;%&quot;"/>
<numFmt numFmtId="170" formatCode="0.000&quot;%&quot;"/>
</numFmts>
<fonts count="${fonts.length}">${fonts.map(f=>
  `<font><sz val="${f.sz}"/>${f.b?'<b/>':''}${f.i?'<i/>':''}`
  + `<color rgb="${f.color||NC.text}"/><name val="${f.name}"/></font>`).join('')}</fonts>
<fills count="${fills.length}">${fills.map(f=>
  f.gray ? '<fill><patternFill patternType="gray125"/></fill>'
  : f.fg  ? `<fill><patternFill patternType="solid"><fgColor rgb="${f.fg}"/><bgColor indexed="64"/></patternFill></fill>`
          : '<fill><patternFill patternType="none"/></fill>').join('')}</fills>
<borders count="${borders.length}">${borders.map(b=>{
  if (!b.s) return '<border><left/><right/><top/><bottom/><diagonal/></border>';
  const st = b.s === 'medium' ? 'medium' : 'thin';
  const col = '<color rgb="FF7F7F7F"/>';
  if (b.s === 'bottom') return `<border><left/><right/><top/><bottom style="thin">${col}</bottom><diagonal/></border>`;
  return `<border><left style="${st}">${col}</left><right style="${st}">${col}</right>`
       + `<top style="${st}">${col}</top><bottom style="${st}">${col}</bottom><diagonal/></border>`;
}).join('')}</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${xfs.length}">${xfs.map(x=>
  `<xf numFmtId="${x.fmt}" fontId="${x.fi}" fillId="${x.li}" borderId="${x.bi}" xfId="0"`
  + ` applyFont="1" applyFill="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1">`
  + `<alignment${x.h?` horizontal="${x.h}"`:''} vertical="${x.v}"${x.wrap?' wrapText="1"':''}`
  + `${x.indent?` indent="${x.indent}"`:''}/></xf>`).join('')}</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
<dxfs count="0"/><tableStyles count="0"/></styleSheet>`;
    }};
}

/* ---------- sheet model ---------- */
const COLA = n => { let s=''; while(n>0){ const m=(n-1)%26; s=String.fromCharCode(65+m)+s; n=(n-m-1)/26; } return s; };

function XSheet(name){
  return {
    name, cells:{}, widths:{}, heights:{}, merges:[], freeze:null, maxR:0, maxC:0,
    put(r, c, v, st, type){
      if (v === undefined || v === null || v === '') { if (!st) return this; }
      (this.cells[r] = this.cells[r] || {})[c] = {v, s:st||0, t:type||(typeof v==='number'?'n':'s')};
      this.maxR = Math.max(this.maxR, r); this.maxC = Math.max(this.maxC, c);
      return this;
    },
    merge(r1,c1,r2,c2){ this.merges.push(`${COLA(c1)}${r1}:${COLA(c2)}${r2}`);
      this.maxR = Math.max(this.maxR, r2); this.maxC = Math.max(this.maxC, c2); return this; },
    width(c, w){ this.widths[c] = w; return this; },
    height(r, h){ this.heights[r] = h; return this; },
    xml(){
      const rows = Object.keys(this.cells).map(Number).sort((a,b)=>a-b).map(r=>{
        const cs = this.cells[r];
        const cells = Object.keys(cs).map(Number).sort((a,b)=>a-b).map(c=>{
          const cell = cs[c], ref = `${COLA(c)}${r}`;
          if (cell.t === 'n') return `<c r="${ref}" s="${cell.s}"><v>${isFinite(cell.v)?cell.v:0}</v></c>`;
          if (cell.v === '') return `<c r="${ref}" s="${cell.s}"/>`;
          return `<c r="${ref}" s="${cell.s}" t="inlineStr"><is><t xml:space="preserve">${XE(cell.v)}</t></is></c>`;
        }).join('');
        const h = this.heights[r];
        return `<row r="${r}"${h?` ht="${h}" customHeight="1"`:''}>${cells}</row>`;
      }).join('');
      const cols = Object.keys(this.widths).map(Number).sort((a,b)=>a-b)
        .map(c=>`<col min="${c}" max="${c}" width="${this.widths[c]}" customWidth="1"/>`).join('');
      const pane = this.freeze
        ? `<pane ySplit="${this.freeze}" topLeftCell="A${this.freeze+1}" activePane="bottomLeft" state="frozen"/>`
        + `<selection pane="bottomLeft"/>` : '';
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:${COLA(Math.max(1,this.maxC))}${Math.max(1,this.maxR)}"/>
<sheetViews><sheetView showGridLines="0" workbookViewId="0">${pane}</sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
${cols?`<cols>${cols}</cols>`:''}
<sheetData>${rows}</sheetData>
${this.merges.length?`<mergeCells count="${this.merges.length}">${
  this.merges.map(m=>`<mergeCell ref="${m}"/>`).join('')}</mergeCells>`:''}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0" paperSize="1" scale="100"/>
</worksheet>`;
    }};
}

function writeXLSX(sheets, styles, filename){
  const n = sheets.length;
  const files = [
    {name:'[Content_Types].xml', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`},
    {name:'_rels/.rels', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`},
    {name:'xl/workbook.xml', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheets.map((s,i)=>`<sheet name="${XE(s.name.substring(0,31))}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets>
</workbook>`},
    {name:'xl/_rels/workbook.xml.rels', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}
<Relationship Id="rId${n+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`},
    {name:'xl/styles.xml', data: styles.xml()}
  ];
  sheets.forEach((s,i)=> files.push({name:`xl/worksheets/sheet${i+1}.xml`, data:s.xml()}) );
  dl(zipStore(files), filename);
}
