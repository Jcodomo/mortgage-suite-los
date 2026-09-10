/* =====================================================================
   v37 — measured sticky offsets and minimal scroll progress
   ===================================================================== */
(function(){
  'use strict';
  var V=window.V37={version:'37.0'},observed=new WeakSet(),raf=0;
  function $(id){return document.getElementById(id);}
  function px(n,fallback){return Math.max(0,Math.round(n&&n.offsetHeight||fallback||0))+'px';}
  function visible(n){return !!(n&&n.offsetParent!==null);}
  function observe(n){
    if(!n||observed.has(n)||!window.ResizeObserver)return;
    observed.add(n);(new ResizeObserver(scheduleMeasure)).observe(n);
  }
  function progress(){
    var max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
    document.documentElement.style.setProperty('--v37-scroll-progress',String(Math.min(1,Math.max(0,scrollY/max))));
  }
  function scheduleProgress(){
    if(raf)return;raf=requestAnimationFrame(function(){raf=0;progress();});
  }
  function measure(){
    var shell=$('shellbar'),shellH=px(shell,52),calc=$('calc-root'),suite=$('suite-root');
    document.documentElement.style.setProperty('--v37-shell-h',shellH);
    if(calc){
      var cnav=$('v23CalcPrimaryNav');
      if(visible(cnav))calc.style.setProperty('--v37-calc-nav-h',px(cnav,46));
      observe(cnav);
    }
    if(suite){
      var chrome=suite.querySelector('.chrome');
      if(visible(chrome))suite.style.setProperty('--v37-suite-chrome-h',px(chrome,88));
      observe(chrome);
    }
    observe(shell);progress();
  }
  function scheduleMeasure(){requestAnimationFrame(measure);}
  function installProgress(){
    var shell=$('shellbar');if(!shell||$('v37ScrollProgress'))return;
    var line=document.createElement('i');line.id='v37ScrollProgress';line.setAttribute('aria-hidden','true');shell.appendChild(line);
  }
  function hidePromotedCopies(){
    var labels={'MORTGAGE RATES':1,'PROPERTY':1,'DOCUMENTS & OCR':1,'ADVANCED':1};
    document.querySelectorAll('#suite-root .v23-context-tabs>.tab').forEach(function(tab){
      var label=String(tab.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();
      tab.classList.toggle('v37-promoted-copy',!!labels[label]);
    });
  }
  function enhance(){
    document.documentElement.dataset.v37='1';installProgress();hidePromotedCopies();measure();
  }
  addEventListener('scroll',scheduleProgress,{passive:true});
  addEventListener('resize',scheduleMeasure,{passive:true});
  document.addEventListener('click',function(){setTimeout(function(){hidePromotedCopies();scheduleMeasure();},30);},{passive:true});
  setTimeout(enhance,80);setTimeout(enhance,650);setTimeout(enhance,1500);
})();
