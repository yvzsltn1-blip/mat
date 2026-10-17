const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = ['tournament-rules','tournament'].map(n=>fs.readFileSync('assets/'+n+'.js','utf8'));
// Shared like a browser's localStorage, so a later harness sees what an earlier one remembered.
const store=new Map(),localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
function harness(count=13) {
  let now=0,data=null,awarded=0,serial=0,markup='';
  const timers=new Map(),inputs={},messages={textContent:''},bodyClasses=new Set();
  const players=Array.from({length:count},(_,i)=>({id:String(i+1),name:'Student '+(i+1)}));
  const host={isConnected:true,querySelectorAll:()=>[],querySelector:s=>s.includes('data-answer')?inputs[s.match(/"(\d+)"/)[1]]:messages};
  Object.defineProperty(host,'innerHTML',{get:()=>markup,set:html=>{
    markup=html;Object.keys(inputs).forEach(k=>delete inputs[k]);
    for(const m of html.matchAll(/<input[^>]*data-answer="(\d+)"[^>]*value="([^"]*)"[^>]*>/g)) inputs[m[1]]={value:m[2],focus(){}};
  }});
  const sandbox={window:null,localStorage,document:{addEventListener(){},body:{classList:{toggle:(key,on)=>on?bodyClasses.add(key):bodyClasses.delete(key),remove:key=>bodyClasses.delete(key)}}},performance:{now:()=>now},Date,Math,confirm:()=>true,
    setInterval:f=>{timers.set(++serial,f);return serial;},clearInterval:i=>timers.delete(i),
    MatAudio:{correct(){},wrong(){},fanfare(){}},MatVisuals:{angleMarks:s=>s},MatGames:{shuffle:(_,a)=>[...a].reverse()},
    MatLevelGen:{generate:(topic,level)=>({kind:'num',prompt:'2 + 2?',answer:4,level,unit:'°'})}};
  sandbox.window=sandbox;vm.createContext(sandbox);code.forEach(s=>vm.runInContext(s,sandbox));
  const context={get:()=>data,save:t=>{data=t;},students:()=>players,topics:()=>[{id:'sum',no:'01',title:'Sum'},{id:'diff',no:'02',title:'Diff'},{id:'prod',no:'03',title:'Prod'}],practice:()=>false,award:()=>awarded++};
  const api=sandbox.MatTournament,R=sandbox.MatTournamentRules;
  const control=(selector,dataset)=>host.onclick({target:{closest:s=>s===selector?{dataset}:null}});
  const click=t=>control('[data-t]',{t});
  const fields=config=>{
    const elements={topicFrom:{value:'sum'},topicTo:{value:'sum'}};
    for(const [key,c] of Object.entries(config)) {
      elements['level_'+key]={value:String(c.level)};elements['seconds_'+key]={value:String(c.seconds)};
      elements['format_'+key]={value:c.format};elements['eye_'+key]={checked:!!c.eye};
    }
    return elements;
  };
  const formSubmit=(selector,elements)=>host.onsubmit({preventDefault(){},target:{matches:s=>s===selector,reportValidity:()=>true,elements}});
  const start=(changes={})=>{api.mount(host,context);const config=R.defaults(count);for(const [key,c] of Object.entries(changes))config[key]={...config[key],...c};formSubmit('[data-setup]',fields(config));};
  const submit=(side,value='4')=>{if(inputs[side])inputs[side].value=value;host.onsubmit({preventDefault(){},target:{matches:s=>s==='[data-side]',dataset:{side:String(side)}}});};
  const draw=()=>{for(let i=0;i<14;i++)[...timers.values()].forEach(f=>f());};
  return {get data(){return data;},get awarded(){return awarded;},host,inputs,R,api,context,start,click,submit,control,draw,fields,formSubmit,bodyClasses,
    advance:ms=>now+=ms,tick:()=>[...timers.values()].forEach(f=>f()),remount:()=>{api.unmount();api.mount(host,context);}};
}
const base=harness(),R=base.R;
for(let n=2;n<=120;n++){
  const cut=R.bracketSize(n);assert(cut<=n && cut*2>n);assert.equal(Math.log2(cut)%1,0);
  assert.equal(R.phases(n).includes('qualify'),n!==cut);
}
for(const n of [2,4,8,16,32,64]) {
  const h=harness(n);h.start();assert.equal(h.data.mode,'duel');assert.equal(h.data.results.length,0);
  assert.equal(h.data.rounds[0].length,n/2);h.draw();assert.equal(h.data.stage,'ready');
}
function matchResult(sequence){const m=R.createMatch(['a','b']);sequence.forEach(side=>R.recordQuestion(m,side));return m;}
assert.equal(matchResult([0,0]).winner,'a');
assert.equal(matchResult([null,null,1]).winner,'b');
assert.equal(matchResult([0,null,null]).winner,'a');
assert.equal(matchResult([null,null,null]).overtime,true);
assert.equal(matchResult([0,1,null]).overtime,true);
assert.equal(matchResult([0,1,null,null,1]).winner,'b');
assert.equal(matchResult([null,null,null,null,0]).winner,'a');
// Topic range: questions come only from the chosen topics; the elimination stays on one topic.
{const r=harness(13);r.api.mount(r.host,r.context);const els=r.fields(R.defaults(13));els.topicFrom.value='diff';els.topicTo.value='prod';r.formSubmit('[data-setup]',els);
  assert.deepEqual([...r.data.topics],['diff','prod']);assert.equal(r.data.topicName,'Konular 02–03 · 2 konu');
  const seen=new Set();for(let i=0;i<13;i++){r.click('question');seen.add(r.data.q.topic);r.submit(0);if(r.data.stage==='result')r.click('next');}
  assert.equal(r.data.results.length,13);assert.equal(seen.size,1);assert(['diff','prod'].includes([...seen][0]));}
