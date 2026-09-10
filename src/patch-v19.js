/* v19 - publishable release polish and universal freeform numeric entry. */
(function(){
'use strict';
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var V=window.V19={version:'19.0'};

V.normalizeNumber=function(raw){
  var s=String(raw==null?'':raw).trim();if(!s)return'';
  var neg=/^\(.*\)$/.test(s);s=s.replace(/[()$,%\s]/g,'').replace(/,/g,'');
  var m=s.match(/^(-?(?:\d+\.?\d*|\.\d+))([km])?$/i);if(!m)return raw;
  var n=parseFloat(m[1]),mult=!m[2]?1:m[2].toLowerCase()==='k'?1000:1000000;if(!isFinite(n))return raw;n=(neg?-Math.abs(n):n)*mult;
  return String(Math.round(n*1000000)/1000000);
};
function normalizeField(el){var raw=el.value;if(/[\s$,%(),]|[km]$/i.test(raw))el.value=V.normalizeNumber(raw);}

/* Calculations already normalize typed currency, commas, percentages, k and m
   shorthand. Text-mode numeric controls expose that parser everywhere while
   preserving each existing input/change handler and data path. */
V.enhanceFreeform=function(root){
  $$('input[type="number"]',root||document).forEach(function(el){
    if(el.dataset.v19Freeform)return;
    el.dataset.v19Freeform='1';
    el.type='text';
    el.inputMode='decimal';
    el.autocomplete='off';
    el.spellcheck=false;
    /* Capture runs before the field's original input/change handler, so the
       calculation engine receives a plain numeric string. */
    el.addEventListener('input',function(){normalizeField(el);},true);
    el.addEventListener('change',function(){normalizeField(el);},true);
    el.addEventListener('blur',function(){normalizeField(el);},true);
  });
};
function releaseStamp(){var current=parseFloat(document.documentElement.dataset.losRelease||'0');if(!isFinite(current)||current<19)document.documentElement.dataset.losRelease='19';}
function boot(){V.enhanceFreeform(document);releaseStamp();if(window.V17&&V17.paintThemeButtons)V17.paintThemeButtons();return true;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();setInterval(boot,350);
})();
