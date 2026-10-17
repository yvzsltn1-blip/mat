const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
for(const file of ['curriculum','curriculum7','games','question-bank','arcade-gen','level-gen','questions7','foundation'])require(path.join(root,'assets',file+'.js'));
const F=MatFoundation,topic='m7-siralama',rng=MatGames.makeRng(1471);
assert(F.has(topic));assert(!F.has('m7-rasyonel'));assert.throws(()=>F.generate('alan'));
const sign=n=>n<0?'<':n>0?'>':'=';
const rat=s=>{const [a,b=1]=s.split('/').map(Number);return a/b;};
let count=0;
for(const template of F.templates)for(let i=0;i<120;i++){
  const q=F.generate(topic,rng,{template}),d=q.data;
  assert.equal(q.level,'foundation');assert.equal(q.points,5);assert(q.hint&&q.explain&&q.scene.html);
  assert(q.choices.length>=3&&q.choices.length<=4);assert.equal(new Set(q.choices).size,q.choices.length);assert(q.choices.includes(q.answer));
  assert(!/undefined|NaN|Infinity/.test(JSON.stringify(q)));
  if(d.a)assert.equal(q.answer,sign(d.a[0]*d.b[1]-d.b[0]*d.a[1]));
  else if(template==='alt-tam-sayi'||template==='ust-tam-sayi'){
    const a=Number(q.answer);assert(d.above?a>d.n/d.d:a<d.n/d.d);assert(d.above?a-1<=d.n/d.d:a+1>=d.n/d.d);
  }else if(template==='cift-tek-sinir'){
    const a=Number(q.answer);assert.equal(Math.abs(a)%2,d.parity);assert(d.below?a<d.edge:a>d.edge);assert(d.below?a+2>=d.edge:a-2<=d.edge);
  }else if(template==='basamakli-tam-sayi'){
    const answer=Number(q.answer),range=Array.from({length:10**d.digits-10**(d.digits-1)},(_,i)=>10**(d.digits-1)+i).filter(n=>!d.distinct||new Set(String(n)).size===d.digits).map(n=>d.negative?-n:n);
    assert.equal(answer,d.largest?Math.max(...range):Math.min(...range));
  }else if(template==='negatif-mutlak')assert.equal(Number(q.answer),-d.n);
  else if(template==='eksik-pay'){const a=Number(q.answer);assert(a/d.e<d.n/d.d);assert((a+1)/d.e>=d.n/d.d);}
  else if(template==='eksik-tam-sayili-pay'){const a=Number(q.answer);assert(a>=0&&a<d.d);assert(a<d.part&&a+1>=d.part);}
  else if(template==='eksik-payda'){const a=Number(q.answer);assert(a>0&&d.n/a>d.tenths/10);assert(d.n/(a+1)<=d.tenths/10);}
  else if(template==='cubuk-araligi')assert.equal(q.answer,Array.from({length:d.high-d.low-1},(_,i)=>d.low+i+1).join(', '));
  else if(template==='donma-noktasi')q.answer.split(' ve ').forEach(n=>assert(Number(n)<=d.tenths/10));
  else if(template==='isi-akisi'){
    const [a,b]=d.pairs[d.wrong],fmt=n=>String(n/10).replace('.',',');
    assert.equal(q.answer,`${fmt(a)} °C ${a>b?'←':'→'} ${fmt(b)} °C`);
  }
  else if(template==='fanus-siralama'){
    const expected=[...new Set(d.nums.flatMap(n=>d.dens.map(e=>n/e)))].sort((a,b)=>a-b),actual=q.answer.split(' < ').map(rat);
    assert.deepEqual(actual,expected);
  }else assert.fail('Test edilmeyen kalıp '+template);
  count++;
}
// Dengeli kalıp döngüsü ve yeniden üretim; iki takımın sorusu birebir aynı olmalı.
const templates=F.templates.length;
const round=Array.from({length:templates},()=>F.generate(topic,rng).templateId);
assert.equal(new Set(round).size,templates);
const withoutId=q=>{const {id,...rest}=q;return rest;};
for(let seed=1;seed<=80;seed++)assert.deepEqual(withoutId(F.generate(topic,MatGames.makeRng(seed),{repeatable:true})),withoutId(F.generate(topic,MatGames.makeRng(seed),{repeatable:true})));
// Gerçek uygulamada seviye seçimi, banka modunda dahi üretim, puan ve rapor.
const base=fs.readFileSync(path.join(__dirname,'verify.cjs'),'utf8');
let hs=base.slice(base.indexOf('function harness('),base.indexOf('function addStudent('));
hs=hs.replace('applyLessonAngle, render };','applyLessonAngle, render, renderPick, openFromHash };');
const harness=vm.runInNewContext(hs+'\nharness',{assert,vm,fs,path,root,console});
const h=harness(new Map(),{gen:true,grade7:true});
vm.runInContext(fs.readFileSync(path.join(root,'assets/foundation.js'),'utf8'),h.ctx);
h.state.classId='c7';h.state.grade=7;h.state.roundLength=5;h.state.questionSource='bank';
h.state.students.push({id:'a',name:'Örnek',score:0,stars:{},groupId:null});h.state.selectedId='a';
for(const grade of [5,7])for(const t of h.ctx.MatCurriculum.forGrade(grade).topics){
  h.state.grade=grade;h.openTopic(t.id,'play');const html=h.renderPick(t);
  assert(html.includes('foundation-section'));assert(html.lastIndexOf('foundation-section')>html.indexOf('Görsel oyunlar'));
  assert.equal(html.includes("Seviye 0'a başla"),t.id===topic);
}
h.state.grade=7;h.openTopic(topic,'play');h.beginLevel('foundation');
for(let i=0;i<5;i++){h.advance(500);const q=h.currentQ();assert.equal(q.level,'foundation');h.state.draft=q.answer;h.submit();h.goNext();}
assert.equal(h.state.phase,'finish');assert.equal(h.state.students[0].score,25);
assert.equal(h.state.history[0].level,'foundation');assert.equal(h.state.students[0].stats.levels.foundation.c,5);
h.ctx.location.hash='#oyun-m7-siralama-temel';h.openFromHash();h.advance(500);assert.equal(h.currentQ().level,'foundation');
h.cancelRound();h.openTopic('m7-rasyonel','play');h.beginLevel('foundation');assert.equal(h.state.phase,'pick');
h.openTopic(topic,'play');h.beginLevel(0);h.advance(800);assert(h.state.randomLevel); // Eski rastgele 0 ile karışmaz.
console.log(`OK: ${count} Seviye 0 sorusu bağımsız hesaplarla, 42 konu alanı, 5 soruluk tur, puan/rapor ve rastgele seviye uyumluluğu.`);
