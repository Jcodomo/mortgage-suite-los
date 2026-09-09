const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const dir=__dirname,files=fs.readdirSync(dir).filter(f=>/\.test\.js$/.test(f)).sort();
let failed=0;
for(const file of files){
  const run=spawnSync(process.execPath,[path.join(dir,file)],{stdio:'inherit'});
  if(run.status!==0)failed++;
}
if(failed){console.error(`\n${failed} test file(s) failed.`);process.exit(1);}
console.log(`\nAll ${files.length} test files passed.`);
