import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from 'three/addons/renderers/CSS2DRenderer.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const M=window.MKT,host=document.getElementById('m3d');
const W=41.7,D=14.3,CX=W/2,CZ=D/2;
const esc=M.esc;

/* ---------- renderer / scene ---------- */
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
renderer.domElement.setAttribute('aria-label','商學大樓 6F 3D 模型，可拖曳旋轉、滾輪縮放');
host.prepend(renderer.domElement);
const labelR=new CSS2DRenderer();labelR.domElement.className='m3d-labels';host.insertBefore(labelR.domElement,renderer.domElement.nextSibling);

const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xf7e7d3,70,150);
const camera=new THREE.PerspectiveCamera(30,1,.3,400);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=1.32;controls.minDistance=5;controls.maxDistance=95;
controls.autoRotateSpeed=.6;

scene.add(new THREE.HemisphereLight(0xfff3df,0xc99a6b,1.25));
const sun=new THREE.DirectionalLight(0xffe0b5,2.4);
sun.position.set(CX-14,34,CZ+22);sun.target.position.set(CX,0,CZ);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-30,right:30,top:22,bottom:-22,near:5,far:90});
sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;sun.shadow.radius=4;
scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight(0xc9dcff,.45);fill.position.set(CX+25,18,CZ-20);scene.add(fill);

/* ---------- helpers ---------- */
const MC={};
const mat=(c,o={})=>{const k=c+JSON.stringify(o);return MC[k]||(MC[k]=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.78,metalness:0},o)))};
const GC={};
const rbox=(w,h,d,r=.04)=>{r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const k=[w,h,d,r].map(v=>v.toFixed(3)).join();return GC[k]||(GC[k]=new RoundedBoxGeometry(w,h,d,2,r))};
function blk(w,h,d,c,x,y,z,r,o){const m=new THREE.Mesh(rbox(w,h,d,r),typeof c==='object'?c:mat(c,o));m.position.set(x,y+h/2,z);m.castShadow=m.receiveShadow=true;return m}
function cyl(rt,rb,h,c,x,y,z,seg=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),typeof c==='object'?c:mat(c));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;return m}
function sph(r,c,x,y,z){const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),typeof c==='object'?c:mat(c));m.position.set(x,y,z);m.castShadow=true;return m}
function cone(r,h,c,x,y,z){const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,14),mat(c));m.position.set(x,y+h/2,z);m.castShadow=true;return m}
function label(html,cls,x,y,z){const el=document.createElement('div');el.className=cls;el.innerHTML=html;const o=new CSS2DObject(el);o.position.set(x,y,z);return o}

const WARM={'606':0xf4c79e,'614':0xf1dba0,'620':0xeec3c6,'618':0xc3dcc0,'604-1':0xd9cbe9};
const DOORS={'606':['S',12],'614':['S',23.8],'620':['W',7.5],'618':['N',26.6],'604-1':['S',1.8],'604':['E',7.5],'602-1':['N',4.45],'608':['N',7.85],'610':['N',13],'612':['N',16.75],'616':['N',19.75],'618-1':['N',23.6]};
const WALL=mat(0xfffaf1),WALLTOP=mat(0xe9d9c2),T=.14,WH=1.05;

