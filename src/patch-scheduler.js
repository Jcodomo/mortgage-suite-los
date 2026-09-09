/* Shared enhancement scheduler.
   Older presentation layers register many short recurring timers. During the
   generated patch block, compatible UI timers are collected here and run as
   one visible-page task. Calculation handlers remain untouched and immediate. */
(function(){
'use strict';
if(window.LOS_SCHEDULER)return;
var nativeSet=window.setInterval.bind(window),nativeClear=window.clearInterval.bind(window);
var tasks={},nextId=-1,pending=false,sealed=false;
function request(delay){
  if(pending)return;pending=true;
  setTimeout(function(){pending=false;run();},delay==null?36:delay);
}
function run(){
  if(document.hidden)return;
  var now=Date.now();
  Object.keys(tasks).forEach(function(id){
    var task=tasks[id];if(!task||task.next>now)return;
    task.next=now+task.every;
    try{task.fn.apply(window,task.args);}catch(e){if(console&&console.warn)console.warn('LOS enhancement task',e);}
  });
}
window.setInterval=function(fn,ms){
  var args=Array.prototype.slice.call(arguments,2),wait=Number(ms)||0;
  if(!sealed&&typeof fn==='function'&&wait>=300&&wait<=1500){
    var id=nextId--;tasks[id]={fn:fn,args:args,every:Math.max(1200,wait),next:Date.now()+80};request(24);return id;
  }
  return nativeSet.apply(window,[fn,ms].concat(args));
};
window.clearInterval=function(id){if(Number(id)<0&&tasks[id]){delete tasks[id];return;}nativeClear(id);};
nativeSet(function(){request(0);},900);
['input','change','click'].forEach(function(name){document.addEventListener(name,function(){
  var now=Date.now();Object.keys(tasks).forEach(function(id){tasks[id].next=Math.min(tasks[id].next,now+70);});request(72);
},true);});
document.addEventListener('visibilitychange',function(){if(!document.hidden){var now=Date.now();Object.keys(tasks).forEach(function(id){tasks[id].next=now;});request(0);}});
window.LOS_SCHEDULER={
  request:request,
  add:function(fn,every){var id=nextId--;tasks[id]={fn:fn,args:[],every:Math.max(1200,Number(every)||1200),next:Date.now()};request(0);return id;},
  remove:function(id){delete tasks[id];},
  count:function(){return Object.keys(tasks).length;},
  seal:function(){if(sealed)return;sealed=true;window.setInterval=nativeSet;window.clearInterval=nativeClear;}
};
})();
