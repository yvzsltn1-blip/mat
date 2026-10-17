// node tests/grade7.cjs — içerik bütünlüğü ve gerçek uygulama akışları.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const modules = ['scoreboard.js','curriculum.js','lesson-stories.js','curriculum7.js','games.js','question-bank.js','arcade-gen.js','level-gen.js','questions7.js'];
for (const file of [...modules, 'labs7.js']) require(path.join(root,'assets',file));
assert.equal(MatCurriculum.forGrade(5).topics.length,20);
assert.equal(MatCurriculum.forGrade(7).topics.length,22);
assert.equal(MatCurriculum.forGrade(7).worlds.length,4);
assert.equal(MatCurriculum.forGrade(6),MatCurriculum.forGrade(5));
const ids=new Set();let count=0;
function validate(q) {
  assert(q.prompt&&q.explain&&q.hint&&q.outcome&&q.scene.html);
  assert(!/undefined|NaN|Infinity/.test(JSON.stringify(q)),q.id);
  assert.equal(q.points,MatGames.LEVELS[q.level-1].points);
  if(q.kind==='mc'){
    assert.equal(q.choices.length,4,q.id);
    assert.equal(new Set(q.choices).size,4,q.id);
    assert(q.choices.includes(q.answer),q.id);
  } else {
    assert.equal(q.kind,'num');
    assert(Number.isSafeInteger(q.answer)&&q.answer>=0,q.id);
  }
}
for(const topic of MatCurricula[7].topics){
  const prompts=new Set();
  assert(topic.slides.length>=5);
  assert(topic.slides.every(s=>s.h&&s.p&&(s.scene||s.sandbox)));
  assert(topic.slides.some(s=>s.check));
  for(let level=1;level<=5;level++){
    const bank=MatQuestionBank.get(topic.id,level);
    assert.equal(bank.length,15);
    for(const q of bank){validate(q);assert(!ids.has(q.id));assert(!prompts.has(q.prompt),q.id);ids.add(q.id);prompts.add(q.prompt);count++;}
    const copy=MatQuestionBank.get(topic.id,level);copy[0].prompt='mutation';assert.notEqual(MatQuestionBank.get(topic.id,level)[0].prompt,'mutation');
    const used=bank.slice(0,14).map(q=>q.id);
    assert.equal(MatGames.buildQuiz(topic.id,level,123,used,1)[0].id,bank[14].id);
    const rng=MatGames.makeRng(level*71);
    for(let i=0;i<60;i++)validate(MatLevelGen.generate(topic.id,level,rng));
  }
  // Usta, Efsane, Prestij yalnız üreticide vardır.
  for(let level=6;level<=8;level++){const rng=MatGames.makeRng(level*71);for(let i=0;i<80;i++)validate(MatLevelGen.generate(topic.id,level,rng));assert.throws(()=>MatQuestionBank.get(topic.id,level));}
  for(let d=1;d<=3;d++)for(const numeric of [false,true]){
    const q=MatArcadeGen.generate(topic.id,MatGames.makeRng(71+d),d,numeric);
    assert(q.svg&&q.choices.includes(String(q.answer)));
    assert.equal(q.choices.length,4);
  }
}
assert.equal(count,1650);
const get=(slug,level,index)=>MatQuestionBank.get('m7-'+slug,level)[index];
// Bağımsız hesaplanmış örnekler: işaret, devir, üs, hacim, OMS ve inşa.
assert.equal(get('tamsayilar',1,0).answer,'-5');
assert.equal(get('rasyonel',1,0).answer,'-5/6');
assert.equal(get('temsiller',4,0).answer,'751/11'); // 68 + 3/11
assert.equal(get('temsiller',4,1).answer,'6251/90'); // 69 + 41/90
assert.equal(get('rasyonelislemler',4,0).answer,'65/2');
assert.equal(get('cokadimli',4,0).answer,16); // 2² - [68-72]×3
assert.equal(get('acinim',1,0).answer,48); // 5×2×2
assert.equal(get('acinim',4,1).answer,47610); // Ayrıtı 69 olan iki birleşik küp.
assert.equal(get('hacim',1,0).answer,20);
assert.equal(get('birimler',1,0).answer,5000);
assert.equal(get('yorumlama',1,4).answer,'4'); // 9,15,21: OMS 4
assert.equal(get('insa',1,3).answer,9);
const stats=Mat7Labs.statistics('2; 4; 4; 10');
assert.deepEqual([stats.mean,stats.median,stats.range,stats.mad],[5,4,8,2.5]);
assert.deepEqual(stats.modes,[4]);
assert.equal(Mat7Labs.statistics('1,5; 2,5').mean,2);
assert.equal(Mat7Labs.statistics('2; ; 4'),null);
assert.equal(Mat7Labs.statistics('<script>'),null);

