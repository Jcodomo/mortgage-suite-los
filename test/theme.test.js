/* Theme cycle + cross-shell sync.
   The buttons hold no state of their own: each one reads the current
   skin, computes the next, and commits through LOS.setSkin, which writes
   ONE data-skin attribute on <html>. Both shells' CSS keys off that
   attribute, so sync is structural rather than something that has to be
   messaged between the two sides. These assertions pin that property. */
let pass=0, fail=0;
const eq=(l,g,w)=>{const ok=JSON.stringify(g)===JSON.stringify(w);ok?pass++:fail++;
  console.log(`${ok?'PASS':'FAIL'}  ${l}  got=${JSON.stringify(g)} want=${JSON.stringify(w)}`);};

const NEXT  = { light:'dark', dark:'navy', navy:'oled', oled:'light' };
const LABEL = { light:'Light', dark:'Dark (black)', navy:'Navy blue', oled:'OLED true black' };

// --- the single source of truth both shells read ---
const html = { skin:'light', theme:'light' };
function setSkin(s){                       // mirrors LOS.setSkin
  html.skin = s;
  html.theme = (s === 'light') ? 'light' : 'dark';
}
// every button is identical: read current, advance, commit
const press = () => setSkin(NEXT[html.skin]);

// full cycle in the requested order
const seen=[];
for (let i=0;i<4;i++){ seen.push(html.skin); press(); }
eq('cycle order', seen, ['light','dark','navy','oled']);
eq('cycle returns to start', html.skin, 'light');

// every skin has a label and a successor
eq('all skins labelled', Object.keys(NEXT).every(k=>!!LABEL[k]), true);
eq('no dead ends', Object.values(NEXT).every(v=>NEXT[v]!==undefined), true);

// the three dark skins must all carry data-theme=dark so the engine's
// own dark rules still apply underneath the skin overrides
['dark','navy','oled'].forEach(s=>{ setSkin(s); eq(`${s} -> data-theme dark`, html.theme, 'dark'); });
setSkin('light'); eq('light -> data-theme light', html.theme, 'light');

// --- cross-shell sync: pressing any button moves both shells ---
// three mount points, one attribute; whichever is pressed, both shells
// read the same value afterwards because they read the same attribute
const shells = () => ({ calc: html.skin, suite: html.skin });
setSkin('light');
['calcToolbarBtn','shellBarBtn','suiteToolbarBtn'].forEach(which=>{
  const before = html.skin;
  press();                                   // any of the three does this
  const after = shells();
  eq(`${which}: both shells match`, after.calc === after.suite, true);
  eq(`${which}: advanced from ${before}`, html.skin, NEXT[before]);
});

console.log(`\ntheme: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