function walls(id,x,y,w,d){
  const g=new THREE.Group(),[side,at]=DOORS[id]||['S',x+w/2],gap=Math.min(1.15,(side==='N'||side==='S'?w:d)*.5);
  const seg=(x0,z0,x1,z1)=>{const lx=Math.abs(x1-x0),lz=Math.abs(z1-z0);if(lx<.05&&lz<.05)return;
    const m=blk(Math.max(lx,T),WH,Math.max(lz,T),WALL,(x0+x1)/2,0,(z0+z1)/2,.05);g.add(m);
    g.add(blk(Math.max(lx,T)+.02,.05,Math.max(lz,T)+.02,WALLTOP,(x0+x1)/2,WH,(z0+z1)/2,.02))};
  const xa=x+T/2,xb=x+w-T/2,za=y+T/2,zb=y+d-T/2;
  const run=(s,a0,a1,fixed,horiz)=>{if(s===side){const c=Math.max(a0+gap/2+.1,Math.min(a1-gap/2-.1,at));horiz?(seg(a0,fixed,c-gap/2,fixed),seg(c+gap/2,fixed,a1,fixed)):(seg(fixed,a0,fixed,c-gap/2),seg(fixed,c+gap/2,fixed,a1))}else horiz?seg(a0,fixed,a1,fixed):seg(fixed,a0,fixed,a1)};
  run('N',x,x+w,za,1);run('S',x,x+w,zb,1);run('W',y+T,y+d-T,xa,0);run('E',y+T,y+d-T,xb,0);
  return g}

function xtree(x,z,k,y0=0){const g=new THREE.Group();
  g.add(cyl(.09*k,.11*k,.35*k,0x8a5a2b,x,y0,z));
  g.add(cone(.62*k,.9*k,0x2f8f57,x,y0+.3*k,z),cone(.48*k,.75*k,0x37a363,x,y0+.78*k,z),cone(.32*k,.6*k,0x45b872,x,y0+1.2*k,z));
  g.add(sph(.1*k,mat(0xffd257,{emissive:0xffb400,emissiveIntensity:.8}),x,y0+1.86*k,z));
  const cs=[0xd62839,0xffd257,0x4aa8ff,0xffffff];for(let i=0;i<9;i++){const a=i*2.3,h=.45+i*.13,r=(.6-i*.055)*k;g.add(sph(.05*k,mat(cs[i%4],{emissive:cs[i%4],emissiveIntensity:.35}),x+Math.cos(a)*r,y0+h*k,z+Math.sin(a)*r))}
  return g}
function gift(x,z,s,c,y0=0){const g=new THREE.Group();g.add(blk(s,s*.8,s,c,x,y0,z,.02));g.add(blk(s+.01,s*.8+.01,s*.18,0xfff4d8,x,y0,z,.01));g.add(blk(s*.18,s*.8+.01,s+.01,0xfff4d8,x,y0,z,.01));return g}
function plant(x,z,k=1){const g=new THREE.Group();g.add(cyl(.17*k,.13*k,.3*k,0xd98b5f,x,0,z));g.add(sph(.26*k,0x5a9c5e,x,.48*k,z),sph(.18*k,0x6fb46f,x+.1*k,.66*k,z-.05*k));return g}
const SKIN=mat(0xf6d2ad);
function person(x,z,col,santa){const g=new THREE.Group();
  g.add(cyl(.12,.15,.5,col,x,0,z));g.add(sph(.13,SKIN,x,.64,z));
  if(santa){g.add(cone(.12,.24,0xd62839,x,.71,z));g.add(sph(.045,0xffffff,x,.96,z));g.add(cyl(.135,.135,.05,0xffffff,x,.7,z))}
  return g}

/* ---------- static building ---------- */
const world=new THREE.Group();scene.add(world);
const build=[];// for assemble animation
const base=new THREE.Group();
base.add(blk(W+3.4,.7,D+3.4,0xc08a55,CX,-.72,CZ,.25));
base.add(blk(W+2.6,.06,D+2.6,0xa8743f,CX,-.04,CZ,.03));
base.add(blk(W+.6,.06,D+.6,0xf6ead7,CX,-.02,CZ,.03));
const ground=new THREE.Mesh(new THREE.CircleGeometry(120,48),new THREE.ShadowMaterial({opacity:.18}));ground.rotation.x=-Math.PI/2;ground.position.y=-.73;ground.receiveShadow=true;
scene.add(ground);world.add(base);

const pick=[];
function room(id,name,x,y,w,d,floorCol,isDept){
  const g=new THREE.Group();
  const fl=blk(w-.04,.1,d-.04,floorCol,x+w/2,0,y+d/2,.03);fl.userData={kind:isDept?'dep':'room',dep:id};if(isDept)pick.push(fl);g.add(fl);
  g.add(walls(id,x,y,w,d));
  return g}