const h=harness(13);
h.start({qualify:{seconds:7,level:2},8:{seconds:19,level:4},2:{seconds:55,level:5}});
assert.equal(h.data.cut,8);assert.equal(h.data.mode,'qualify');
h.click('question');assert.equal(h.data.q.kind,'mc');assert.equal(h.data.q.choices.length,4);
assert(h.bodyClasses.has('tournament-question'));
assert(h.host.innerHTML.includes('tr-question-main'));assert(h.host.innerHTML.includes('tr-single-question'));
assert(!h.host.innerHTML.includes('<select'));assert(h.host.innerHTML.includes('tr-choices'));
// Selecting an option is distinct from submitting it.
h.control('[data-choice]',{choice:String(h.data.q.choices.indexOf('4')),side:'0'});
assert.equal(h.data.drafts[0],'4');assert.equal(h.data.stage,'question');
h.advance(1234);h.submit(0);assert.equal(h.data.results[0].ms,1230);
for(let i=1;i<13;i++){h.click('question');h.advance(1000+i*10);h.submit(0);}
assert.equal(h.data.stage,'ranking');h.click('draw');h.draw();
assert.equal(h.data.rounds[0].length,4);assert(!h.host.innerHTML.includes('class="tr-bracket"'));
h.click('question');assert.equal(h.data.q.kind,'num');assert.equal(h.data.q.level,4);
assert(h.host.innerHTML.includes('tr-duel-question'));
assert(h.host.innerHTML.includes('data-key="Sil"'));assert(h.host.innerHTML.includes('Cevabı kontrol et'));
// Typed answer, exact time and answer rights survive a tree visit and remount.
h.inputs[0].value='12';h.advance(2345);h.click('tree');
assert.equal(h.data.stage,'paused');assert.equal(h.data.elapsed,2345);assert.equal(h.data.drafts[0],'12');
assert(!h.bodyClasses.has('tournament-question'));
assert(h.host.innerHTML.includes('class="tr-board tr-tree"'));assert(!h.host.innerHTML.includes('tr-number-display'));
h.remount();h.click('tree');assert.equal(h.data.stage,'paused');h.click('resume');assert.equal(h.inputs[0].value,'12');
assert(h.bodyClasses.has('tournament-question'));
h.control('[data-key]',{key:'Sil',side:'0'});assert.equal(h.inputs[0].value,'');
h.control('[data-key]',{key:'4',side:'0'});assert.equal(h.inputs[0].value,'4');
h.advance(100);h.submit(0);
let safety=0;
while(h.data.stage!=='champion' && safety++<30){h.click('question');h.advance(500);h.submit(0);}
assert.equal(h.data.stage,'champion');assert.equal(h.awarded,1);assert.equal(h.data.rounds.length,3);
assert(!h.bodyClasses.has('tournament-question'));
assert.equal(h.data.q.level,5);h.remount();assert.equal(h.awarded,1);
// A late submit is a timeout even before the interval gets CPU time.
const late=harness(3);late.start({qualify:{seconds:5,format:'number'}});late.click('question');late.advance(5001);late.submit(0);
assert.equal(late.data.results[0].ok,false);assert.equal(late.data.results[0].ms,5000);
// Each timeout uses the current phase duration, not qualification's duration.
const extra=harness(2);extra.start({2:{seconds:9,level:3}});extra.draw();
for(let i=0;i<3;i++){extra.click('question');extra.advance(9001);extra.tick();}
assert.equal(extra.data.rounds[0][0].questions,3);assert.equal(extra.data.rounds[0][0].overtime,true);
extra.click('question');extra.advance(3600000);extra.tick();assert.equal(extra.data.stage,'question');
assert(extra.host.innerHTML.includes('∞ Süresiz'));
extra.submit(0,'5');extra.remount();extra.click('resume');assert(extra.data.answers[0]);extra.submit(1,'6');
assert.equal(extra.data.rounds[0][0].questions,4);assert.equal(extra.data.stage,'result');
extra.click('question');extra.submit(1);assert.equal(extra.data.stage,'champion');assert.equal(extra.awarded,1);
// Teacher changes apply to the next question and persist.
const edit=harness(4);edit.start();edit.draw();edit.click('settings');
const changed=JSON.parse(JSON.stringify(edit.data.settings));changed[4]={level:2,seconds:17,format:'number'};
edit.formSubmit('[data-settings]',edit.fields(changed));edit.remount();edit.click('question');
assert.equal(edit.data.q.level,2);edit.advance(17001);edit.tick();assert.equal(edit.data.stage,'result');
// Duel phases default to keypad entry, but the teacher can switch a phase to four choices.
{const mc=harness(2);assert.equal(R.defaults(2)[2].format,'number');mc.start({2:{format:'choice'}});mc.draw();mc.click('question');
  assert.equal(mc.data.settings[2].format,'choice');assert.equal(mc.data.q.kind,'mc');assert(mc.host.innerHTML.includes('tr-choices'));}
