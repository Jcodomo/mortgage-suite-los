const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'src','release-50','loan-limits-2026.json'),'utf8'));

assert.equal(data.year,2026);
assert.deepEqual(data.conventionalBaseline,[832750,1066250,1288800,1601750]);
assert.deepEqual(data.conventionalCeiling,[1249125,1599375,1933200,2402625]);
assert.deepEqual(data.fhaFloor,[541287,693050,837700,1041125]);
assert.deepEqual(data.fhaCeiling,[1249125,1599375,1933200,2402625]);
assert.deepEqual(data.counties['NY|NASSAU'][0],[1209750,1548975,1872225,2326875]);
assert.deepEqual(data.counties['NY|NASSAU'][1],[1249125,1599375,1933200,2402625]);
assert.ok(Object.keys(data.counties).length>450,'county exception table should be populated');
assert.ok(/^https:\/\/www\.fhfa\.gov\//.test(data.sources.conventional));
assert.ok(/^https:\/\/apps\.hud\.gov\//.test(data.sources.fha));

function classify(program,amount,units,state,county){
  const idx=Math.max(0,Math.min(3,Number(units||1)-1));
  const row=data.counties[state+'|'+county];
  const conventional=(row&&row[0]||data.conventionalBaseline)[idx];
  const fha=(row&&row[1]||data.fhaFloor)[idx];
  if(program==='FHA'){
    if(amount>fha)return'over-limit';
    if(fha>data.fhaFloor[idx]&&amount>data.fhaFloor[idx])return'high-cost';
    return'standard';
  }
  if(amount<=data.conventionalBaseline[idx])return'conforming';
  if(conventional>data.conventionalBaseline[idx]&&amount<=conventional)return'high-balance';
  return'jumbo';
}

assert.equal(classify('Conventional',800000,1,'NY','NASSAU'),'conforming');
assert.equal(classify('Conventional',1000000,1,'NY','NASSAU'),'high-balance');
assert.equal(classify('Conventional',1220000,1,'NY','NASSAU'),'jumbo');
assert.equal(classify('FHA',500000,1,'NY','NASSAU'),'standard');
assert.equal(classify('FHA',1000000,1,'NY','NASSAU'),'high-cost');
assert.equal(classify('FHA',1260000,1,'NY','NASSAU'),'over-limit');

console.log('v50 county limits: official values and six classifications passed');