const props=new THREE.Group();
function addOther(o){const [id,nm,x,y,w,d]=o,g=room(id,nm,x,y,w,d,0xeadfcd,false);
  const cx=x+w/2,cz=y+d/2;
  if(id==='610'){for(let i=0;i<3;i++){const z=y+1+i*1.8;g.add(blk(w-1.4,.95,.35,0x9b6b43,cx,0,z,.04));const cs=[0xd65a4a,0x4a7fd6,0xe6b84a,0x5aa86e,0x8e6bd1];for(let k=0;k<10;k++)g.add(blk(.24,.3,.22,cs[(k+i)%5],x+.95+k*((w-1.9)/9.5),.95,z,.02))}}
  else if(id==='608'){g.add(blk(2.6,.08,1.3,0xd6a66c,cx,.62,cz,.04));g.add(blk(.3,.62,.3,0xb5844f,cx,0,cz,.05));for(const [dx,dz] of [[-.9,-1],[0,-1],[.9,-1],[-.9,1],[0,1],[.9,1]])g.add(blk(.38,.42,.38,0x6c8fc2,cx+dx,0,cz+dz,.08))}
  else if(id==='604'){g.add(blk(2,.42,.7,0xc65d4f,cx,0,y+.6,.12));g.add(blk(2,.55,.18,0xb14c3f,cx,.2,y+.3,.07));g.add(blk(1,.32,.6,0xd6a66c,cx,0,cz+.4,.06))}
  else if(id==='618-1'){for(let i=0;i<3;i++){const r=blk(.75,1.6,.75,0x3a3f4f,x+.8+i*1.1,0,cz-.6,.04);g.add(r);for(let k=0;k<4;k++)g.add(sph(.03,mat(k%2?0x5dff8f:0x66c8ff,{emissive:k%2?0x2bff6a:0x3ab4ff,emissiveIntensity:1.5}),x+.6+i*1.1,.4+k*.3,cz-.22))}}
  else if(id==='616'){g.add(blk(1.1,.9,.75,0xe8e8ee,cx,0,cz,.06));g.add(blk(1.1,.08,.75,0x6c7488,cx,.9,cz,.03))}
  else if(id==='612'){g.add(blk(.8,1.1,.6,0x59606f,cx,0,cz,.05))}
  else if(id==='602-1'){g.add(xtree(cx,cz,1.9));g.add(gift(cx+.9,cz+.8,.42,0xd62839),gift(cx-.9,cz+.6,.36,0x2fa36b),gift(cx+.3,cz+1.2,.3,0xffc93c),gift(cx-.4,cz-1.1,.34,0x4aa8ff));g.add(blk(2.6,.42,.8,0x6c8fc2,cx,0,y+d-.8,.14));g.add(plant(x+.6,y+d-.6),plant(x+w-.6,y+.8))}
  const lb=label(esc(nm),'r3',cx,id==='602-1'?3.8:1.6,cz);g.add(lb);
  return g}
const rooms={};
for(const o of M.OTHER){const g=addOther(o);world.add(g);build.push({o:g,x:o[2]+o[4]/2})}
for(const d of M.DEPS){const g=room(d.id,d.name,d.x,d.y,d.w,d.d,WARM[d.id]||0xf0d8b8,true);rooms[d.id]=g;world.add(g);build.push({o:g,x:d.x+d.w/2})}
// corridor deco
const deco=new THREE.Group();
deco.add(xtree(6.2,7.5,.85),gift(6.9,7.9,.3,0xd62839),gift(5.5,7.95,.26,0xffc93c));
for(const x of [10,15,20.4,26.8])deco.add(plant(x,7.05,.9));
deco.add(blk(2.2,.02,.9,0xc8283a,1.8,0,7.4,.01));// welcome mat
world.add(deco);build.push({o:deco,x:6});
// snowman outside on the base
{const s=new THREE.Group(),x=W+.9,z=D+.9;s.add(sph(.42,0xffffff,x,.38,z),sph(.3,0xffffff,x,.98,z),sph(.21,0xffffff,x,1.42,z));s.add(cone(.05,.25,0xf08a24,x+.2,1.38,z).rotateZ(-Math.PI/2));s.add(cyl(.2,.2,.04,0x222222,x,1.58,z),cyl(.13,.13,.26,0x222222,x,1.6,z));s.add(blk(.5,.08,.5,0xd62839,x,1.18,z,.03));s.position.y=0;world.add(s)}
{const x=-.9,z=-.9;world.add(xtree(x,z,1.1));world.add(xtree(W+1,-.9,.9));world.add(xtree(-1,D+1,.8))}

