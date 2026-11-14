import * as THREE from './vendor/three.module.js';
const host=document.getElementById('scene'),canvas=document.getElementById('universe'),story=document.getElementById('evren');
const focusRoot=document.querySelector('.project-focus'),focusCards=[...document.querySelectorAll('.focus-project')];
const labels=[...document.querySelectorAll('.satellite')],title=document.querySelector('.orbital-copy h1'),description=document.querySelector('.orbit-description');
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
let renderer;
function fallback(){host.classList.remove('scene-ready');host.dataset.renderer='fallback';story.style.height='100svh';document.getElementById('motion-toggle').hidden=true;labels.forEach(l=>l.hidden=true);}
try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x020303,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,70);camera.position.set(0,0,7.3);
 scene.add(new THREE.AmbientLight(0x98bfe6,.055));
 const sun=new THREE.DirectionalLight(0xe5efff,3.4);sun.position.set(-3,1.4,1.3);scene.add(sun);
 const world=new THREE.Group(),earthGroup=new THREE.Group();scene.add(world);world.add(earthGroup);
 const earthMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.88,transparent:true});
 const earth=new THREE.Mesh(new THREE.SphereGeometry(1.35,80,48),earthMaterial);earthGroup.add(earth);
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.365,64,40),new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.86,depthWrite:false,roughness:1}));
 const loader=new THREE.TextureLoader();
 loader.load('assets/space/earth-day.jpg',texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());earthMaterial.map=texture;earthMaterial.needsUpdate=true;draw();});
 // Cloud opacity is encoded in the PNG alpha channel, not its palette colors.
 loader.load('assets/space/clouds.png',texture=>{texture.colorSpace=THREE.SRGBColorSpace;clouds.material.map=texture;clouds.material.needsUpdate=true;earthGroup.add(clouds);draw();});
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.39,64,40),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),4.);gl_FragColor=vec4(.08,.42,.85,f*.65);}'}));earthGroup.add(atmosphere);
 const cage=new THREE.Group(),cageMaterial=new THREE.LineBasicMaterial({color:0xa5b4b8,transparent:true,opacity:.4});world.add(cage);
 for(let i=0;i<7;i++){
  const points=[];for(let j=0;j<=120;j++){const a=j/120*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*1.6,Math.sin(a)*1.6,0));}
  const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),cageMaterial);ring.rotation.set(i<4?0:Math.PI/2,i<4?i*Math.PI/4:0,i<4?0:(i-4)*.5);cage.add(ring);
 }
 const orbitGroup=new THREE.Group();world.add(orbitGroup);const orbits=[];
 const orange=new THREE.MeshBasicMaterial({color:0xec8e3d});
 for(let i=0;i<4;i++){
  const pivot=new THREE.Group();pivot.rotation.set(1.16+i*.21,.08+i*.12,-.27+i*.2);orbitGroup.add(pivot);
  const points=[];for(let j=0;j<=180;j++){const a=j/180*Math.PI*1.9;points.push(new THREE.Vector3(Math.cos(a)*(2.5+i*.08),Math.sin(a)*(2.5+i*.08),0));}
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:i===0?0xe28c37:0x9a7770,transparent:true,opacity:0}));pivot.add(line);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.018,8,8),orange),arrow=new THREE.Mesh(new THREE.ConeGeometry(.013,.06,5),orange);pivot.add(dot,arrow);
  orbits.push({pivot,line,dot,arrow,radius:2.5+i*.08,phase:[2.55,.3,3.7,5.7][i]});
 }
 let seed=41;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const dustCount=1600,dustBase=new Float32Array(dustCount*3),dustPositions=new Float32Array(dustCount*3);
 for(let i=0;i<dustCount;i++){const y=random()*2-1,a=random()*Math.PI*2,r=1.45+random()*.18;dustBase[i*3]=Math.sqrt(1-y*y)*Math.cos(a)*r;dustBase[i*3+1]=y*r;dustBase[i*3+2]=Math.sqrt(1-y*y)*Math.sin(a)*r;}
 const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
 const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.008,color:0xb0c6c9,transparent:true,opacity:.45,depthWrite:false}));world.add(dust);
 const positions=[];for(let i=0;i<600;i++)positions.push((random()-.5)*22,(random()-.5)*14,(random()-.5)*10-5);
 const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)),new THREE.PointsMaterial({size:.008,color:0x6d807c,transparent:true,opacity:.5}));scene.add(stars);
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let off=document.documentElement.dataset.motion==='off',visible=true,mobile=false,mx=0,my=0,time=0,frame=0,last=0,progress=0,target=0,stage=-1,focused=false;
 const copyElement=document.querySelector('.orbital-copy'),stageElement=host.parentElement,ns='http://www.w3.org/2000/svg',leaders=document.createElementNS(ns,'svg');leaders.setAttribute('class','orbit-leaders');leaders.setAttribute('aria-hidden','true');stageElement.insertBefore(leaders,document.querySelector('.satellites'));
 const paths=labels.map(()=>{const path=document.createElementNS(ns,'path');leaders.appendChild(path);return path;});
 const projected=new THREE.Vector3(),anchor=new THREE.Vector3(),center=new THREE.Vector3(),labelPoint=new THREE.Vector3(),hit=new THREE.Vector3(),direction=new THREE.Vector3(),ray=new THREE.Ray(),sphere=new THREE.Sphere();
 const copy=[['Dijital bir dünya.','Web siteleri, botlar, oyunlar ve uygulamalar geliştiriyorum.'],['YAKINDAN BAK.','Her detay bir fikrin parçası. Kaydırmaya devam et; bu dünyanın içindeki projeleri keşfet.'],['FİKİRDEN YAYINA.','Bir web sitesi, bir marka, yeni bir başlangıç. Gerçek projeler kendi yörüngelerine çıkıyor.'],['PROJELERİN YÖRÜNGESİ.','Kare görsellere dokunarak canlı siteleri açabilirsin. Her biri tasarımdan yayına uzanan ayrı bir çalışma.'],['ŞİMDİ, İŞLERE BAKALIM.','Web siteleri önce. Oyunlar, botlar, uygulamalar ve video çalışmalarım kendi bölümlerinde.']];
 const placements=[[-2.65,.9,.6],[2.55,.8,.5],[-2.6,-.75,1.0],[2.65,-.7,.8]];
 const projects=JSON.parse(document.getElementById('timeline-data').textContent),bubble=document.getElementById('timeline-bubble'),timelineRange=document.getElementById('timeline-range'),countLabel=document.getElementById('project-count');
 const bubbleName=document.getElementById('timeline-name'),bubbleNumber=document.getElementById('timeline-number'),bubbleCategory=document.getElementById('timeline-category');let selectedProject=-1;
 const chartDot=document.getElementById('chart-dot'),counter=document.getElementById('orbit-progress'),status=document.getElementById('orbit-status');
 function readProgress(){target=clamp(-story.getBoundingClientRect().top/Math.max(1,story.offsetHeight-host.clientHeight));}
 function resize(){const w=host.clientWidth,h=host.clientHeight;mobile=w<700;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();readProgress();draw();}
 function draw(){
  const raw=progress,p=raw<.55?raw/.55*.84:raw<.95?.84:lerp(.84,1,(raw-.95)/.05),w=host.clientWidth,h=host.clientHeight;
  const focusStrength=focusCards.map((_,i)=>{const t=(raw-(.55+i*.1))/.1;return smooth(0,.2,t)*(1-smooth(.8,1,t));}),front=Math.max(...focusStrength);
  canvas.style.opacity=String(1-front*.6);story.style.setProperty('--foreground',String(front));stageElement.classList.toggle('has-foreground',front>.65);
  const reveal=smooth(0,.12,p),approach=smooth(.12,.25,p),retreat=smooth(.25,.46,p),launch=smooth(.46,.82,p),exit=smooth(.88,1,p);
  const base=Math.min(1,camera.aspect*1.15),zoom=1+approach*1.2-retreat*1.38-exit*.25;
  world.scale.setScalar(base*zoom);world.position.set((approach*1.35-retreat*1.35+launch*.15)*base,.7-approach*2.9+retreat*2.9+exit*.15,0);
  world.rotation.set(my*.025,mx*.035,0);earthGroup.rotation.z=-.18+retreat*.08;
  earth.rotation.y=4.2+time*.022+p*.18;clouds.rotation.y=earth.rotation.y+time*.007;earthMaterial.opacity=.42+reveal*.58;clouds.material.opacity=(.3+reveal*.56)*(1-exit*.2);
  cage.rotation.set(.12+p*.2,p*.8+time*.07,.1);cage.scale.setScalar(1+exit*.55);cageMaterial.opacity=(1-reveal)*.7+exit*.6;
  orbitGroup.rotation.y=launch*.35+Math.sin(time*.12)*.06;orbitGroup.rotation.z=-launch*.1;
  orbits.forEach((o,i)=>{const start=.44+i*.055,show=smooth(start,start+.11,p);o.line.material.opacity=show*(i===0?.82:.4)*(1-exit*.4);o.line.geometry.setDrawRange(0,Math.max(2,Math.round(181*show)));const a=o.phase+time*.07+launch*.32;o.dot.position.set(Math.cos(a)*o.radius,Math.sin(a)*o.radius,0);o.arrow.position.set(Math.cos(a+.045)*o.radius,Math.sin(a+.045)*o.radius,0);o.arrow.rotation.z=a+.045;o.dot.visible=o.arrow.visible=show>.08;});
  const spread=smooth(.82,.99,p);
  for(let i=0;i<dustCount;i++){const expansion=1+spread*(2+(i%9)*.28);for(let axis=0;axis<3;axis++)dustPositions[i*3+axis]=dustBase[i*3+axis]*expansion;}
  dustGeo.attributes.position.needsUpdate=true;dust.rotation.y=time*.055+p*.5;dust.material.opacity=.16+launch*.36-spread*.22;stars.rotation.y=p*.1+mx*.008;
  camera.position.x=mx*.07;camera.position.y=my*.04;renderer.render(scene,camera);
  world.getWorldPosition(center);sphere.set(center,1.35*world.scale.x);leaders.setAttribute('viewBox',`0 0 ${w} ${h}`);
  const painted=[];
  labels.forEach((label,i)=>{
   const emerge=smooth(.48+i*.065,.61+i*.065,p),travel=smooth(.48+i*.065,.78+i*.055,p),place=placements[i];
   labelPoint.set(lerp((i%2===0?-.25:.25),place[0],emerge)+Math.sin(time*.18+i)*.055,lerp(.1,place[1],emerge)+Math.sin(travel*Math.PI)*.38,lerp(-1.9,place[2],emerge));
   world.localToWorld(labelPoint);direction.copy(labelPoint).sub(camera.position);const distance=direction.length();ray.set(camera.position,direction.normalize());const blocked=ray.intersectSphere(sphere,hit)&&camera.position.distanceTo(hit)<distance-.035;
   projected.copy(labelPoint).project(camera);const size=label.offsetWidth,scale=lerp(.25,1,emerge),x=Math.max(w*.035,Math.min(w*.965-size,(projected.x*.5+.5)*w-size/2)),y=Math.max(h*.16,Math.min(h*.59-size,(-projected.y*.5+.5)*h-size/2));
   const opacity=emerge*(blocked?0:1)*(1-exit*.45)*(1-front*.7);label.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;label.style.opacity=opacity;label.style.visibility=opacity>.12?'visible':'hidden';label.inert=opacity<=.12;label.dataset.depth=blocked?'behind':'front';
   oAnchor(i);const ax=(anchor.x*.5+.5)*w,ay=(-anchor.y*.5+.5)*h,ex=x+size/2,ey=y-7;
   paths[i].setAttribute('d',`M${ax} ${ay} Q${ex} ${ay} ${ex} ${ey} M${ex-3} ${ey-5} L${ex} ${ey} L${ex+3} ${ey-5}`);paths[i].style.opacity=opacity*.75;
   painted.push([Math.round(x),Math.round(y),+scale.toFixed(2),+opacity.toFixed(2)]);
  });
  const focusRect=focusRoot.getBoundingClientRect();
  focusCards.forEach((card,i)=>{
   const strength=focusStrength[i],thumb=painted[i],dx=(thumb[0]+labels[i].offsetWidth/2-(focusRect.left+focusRect.width/2))*(1-strength),dy=(thumb[1]+labels[i].offsetHeight/2-(focusRect.top+focusRect.height/2))*(1-strength);
   card.style.transform=`translate3d(${dx}px,calc(-50% + ${dy}px),0) scale(${lerp(.15,1,strength)})`;card.style.opacity=String(smooth(0,.35,strength));card.style.visibility=strength>.01?'visible':'hidden';card.inert=strength<.65;card.dataset.expansion=strength.toFixed(3);
  });
  focusRoot.dataset.active=String(focusStrength.findIndex(v=>v>.5));
  function oAnchor(i){orbits[i].dot.getWorldPosition(anchor);anchor.project(camera);}
  const grid=1-smooth(.08,.18,p)+smooth(.4,.49,p);story.style.setProperty('--grid-opacity',String(clamp(grid)));
  const copyOpacity=(1-smooth(.13,.21,p)+smooth(.35,.45,p))*(1-front);story.style.setProperty('--copy-opacity',String(clamp(copyOpacity)));copyElement.inert=copyOpacity<.15;story.style.setProperty('--chart-opacity',String(clamp(1-smooth(.08,.18,p)+smooth(.36,.46,p))));story.style.setProperty('--chart-shift','0');story.style.setProperty('--journey',String(raw));
  const graph=[86,80,68,62,40,35,22,16,5],n=Math.min(7,Math.floor(raw*8)),mix=raw*8-n;chartDot.setAttribute('cx',String(raw*1000));chartDot.setAttribute('cy',String(lerp(graph[n],graph[n+1],mix)));counter.textContent=String(Math.round(raw*100)).padStart(3,'0');
  const projectNumber=raw<=.00001?0:Math.min(projects.length,Math.floor(raw*projects.length)+1);
  if(projectNumber!==selectedProject){
   selectedProject=projectNumber;countLabel.textContent=String(projectNumber);bubbleNumber.textContent=String(projectNumber);timelineRange.value=String(projectNumber);
   const project=projects[projectNumber-1];bubbleName.textContent=project?.name||'Projeleri keşfet';bubbleCategory.textContent=project?project.category+' · Projeyi aç ↗':'Kaydır veya oklarla ilerle';bubble.href=project?.url||'#isler';bubble.target=project?.url.startsWith('https:')?'_blank':'_self';bubble.rel='noopener';timelineRange.setAttribute('aria-valuetext',project?projectNumber+' / '+projects.length+' — '+project.name:'Başlangıç');
  }
  const plot=bubble.parentElement,left=Math.max(0,Math.min(plot.clientWidth-bubble.offsetWidth,raw*plot.clientWidth-bubble.offsetWidth/2));bubble.style.left=left+'px';bubble.style.setProperty('--tip',Math.max(12,Math.min(bubble.offsetWidth-12,raw*plot.clientWidth-left))+'px');

  const next=p<.12?0:p<.4?1:p<.59?2:p<.9?3:4;
  if(next!==stage){stage=next;title.textContent=copy[stage][0];description.textContent=copy[stage][1];status.textContent=['01 / KOORDİNATLAR','02 / YAKLAŞMA','03 / YÖRÜNGEYE ÇIKIŞ','04 / PROJELER','05 / KEŞFET'][stage];}
  host.dataset.progress=raw.toFixed(3);host.dataset.renderer='webgl';
  // Record painted geometry, not merely scroll input, for motion regression tests.
  host.dataset.pose=JSON.stringify({zoom:+zoom.toFixed(3),rotation:+earth.rotation.y.toFixed(3),y:+world.position.y.toFixed(3),cards:painted,foreground:focusStrength.map(v=>+v.toFixed(3))});
 }
 function animate(now){frame=0;if(off||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.05);last=now;if(!focused&&!reduced.matches)time+=dt;const previous=progress;progress=reduced.matches?target:progress+(target-progress)*(1-Math.exp(-dt*10));if(!reduced.matches||previous!==progress)draw();frame=requestAnimationFrame(animate);}
 function start(){if(!frame&&!off&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(animate);}}
 function stop(){cancelAnimationFrame(frame);frame=0;}
 new ResizeObserver(resize).observe(host);new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible){readProgress();start();}else stop();}).observe(host);
 window.addEventListener('scroll',readProgress,{passive:true});
 stageElement.addEventListener('pointermove',e=>{if(off||reduced.matches||e.pointerType==='touch')return;mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;});stageElement.addEventListener('pointerleave',()=>{mx=my=0;});
 labels.forEach(label=>{label.addEventListener('pointerenter',()=>focused=true);label.addEventListener('pointerleave',()=>focused=false);label.addEventListener('focus',()=>focused=true);label.addEventListener('blur',()=>focused=false);});
 document.addEventListener('motionchange',e=>{off=e.detail;if(off){stop();draw();}else{readProgress();start();}});
 const stops=[0,.12,.25,.4,.55,.6,.7,.8,.9,1];
 function navigateTo(value){if(off)document.getElementById('motion-toggle').click();window.scrollTo({top:story.offsetTop+value*(story.offsetHeight-host.clientHeight),behavior:reduced.matches?'instant':'smooth'});}
 document.getElementById('orbit-next').addEventListener('click',()=>navigateTo(stops.find(v=>v>target+.015)??1));
 document.getElementById('orbit-prev').addEventListener('click',()=>navigateTo([...stops].reverse().find(v=>v<target-.015)??0));
 timelineRange.addEventListener('input',()=>{const value=Number(timelineRange.value);navigateTo(value===0?0:value===projects.length?1:(value-.5)/projects.length);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();fallback();});
 host.classList.add('scene-ready');resize();start();
}catch(e){renderer?.dispose();fallback();}
