const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const name of ['curriculum','curriculum7','games','question-bank','arcade-gen','level-gen','questions7','foundation','group-race-rules'])require(path.join(root,'assets',name+'.js'));
const R=MatGroupRaceRules,teams=[{name:'Mavi'},{name:'Mercan'}];
const create=count=>R.create({topicId:'m7-siralama',level:1,count,teams},MatGames.makeRng(73));
assert.equal(create(1).questionMode,'same');
assert.throws(()=>R.create({topicId:'m7-siralama',level:1,count:1,teams,questionMode:'invalid'}));
for(const n of [1,3,10,100])assert.equal(create(n).seeds.length,n);
for(const count of [0,101,2.5,NaN])assert.throws(()=>create(count));
assert.throws(()=>R.create({topicId:'x',count:2,teams:[{name:'Bir',id:'x'},{name:'İki',id:'x'}]}));
assert.throws(()=>R.create({topicId:'x',count:2,teams:[{name:'A'},{name:' a '}]}));
// Karışık seviye: her soru sırasının bir seviyesi var, iki takım aynı seviyeyi görür.
assert.throws(()=>R.create({topicId:'cokgen',level:'mixed',count:2,teams}));
const pool=MatGames.LEVELS.map(l=>l.id),mixed=R.create({topicId:'cokgen',level:'mixed',count:20,teams,questionMode:'different',levelPool:pool},MatGames.makeRng(5));
assert.equal(mixed.levels.length,20);assert.deepEqual([...mixed.levels.slice(0,pool.length)].sort(),[...pool].sort());
assert.deepEqual(JSON.parse(JSON.stringify(mixed)).levels,mixed.levels);assert.equal(R.levelAt(create(1),0),1);
for(let i=0;i<mixed.count;i++){const level=R.levelAt(mixed,i);const [a,b]=R.questionPair(mixed,i,{generate:r=>MatLevelGen.generate('cokgen',level,r,{repeatable:true}),templateCount:MatLevelGen.templates('cokgen',level),makeRng:MatGames.makeRng});assert.equal(a.templateId,b.templateId);assert.notEqual(a.prompt,b.prompt);}
// Aynı soruda art arda yanlış: 10, 15, 20 sn; üçüncüsünden sonra soru geçilir.
{const r=create(2);R.resume(r,0);
 assert.equal(R.answer(r,0,0,false,0),'wrong');assert.equal(R.remaining(r,0,0),10000);
 assert.equal(R.answer(r,0,0,false,10000),'wrong');assert.equal(R.remaining(r,0,10000),15000);
 assert.equal(R.answer(r,0,0,false,25000),'skipped');assert.equal(R.remaining(r,0,25000),20000);
 assert.deepEqual([r.teams[0].index,r.teams[0].correct,r.teams[0].skipped,r.teams[0].tries,r.teams[0].penaltyMs],[1,0,1,0,45000]);
 assert.equal(R.answer(r,0,1,true,44999),'ignored');assert.equal(R.answer(r,0,1,true,45000),'completed');
 assert.equal(R.answer(r,0,2,false,45000),'ignored');assert.equal(R.answer(r,0,2,true,55000),'ignored');assert.equal(r.teams[0].index,2);
 assert.equal(r.teams[0].finishedAt,45000);assert.equal(r.status,'running');
 // Doğru cevap deneme sayacını sıfırlar.
 const t=create(3);R.resume(t,0);R.answer(t,1,0,false,0);R.answer(t,1,0,true,10000);R.answer(t,1,1,false,10000);assert.equal(R.remaining(t,1,10000),10000);
 assert(R.seedAt(r,2)>0&&R.seedAt(r,2)===R.seedAt(JSON.parse(JSON.stringify(r)),2)&&R.seedAt(r,2)!==R.seedAt(r,3));}
