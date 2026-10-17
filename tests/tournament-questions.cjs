const assert = require('node:assert/strict');
for (const name of ['curriculum','curriculum7','games','question-bank','arcade-gen','level-gen','questions7','tournament-rules']) require('../assets/'+name+'.js');
const R = MatTournamentRules;
for (const [input,answer] of [['−1,5',-1.5],['2/4',.5],['0',0],['-3/2',-1.5],['1/0',null],['',null],['1e3',null],['1,2,3',null]]) assert.equal(R.numericValue(input),answer);
assert.equal(R.numericQuestion({kind:'mc',answer:'Doğru'}),null);
const rng=MatGames.makeRng(17102026);
const original=MatLevelGen.generate;
MatLevelGen.generate=(id,level,_rng,opts)=>original(id,level,rng,opts);
let count=0;
for(const topic of MatLevelGen.topics) for(let level=1;level<=8;level++) for(const format of ['choice','number']) for(let i=0;i<3;i++) {
  let q;
  try {q=R.question(topic,level,format);} catch(err) {err.message=topic+'/'+level+'/'+format+': '+err.message;throw err;}
  assert.equal(q.level,level);
  assert(q.prompt && q.explain && q.scene);
  if(format==='choice') {
    assert.equal(q.kind,'mc');assert.equal(q.choices.length,4);
    assert.equal(new Set(q.choices).size,4);
    assert.equal(q.choices.filter(c=>c===q.answer).length,1);
  } else { assert.equal(q.kind,'num');assert.notEqual(R.numericValue(q.answer),null); }
  count++;
}
// Elimination: every student gets the same kind of question, with new values.
for(const [topic,level] of [['nokta',2],['islem',2],['m7-tamsayilar',2]]) for(const format of ['choice','number']) {
  const pick=R.pickShape(topic,level,format,10);assert(pick,topic);
  const lock={template:pick.template,family:pick.family,asked:[],uses:{}};
  for(let i=0;i<10;i++){const q=R.question(topic,level,format,lock);assert.equal(q.templateId,lock.template);assert.equal(q.family,lock.family);assert(!lock.asked.includes(q.seen),topic+' tekrar');lock.asked.push(q.seen);lock.uses[q.shape]=(lock.uses[q.shape]||0)+1;}
}
// Polygons: same kind of question, but not the same polygon for everyone.
{const lock={template:'cokgen:3',family:R.familyOf({templateId:'cokgen:3',prompt:'Altıgenin toplam kaç köşegeni vardır?'}),asked:[],uses:{}};
  const shapes=new Set();for(let i=0;i<6;i++){const q=R.question('cokgen',4,'number',lock);assert.equal(q.family,lock.family);shapes.add(q.shape);lock.asked.push(q.seen);lock.uses[q.shape]=(lock.uses[q.shape]||0)+1;}
  assert(shapes.size>=4,'çokgenler dönüşümlü gelmeli');}
console.log(`Tournament question formats: ${count} samples, 42 topics × 8 levels, four choices and numeric entry passed.`);