/* ---------- desks (rebuilt on data change) ---------- */
const seatLayer=new THREE.Group();world.add(seatLayer);
const DESK=mat(0xe2b47f),DESKV=mat(0xcfc6bb),LEG=mat(0xb7854f),MON=mat(0x2b2f3f),SCR=mat(0x8fd0ff,{emissive:0x4aa8ff,emissiveIntensity:.35});
const CLOTH=mat(0xc8283a),CLOTHT=mat(0xfff3dc);
let seatKey='',seatPos={},nameTags=[],stallObjs={},rings=[];
const hueCol=n=>{let h=0;for(const ch of n)h=(h*31+ch.charCodeAt(0))%360;return new THREE.Color().setHSL(h/360,.5,.55)};
function buildSeats(first){
  seatLayer.clear();seatPos={};nameTags=[];stallObjs={};rings=[];pick.length=pick.filter(p=>p.userData.kind==='dep').length;
  const live=M.live();
  for(const d of M.DEPS){const st=M.stallsOf(d);
    for(const t of d.seats){
      const x=d.x+t.x,z=d.y+t.y,has=st.includes(t.id),g=new THREE.Group();seatPos[t.id]=new THREE.Vector3(x,0,z);
      const top=blk(.66,.06,.9,t.vacant?DESKV:DESK,x,.56,z,.025);g.add(top);
      g.add(blk(.05,.56,.82,LEG,x-.28,0,z,.02),blk(.05,.56,.82,LEG,x+.28,0,z,.02));
      if(!t.vacant&&!has){g.add(blk(.04,.26,.36,MON,x-.2,.62,z,.015),blk(.012,.2,.3,SCR,x-.175,.66,z,.005));}
      if(!t.vacant)g.add(person(x+.5,z+.08,hueCol(t.name||t.id),has));
      if(has){
        const n=live.filter(i=>i.dep===d.id&&i.seat===t.id),seller=n[0].seller;
        g.add(blk(.74,.03,.98,CLOTH,x,.62,z,.012));g.add(blk(.76,.012,.12,CLOTHT,x,.6,z-.44,.005),blk(.76,.012,.12,CLOTHT,x,.6,z+.44,.005));
        g.add(xtree(x-.12,z-.22,.22,.65));g.add(gift(x+.15,z+.18,.17,0xffc93c,.65),gift(x-.14,z+.25,.13,0x2fa36b,.65));
        const ring=new THREE.Mesh(new THREE.RingGeometry(.62,.72,40),new THREE.MeshBasicMaterial({color:0xd62839,transparent:true,opacity:.55}));ring.rotation.x=-Math.PI/2;ring.position.set(x+.15,.012,z);g.add(ring);rings.push(ring);
        const pin=label('<span class="pc">'+n.length+'</span><span class="pn">'+esc(seller)+'</span>','pin3d',x,1.55,z);pin.element.dataset.seat=t.id;pin.element.dataset.dep=d.id;pin.element.title=seller+' 的攤位';g.add(pin);
        stallObjs[t.id]={g,pin};
        g.traverse(o=>{if(o.isMesh){o.userData={kind:'seat',dep:d.id,seat:t.id};pick.push(o)}});
      }else g.traverse(o=>{if(o.isMesh)o.userData={kind:'dep',dep:d.id,plain:true,vac:t.vacant}});
      if(!has){const nt=label(esc(t.vacant?'空位':(t.name&&t.name!=='?'?t.name:t.id.slice(-2))),'nt'+(t.vacant?' v':''),x+.5,1.15,z);nt.userData.dep=d.id;g.add(nt);nameTags.push(nt)}
      g.userData={dep:d.id,stall:has,id:t.id,x};
      seatLayer.add(g);
      if(first)build.push({o:g,x,small:1});
    }}
  for(const d of M.DEPS){const n=M.stallsOf(d).length;let lb=rooms[d.id].userData.lb;
    if(!lb){lb=label('','dl',d.x+d.w/2,2.6,d.y+d.d/2);lb.element.dataset.dep=d.id;rooms[d.id].add(lb);rooms[d.id].userData.lb=lb}
    lb.element.innerHTML='<b>'+esc(d.name)+'</b><span>'+(n?n+' 個攤位':'暫無攤位')+'</span>'}
  applyToggles();
}
function sig(){return JSON.stringify(M.DEPS.map(d=>[d.id,d.seats.map(t=>t.name+(t.vacant?1:0)),M.stallsOf(d).map(s=>s+':'+M.live().filter(i=>i.seat===s).length+(M.live().find(i=>i.seat===s)||{}).seller)]))}