// Both students answer at once: keys, choices and confirm act on pointerdown, side by side.
{const p=harness(2);p.start();p.draw();p.click('question');
  const ctl=(sel,dataset)=>({dataset,disabled:false,matches:s=>s===sel,closest:s=>s==='[data-side]'?{dataset:{side:dataset.side}}:null});
  const down=(sel,dataset)=>p.host.onpointerdown({button:0,preventDefault(){},target:{closest:s=>s.includes(sel)?ctl(sel,dataset):null}});
  down('[data-key]',{key:'4',side:'0'});down('[data-key]',{key:'5',side:'1'});
  assert.equal(p.inputs[0].value,'4');assert.equal(p.inputs[1].value,'5');
  down('.tr-confirm',{side:'1'});assert.equal(p.data.answers[1].ok,false);assert.equal(p.data.stage,'question');
  down('[data-key]',{key:'9',side:'1'});assert.equal(p.data.drafts[1],'5');
  down('.tr-confirm',{side:'0'});assert.equal(p.data.stage,'result');}
// Göz kararı elimination: one kind for everybody; closest estimate first, equal distance goes to the faster.
{const e=harness(3);e.start({qualify:{eye:true,seconds:20}});const kinds=new Set();
  const offsets=[[5,500],[2,1000],[-2,3000]];
  for(const [off,wait] of offsets){e.click('question');kinds.add(e.data.q.eye);assert.equal(e.data.q.unit,'°');
    e.advance(wait);e.submit(0,String(e.data.q.answer+off));if(e.data.stage==='result')e.click('next');}
  assert.equal(kinds.size,1);assert(R.EYE_KINDS.includes([...kinds][0]));assert.equal(e.data.stage,'ranking');
  const [slow,near,tied]=e.data.results;assert.equal(slow.err,5);assert.equal(near.err,2);assert.equal(tied.err,2);
  e.click('draw');e.draw();assert.deepEqual([...e.data.rounds[0][0].ids].sort(),[near.id,tied.id].sort());
  const sorted=[...e.data.results].sort((a,b)=>Number(b.ok)-Number(a.ok)||(a.err??0)-(b.err??0)||a.ms-b.ms);assert.equal(sorted[0].id,near.id);}