// Mevcut zamanlayıcılı uygulama test donanımını aynı dosyadan yeniden kullan.
// Yeni müfredat modüllerini yükle; gerçek app.js üzerinde sınıf ve tur akışını sınar.
const base=fs.readFileSync(path.join(__dirname,'verify.cjs'),'utf8');
let harnessSource=base.slice(base.indexOf('function harness('),base.indexOf('function addStudent('));
harnessSource=harnessSource.replace(/for \(const file of \[.*?\]\) vm\.runInContext/,`for (const file of ${JSON.stringify(modules)}) vm.runInContext`);
harnessSource=harnessSource.replace('applyLessonAngle, render };','applyLessonAngle, render, curriculum, renderBoard, openFromHash };');
const harness=vm.runInNewContext(harnessSource+'\nharness',{assert,vm,fs,path,root,console});
const h=harness(new Map(),{gen:true});
h.state.classId='c7';h.state.grade=7;h.state.roundLength=5;
h.state.students.push({id:'s7',name:'Öğrenci',score:0,stars:{},groupId:null});h.state.selectedId='s7';
assert.equal(h.curriculum().topics.length,22);
assert(h.renderBoard().includes('1.650')===false); // Varsayılan sınırsız mod.
h.state.questionSource='bank';
assert(h.renderBoard().includes('1.650'));
assert(!h.renderBoard().includes('bu sürümde 5. sınıf'));
let turns=0;
for(const source of ['bank','gen'])for(const topic of MatCurricula[7].topics)for(let level=1;level<=(source==='gen'?8:5);level++){
  h.state.questionSource=source;h.openTopic(topic.id,'play');h.beginLevel(level);
  for(let i=0;i<5;i++){
    h.advance(500);const q=h.currentQ();assert(q&&q.id.startsWith('m7-'));
    h.state.draft=String(q.answer);assert(h.isCorrect(q),q.id);h.submit();h.goNext();
  }
  assert.equal(h.state.phase,'finish');assert.equal(h.state.finishStars,3);turns++;
}
h.state.grade=5;assert.equal(h.curriculum().topics.length,20);assert(h.renderBoard().includes('Geometri Diyarı'));assert(!h.renderBoard().includes('Sayılar Uzayı'));
h.state.grade=7;h.ctx.location.hash='#oyun-m7-rasyonel-3';h.openFromHash();h.advance(500);assert.equal(h.state.topicId,'m7-rasyonel');assert.equal(h.currentQ().level,3);
h.cancelRound();h.ctx.location.hash='#konu-m7-yansima';h.openFromHash();assert.equal(h.state.topicId,'m7-yansima');assert.equal(h.state.topicTab,'lesson');
// Kapışmada kesir ve metin cevapları, yanlış cevap cezası ve çift tıklama.
let arcadeSource=fs.readFileSync(path.join(root,'assets/arcade.js'),'utf8');
arcadeSource=arcadeSource.replace('  root.MatArcade =', '  root.arcadeTest = { setup(s,c,e) { S=s;ctx=c;el=e;draw=()=>{}; }, racePanel, onClick };\n  root.MatArcade =');
vm.runInContext(arcadeSource,h.ctx);
const game={game:'race',players:[null,null],scores:[0,0],wins:[0,0],penalty:[0,0],tried:[false,false],drafts:['',''],result:null,
  item:{numeric:false,answer:'-3/4',choices:['1/4','-3/4','3/4','-1/4']}};
h.ctx.arcadeTest.setup(game,{sound:{correct(){},wrong(){}},burst(){}}, {querySelector(){return null;}});
assert(h.ctx.arcadeTest.racePanel(0).includes('data-g="race-choice"'));
const choose=(player,choice)=>h.ctx.arcadeTest.onClick({target:{closest:()=>({dataset:{g:'race-choice',player:String(player),choice:String(choice)},disabled:false})}});
choose(0,0);assert(game.penalty[0]>0);assert.equal(game.result,null);
choose(0,1);assert.equal(game.result,null); // Ceza sürerken doğru seçim sayılmaz.
choose(1,1);assert.equal(game.result.winner,1);assert.equal(game.scores[1],15);
choose(1,1);assert.equal(game.scores[1],15);
console.log(`OK: ${count} benzersiz banka sorusu, 6.600 üretilen soru, 22 konu, 8 laboratuvar yerleşimi, ${turns} tam tur, sınıf geçişleri ve derin bağlantılar.`);