/* ---------- snow ---------- */
const SN=700,sp=new Float32Array(SN*3);for(let i=0;i<SN;i++){sp[i*3]=Math.random()*(W+16)-8;sp[i*3+1]=Math.random()*22;sp[i*3+2]=Math.random()*(D+16)-8}
const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sp,3));
const snow=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:.13,transparent:true,opacity:.9,depthWrite:false}));scene.add(snow);

/* ---------- toggles ---------- */
const TG={names:false,only:false,spin:false};
function applyToggles(){
  const dep=M.st.dep;
  for(const n of nameTags)n.visible=TG.names||n.userData.dep===dep;
  for(const id in stallObjs)stallObjs[id].pin.visible=stallObjs[id].g.userData.dep===dep;
  for(const id in rooms){const lb=rooms[id].userData.lb;if(lb)lb.visible=id!==dep}
  seatLayer.children.forEach(g=>{if(g.userData.stall)return;g.traverse(o=>{if(o.isMesh)o.visible=!TG.only||o.material===DESK||o.material===DESKV||o.material===LEG})});
  DESK.transparent=DESKV.transparent=LEG.transparent=TG.only;DESK.opacity=DESKV.opacity=LEG.opacity=TG.only?.28:1;DESK.needsUpdate=DESKV.needsUpdate=LEG.needsUpdate=true;
  controls.autoRotate=TG.spin;
  for(const b of host.querySelectorAll('.m3d-tools [data-t]'))b.setAttribute('aria-pressed',TG[b.dataset.t])}
host.querySelector('.m3d-tools').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.t){TG[b.dataset.t]=!TG[b.dataset.t];applyToggles();return}
  if(b.dataset.v==='home'){M.st.dep=null;M.st.seat=null;M.render()}
  if(b.dataset.v==='top'){const t=controls.target.clone(),dist=camera.position.distanceTo(t);fly(t.clone().add(new THREE.Vector3(0,Math.max(dist,20),.01)),t)}});

/* ---------- camera ---------- */
const DIR=new THREE.Vector3(-.55,.78,.62).normalize();
function homeView(){const a=camera.aspect,dist=a<1?92:a<1.4?66:54;return [new THREE.Vector3(CX,0,CZ+.6).addScaledVector(DIR,dist),new THREE.Vector3(CX,0,CZ+.6)]}
function depView(d){const t=new THREE.Vector3(d.x+d.w/2,0,d.y+d.d/2),dist=(Math.max(d.w,d.d*1.6)+4)*(camera.aspect<1?2.6:1.85);return [t.clone().addScaledVector(DIR,dist),t]}
function seatView(id){const t=seatPos[id].clone();return [t.clone().addScaledVector(DIR,camera.aspect<1?20:14),t]}
let tw=null;
function fly(pos,tgt,ms=1000){tw={p0:camera.position.clone(),t0:controls.target.clone(),p1:pos,t1:tgt,s:performance.now(),ms}}
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