// Göz kararı duel: the question waits for both estimates; closer wins, equal distance goes to the faster.
{const d=harness(2);d.start({2:{eye:true,seconds:30}});d.draw();
  d.click('question');assert(R.EYE_KINDS.includes(d.data.q.eye));let a=d.data.q.answer;
  d.advance(400);d.submit(0,String(a+3));assert.equal(d.data.stage,'question');assert(d.host.innerHTML.includes('Tahminin alındı'));
  d.advance(400);d.submit(1,String(a-1));assert.equal(d.data.stage,'result');assert.deepEqual([...d.data.rounds[0][0].scores],[0,1]);
  d.click('question');a=d.data.q.answer;d.advance(500);d.submit(0,String(a+2));d.advance(400);d.submit(1,String(a-2));
  assert.deepEqual([...d.data.rounds[0][0].scores],[1,1]);
  d.click('question');a=d.data.q.answer;d.advance(500);d.submit(1,String(a));d.advance(30000);d.tick();
  assert.equal(d.data.stage,'champion');assert.equal(d.data.champion,d.data.rounds[0][0].ids[1]);}
// The teacher's last setup is remembered: a new tournament opens with the same values.
{const m=harness(2);m.start({2:{seconds:75,eye:true}});const next=harness(2);next.api.mount(next.host,next.context);
  assert(next.host.innerHTML.includes('name="seconds_2" type="number" value="75"'));assert(next.host.innerHTML.includes('name="eye_2" checked'));}
// The tree shows one round per screen and steps to the next round with a button.
{const b=harness(8);b.start();b.draw();b.click('tree');const html=()=>b.host.innerHTML;
  assert(html().includes('<h2>Çeyrek final</h2>'));assert.equal(html().split('class="tr-m ').length-1,4);assert(html().includes('SIRADAKİ MAÇ'));
  assert(html().includes('data-r="1">Sonraki tur ›'));b.control('[data-t]',{t:'tree-round',r:'1'});
  assert(html().includes('<h2>Yarı final</h2>'));assert.equal(html().split('class="tr-m ').length-1,2);
  b.click('tree');b.click('tree');assert(html().includes('<h2>Çeyrek final</h2>'));}
// Saved v1 tournaments retain their bracket/scores, replacing an incompatible active question.
const legacy=harness(16);legacy.start();legacy.draw();legacy.data.rounds[0][0].scores[0]=1;
legacy.click('question');delete legacy.data.settings;legacy.data.seconds=23;
legacy.api.mount(legacy.host,legacy.context);
assert.equal(legacy.data.stage,'ready');assert.equal(legacy.data.rounds[0].length,8);
assert.equal(legacy.data.rounds[0][0].scores[0],1);assert.equal(legacy.data.settings[16].seconds,23);
console.log('Tournament v2: sizes 2–120, 13→8 elimination, direct 16/32, per-phase settings, choice/keypad entry, 3-question results, unlimited overtime, tree pause/resume and single championship award passed.');
