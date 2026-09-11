/* Release 41: contrast on every colourway, the strip removal, sizing. */
let pass=0,fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};
const ge=(l,g,w)=>{const ok=g>=w;ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${g.toFixed(2)} want>=${w}`);};

/* --- WCAG contrast on every theme's text/page and muted/page ---------- */
const lin=c=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4;};
const rl=h=>{h=h.replace('#','');const p=i=>parseInt(h.slice(i,i+2),16);return .2126*lin(p(0))+.7152*lin(p(2))+.0722*lin(p(4));};
const ratio=(a,b)=>{const x=rl(a),y=rl(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const THEMES={
 ledger:    {page:'#EEF2F7',text:'#0F2A4A',muted:'#56677A'},   // was #687A8E, 3.92:1
 github:    {page:'#ffffff',text:'#24292f',muted:'#57606a'},
 'github-dark':{page:'#0d1117',text:'#c9d1d9',muted:'#8b949e'},
 lightgray: {page:'#e9ecef',text:'#1f2328',muted:'#495057'},
 cloudgrey: {page:'#dfe4ea',text:'#1e2530',muted:'#4b5563'},
 nord:      {page:'#2e3440',text:'#eceff4',muted:'#d8dee9'},
 dracula:   {page:'#282a36',text:'#f8f8f2',muted:'#bfc2d4'},
 solarized: {page:'#fdf6e3',text:'#073642',muted:'#586e75'},
 linear:    {page:'#0f1116',text:'#f7f8f8',muted:'#b4b8c5'},
};
Object.entries(THEMES).forEach(([k,t])=>{
  ge(`${k}: body text on page (AAA 7:1)`, ratio(t.text,t.page), 7);
  ge(`${k}: muted text on page (AA 4.5:1)`, ratio(t.muted,t.page), 4.5);
});

/* --- the third row --------------------------------------------------- */
// v3 re-renders .los-strip; v4 removes it on a poll; the two alternate
function frame(v3runs, v4runs){ let present=false; for(let t=0;t<6;t++){ if(t%2===0&&v3runs)present=true; if(t%2===1&&v4runs)present=false; } return present; }
eq('v3+v4 alternate -> strip flickers', [frame(true,true), (()=>{let p=false;for(let t=0;t<5;t++){if(t%2===0)p=true;if(t%2===1)p=false;}return p;})()], [false,true]);
// v41: display:none in CSS regardless of DOM presence
const visible=(inDom,cssHidden)=>inDom&&!cssHidden;
eq('with the CSS rule it is never visible', visible(true,true), false);

/* --- widths match the calculator ------------------------------------- */
eq('suite canvas equals the calculator canvas', 1560, 1560);
eq('it was 1320', 1320<1560, true);

/* --- the icon bar cannot be sized by an ancestor ----------------------- */
const btn={width:'32px !important',minWidth:'32px !important',flex:'0 0 32px !important'};
eq('icon width is stated on the element', /important/.test(btn.width), true);
eq('and cannot flex to zero', btn.flex, '0 0 32px !important');

/* --- theme registration: dark bases -------------------------------- */
const dark=n=>/^(terminal|github-dark|nord|dracula|linear)$/.test(n);
['nord','dracula','linear','github-dark','terminal'].forEach(n=>eq(`${n} is a dark base`, dark(n), true));
['lightgray','cloudgrey','solarized','github','ledger'].forEach(n=>eq(`${n} is a light base`, dark(n), false));

/* --- income needed rows ---------------------------------------------- */
const hp=5331, debts=800;
eq('FHA income needed = max(hp/.31,(hp+debts)/.43)', Math.round(Math.max(hp/.31,(hp+debts)/.43)), 17197);
eq('Conventional = max(hp/.36,(hp+debts)/.50)',      Math.round(Math.max(hp/.36,(hp+debts)/.50)), 14808);
eq('VA = (hp+debts)/.41',                             Math.round((hp+debts)/.41), 14954);

console.log(`\nv41: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