/* ---------- popup ---------- */
const pop=host.querySelector('#m3dPop');
function drawPop(){
  const id=M.st.seat;if(!id||!seatPos[id]){pop.hidden=true;return}
  const its=M.live().filter(i=>i.seat===id);if(!its.length){pop.hidden=true;return}
  const d=M.dep(its[0].dep);
  pop.innerHTML='<button class="x" aria-label="關閉">×</button><div class="ph"><div class="av" style="background:'+M.hue(its[0].seller)+'">'+esc(its[0].seller.slice(-1))+'</div><div><b>'+esc(its[0].seller)+' 的攤位</b><span>'+esc(d.name)+' · 座位 '+esc(id)+'</span></div></div>'+
   its.slice(0,3).map(i=>'<div class="pi">'+M.thumb(i)+'<div><b>'+esc(i.title)+'</b><span>'+esc(M.cat(i.cat)[1])+' · '+esc(i.cond||'')+'</span></div><div class="pa">'+M.priceTxt(i)+M.askBtn(i)+'</div></div>').join('')+
   (its.length>3?'<p class="more">還有 '+(its.length-3)+' 件，看右側攤位清單</p>':'')+'<p class="hint">按「我有興趣」會通知賣家，也可以直接到 '+esc(id)+' 座位看貨</p>';
  pop.hidden=false;placePop()}
const v3=new THREE.Vector3();
function placePop(){if(pop.hidden||!M.st.seat||!seatPos[M.st.seat])return;
  v3.copy(seatPos[M.st.seat]);v3.y=1.3;v3.project(camera);
  const w=host.clientWidth,h=host.clientHeight,pw=pop.offsetWidth,ph=pop.offsetHeight;
  if(w<640){pop.style.transform='translate(10px,'+(h-ph-10)+'px)';return}
  let x=(v3.x*.5+.5)*w+24,y=(-v3.y*.5+.5)*h-ph/2;
  if(x+pw>w-10)x=(v3.x*.5+.5)*w-pw-24;x=Math.max(10,Math.min(w-pw-10,x));y=Math.max(54,Math.min(h-ph-10,y));
  pop.style.transform='translate('+x+'px,'+y+'px)'}
pop.addEventListener('click',e=>{const a=e.target.closest('[data-ask]');if(a){M.ask(a.dataset.ask);return}if(e.target.closest('.x')){M.st.seat=null;M.render()}});

/* ---------- picking ---------- */
const ray=new THREE.Raycaster(),mp=new THREE.Vector2(),tip=host.querySelector('#m3dTip');
let hover=null,down=null;
function hit(e){const r=renderer.domElement.getBoundingClientRect();mp.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mp,camera);
  const h=ray.intersectObjects(pick,false).find(x=>x.object.visible);return h&&h.object.userData}
