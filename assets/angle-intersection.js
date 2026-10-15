(function(root){
  const point=(angle,r)=>[200+r*Math.cos(angle*Math.PI/180),180-r*Math.sin(angle*Math.PI/180)];
  function drawing(base,gap){
    const sector=(start,end,color)=>{const a=point(start,62),b=point(end,62);return `<path d="M200 180 L${a[0]} ${a[1]} A62 62 0 0 0 ${b[0]} ${b[1]} Z" fill="${color}"/>`;};
    let html='';
    const starts=[base,base+gap,base+180,base+180+gap];
    const values=[gap,180-gap,gap,180-gap];
    starts.forEach((a,i)=>{html+=sector(a,a+values[i],i%2?'#ddd2f3':'#b9e5d7');const p=point(a+values[i]/2,91);html+=`<text x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="800" fill="${i%2?'#654293':'#14654d'}" paint-order="stroke" stroke="#fffdf8" stroke-width="4">${['A','B','C','D'][i]}: ${values[i]}°</text>`;});
    [base,base+gap].forEach((a,i)=>{const p=point(a,145),q=point(a+180,145);html+=`<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${i?'#df6148':'#3269ce'}" stroke-width="3"/><circle data-line="${i}" cx="${p[0]}" cy="${p[1]}" r="11" fill="white" stroke="${i?'#df6148':'#3269ce'}" stroke-width="4" style="cursor:grab"/>`;});
    return html+'<circle cx="200" cy="180" r="5" fill="#173f34"/>';
  }
  function html(){return `<div class="intersection-lab"><p class="fine">Uçlardaki halkaları sürükle veya kaydırıcıları oynat.</p><svg id="intersectionSvg" viewBox="0 0 400 360" role="img" aria-label="İki doğru ve eşit ters açı çiftleri"><g id="intersectionDrawing">${drawing(15,60)}</g></svg><div class="opposite-equalities" aria-live="off"><b id="oppositeAC">A = C = 60°</b><b id="oppositeBD">B = D = 120°</b></div><div class="intersection-controls"><label>Mavi doğruyu döndür <input id="intersectionBase" type="range" min="0" max="180" value="15"></label><label>Kırmızı doğruyu döndür <input id="intersectionGap" type="range" min="15" max="165" value="60"></label></div><div class="angle-presets">${[30,45,60,90,120].map(n=>`<button type="button" class="soft" data-cross="${n}">${n}°</button>`).join('')}</div><p class="fine">Yeşil A ve C ters açılardır; mor B ve D de ters açılardır. Her çiftin ölçüleri daima eşittir. Komşu iki açının toplamı 180°dir.</p></div>`;}
  function bind(){
    const svg=document.getElementById('intersectionSvg');if(!svg)return;
    const baseInput=document.getElementById('intersectionBase'),gapInput=document.getElementById('intersectionGap');
    let base=15,gap=60,drag=null;
    const clamp=n=>Math.max(15,Math.min(165,n));
    const mod=n=>(n%180+180)%180;
    function paint(){document.getElementById('intersectionDrawing').innerHTML=drawing(base,gap);baseInput.value=base;gapInput.value=gap;document.getElementById('oppositeAC').textContent=`A = C = ${gap}°`;document.getElementById('oppositeBD').textContent=`B = D = ${180-gap}°`;svg.setAttribute('aria-label',`Ters açılar: A ve C ${gap} derece; B ve D ${180-gap} derece.`);}
    baseInput.addEventListener('input',()=>{const red=base+gap;base=Number(baseInput.value);gap=clamp(mod(red-base));paint();});
    gapInput.addEventListener('input',()=>{gap=Number(gapInput.value);paint();});
    svg.closest('.intersection-lab').querySelectorAll('[data-cross]').forEach(button=>button.addEventListener('click',()=>{gap=Number(button.dataset.cross);paint();}));
    svg.addEventListener('pointerdown',e=>{const handle=e.target.closest('[data-line]');if(!handle)return;drag=Number(handle.dataset.line);svg.setPointerCapture(e.pointerId);e.preventDefault();});
    svg.addEventListener('pointermove',e=>{if(drag===null)return;const matrix=svg.getScreenCTM();if(!matrix)return;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const p=pt.matrixTransform(matrix.inverse());const angle=mod(Math.round(Math.atan2(180-p.y,p.x-200)*180/Math.PI));if(drag===1)gap=clamp(mod(angle-base));else{const red=base+gap;base=angle;gap=clamp(mod(red-base));}paint();});
    ['pointerup','pointercancel','lostpointercapture'].forEach(event=>svg.addEventListener(event,()=>{drag=null;}));
  }
  root.MatIntersection={html,bind,drawing};
})(typeof window!=='undefined'?window:globalThis);
