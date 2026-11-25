(()=>{
'use strict';
/* ====== edit these ====== */
const CONFIG={whatsapp:'2348147515744'};
/* ======================== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const easeOut=t=>1-Math.pow(1-t,3);
const pad=n=>String(n).padStart(3,'0');
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const touch=matchMedia('(pointer:coarse)').matches;
const DPR=()=>Math.min(devicePixelRatio||1,1.75);
try{history.scrollRestoration='manual'}catch(e){}
scrollTo(0,0);
const IMG={};const loadImg=n=>new Promise(r=>{const i=new Image();i.decoding='async';i.onload=i.onerror=()=>r(i);i.src=`img/${n}.webp`;IMG[n]=i});
function coverRect(iw,ih,W,H){const s=Math.max(W/iw,H/ih);return{s,x:(W-iw*s)/2,y:(H-ih*s)/2,w:iw*s,h:ih*s}}

/* ---------- canvas image sequence (frames packed four to a sheet, 2×2) ---------- */
class Seq{
  constructor(cv,parts){this.cv=cv;this.ctx=cv.getContext('2d');this.urls=[];this.fs=[];this.fk=[];
    for(const p of parts){const base=this.urls.length,ns=Math.ceil(p.n/4);for(let s=0;s<ns;s++)this.urls.push(`sheets/${p.name}/s${String(s+1).padStart(2,'0')}.webp`);for(let l=0;l<p.n;l++){this.fs.push(base+(l>>2));this.fk.push(l&3)}}
    this.n=this.fs.length;this.f=new Array(this.urls.length);this.last='';this.resize()}
  resize(){const d=DPR(),r=this.cv.getBoundingClientRect();this.w=this.cv.width=Math.max(2,Math.round(r.width*d));this.h=this.cv.height=Math.max(2,Math.round(r.height*d));this.ctx.imageSmoothingQuality='high';this.last=''}
  load(s){return new Promise(res=>{if(this.f[s])return res();const im=new Image();im.decoding='async';im.onload=()=>{this.f[s]=im;res()};im.onerror=()=>res();im.src=this.urls[s]})}
  async loadAll(cb,conc=4){let k=0,done=0;const N=this.urls.length,run=async()=>{while(k<N){const s=k++;await this.load(s);done++;cb&&cb(done/N)}};await Promise.all(Array.from({length:conc},run))}
  ok(i){return !!this.f[this.fs[i]]}
  near(i){for(let d=0;d<this.n;d++){if(i-d>=0&&this.ok(i-d))return i-d;if(i+d<this.n&&this.ok(i+d))return i+d}return -1}
  frame(i,a){const im=this.f[this.fs[i]],k=this.fk[i],fw=im.naturalWidth/2,fh=im.naturalHeight/2,c=coverRect(fw,fh,this.w,this.h);this.ctx.globalAlpha=a;this.ctx.drawImage(im,(k&1)*fw,(k>>1)*fh,fw,fh,c.x,c.y,c.w,c.h)}
  draw(p,force,alpha=1){const i=Math.round(clamp(p)*(this.n-1)),key=i+':'+this.w+':'+this.h;if(key===this.last&&!force)return false;
    const A=this.near(i);if(A<0)return false;this.last=key;this.frame(A,alpha);this.ctx.globalAlpha=1;return true}
}

/* ---------- sound (starts on the first touch, click or key) ---------- */
const snd={on:true,touched:false,music:new Audio('audio/music.mp3'),rain:new Audio('audio/rain.mp3'),door:new Audio('audio/door.mp3'),sw:new Audio('audio/switch.mp3'),keys:new Audio('audio/keys.mp3')};
snd.music.loop=true;snd.rain.loop=true;snd.music.volume=.07;snd.rain.volume=0;snd.rainT=0;snd.door.volume=.6;snd.sw.volume=.4;snd.keys.volume=.6;
[snd.music,snd.rain,snd.door,snd.sw,snd.keys].forEach(a=>a.preload='auto');
snd.play=a=>{if(!snd.on)return;try{a.currentTime=0;a.play().catch(()=>{})}catch(e){}};
const sBtn=$('#sndBtn');
const startBed=()=>{try{return snd.music.play()||Promise.resolve()}catch(e){return Promise.reject(e)}};
function setSound(on){snd.on=on;sBtn.setAttribute('aria-pressed',on);try{if(on)startBed().catch(()=>{});else{snd.music.pause();snd.rain.pause()}}catch(e){}}
sBtn.addEventListener('click',e=>{e.stopPropagation();snd.touched=true;setSound(!snd.on)});
sBtn.setAttribute('aria-pressed','true');
// Browsers only allow sound after a tap, click or key press, so the music starts the moment the visitor first touches the page.
let unlocked=false;
function unlockAudio(){if(unlocked)return;unlocked=true;
  // iOS needs every sound touched once inside a tap before it may play later
  [snd.door,snd.sw,snd.keys].forEach(a=>{const v=a.volume;a.volume=0;const pr=a.play();if(pr&&pr.then)pr.then(()=>{a.pause();a.currentTime=0;a.volume=v}).catch(()=>{a.volume=v});else a.volume=v});
  if(snd.on)startBed().catch(()=>{})}
const tryMusic=()=>{if(snd.on&&snd.music.paused)startBed().catch(()=>{})};
['pointerdown','keydown','touchend','click'].forEach(t=>addEventListener(t,()=>{unlockAudio();tryMusic()},{passive:true}));
// rain only under the dark moments: the dark process steps and the night footer, and only just audible
const _pr=$('#process'),_tw=$('#tower');
setInterval(()=>{const inV=el=>{const r=el.getBoundingClientRect();return r.top<innerHeight*.6&&r.bottom>innerHeight*.4};
  snd.rainT=(snd.on&&((inV(_pr)&&psIdx>=3)||inV(_tw)))?.03:0;
  const v=snd.rain.volume,n=v+(snd.rainT-v)*.12;snd.rain.volume=Math.max(0,Math.min(1,Math.abs(n-snd.rainT)<.002?snd.rainT:n));
  if(snd.rain.volume>0&&snd.rain.paused&&snd.on)snd.rain.play().catch(()=>{});else if(snd.rain.volume===0&&!snd.rain.paused)snd.rain.pause()},120);
document.addEventListener('visibilitychange',()=>{if(document.hidden){snd.music.pause();snd.rain.pause()}else if(snd.on)startBed().catch(()=>{})});

/* ---------- sequences ---------- */
const doorSeq=new Seq($('#cDoor'),[{name:'door',n:127}]);
const shiftSeq=new Seq($('#cShift'),[{name:'build',n:95},{name:'office',n:95}]);
const yoursSeq=new Seq($('#cRoom'),[{name:'yours',n:95}]);
const towerSeq=new Seq($('#cTower'),[{name:'tower',n:48}]);
const finishSeq=new Seq($('#cTower'),[{name:'finish',n:70}]);
const seqs=[doorSeq,shiftSeq,yoursSeq,towerSeq,finishSeq];/* tours are added below */

/* ---------- door scenes ---------- */
const SCENES=[
 {tour:'okafor',img:'p_ikoyi',type:'Home',name:'Okafor Penthouse',word:'OKAFOR',loc:'Ikoyi, Lagos',meta:'Bedroom, living, dining and kitchen. Walnut, linen and the lagoon at dusk, all the way through.',wall:'#5A3D2A'},
 {tour:'ember',img:'p_vi',type:'Restaurant',name:'Ember &amp; Oak',word:'EMBER &amp; OAK',loc:'Victoria Island, Lagos',meta:'Booths, bar, dining room and the terrace. Terracotta, brass and low light, built for long dinners.',wall:'#A65A38'},
 {tour:'kestrel',img:'p_lekki',type:'Office',name:'Kestrel Capital',word:'KESTREL',loc:'Lekki Phase 1, Lagos',meta:'Desks, meeting room, lounge and reception. An office people actually want to come back to.',wall:'#5C5A3D'},
 {tour:'bello',img:'p_banana',type:'Home',name:'Bello Residence',word:'BELLO',loc:'Banana Island, Lagos',meta:'Staircase, living room, dining and the pool terrace. Marble, glass and a lot of light.',wall:'#D6C8AE',cls:'lightwall'}
];
$('#doors').innerHTML=SCENES.map(s=>`<div class="dscene" style="height:${s.tour?660:380}vh"><div class="ds ${s.cls||''}" style="--w:${s.wall}">
<img class="room" src="img/${s.img}.webp" alt="${s.name}, ${s.loc}, designed by ILÉ" loading="lazy">${s.tour?'<canvas class="tour" aria-hidden="true"></canvas>':''}
<div class="glow"></div>
<div class="wall"><div class="deco"><span class="dname">${s.word}</span><i class="sc l"></i><i class="sc r"></i><div class="plaque"><small>${s.type}</small><b>${s.name}</b><span>${s.loc}</span></div></div></div>
<div class="frame"></div><div class="leaf"></div>
<p class="knock">${s.name}<small>${s.loc}</small></p><div class="vig2"></div>
<div class="cap"><span class="type">${s.type}</span><h3>${s.name}<em>.</em></h3><p class="loc">${s.loc}</p><p class="meta">${s.meta}</p></div>
</div></div>`).join('');
const mk=el=>({el,room:$('.room',el),wall:$('.wall',el),deco:$('.deco',el),frame:$('.frame',el),leaf:$('.leaf',el),glow:$('.glow',el),cap:$('.cap',el),knock:$('.knock',el),played:false});
const scenes=$$('#doors .dscene').map((el,i)=>{const sc=mk(el);const cv=$('.tour',el);if(cv){sc.tour=new Seq(cv,[{name:SCENES[i].tour,n:95}]);seqs.push(sc.tour)}return sc});
const fin=mk($('#cta'));fin.shade=$('.cta-shade',fin.el);

/* ---------- guestbook ---------- */
const guestEl=$('#guest'),gbImg=$('#gbImg'),gbPages=$('#gbPages'),gbCap=$('#gbCap');
const gbParts=$$('.gb-e p',gbPages);
function guestFrame(p){
  const W=innerWidth,H=innerHeight,mob=W<820||H>W;let s,cx,cy;
  if(mob){s=.94*W/515;const pan=ease(clamp((p-.44)/.1));cx=lerp(505,1005,pan);cy=520}
  else{s=Math.max(W/1536,H/1024)*lerp(1.02,1.1,p);cx=760;cy=520}
  const tx=W/2-cx*s,ty=H/2-cy*s,t=`translate(${tx}px,${ty}px) scale(${s})`;
  gbImg.style.transform=t;gbPages.style.transform=t;
  gbParts.forEach((el,k)=>el.classList.toggle('on',p>.05+k*(.72/gbParts.length)));
  gbCap.classList.toggle('on',p>.8)}

/* ---------- process ---------- */
const procCv=$('#cProc'),pctx=procCv.getContext('2d');
const mA=document.createElement('canvas'),mB=document.createElement('canvas');
let PW=0,PH=0,paperPat=null,procKey='';
function rng(seed){return()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}}
function makeStrokes(seed){const r=rng(seed),rows=8,out=[];for(let i=0;i<rows;i++){const y=(i+.5)/rows,dir=i%2?-1:1,pts=[];const n=14;for(let k=0;k<=n;k++){const t=k/n;pts.push([dir>0?-.05+t*1.1:1.05-t*1.1,y+(r()-.5)*.05+Math.sin(t*6+i)*.012])}out.push({pts,w:1.9/rows*(.9+r()*.3)})}return out}
const strokesA=makeStrokes(11),strokesB=makeStrokes(97);
function procResize(){const d=Math.min(DPR(),1.5),r=procCv.getBoundingClientRect();PW=procCv.width=mA.width=mB.width=Math.round(r.width*d);PH=procCv.height=mA.height=mB.height=Math.round(r.height*d);
  const n=document.createElement('canvas');n.width=n.height=220;const x=n.getContext('2d'),id=x.createImageData(220,220);for(let i=0;i<id.data.length;i+=4){const v=Math.random()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=16}x.putImageData(id,0,0);paperPat=pctx.createPattern(n,'repeat');procKey=''}
function paintMask(m,strokes,t,img){const c=m.getContext('2d');c.globalCompositeOperation='source-over';c.clearRect(0,0,PW,PH);c.lineCap='round';c.lineJoin='round';
  const tot=t*strokes.length;for(let i=0;i<strokes.length&&i<tot;i++){const s=strokes[i],f=clamp(tot-i),pts=s.pts,last=Math.max(1,Math.ceil(f*(pts.length-1)));
    for(const [off,al,wm] of [[0,1,1],[-.32,.55,.55],[.34,.5,.5]]){c.globalAlpha=al;c.lineWidth=s.w*PH*wm;c.beginPath();for(let k=0;k<=last;k++){let [px,py]=pts[k];if(k===last&&f<1){const a=pts[k-1],fr=f*(pts.length-1)-(k-1);px=lerp(a[0],pts[k][0],fr);py=lerp(a[1],pts[k][1],fr)}const X=px*PW,Y=(py+off*s.w)*PH;k?c.lineTo(X,Y):c.moveTo(X,Y)}c.stroke()}}
  c.globalAlpha=1;c.globalCompositeOperation='source-in';const cr=coverRect(img.naturalWidth,img.naturalHeight,PW,PH);c.drawImage(img,cr.x,cr.y,cr.w,cr.h);c.globalCompositeOperation='source-over'}
function drawProc(tA,tB,tG){const key=[tA,tB,tG].map(v=>v.toFixed(3)).join()+PW+PH;if(key===procKey)return;procKey=key;
  pctx.globalAlpha=1;pctx.fillStyle='#EFE6D6';pctx.fillRect(0,0,PW,PH);if(paperPat){pctx.fillStyle=paperPat;pctx.fillRect(0,0,PW,PH)}
  const sk=IMG.sketch,lv=IMG.living,gd=IMG.golden;if(!sk||!sk.naturalWidth)return;
  const full=(im,a=1)=>{const c=coverRect(im.naturalWidth,im.naturalHeight,PW,PH);pctx.globalAlpha=a;pctx.drawImage(im,c.x,c.y,c.w,c.h);pctx.globalAlpha=1};
  if(tB>=1){full(lv)}else{
    if(tA>=1)full(sk);else if(tA>0){paintMask(mA,strokesA,tA,sk);pctx.drawImage(mA,0,0)}
    if(tB>0){paintMask(mB,strokesB,tB,lv);pctx.drawImage(mB,0,0)}}
  if(tG>0)full(gd,tG)}
const notes=$$('.note'),brief=$('#brief'),psEls=$$('.ph'),phead=$('#phead'),pshade=$('#pshade');let psIdx=-1;
const SW=[{k:'Bouclé, ivory',x:190,y:40,s:380,tx:900,ty:640},{k:'Linen, terracotta',x:470,y:390,s:270,tx:480,ty:545},{k:'American walnut',x:110,y:490,s:270,tx:830,ty:730},{k:'Brushed brass',x:830,y:430,s:380,tx:485,ty:300}];
const swLayer=$('#swLayer');
swLayer.innerHTML=SW.map(s=>`<div class="sw"><i style="background-size:${1672/s.s*100}% ${941/s.s*100}%;background-position:${s.x/(1672-s.s)*100}% ${s.y/(941-s.s)*100}%"></i><b>${s.k}</b></div>`).join('')+SW.map(s=>`<div class="tag"><span>${s.k}</span></div>`).join('');
const swEls=$$('.sw',swLayer),tagEls=$$('.tag',swLayer);const ROT=[-6,4,-3,7];
function procFrame(p){
  const W=innerWidth,H=innerHeight,mob=W<820;
  notes.forEach((n,i)=>n.classList.toggle('on',p>.012+i*.03));
  brief.style.opacity=1-clamp((p-.165)/.05);
  drawProc(clamp((p-.16)/.18),clamp((p-.5)/.22),clamp((p-.82)/.09));
  const sz=mob?Math.min(104,W*.26):Math.min(160,W*.11);
  const cr=coverRect(1672,941,W,H);
  SW.forEach((s,k)=>{const el=swEls[k];el.style.setProperty('--sz',sz+'px');
    const px=mob?[W*.12,W*.56,W*.12,W*.56][k]:[W*.14,W*.36,W*.58,W*.8][k]-sz/2+W*.03,py=mob?[H*.42,H*.42,H*.62,H*.62][k]:[H*.5,H*.56,H*.5,H*.56][k];
    const a=clamp((p-(.36+k*.03))/.04),f=easeOut(clamp((p-(.52+k*.045))/.1));
    const tx=cr.x+s.tx*cr.s-sz/2,ty=cr.y+s.ty*cr.s-sz/2;
    el.style.transform=`translate(${lerp(px,tx,f)}px,${lerp(py-(1-a)*60,ty,f)}px) rotate(${ROT[k]*(1-f)}deg) scale(${lerp(1,.22,f)})`;
    el.style.opacity=a*(1-clamp((f-.8)/.2));
    const tg=tagEls[k],tx2=cr.x+s.tx*cr.s;tg.style.left=tx2+'px';tg.style.top=(cr.y+s.ty*cr.s)+'px';tg.classList.toggle('on',f>=1&&p<.84&&tx2>12&&tx2<W-130)});
  const i=p<.15?0:p<.35?1:p<.5?2:p<.78?3:4;if(i!==psIdx){psIdx=i;psEls.forEach((e,k)=>e.classList.toggle('on',k===i));phead.classList.toggle('dark',i>=3);pshade.style.opacity=i>=3?1:0}
}

/* ---------- yours: each piece arrives, then takes its place ---------- */
// targets are in the 1600×900 video frame; a/b are video frames while it lands
const PIECES=[
 {c:'rug',n:'The <i>rug.</i>',s:'Hand-woven jute, 3 × 4 m',w:.5,tw:.6,x:957,y:766,a:0,b:13,side:-1},
 {c:'sofa',n:'The <i>sofa.</i>',s:'Olive velvet, 3.2 m',w:.5,tw:.35,x:278,y:680,a:13,b:24,side:1},
 {c:'table',n:'The <i>table.</i>',s:'Travertine drum, Ø 110 cm',w:.34,tw:.23,x:804,y:756,a:24,b:35,side:-1},
 {c:'chair',n:'The <i>chairs.</i>',s:'Bentwood and cane, a set of six',w:.2,tw:.06,x:727,y:545,a:35,b:50,side:1},
 {c:'lamp',n:'The <i>light.</i>',s:'Paper pendant, Ø 90 cm',w:.22,tw:.11,x:809,y:325,a:50,b:60,side:-1},
 {c:'plant',n:'The <i>fig.</i>',s:'Fiddle-leaf, in an old clay pot',w:.2,tw:.1,x:981,y:402,a:60,b:75,side:1},
 {c:'art',n:'The <i>art.</i>',s:'Ochre and charcoal, 2.2 m',w:.4,tw:.18,x:699,y:392,a:75,b:94,side:-1}
];
const yLabel=$('#yLabel'),yCuts=$('#yCuts'),yScrim=$('#yScrim');
yLabel.innerHTML=PIECES.map((p,i)=>`<div class="yl"><p class="yn"><b>0${i+1}</b>of 07</p><h3>${p.n}</h3></div><p class="ysb">${p.s}</p>`).join('');
yCuts.innerHTML=PIECES.map(p=>`<img class="yc" src="img/cut/${p.c}.webp" alt="">`).join('');
const yss=$$('.ysb',yLabel),yls=$$('.yl',yLabel),ycs=$$('.yc',yCuts);let yLanded=-1;
const Y0=.16,YS=.095;
function yoursFrame(p,g){
  const r=door(fin,g,p,{o0:.02,o1:.07,g0:.07,g1:.14});
  const W=g.W,H=g.H,mob=W<820||H>W,cr=coverRect(1600,900,W,H);
  let frame=0,scrim=0;
  PIECES.forEach((pc,k)=>{const t=(p-(Y0+k*YS))/YS,el=ycs[k],lb=yls[k];
    if(t<0||t>1){el.style.opacity=0;lb.style.opacity=0;yss[k].style.opacity=0;if(t>1)frame=Math.max(frame,pc.b);return}
    frame=lerp(pc.a,pc.b,ease(clamp((t-.45)/.5)));
    scrim=Math.max(scrim,clamp(t/.14)*(1-clamp((t-.5)/.3)));
    const iw=el.naturalWidth||1000,ih=el.naturalHeight||600;
    let w0=W*(mob?Math.min(.9,pc.w*1.7):pc.w),h0=w0*ih/iw;const mh=H*(mob?.38:.54);if(h0>mh){h0=mh;w0=h0*iw/ih}
    const e=easeOut(clamp(t/.25)),f=ease(clamp((t-.5)/.4));
    const cx0=W/2+(mob?0:pc.side*-W*.12),cy0=H*(mob?.6:.52)+Math.sin(t*6)*6;
    const sx=cx0+pc.side*W*.75*(1-e),tx=cr.x+pc.x*cr.s,ty=cr.y+pc.y*cr.s;
    const cx=lerp(sx,tx,f),cy=lerp(cy0,ty,f),tw=pc.tw*cr.w,sc=lerp(1,tw/w0,f)*lerp(.88,1,e);
    el.style.width=w0+'px';
    el.style.transform=`translate(${cx-w0/2}px,${cy-h0/2}px) rotate(${pc.side*10*(1-e)}deg) scale(${sc})`;
    el.style.opacity=e*(1-clamp((f-.72)/.28));
    const li=clamp((t-.06)/.14)*(1-clamp((t-.5)/.12));lb.style.opacity=li;lb.style.top=mob?'14vh':'50%';lb.style.transform=mob?`translateY(${(1-clamp((t-.06)/.14))*30}px)`:`translateY(calc(-50% + ${(1-clamp((t-.06)/.14))*30}px))`;yss[k].style.opacity=li;
    if(f>.98&&yLanded<k){yLanded=k;snd.play(snd.sw)}});
  if(p<Y0)yLanded=-1;
  if(p>=Y0+PIECES.length*YS)frame=94;
  yoursSeq.draw(frame/94);
  yScrim.style.opacity=scrim;
  const c=clamp((p-.85)/.06);fin.cap.style.opacity=c;fin.shade.style.opacity=c;fin.cap.style.pointerEvents=c>.5?'auto':'none';
  fin.cap.style.transform=mob?`translateY(${(1-c)*40}px)`:`translateY(calc(-50% + ${(1-c)*40}px))`;
}

/* ---------- footer ---------- */
const towerEl=$('#tower'),twCopy=$('#twCopy');
function towerFrame(p){
  const a=clamp(p/.4),x=clamp((p-.37)/.07),b=clamp((p-.37)/.55);
  if(x<=0)towerSeq.draw(a,true);
  else if(x>=1)finishSeq.draw(b,true);
  else{towerSeq.draw(1,true);finishSeq.draw(b,true,x)}
  twCopy.classList.toggle('on',p>.86)}

/* ---------- scroll engine ---------- */
let cur=0,target=0,ours=false,vel=0,lastY=0,locked=true;
const maxS=()=>document.documentElement.scrollHeight-innerHeight;
const smooth=!touch&&!reduce;
if(smooth){
  addEventListener('wheel',e=>{if(locked||e.ctrlKey||$('#book').open)return;e.preventDefault();target=clamp(target+e.deltaY*(e.deltaMode===1?32:1),0,maxS())},{passive:false});
  addEventListener('scroll',()=>{if(!ours&&Math.abs(scrollY-cur)>3)cur=target=scrollY});
  addEventListener('keydown',e=>{const k={ArrowDown:80,ArrowUp:-80,PageDown:innerHeight*.9,PageUp:-innerHeight*.9,' ':innerHeight*.9}[e.key];if(k&&!locked&&!$('#book').open&&!/input|textarea|select/i.test(document.activeElement.tagName)){e.preventDefault();target=clamp(target+(e.shiftKey&&e.key===' '?-k:k),0,maxS())}});
}
$$('[data-top]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();if(smooth)target=0;else scrollTo({top:0,behavior:'smooth'})}));
function prog(el){const r=el.getBoundingClientRect();return clamp(-r.top/Math.max(1,r.height-innerHeight))}
function vis(el){const r=el.getBoundingClientRect();return r.bottom>-50&&r.top<innerHeight+50}

const heroEl=$('#hero'),heroCopy=$('#heroCopy'),push=$('#push'),scrim=$('#scrim'),abL=$$('.ab-l'),abF=$('.ab-f');
const shiftEl=$('#shift'),sWords=$$('#shiftWord span'),sLine=$('#shiftLine');
const SL=['Every space starts here.','Then it becomes a home that feels like you.','Or an office people actually want to come back to.'];let sIdx=-1;
const procEl=$('#process');

function geom(){const W=innerWidth,H=innerHeight;let h0=H*.6,w0=h0*.45;if(w0>W*.62){w0=W*.62;h0=w0/.45}return{W,H,w0,h0}}
function door(sc,g,p,o){
  o=o||{o0:.12,o1:.4,g0:.38,g1:.85};
  const open=easeOut(clamp((p-o.o0)/(o.o1-o.o0))),grow=ease(clamp((p-o.g0)/(o.g1-o.g0)));
  const S=Math.max(g.W/g.w0,g.H/g.h0)*1.55,s=1+(S-1)*grow;
  const w=g.w0*s,h=g.h0*s,cx=g.W/2,cy=g.H*.54,L=cx-w/2,T=cy-h/2,R=L+w,B=T+h;
  sc.wall.style.clipPath=`polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${L}px ${T}px,${R}px ${T}px,${R}px ${B}px,${L}px ${B}px,${L}px ${T}px)`;
  sc.wall.style.visibility=grow>=1?'hidden':'visible';
  for(const el of [sc.frame,sc.leaf,sc.glow]){el.style.left=L+'px';el.style.top=T+'px';el.style.width=w+'px';el.style.height=h+'px'}
  const d=sc.deco;d.style.left=(cx-g.w0/2)+'px';d.style.top=(cy-g.h0/2)+'px';d.style.width=g.w0+'px';d.style.height=g.h0+'px';d.style.fontSize=(g.h0/100)+'px';d.style.transform=`scale(${s})`;
  sc.leaf.style.transform=`rotateY(${open*82}deg)`;
  sc.leaf.style.opacity=clamp(1-(grow-.04)*3);
  sc.frame.style.opacity=clamp(1-grow*2.2);
  sc.glow.style.opacity=open*clamp(1-grow*3)*.85;
  sc.room.style.transform=`scale(${1.2-.2*ease(clamp((p-o.o0)/(o.g1-o.o0+.1)))})`;
  sc.knock.style.opacity=clamp(1-open*2.2)*clamp(p*12);
  if(open>.03&&!sc.played){sc.played=true;snd.play(snd.door)}
  if(open<.005)sc.played=false;
  return{open,grow};
}

function frame(){
  if(smooth){const d=target-cur;ours=true;if(Math.abs(d)>.4){cur+=d*.09;scrollTo(0,cur)}else if(cur!==target){cur=target;scrollTo(0,cur)}ours=false}
  const y=scrollY;vel+=((y-lastY)-vel)*.15;lastY=y;const g=geom();

  if(vis(heroEl)){const p=prog(heroEl);doorSeq.draw(easeOut(clamp(p/.4)));
    const f=clamp(p/.07);heroCopy.style.opacity=1-f;heroCopy.style.transform=`translateY(${-f*50}px)`;
    push.style.transform=`scale(${1+.22*ease(clamp((p-.38)/.62))})`;
    scrim.style.opacity=clamp((p-.42)/.08);
    abL.forEach((l,i)=>l.classList.toggle('on',p>.47+i*.1));abF.classList.toggle('on',p>.77)}

  if(vis(shiftEl)){const p=prog(shiftEl),x=clamp((p-.03)/.9);shiftSeq.draw(x);
    const i=x<.2?0:x<.62?1:2;if(i!==sIdx){if(sIdx>=0)snd.play(snd.sw);sIdx=i;sWords.forEach((w,k)=>{w.classList.toggle('on',k===i);w.classList.toggle('out',k<i)});sLine.style.opacity=0;setTimeout(()=>{sLine.textContent=SL[sIdx];sLine.style.opacity=1},200)}}

  for(const sc of scenes){if(vis(sc.el)){const p=prog(sc.el),r=door(sc,g,p,sc.tour?{o0:.05,o1:.15,g0:.14,g1:.32}:null);const c=clamp((r.grow-.6)/.3);sc.cap.style.opacity=c;sc.cap.style.transform=`translateY(${(1-c)*40}px)`;
    if(sc.tour){const tp=clamp((p-.36)/.58);sc.tour.cv.style.opacity=tp>0&&sc.tour.near(0)>=0?1:0;if(tp>0)sc.tour.draw(ease(tp))}}}
  if(vis(guestEl))guestFrame(prog(guestEl));
  if(vis(procEl))procFrame(prog(procEl));
  if(vis(fin.el))yoursFrame(prog(fin.el),g);
  if(vis(towerEl))towerFrame(prog(towerEl));
  requestAnimationFrame(frame);
}
function onResize(){seqs.forEach(s=>s.resize());procResize()}
addEventListener('resize',onResize);

/* ---------- booking: finish the sentence ---------- */
const bk=$('#book'),bkForm=$('#bkForm'),bkSend=$('#bkSend'),waBase=`https://wa.me/${CONFIG.whatsapp}`;
const bkMsg=()=>{const f=new FormData(bkForm);return `Hello ILÉ, I’m ${f.get('name')||'…'}, and I’d love you to design my ${f.get('type')}${f.get('where')?' in '+f.get('where'):''}, for around ${f.get('budget')}.${f.get('note')?' It should feel '+f.get('note')+'.':''}`};
const mctx=document.createElement('canvas').getContext('2d');
const fit=i=>{if(i.tagName!=='INPUT'||i.type==='hidden')return;const cs=getComputedStyle(i);mctx.font=`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;mctx.letterSpacing=cs.letterSpacing;const w=mctx.measureText(i.value||i.placeholder).width;i.style.width=Math.ceil(w+parseFloat(cs.fontSize)*.5)+'px'};
$$('.pick',bkForm).forEach(pk=>{const opts=pk.dataset.opts.split('|'),name=pk.dataset.name;
  pk.innerHTML=`<button type="button" class="pk-b" aria-haspopup="listbox" aria-expanded="false">${opts[0]}</button><input type="hidden" name="${name}" value="${opts[0]}"><span class="pk-m" role="listbox">${opts.map((o,i)=>`<button type="button" role="option" aria-selected="${i===0}">${o}</button>`).join('')}</span>`;
  const b=$('.pk-b',pk),hid=$('input',pk);
  b.addEventListener('click',e=>{e.stopPropagation();const o=!pk.classList.contains('open');$$('.pick.open',bkForm).forEach(x=>{x.classList.remove('open');$('.pk-b',x).setAttribute('aria-expanded','false')});const m=$('.pk-m',pk);m.classList.remove('flip');pk.classList.toggle('open',o);b.setAttribute('aria-expanded',o);if(o&&m.getBoundingClientRect().right>innerWidth-12)m.classList.add('flip');if(o)$('[aria-selected=true]',pk).focus()});
  $$('.pk-m button',pk).forEach(ob=>ob.addEventListener('click',e=>{e.stopPropagation();hid.value=ob.textContent;b.textContent=ob.textContent;$$('.pk-m button',pk).forEach(x=>x.setAttribute('aria-selected',x===ob));pk.classList.remove('open');b.setAttribute('aria-expanded','false');b.focus();bkSync()}));
  pk.addEventListener('keydown',e=>{if(e.key==='Escape'){pk.classList.remove('open');b.focus()}})});
bkForm.addEventListener('click',()=>$$('.pick.open',bkForm).forEach(x=>x.classList.remove('open')));
const bkSync=()=>{bkSend.href=`${waBase}?text=${encodeURIComponent(bkMsg())}`;$$('input',bkForm).forEach(fit)};
function openBook(){bk.showModal();bkSync();setTimeout(bkSync,600);locked=true;setTimeout(()=>{const n=$('input[name=name]',bkForm);try{n.focus({preventScroll:true})}catch(e){}},700)}
$$('[data-book]').forEach(b=>b.addEventListener('click',openBook));
$('#bkX').addEventListener('click',()=>bk.close());
bk.addEventListener('close',()=>{locked=false});
bkForm.addEventListener('input',bkSync);bkForm.addEventListener('submit',e=>e.preventDefault());
$('#waLink').href=waBase+'?text='+encodeURIComponent('Hello ILÉ, I’d like to talk about designing my space.');

/* ---------- arrival: the lift climbs while things load, then opens by itself ---------- */
const floorEl=$('#floor'),pre=$('#pre');
const imgs=['door','empty','living','golden','sketch','moodboard','p_ikoyi','p_lekki','p_vi','p_banana','guestbook','yours_empty','yours_full'];
let ip=0,dp=0;const upd=()=>{const v=clamp(ip*.25+dp*.75),f=Math.round(v*12);floorEl.textContent=f?String(f).padStart(2,'0'):'G'};
const first=['door','empty','living'];const imgP=Promise.all(first.map(n=>loadImg(n).then(()=>{ip+=1/first.length;upd()})));imgs.filter(n=>!first.includes(n)).forEach(loadImg);
PIECES.forEach(p=>loadImg('cut/'+p.c));
// only the first stretch of the door needs to be here before we open; the rest streams in behind
const doorP=Promise.all([0,1,2,3,4,5].map(s=>doorSeq.load(s).then(()=>{dp+=1/6;upd()})));
// key-drop when the closing scene arrives
if('IntersectionObserver' in window){let kd=false;new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!kd){kd=true;setTimeout(()=>snd.play(snd.keys),500)}else if(!e.isIntersecting&&e.boundingClientRect.top>0)kd=false}),{threshold:.35}).observe($('#cta'))}
let ready=false;const T0=performance.now(),MIN=1300;
function arrive(){if(ready)return;ready=true;onResize();doorSeq.draw(0,true);
  const wait=Math.max(0,MIN-(performance.now()-T0));
  // let the floors finish climbing, pause on the name, then open
  let f=+(floorEl.textContent)||0;const climb=setInterval(()=>{f=Math.min(12,f+1);floorEl.textContent=String(f).padStart(2,'0');if(f>=12)clearInterval(climb)},Math.max(30,wait/14));
  setTimeout(()=>{pre.classList.add('open');document.body.classList.remove('loading');locked=false;unlockAudio();tryMusic();snd.play(snd.door)},wait+250);
  setTimeout(()=>document.body.classList.add('in'),wait+900);
  setTimeout(()=>pre.classList.add('done'),wait+1800);
  doorSeq.loadAll(null,4);
  (async()=>{await shiftSeq.loadAll(null,4);for(const sc of scenes)if(sc.tour)await sc.tour.loadAll(null,4);await yoursSeq.loadAll(null,4);await towerSeq.loadAll(null,4);await finishSeq.loadAll(null,4)})()}
Promise.all([imgP,doorP]).then(arrive);
setTimeout(arrive,15000);
onResize();requestAnimationFrame(frame);
})();
