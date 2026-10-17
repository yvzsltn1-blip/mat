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
const race=create(3);assert.equal(R.answer(race,0,0,true,0),'ignored');R.resume(race,1000);
assert.equal(R.answer(race,0,0,false,1100),'wrong');assert.equal(race.teams[0].index,0);assert.equal(R.remaining(race,0,1100),10000);
assert.equal(R.answer(race,1,0,true,1200),'correct');assert.equal(race.teams[1].index,1);assert.equal(race.teams[0].index,0);
assert.equal(R.answer(race,0,0,true,11099),'ignored');assert.equal(R.answer(race,0,0,true,11100),'correct');
assert.equal(R.answer(race,0,0,true,11100),'ignored'); // Eski sorunun çift tıklaması yeni soruyu çözmez.
R.answer(race,0,1,false,11200);R.pause(race,13200);assert.equal(R.remaining(race,0,999999),8000);
const restored=JSON.parse(JSON.stringify(race));R.resume(restored,1000000);
assert.equal(R.remaining(restored,0,1007999),1);assert.equal(R.answer(restored,0,1,true,1007999),'ignored');
assert.equal(R.answer(restored,0,1,true,1008000),'correct');assert.equal(R.answer(restored,0,2,true,1008100),'won');
assert.equal(restored.winner,0);assert.equal(restored.status,'finished');assert.equal(R.answer(restored,1,1,true,1008100),'ignored');
assert.equal(R.resume(restored,1009000),false);
const single=create(1);R.resume(single,0);assert.equal(R.answer(single,1,0,true,1),'won');assert.equal(single.winner,1);
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
const box={window:null,MatGroupRaceRules:R,MatGames,MatFoundation,MatLevelGen:{generate:()=>({kind:'num',prompt:'2 + 2 = ?',answer:4})},
  document:{addEventListener(){},body:{classList:{toggle(){},remove(){}}}},Date:TestDate,Math,confirm:()=>true,
  MatAudio:{correct(){},wrong(){},fanfare(){}},setInterval:f=>{jobs.set(++serial,f);return serial;},clearInterval:id=>jobs.delete(id)};
box.window=box;vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(root,'assets/group-race.js'),'utf8'),box);
const api=box.MatGroupRace,context={get:()=>data,save:v=>data=v,groups:()=>[],topics:()=>[{id:'sum',title:'Toplama'}],levels:()=>MatGames.LEVELS};
api.mount(host,context);assert(markup.includes('data-gr-setup'));assert(markup.includes('value="same" selected'));assert(markup.includes('value="different"'));
data=R.create({topicId:'sum',level:1,count:2,teams});api.unmount();api.mount(host,context);
const act=(gr,side=0,index=0,key='')=>host.onclick({detail:0,preventDefault(){},target:{closest:()=>({dataset:{gr,side:String(side),index:String(index),key}})}});
act('resume');assert.equal(data.status,'running');assert(markup.includes('gr-arena'));
act('key',1,0,'8');assert.equal(data.teams[1].draft,'8');
act('key',0,0,'3');act('submit');assert.equal(data.teams[0].wrong,1);assert.equal(data.teams[1].draft,'8');
act('key',0,0,'4');act('submit');assert.equal(data.teams[0].index,0);
now=9999;[...jobs.values()].forEach(fn=>fn());assert(controls[0].inert);
now=10000;[...jobs.values()].forEach(fn=>fn());assert.equal(controls[0].inert,false);assert.equal(penalties[0].hidden,true);
act('key',0,0,'4');act('submit');assert.equal(data.teams[0].index,1);assert.equal(data.teams[1].draft,'8');
act('pause');now+=9000;assert.equal(data.status,'paused');api.unmount();api.mount(host,context);assert.equal(data.teams[1].draft,'8');
act('resume');act('key',0,1,'4');act('submit',0,1);assert.equal(data.winner,0);assert(markup.includes('KAZANAN TAKIM'));
// Çoktan seçmeli, kesirli/metinli cevaplar ve iki ayrı dokunma yolu.
act('reset');
box.MatLevelGen.generate=()=>({kind:'mc',prompt:'Kesri seç',answer:'-3/4',choices:['1/4','-3/4','3/4','-1/4']});
data=R.create({topicId:'sum',level:1,count:1,teams});api.unmount();api.mount(host,context);act('resume');
const choice=(side,index)=>({dataset:{gr:'choice',side:String(side),index:'0',choice:String(index)}});
host.onpointerdown({button:0,preventDefault(){},target:{closest:()=>choice(0,0)}});
assert.equal(data.teams[0].wrong,1);
host.onpointerdown({button:0,preventDefault(){},target:{closest:()=>choice(1,1)}});
assert.equal(data.winner,1);assert.equal(data.teams[0].index,0);
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
input(1,lastPair[1].answer);act('submit',1,1);assert.equal(data.winner,1);assert.equal(data.teams[0].index,1);
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
api.unmount();assert.equal(captured.size,0);assert(prevented>0);data=completedDifferentRace;
// Uygulamanın sınıf kaydı yarış ilerlemesini ve tohumları ayrı ayrı saklar.
const base=fs.readFileSync(path.join(__dirname,'verify.cjs'),'utf8');
const hs=base.slice(base.indexOf('function harness('),base.indexOf('function addStudent('));
const harness=vm.runInNewContext(hs+'\nharness',{assert,vm,fs,path,root,console});
const storage=new Map(),app=harness(storage,{gen:true,grade7:true});
app.state.classId='race7';app.state.grade=7;app.state.students=[{id:'one',name:'Örnek',score:0,stars:{}}];
app.state.groupRace=data;app.persist();
const reopened=harness(storage,{gen:true,grade7:true});
assert.equal(reopened.state.groupRace.winner,1);assert.equal(reopened.state.groupRace.questionMode,'different');assert.deepEqual([...reopened.state.groupRace.seeds],data.seeds);
reopened.onClick({target:{closest:()=>({dataset:{act:'goto-group-race'}})}});
assert.equal(reopened.state.screen,'group-race');assert.equal(reopened.state.phase,'pick');
console.log(`OK: örtüşen birincil/ikincil dokunmalar, iki bağımsız tuş takımı ve seçenekler, temas iptali, çift giriş koruması, klavye/fare, ceza/kalıcılık; ${samples} aynı soru ve ${pairs} farklı sayılı soru çifti.`);