function setHover(u,e){
  const key=u?(u.kind==='seat'?'s'+u.seat:'d'+u.dep):null;
  if(hover!==key){
    if(hover&&hover[0]==='s'&&stallObjs[hover.slice(1)])stallObjs[hover.slice(1)].g.scale.setScalar(1);
    hover=key;
    if(key&&key[0]==='s'&&stallObjs[key.slice(1)])stallObjs[key.slice(1)].g.scale.setScalar(1.06);
    for(const id in rooms)rooms[id].userData.lb&&rooms[id].userData.lb.element.classList.toggle('hov',key==='d'+id)}
  renderer.domElement.style.cursor=u?'pointer':'grab';
  if(u&&e){const its=u.kind==='seat'?M.live().filter(i=>i.seat===u.seat):null,d=M.dep(u.dep);
    tip.textContent=u.kind==='seat'?its[0].seller+' 的攤位 · '+its.length+' 件，點一下看看':d.name+' · 點一下走進去';
    const r=host.getBoundingClientRect();tip.style.transform='translate('+(e.clientX-r.left+14)+'px,'+(e.clientY-r.top+14)+'px)';tip.hidden=false}else tip.hidden=true}
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!e.buttons)setHover(hit(e),e)});
renderer.domElement.addEventListener('pointerleave',()=>setHover(null));
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];TG.spin&&(TG.spin=false,applyToggles())});
renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;down=null;
  const u=hit(e);if(!u)return;
  if(u.kind==='seat'){M.st.dep=u.dep;M.st.seat=u.seat}else{if(M.st.dep===u.dep&&!M.st.seat)return;M.st.dep=u.dep;M.st.seat=null}
  M.render()});
labelR.domElement.addEventListener('click',e=>{const p=e.target.closest('[data-seat],[data-dep]');if(!p)return;
  if(p.dataset.seat){M.st.dep=p.dataset.dep;M.st.seat=p.dataset.seat}else{M.st.dep=p.dataset.dep;M.st.seat=null}M.render()});

/* ---------- market log ---------- */
const log=host.querySelector('#m3dLog');
function drawLog(){const its=M.live().slice().reverse().slice(0,3);
  log.innerHTML='<div class="lh"><span class="live">LIVE</span><b>市集日誌</b><button class="lt" aria-label="收合日誌">–</button></div><ol>'+its.map(i=>'<li data-seat="'+esc(i.seat)+'" data-dep="'+esc(i.dep)+'"><b>'+esc(i.seller)+'</b> 上架了「'+esc(i.title)+'」<span>'+esc(M.dep(i.dep).name)+' '+esc(i.seat)+'</span></li>').join('')+'</ol>'}
log.addEventListener('click',e=>{if(e.target.closest('.lt')){log.classList.toggle('min');return}const li=e.target.closest('li');if(li){M.st.dep=li.dataset.dep;M.st.seat=li.dataset.seat;M.render()}});

/* ---------- sync with app state ---------- */
let last='',last0=[null];
let drops=[],dropT=0;
function dropIn(dep){dropT=performance.now();drops=seatLayer.children.filter(g=>g.userData.dep===dep).map(g=>{const p=seatPos[g.userData.id];return {g,k:Math.random()*350+(g.userData.x-M.dep(dep).x)*40}})}
function sync(){
  resize();
  const s=sig();if(s!==seatKey){const first=!seatKey;seatKey=s;buildSeats(first);drawLog()}
  const k=M.st.dep+'|'+M.st.seat;
  if(k!==last){last=k;applyToggles();
    const [lp]=last0;last0=[M.st.dep];
    if(!M.st.dep){}else{const v=M.st.seat&&seatPos[M.st.seat]?seatView(M.st.seat):depView(M.dep(M.st.dep));
      if(lp!==M.st.dep){tw=null;camera.position.copy(v[0]);controls.target.copy(v[1]);controls.update()}else fly(...v,700)}}
  drawPop()}

