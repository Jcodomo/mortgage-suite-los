
/* ==================================================================
   FLUID DATE ENTRY
   Type it any reasonable way — 8/15/26, 08152026, 8-15, Aug 15 2026,
   "t" for today — or click the calendar to pick one. The field settles
   to MM/DD/YYYY and stores an ISO date.
   ================================================================== */
function yr2(y){ return y <= 79 ? 2000 + y : 1900 + y; }
function mkISO(y, mo, d){
  if (!(mo>=1 && mo<=12) || !(d>=1 && d<=31) || !(y>=1900 && y<=2200)) return '';
  const dt = new Date(y, mo-1, d);
  if (dt.getMonth() !== mo-1 || dt.getDate() !== d) return '';
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function parseLoose(str){
  if (str == null) return '';
  let v = String(str).trim();
  if (!v) return '';
  const now = new Date();
  if (/^(t|today|now)$/i.test(v)) return mkISO(now.getFullYear(), now.getMonth()+1, now.getDate());
  if (/^(y|yest|yesterday)$/i.test(v)){ const d=new Date(now.getTime()-864e5); return mkISO(d.getFullYear(), d.getMonth()+1, d.getDate()); }
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);            /* already ISO */
  if (m) return mkISO(+m[1], +m[2], +m[3]);
  if (/^\d+$/.test(v)){                                        /* 08152026 / 081526 / 0815 */
    if (v.length===8) return mkISO(+v.slice(4), +v.slice(0,2), +v.slice(2,4));
    if (v.length===6) return mkISO(yr2(+v.slice(4)), +v.slice(0,2), +v.slice(2,4));
    if (v.length===4) return mkISO(now.getFullYear(), +v.slice(0,2), +v.slice(2,4));
    return '';
  }
  m = v.match(/^(\d{1,2})\s*[\/\-. ]\s*(\d{1,2})(?:\s*[\/\-. ]\s*(\d{1,4}))?$/);   /* 8/15/26, 8-15 */
  if (m){
    const y = (m[3]===undefined) ? now.getFullYear()
            : (m[3].length<=2 ? yr2(+m[3]) : +m[3]);
    return mkISO(y, +m[1], +m[2]);
  }
  /* month-name form — only when a real month name is present, so junk never
     slips through Date.parse's very forgiving reader */
  if (/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(v)){
    const t = Date.parse(/\d{4}/.test(v) ? v : v + ' ' + now.getFullYear());
    if (!isNaN(t)){ const d = new Date(t); return mkISO(d.getFullYear(), d.getMonth()+1, d.getDate()); }
  }
  return '';
}
function isoToUS(iso){
  const m = String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : '';
}
/* fn/a/b/c describe where the value goes, so no eval is needed */
function dateFld(iso, fn, a, b, c){
  return `<span class="datefld">
    <input class="cell-input dtxt" type="text" autocomplete="off" spellcheck="false"
      placeholder="mm/dd/yyyy" value="${isoToUS(iso)}"
      data-iso="${iso||''}" data-fn="${fn}" data-a="${esc(a)}" data-b="${esc(b)}" data-c="${esc(c)}"
      onkeydown="dfKey(event,this)" onblur="dfCommit(this)" onfocus="this.select()">
    <input type="date" class="dpick" value="${iso||''}" onchange="dfPicked(this)" tabindex="-1">
    <button type="button" class="dbtn no-print" tabindex="-1" title="Pick a date" onclick="dfOpen(this)">
      <svg class="icon"><use href="#i-cal"/></svg></button>
  </span>`;
}
function dfApply(txt, iso){
  const d = txt.dataset;
  if (d.fn === 'setField') setField(d.a, d.b, d.c, iso);
  else if (d.fn === 'setFld') setFld(d.a, +d.b, d.c, iso);
  else if (d.fn === 'setLoan') setLoan(d.c, iso);
  else if (d.fn === 'setPS') setPS(d.a, d.b, d.c, iso);
}
function dfCommit(txt){
  const raw = txt.value.trim();
  if (!raw){
    txt.classList.remove('bad'); txt.dataset.iso = '';
    txt.parentNode.querySelector('.dpick').value = '';
    dfApply(txt, ''); return;
  }
  const iso = parseLoose(raw);
  if (!iso){
    txt.classList.add('bad');
    setTimeout(()=>{ txt.classList.remove('bad'); txt.value = isoToUS(txt.dataset.iso); }, 900);
    return;
  }
  txt.classList.remove('bad');
  txt.value = isoToUS(iso);
  txt.dataset.iso = iso;
  txt.parentNode.querySelector('.dpick').value = iso;
  dfApply(txt, iso);
}
function dfKey(e, txt){
  if (e.key === 'Enter'){ e.preventDefault(); dfCommit(txt); txt.blur(); }
  else if (e.key === 'Escape'){ txt.value = isoToUS(txt.dataset.iso); txt.blur(); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowDown'){
    const iso = parseLoose(txt.value) || txt.dataset.iso;
    if (!iso) return;
    e.preventDefault();
    const p = iso.split('-').map(Number);
    const d = new Date(p[0], p[1]-1, p[2] + (e.key==='ArrowUp' ? 1 : -1));
    txt.value = isoToUS(mkISO(d.getFullYear(), d.getMonth()+1, d.getDate()));
    dfCommit(txt);
  }
}
function dfPicked(pick){
  const txt = pick.parentNode.querySelector('.dtxt');
  txt.value = isoToUS(pick.value); txt.dataset.iso = pick.value;
  dfApply(txt, pick.value);
}
function dfOpen(btn){
  const pick = btn.parentNode.querySelector('.dpick');
  const txt  = btn.parentNode.querySelector('.dtxt');
  if (!pick.value && txt.dataset.iso) pick.value = txt.dataset.iso;
  pick.style.pointerEvents = 'auto';
  try { pick.showPicker(); }
  catch(e){ pick.focus(); pick.click(); }
  setTimeout(()=>{ pick.style.pointerEvents = 'none'; }, 400);
}
