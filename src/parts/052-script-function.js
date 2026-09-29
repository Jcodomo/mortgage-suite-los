
(function(){
  var registry = {}, cache = {};
  function normalize(base, id){
    if (id.charAt(0) !== '.') return id;
    var parts = base.split('/'); parts.pop();
    id.split('/').forEach(function(p){
      if (p === '.') return;
      if (p === '..') parts.pop();
      else parts.push(p);
    });
    return parts.join('/');
  }
  function req(base, id){
    if (id === 'require') return function(x){ return req(base, x); };
    if (id === 'exports') return {};
    var name = normalize(base, id);
    if (cache[name]) return cache[name];
    var mod = registry[name];
    if (!mod) throw new Error('Module not found: ' + name + ' (from ' + base + ')');
    var exports = cache[name] = {};
    var args = mod.deps.map(function(d){
      if (d === 'exports') return exports;
      if (d === 'require') return function(x){ return req(name, x); };
      return req(name, d);
    });
    var result = mod.factory.apply(null, args);
    if (result !== undefined) cache[name] = result;
    return cache[name];
  }
  window.define = function(name, deps, factory){
    registry[name] = { deps: deps, factory: factory };
  };
  window.define.amd = true;
  window.__amdStart = function(entry){ req(entry, entry); };
  /* Read-only module access for progressive UI layers such as the editable
     full-file workspace. The existing loader and calculation modules remain
     authoritative; this only exposes their already-instantiated exports. */
  window.__amdGet = function(entry){ return req(entry, entry); };
})();