// Süre: çok doğru kazanır; iki takım da bitirmediyse eşit doğruda berabere.
assert.throws(()=>R.create({topicId:'x',level:1,count:2,teams,minutes:-1}));
{const timed=()=>{const r=R.create({topicId:'x',level:1,count:5,teams,minutes:1},MatGames.makeRng(1));R.resume(r,0);return r;};
 let r=timed();R.answer(r,0,0,true,1000);R.answer(r,1,0,true,500);R.answer(r,1,1,true,2000);
 assert.equal(R.expire(r,59999),false);assert.equal(R.expire(r,60000),true);assert.deepEqual([r.winner,r.endReason,r.status,r.elapsedMs],[1,'time','finished',60000]);
 r=timed();R.answer(r,0,0,true,3000);R.answer(r,1,0,true,4000);assert.equal(R.answer(r,1,1,true,61000),'timeup');assert.equal(r.winner,null);assert.equal(r.teams[1].correct,1);
 r=timed();R.pause(r,30000);assert.equal(R.expire(r,999999),false);R.resume(r,1000000);assert.equal(R.timeLeft(r,1010000),20000);assert.equal(R.expire(r,1030000),true);assert.equal(r.winner,null);
 assert.equal(R.timeLeft(create(1),5),Infinity);}
{const old={teams:[{index:2,wrong:1},{index:0,wrong:0}]};R.upgrade(old);assert.deepEqual([old.teams[0].correct,old.teams[0].penaltyMs,old.timeLimitMs],[2,10000,0]);}
const race=create(3);assert.equal(R.answer(race,0,0,true,0),'ignored');R.resume(race,1000);
assert.equal(R.answer(race,0,0,false,1100),'wrong');assert.equal(race.teams[0].index,0);assert.equal(R.remaining(race,0,1100),10000);
assert.equal(R.answer(race,1,0,true,1200),'correct');assert.equal(race.teams[1].index,1);assert.equal(race.teams[0].index,0);
assert.equal(R.answer(race,0,0,true,11099),'ignored');assert.equal(R.answer(race,0,0,true,11100),'correct');
assert.equal(R.answer(race,0,0,true,11100),'ignored'); // Eski sorunun çift tıklaması yeni soruyu çözmez.
R.answer(race,0,1,false,11200);R.pause(race,13200);assert.equal(R.remaining(race,0,999999),8000);
const restored=JSON.parse(JSON.stringify(race));R.resume(restored,1000000);
assert.equal(R.remaining(restored,0,1007999),1);assert.equal(R.answer(restored,0,1,true,1007999),'ignored');
assert.equal(R.answer(restored,0,1,true,1008000),'correct');assert.equal(R.answer(restored,0,2,true,1008100),'completed');
assert.equal(restored.status,'running');assert.equal(R.answer(restored,0,3,true,1008100),'ignored');
assert.equal(R.answer(restored,1,1,true,1008200),'correct');assert.equal(R.answer(restored,1,2,true,1008300),'finished');
assert.equal(restored.winner,0);assert.equal(restored.status,'finished');assert.equal(R.answer(restored,1,3,true,1008400),'ignored');
assert.equal(R.resume(restored,1009000),false);
const single=create(1);R.resume(single,0);assert.equal(R.answer(single,1,0,true,1),'completed');assert.equal(single.winner,null);
assert.equal(R.answer(single,0,0,true,2),'finished');assert.equal(single.winner,1);
// Sabit soru sayısı: son yanlışın cezası dahil bitirme süreleri, sıfır doğru ve tam eşitlik.
function skip(r,side,index,at){R.answer(r,side,index,false,at);R.answer(r,side,index,false,at+10000);assert.equal(R.answer(r,side,index,false,at+25000),'skipped');}
for(const offset of [0,1000]){
 const r=create(1);R.resume(r,0);skip(r,0,0,0);skip(r,1,0,offset);
 assert.equal(R.settle(r,44999),false);assert.equal(R.settle(r,45000+offset),true);
 assert.deepEqual(r.teams.map(t=>t.correct),[0,0]);assert.deepEqual(r.teams.map(t=>t.index),[1,1]);
 assert.equal(r.winner,offset?0:null);assert.equal(r.endReason,'questions');assert.equal(r.elapsedMs,45000+offset);
}
// Daha hızlı bitirmek doğru sayısının önüne geçmez.
{const r=create(1);R.resume(r,0);skip(r,0,0,0);assert.equal(R.answer(r,1,0,true,50000),'finished');assert.equal(r.winner,1);}
// Süre dolarken bir takım bitirmişse eşit doğruda bitiren kazanır.
{const r=R.create({topicId:'x',level:1,count:1,minutes:1,teams});R.resume(r,0);skip(r,1,0,0);assert(R.expire(r,60000));assert.equal(r.winner,1);}
// Son ceza yarış süresini aşıyorsa bitiş zamanı yerine süre sınırı kullanılır.
{const r=R.create({topicId:'x',level:1,count:1,minutes:1,teams});R.resume(r,0);skip(r,0,0,30000);assert(R.settle(r,60000));assert.equal(r.winner,null);assert.equal(R.completed(r,0,60000),false);}
// Yeniden açılış veya iki takımın farklı hızları soru gövdelerini değiştirmemeli.
const shape=q=>{const {id,...rest}=q;return rest;};
let samples=0;
for(const grade of [5,7])for(const topic of MatCurriculum.forGrade(grade).topics)for(let level=1;level<=8;level++)for(const seed of [5,417,18171]){
  const a=MatLevelGen.generate(topic.id,level,MatGames.makeRng(seed),{repeatable:true});
  MatLevelGen.generate(topic.id,level,MatGames.makeRng(seed+1)); // Normal soru geçmişi yarışın sorularını değiştiremez.
  const b=MatLevelGen.generate(topic.id,level,MatGames.makeRng(seed),{repeatable:true});
  assert.deepEqual(shape(a),shape(b),topic.id+':'+level);samples++;
}
assert(JSON.stringify(create(100)).length<10000); // Buluta büyük SVG dizileri yazılmaz.
// Farklı sorular: yalnız sayısal verilenler değişir; aynı kalıp, metin ve birim korunur.
const words=s=>String(s||'').replace(/[−-]?\d+(?:[.,]\d+)*/g,'#').replace(/\s+/g,' ').trim();
const visible=q=>q.prompt+' '+(q.scene?.html||'').replace(/<[^>]*>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
const variantsRng=MatGames.makeRng(91587751);let pairs=0;
function factory(topic,level){
  const foundation=level==='foundation';
  return {generate:r=>foundation?MatFoundation.generate(topic,r,{repeatable:true}):MatLevelGen.generate(topic,level,r,{repeatable:true}),
    templateCount:foundation?MatFoundation.templates.length:MatLevelGen.templates(topic,level),makeRng:MatGames.makeRng};
}
for(const grade of [5,7])for(const topic of MatCurriculum.forGrade(grade).topics)for(let level=1;level<=8;level++)for(let sample=0;sample<4;sample++){
  const config={seeds:[1+Math.floor(variantsRng()*2147483645)],questionMode:'different'},f=factory(topic.id,level);
  const [a,b]=R.questionPair(config,0,f);
  assert.equal(a.templateId,b.templateId);assert.equal(a.kind,b.kind);assert.equal(a.unit,b.unit);assert.equal(a.level,b.level);assert.equal(a.points,b.points);
  assert.equal(words(visible(a)),words(visible(b)),topic.id+':'+level);
  assert.notEqual((visible(a).match(/[−-]?\d+(?:[.,]\d+)*/g)||[]).join('|'),(visible(b).match(/[−-]?\d+(?:[.,]\d+)*/g)||[]).join('|'));
  assert.deepEqual((a.choices||[]).map(words).sort(),(b.choices||[]).map(words).sort());
  const copy=JSON.parse(JSON.stringify(config));assert.deepEqual(R.questionPair(copy,0,f).map(shape),[a,b].map(shape));
  if(sample===0){
    const original=f.generate(MatGames.makeRng(config.seeds[0]));
    assert.deepEqual(R.questionPair({...config,questionMode:'same'},0,f).map(shape),[original,original].map(shape));
    assert.deepEqual(R.questionPair({seeds:config.seeds},0,f).map(shape),[original,original].map(shape));
  }
  pairs++;
}
for(let i=0;i<120;i++){
  const config={seeds:[1+Math.floor(variantsRng()*2147483645)],questionMode:'different'},f=factory('m7-siralama','foundation');
  const [a,b]=R.questionPair(config,0,f);assert.equal(a.templateId,b.templateId);assert.equal(words(visible(a)),words(visible(b)));assert.notEqual(visible(a),visible(b));
  assert.deepEqual(R.questionPair(JSON.parse(JSON.stringify(config)),0,f).map(shape),[a,b].map(shape));pairs++;
}
// UI: iki takımın tuşları, ceza, yenileme ve diğer takımın yazısının korunması.
let now=0,data=null,markup='',serial=0,rootPaints=0;const jobs=new Map(),lanes=[{},{}],controls=[{},{}],penalties=[{},{}];
const host={isConnected:true,classList:{add(){}},querySelector(selector){
  if(selector.includes('data-gr-lane'))return lanes[Number(selector.match(/"(\d)"/)[1])];
  if(selector.includes('data-gr-controls'))return controls[Number(selector.match(/"(\d)"/)[1])];
  if(selector.includes('data-gr-penalty'))return penalties[Number(selector.match(/"(\d)"/)[1])];
  return {textContent:'',value:''};
}};
Object.defineProperty(host,'innerHTML',{get:()=>markup,set:s=>{markup=s;rootPaints++;}});
class TestDate extends Date{static now(){return now;}}
const documentEvents={},windowEvents={};
const box={window:null,MatGroupRaceRules:R,MatGames,MatFoundation,MatLevelGen:{generate:()=>({kind:'num',prompt:'2 + 2 = ?',answer:4})},
  document:{addEventListener:(name,fn)=>documentEvents[name]=fn,body:{classList:{toggle(){},remove(){}}}},addEventListener:(name,fn)=>windowEvents[name]=fn,Date:TestDate,Math,confirm:()=>true,
  MatAudio:{correct(){},wrong(){},fanfare(){}},setInterval:f=>{jobs.set(++serial,f);return serial;},clearInterval:id=>jobs.delete(id)};
box.window=box;vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(root,'assets/group-race.js'),'utf8'),box);
const api=box.MatGroupRace,context={get:()=>data,save:v=>data=v,groups:()=>[],topics:()=>[{id:'sum',title:'Toplama'}],levels:()=>MatGames.LEVELS};
api.mount(host,context);assert(markup.includes('data-gr-setup'));assert(markup.includes('value="same" selected'));assert(markup.includes('value="different"'));
data=R.create({topicId:'sum',level:1,count:2,teams});api.unmount();api.mount(host,context);
const act=(gr,side=0,index=0,key='')=>host.onclick({detail:0,preventDefault(){},target:{closest:()=>({dataset:{gr,side:String(side),index:String(index),key,choice:key||'0'}})}});
act('resume');assert.equal(data.status,'running');assert(markup.includes('gr-arena'));
act('key',1,0,'8');assert.equal(data.teams[1].draft,'8');
act('key',0,0,'3');act('submit');assert.equal(data.teams[0].wrong,1);assert.equal(data.teams[1].draft,'8');
act('key',0,0,'4');act('submit');assert.equal(data.teams[0].index,0);
now=9999;[...jobs.values()].forEach(fn=>fn());assert(controls[0].inert);
now=10000;[...jobs.values()].forEach(fn=>fn());assert.equal(controls[0].inert,false);assert.equal(penalties[0].hidden,true);
act('key',0,0,'4');act('submit');assert.equal(data.teams[0].index,1);assert.equal(data.teams[1].draft,'8');
act('pause');now+=9000;assert.equal(data.status,'paused');api.unmount();api.mount(host,context);assert.equal(data.teams[1].draft,'8');
act('resume');act('key',0,1,'4');act('submit',0,1);assert.equal(data.status,'running');assert(lanes[0].outerHTML.includes('Sorular tamamlandı'));assert(!lanes[0].outerHTML.includes('data-gr-answer'));
now++;host.oninput({target:{matches:()=>true,dataset:{grInput:'1'},value:'4'}});act('submit',1,0);act('key',1,1,'4');act('submit',1,1);
assert.equal(data.winner,0);assert(markup.includes('KAZANAN TAKIM'));
// Çoktan seçmeli, kesirli/metinli cevaplar ve iki ayrı dokunma yolu.
act('reset');
box.MatLevelGen.generate=()=>({kind:'mc',prompt:'Kesri seç',answer:'-3/4',choices:['1/4','-3/4','3/4','-1/4']});
data=R.create({topicId:'sum',level:1,count:1,teams});api.unmount();api.mount(host,context);act('resume');
const choice=(side,index)=>({dataset:{gr:'choice',side:String(side),index:'0',choice:String(index)}});
host.onpointerdown({button:0,preventDefault(){},target:{closest:()=>choice(0,0)}});
assert.equal(data.teams[0].wrong,1);
host.onpointerdown({button:0,preventDefault(){},target:{closest:()=>choice(1,1)}});
assert.equal(data.winner,null);assert.equal(data.teams[0].index,0);assert.equal(data.teams[1].index,1);
now+=10000;host.onpointerdown({button:0,preventDefault(){},target:{closest:()=>choice(0,1)}});assert.equal(data.winner,1);assert(markup.includes('gr-result'));
// Ayardan Farklı sorular ile başlat; her cevap yalnız kendi grubunun sorusuna göre kontrol edilir.
act('reset');
box.MatLevelGen={templates:()=>1,generate:(topic,level,rng)=>{rng();const n=2+Math.floor(rng()*9);return {kind:'num',templateId:'sum:0',prompt:`${n} + 2 = ?`,answer:n+2,scene:{html:`<b>${n}</b> + <b>2</b>`}};}};
const elements=Object.fromEntries(Object.entries({topicId:'sum',level:'1',count:'2',questionMode:'different',name0:'Mavi',name1:'Mercan',group0:'',group1:''}).map(([k,v])=>[k,{value:v}]));
host.onsubmit({preventDefault(){},target:{matches:s=>s==='[data-gr-setup]',reportValidity:()=>true,elements}});
assert(data,markup.match(/gr-error[^>]*>(.*?)<\/p>/)?.[1]||'Yarış hazırlanamadı');
assert.equal(data.questionMode,'different');
const uiFactory={generate:r=>box.MatLevelGen.generate('sum',1,r),templateCount:1,makeRng:MatGames.makeRng};
const pair=R.questionPair(data,0,uiFactory);assert.notEqual(pair[0].answer,pair[1].answer);
const input=(side,value)=>host.oninput({target:{matches:()=>true,dataset:{grInput:String(side)},value:String(value)}});
act('resume');input(0,pair[1].answer);act('submit');assert.equal(data.teams[0].wrong,1);assert.equal(data.teams[0].index,0);
input(1,pair[1].answer);act('submit',1);assert.equal(data.teams[1].index,1);
api.unmount();data=JSON.parse(JSON.stringify(data));api.mount(host,context);assert(markup.includes(pair[0].prompt));assert.equal(data.questionMode,'different');
act('resume');now+=10000;input(0,pair[0].answer);act('submit');assert.equal(data.teams[0].index,1);
const lastPair=R.questionPair(data,1,uiFactory);
input(1,lastPair[1].answer);act('submit',1,1);assert.equal(data.winner,null);assert.equal(data.teams[0].index,1);
now++;input(0,lastPair[0].answer);act('submit',0,1);assert.equal(data.winner,1);assert(markup.includes('gr-result'));
const completedDifferentRace=data;
// İki fiziksel temas örtüşür: ilk parmak kalkmadan ikincisinin rakamı ve cevabı alınır.
const captured=new Set();let prevented=0;
host.setPointerCapture=id=>captured.add(id);
host.hasPointerCapture=id=>captured.has(id);
host.releasePointerCapture=id=>captured.delete(id);
const control=(gr,side,index,key='',choice=0)=>({disabled:false,dataset:{gr,side:String(side),index:String(index),key,choice:String(choice)}});
const down=(id,b,primary=false,type='touch',button=0)=>host.onpointerdown({pointerId:id,pointerType:type,isPrimary:primary,button,preventDefault(){prevented++;},target:{closest:()=>b}});
const up=id=>host.onpointerup({pointerId:id});
const click=(b,extra={})=>host.onclick({detail:0,preventDefault(){},target:{closest:()=>b},...extra});
for(const questionMode of ['same','different']){
  api.unmount();data=R.create({topicId:'sum',level:1,count:3,teams,questionMode},MatGames.makeRng(771));api.mount(host,context);act('resume');
  down(11,control('key',0,0,'1'),true);
  down(22,control('key',1,0,'2'),false); // isPrimary=false: ikinci temas elenmemeli.
  assert.deepEqual(data.teams.map(t=>t.draft),['1','2']);assert.deepEqual([...captured],[11,22]);
  down(11,control('key',0,0,'9'),true);assert.equal(data.teams[0].draft,'1'); // Aynı temas ikinci kez yazmaz.
  up(11);down(11,control('key',0,0,'3'),true);assert.deepEqual(data.teams.map(t=>t.draft),['13','2']);
  host.onpointercancel({pointerId:22});assert(!captured.has(22));assert(captured.has(11));
  down(22,control('key',1,0,'4'),false);assert.deepEqual(data.teams.map(t=>t.draft),['13','24']);
  up(11);up(22);assert.equal(captured.size,0);
  const firstPair=R.questionPair(data,0,uiFactory);input(0,firstPair[0].answer);input(1,firstPair[1].answer);
  const paintsBefore=rootPaints;lanes[1].outerHTML='other-pane-intact';
  down(31,control('submit',0,0),true);assert.equal(data.teams[0].index,1);assert.equal(lanes[1].outerHTML,'other-pane-intact');
  down(32,control('submit',1,0),false);assert.deepEqual(data.teams.map(t=>t.index),[1,1]);assert.equal(rootPaints,paintsBefore);
  assert(captured.has(31)&&captured.has(32));up(31);up(32);
  // Touch/pen/mouse kaynaklı click, detail=0 olsa da pointerdown'un üstüne eklenmez.
  click(control('key',0,1,'7'),{pointerType:'touch',pointerId:31});assert.equal(data.teams[0].draft,'');
  click(control('key',1,1,'8'),{sourceCapabilities:{firesTouchEvents:true}});assert.equal(data.teams[1].draft,'');
  click(control('key',0,1,'7'));assert.equal(data.teams[0].draft,'7'); // Klavye/erişilebilirlik çalışır.
  down(1,control('key',1,1,'9'),true,'mouse');up(1);
  click(control('key',1,1,'9'),{detail:1,pointerType:'mouse'});assert.equal(data.teams[1].draft,'9');
  down(1,control('key',1,1,'8'),true,'mouse',2);assert.equal(data.teams[1].draft,'9');
  down(77,control('key',1,1,'3'),false);assert(captured.has(77));api.unmount();assert.equal(captured.size,0);
  api.mount(host,context);act('resume');down(77,control('key',1,1,'4'),false);assert.equal(data.teams[1].draft,'934');
  captured.delete(77);host.onlostpointercapture({pointerId:77});down(77,control('key',1,1,'5'),false);assert.equal(data.teams[1].draft,'9345');
  up(77);api.unmount();
}
// Seçeneklerde de birinci temas ceza alırken ikinci kişi sorusunu aynı anda çözebilir.
box.MatLevelGen={generate:()=>({kind:'mc',prompt:'Kesri seç',answer:'-3/4',choices:['1/4','-3/4','3/4','-1/4']})};
data=R.create({topicId:'sum',level:1,count:3,teams});api.mount(host,context);act('resume');
down(101,control('choice',0,0,'',0),true);down(102,control('choice',1,0,'',1),false);
assert.equal(data.teams[0].wrong,1);assert.deepEqual(data.teams.map(t=>t.index),[0,1]);assert.equal(captured.size,2);
up(101);down(103,control('choice',0,0,'',1),true);assert.equal(data.teams[0].index,0); // Ceza diğer tarafı kilitlemez.
up(102);down(104,control('choice',1,1,'',1),false);assert.deepEqual(data.teams.map(t=>t.index),[0,2]);
api.unmount();assert.equal(captured.size,0);assert(prevented>0);
// Süre dolduğunda, cevap verilmeden/ceza sürerken de sonuç görünmeli ve kalıcı olmalı.
const tickClock=()=>[...jobs.values()].forEach(fn=>fn());
const mountTimed=(count=3,minutes=1)=>{api.unmount();now=0;data=R.create({topicId:'sum',level:1,count,minutes,teams});api.mount(host,context);act('resume');};
// Her iki takım sıfır doğruyla bütün soruları geçerse, son cezanın ardından sonuç görünür.
for(const offset of [0,1000]){
  mountTimed(1,0);
  const attempts=[0,1].flatMap(side=>[0,10000,25000].map(at=>({at:at+side*offset,side}))).sort((a,b)=>a.at-b.at);
  for(const attempt of attempts){now=attempt.at;act('choice',attempt.side);}
  assert.equal(data.status,'running');assert.deepEqual(data.teams.map(t=>t.index),[1,1]);
  assert(lanes.every(lane=>!lane.outerHTML.includes('data-gr="choice"')));
  now=45000+offset-1;tickClock();assert.equal(data.status,'running');
  now++;tickClock();assert.equal(data.status,'finished');assert.equal(data.winner,offset?0:null);
  assert(markup.includes('gr-result'));assert(markup.includes('İki takım da doğru cevap veremedi.'));assert.equal(jobs.size,0);
}
// Bitiren takım beklerken kaydedilip yeniden açılsa da bitirme süresi korunur.
mountTimed(1,0);now=1234;act('choice',1,0,'1');assert.equal(data.teams[1].finishedAt,1234);
api.unmount();data=JSON.parse(JSON.stringify(data));now=100000;api.mount(host,context);assert(markup.includes('Sorular tamamlandı'));
act('resume');now++;act('choice',0,0,'1');assert.equal(data.winner,1);assert(markup.includes('0:01,234'));
for(const brokenAudio of [true,false])for(const scores of [[0,0],[2,1],[1,2],[1,1]]){
  box.MatAudio.fanfare=()=>{if(brokenAudio)throw Error('Ses aygıtı kullanılamıyor');};
  mountTimed();
  for(let side=0;side<2;side++)for(let i=0;i<scores[side];i++)R.answer(data,side,i,true,1000+side*1000+i*100);
  if(!scores.some(Boolean)){now=59000;act('choice',0,0);assert(R.remaining(data,0,now)>0);}
  now=60000;assert.doesNotThrow(tickClock,'Ses hatası sonuç ekranını engellememeli');
  assert.equal(data.status,'finished');assert.equal(data.endReason,'time');assert.equal(jobs.size,0);
  assert.equal(data.winner,scores[0]===scores[1]?null:scores[0]>scores[1]?0:1);
  assert(markup.includes('gr-result'));assert(markup.includes('SÜRE DOLDU'));assert(!markup.includes('gr-arena'));
  if(!scores.some(Boolean)){assert(markup.includes('Berabere'));assert(markup.includes('İki takım da doğru cevap veremedi.'));}
  api.unmount();data=JSON.parse(JSON.stringify(data));api.mount(host,context);
  assert(markup.includes('gr-result'));assert.equal(jobs.size,0);act('resume');assert.equal(data.status,'finished');
}
box.MatAudio.fanfare=()=>{};
// Sayaç henüz yenilenmeden son anda duraklatma/ayrılma sonucu saklamalı.
mountTimed();now=60000;act('pause');assert.equal(data.status,'finished');assert(markup.includes('gr-result'));
mountTimed();now=60000;api.unmount();assert.equal(data.status,'finished');api.mount(host,context);assert(markup.includes('gr-result'));
mountTimed();now=60000;box.document.hidden=true;documentEvents.visibilitychange();assert.equal(data.status,'finished');assert(markup.includes('gr-result'));box.document.hidden=false;
mountTimed();now=60000;windowEvents.pagehide();assert.equal(data.status,'finished');api.unmount();api.mount(host,context);assert(markup.includes('gr-result'));
// Eski sürümde süresi dolmuş halde duraklatılan yarış, açılır açılmaz sonuçlanır.
api.unmount();data=R.create({topicId:'sum',level:1,count:3,minutes:1,teams});data.status='paused';data.elapsedMs=60000;
api.mount(host,context);assert.equal(data.status,'finished');assert(markup.includes('Berabere'));
// Tam süre sınırında gelen cevap skoru değiştiremez; sonucun çizilmesi yeni soru üretmez.
mountTimed();now=60000;box.MatLevelGen.generate=()=>{throw Error('Sonuç için soru üretilmemeli');};
assert.doesNotThrow(()=>act('submit'));assert.equal(data.status,'finished');assert.equal(data.teams[0].correct,0);assert(markup.includes('gr-result'));
api.unmount();data=completedDifferentRace;
// Uygulamanın sınıf kaydı yarış ilerlemesini ve tohumları ayrı ayrı saklar.
const base=fs.readFileSync(path.join(__dirname,'verify.cjs'),'utf8');
const hs=base.slice(base.indexOf('function harness('),base.indexOf('function addStudent('));
const harness=vm.runInNewContext(hs+'\nharness',{assert,vm,fs,path,root,console});
const storage=new Map(),app=harness(storage,{gen:true,grade7:true});
app.state.classId='race7';app.state.grade=7;app.state.students=[{id:'one',name:'Örnek',score:0,stars:{}}];
app.state.groupRace=data;app.persist();
const reopened=harness(storage,{gen:true,grade7:true});
assert.equal(reopened.state.groupRace.winner,1);assert.equal(reopened.state.groupRace.questionMode,'different');assert.deepEqual([...reopened.state.groupRace.seeds],data.seeds);
assert.deepEqual(Array.from(reopened.state.groupRace.teams,t=>t.finishedAt),data.teams.map(t=>t.finishedAt));
reopened.onClick({target:{closest:()=>({dataset:{act:'goto-group-race'}})}});
assert.equal(reopened.state.screen,'group-race');assert.equal(reopened.state.phase,'pick');
console.log(`OK: sabit soru sayısı, sıfır doğru, doğru/bitirme süresi sıralaması, süre sonu, ceza/duraklatma/yeniden açılış, ses hatasında sonuç; iki bağımsız dokunmatik şerit; ${samples} aynı soru ve ${pairs} farklı sayılı soru çifti.`);