/* ---------- loop ---------- */
let started=false,t0=0,size=[0,0];
function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h||(w===size[0]&&h===size[1]))return false;size=[w,h];renderer.setSize(w,h);labelR.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();return true}
function frame(now){
  requestAnimationFrame(frame);
  if(!host.offsetParent)return;
  resize();if(!started&&size[0]){started=true;host.classList.add('ready')}
  if(!started)return;
  // assemble animation
    if(drops.length){const el=now-dropT;let all=1;for(const b of drops){const k=Math.min(1,Math.max(0,(el-300-b.k)/600)),e=1+2.4*Math.pow(k-1,3)+1.4*Math.pow(k-1,2);b.g.position.y=(1-e)*3;if(k<1)all=0}if(all){for(const b of drops)b.g.position.y=0;drops=[]}}
  if(tw){const k=Math.min(1,(now-tw.s)/tw.ms),e=ease(k);camera.position.lerpVectors(tw.p0,tw.p1,e);controls.target.lerpVectors(tw.t0,tw.t1,e);if(k===1)tw=null}
  controls.update();
  const p=sg.attributes.position.array;for(let i=0;i<SN;i++){p[i*3+1]-=.018+(i%5)*.004;p[i*3]+=Math.sin(now/1400+i)*.004;if(p[i*3+1]<0)p[i*3+1]=22}sg.attributes.position.needsUpdate=true;
  const pulse=(now%1600)/1600;for(const r of rings){r.scale.setScalar(1+pulse*.5);r.material.opacity=.6*(1-pulse)}
  stepWalkers(Math.min(.1,(now-(lastNow||now))/1000),now);lastNow=now;
  renderer.render(scene,camera);labelR.render(scene,camera);placePop()}

/* ---------- 即時在線的人（逛市集的小人） ---------- */
const walkers=new Map(),WCOL=[0x3b6fb6,0x2f8f57,0x8e5bb5,0xd98b2b,0x3a9aa6,0x6b7a8f];
const hsh=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)};
function walkerMesh(p){const g=new THREE.Group(),c=WCOL[hsh(p.id)%WCOL.length];
  g.add(cyl(.12,.15,.5,c,0,0,0));g.add(sph(.13,SKIN,0,.64,0));g.add(cyl(.15,.15,.07,0xd62839,0,.5,0));
  if(hsh(p.id)%2)g.add(cone(.12,.24,0xd62839,0,.71,0),sph(.045,0xffffff,0,.96,0));
  const lb=label(esc(p.name||'訪客'),'wk'+(p.name?'':' anon'),0,1.25,0);g.add(lb);g.userData.lb=lb;return g}
function targetFor(w){const p=w.p,d=M.dep(p.dep);if(!d)return null;
  if(p.seat&&seatPos[p.seat]){const k=hsh(p.id);return seatPos[p.seat].clone().add(new THREE.Vector3(-.35+(k%5)*.18,0,.85+(k%3)*.15))}
  return new THREE.Vector3(d.x+.6+Math.random()*(d.w-1.2),0,d.y+.6+Math.random()*(d.d-1.2))}
function people(list){
  const keep=new Set();
  for(const p of list){if(!p.dep)continue;keep.add(p.id);let w=walkers.get(p.id);
    if(!w){const g=walkerMesh(p);const d=M.dep(p.dep);g.position.set(d.x+d.w/2+(Math.random()-.5)*2,0,d.y+d.d+.4);world.add(g);w={g,p,t:null,wait:0};walkers.set(p.id,w)}
    const moved=w.p.dep!==p.dep||w.p.seat!==p.seat;w.p=p;
    if(moved||!w.t){if(w.p.dep!==p.dep){}w.t=targetFor(w)}
    w.g.userData.lb.element.textContent=p.name||'訪客'}
  for(const [id,w] of walkers)if(!keep.has(id)){world.remove(w.g);walkers.delete(id)}}
function stepWalkers(dt,now){
  for(const w of walkers.values()){
    w.g.visible=w.p.dep===M.st.dep;
    if(!w.t)continue;const pos=w.g.position,dx=w.t.x-pos.x,dz=w.t.z-pos.z,dist=Math.hypot(dx,dz);
    if(dist>.05){const sp=Math.min(dist,1.3*dt);pos.x+=dx/dist*sp;pos.z+=dz/dist*sp;pos.y=Math.abs(Math.sin(now/140))*.06}
    else{pos.y=0;if(!w.p.seat){w.wait+=dt;if(w.wait>3+hsh(w.p.id)%4){w.wait=0;w.t=targetFor(w)}}}}}
let lastNow=0;
window.M3D={sync,ready:true,people};
if(M.people)people(M.people());
requestAnimationFrame(frame);
setTimeout(()=>host.classList.add('loaded'),900);

M.render();
