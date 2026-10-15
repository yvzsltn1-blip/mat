const assert=require('node:assert/strict');
for(const f of ['curriculum','curriculum7','labs7','compare7'])require('../assets/'+f+'.js');
const C=Mat7Compare;
const slides=MatCurricula[7].topics.find(t=>t.id==='m7-siralama').slides;
assert.equal(slides.length,11);
assert.equal(slides[0].bullets.length,7);
assert(!slides[0].sandbox);
assert(slides[0].readingTip.includes('sağa'));
assert.equal(slides[0].nextLabel,'Etkileşimli örneklere geç →');
assert(slides.slice(1,9).every(s=>s.sandbox.startsWith('m7-compare-')));
const expected={sign:'>',whole:'>',benchmark:'<',denominator:'<',numerator:'>',common:'<',decimal:'>',negative:'<'};
for(const [mode,relation] of Object.entries(expected)){
  assert.equal(C.model(mode).relation,relation,mode);
  assert(Mat7Labs.html('m7-compare-'+mode).includes('data-cmp-output'));
  for(let a=0;a<=12;a++)for(let b=1;b<=12;b++){
    const m=C.model(mode,{a,b,c:12-a,d:13-b,w:a%4,z:b%4});
    const sign=Math.sign(m.a*m.d-m.c*m.b);
    assert.equal(m.relation,sign>0?'>':sign<0?'<':'=');
    for(const method of ['numerator','denominator']){
      const html=C.render(mode,m,method);assert(!/NaN|Infinity|undefined/.test(html));assert(html.includes('Sayı doğrusu'));
    }
  }
}
assert.equal(C.model('common',{a:2,b:4,c:3,d:6}).relation,'=');
assert.equal(C.model('negative',{a:1,b:4,c:1,d:2}).relation,'>');
assert.equal(C.model('denominator',{a:0,c:0,b:8}).relation,'=');
assert.equal(C.decimal(1,6),'0,16666666…');
assert.equal(C.decimal(-3,4),'−0,75');
assert.equal(C.decimal(4,2),'2');
assert(C.render('common',C.model('common'),'numerator').includes('Payları 6 yap'));
assert(C.render('common',C.model('common'),'denominator').includes('Paydaları 12 yap'));
// Gerçek bağlama: kaydırıcı ve yöntem değişikliği ekranı yeniden hesaplar.
const listeners={},output={innerHTML:''},labels={};
const inputs=[['a',2],['b',3],['c',3],['d',4]].map(([key,n])=>({dataset:{cmp:key},value:String(n)}));
const method={value:'denominator'};
const host={dataset:{compare:'common'},addEventListener:(e,fn)=>listeners[e]=fn,querySelectorAll:()=>inputs,querySelector:s=>s==='[data-cmp-output]'?output:s==='[data-cmp-method]'?method:(labels[s]??={textContent:''})};
Mat7Labs.bind({querySelector:s=>s==='.cmp-lab'?host:null});
assert(output.innerHTML.includes('Paydaları 12 yap'));
method.value='numerator';listeners.change();assert(output.innerHTML.includes('Payları 6 yap'));
inputs[0].value='4';listeners.input();assert(output.innerHTML.includes('Payları 12 yap'));
assert.equal(labels['[data-cmp-label="a"]'].textContent,'4');
console.log('OK: 8 etkileşimli kural, 1.248 kesir çifti, eşitlik/negatif/ondalık durumları ve canlı kontrol olayları.');
