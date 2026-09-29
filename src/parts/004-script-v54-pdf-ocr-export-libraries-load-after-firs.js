/* v54: PDF/OCR/export libraries load after first paint (idle, or first user interaction) instead of blocking the parser. */
(function(){var W='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
L=[['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'],['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'],
['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',function(){try{if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc=W;}catch(e){}}]],started=false;
function start(){if(started)return;started=true;L.forEach(function(x){var s=document.createElement('script');s.src=x[0];s.async=true;if(x[1])s.onload=x[1];(document.head||document.documentElement).appendChild(s);});}
window.LOS_LIBS={start:start};
['pointerdown','keydown','dragenter','touchstart'].forEach(function(n){addEventListener(n,start,{once:true,capture:true,passive:true});});
addEventListener('load',function(){(window.requestIdleCallback||function(f){setTimeout(f,1500);})(start,{timeout:3000});});})();
