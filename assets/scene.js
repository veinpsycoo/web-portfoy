import * as THREE from './vendor/three.module.js';
const host=document.getElementById('scene'),canvas=document.getElementById('universe'),story=document.getElementById('evren');
const labels=[...document.querySelectorAll('.satellite')],title=document.querySelector('.orbital-copy h1'),description=document.querySelector('.orbit-description');
const clamp=(v)=>Math.max(0,Math.min(1,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
try{
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x020303,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,70);camera.position.set(0,0,7.3);
 scene.add(new THREE.AmbientLight(0x8fb5dc,.055));const sun=new THREE.DirectionalLight(0xfff4df,3.3);sun.position.set(-3,1.4,.8);scene.add(sun);
 const world=new THREE.Group();scene.add(world);world.position.y=.72;
 const earthGroup=new THREE.Group();world.add(earthGroup);earthGroup.rotation.z=-.16;
 const textureLoader=new THREE.TextureLoader(),earthMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.88,metalness:0});
 textureLoader.load('assets/space/earth.jpg',t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());earthMaterial.map=t;earthMaterial.needsUpdate=true;draw();});
 const earth=new THREE.Mesh(new THREE.SphereGeometry(1.35,80,48),earthMaterial);earthGroup.add(earth);
 const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.365,64,40),new THREE.MeshStandardMaterial({transparent:true,opacity:.54,depthWrite:false,roughness:1}));
 textureLoader.load('assets/space/clouds.png',t=>{t.colorSpace=THREE.SRGBColorSpace;clouds.material.map=t;clouds.material.needsUpdate=true;earthGroup.add(clouds);draw();});
 const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.39,64,40),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,uniforms:{},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),4.);gl_FragColor=vec4(.08,.42,.85,f*.7);}'}));earthGroup.add(atmosphere);
 const orbitGroup=new THREE.Group();world.add(orbitGroup);const orbits=[],anchors=[];
 for(let i=0;i<4;i++){
  const pivot=new THREE.Group();pivot.rotation.set(1.15+i*.17,.1+i*.14,-.29+i*.24);orbitGroup.add(pivot);
  const points=[];for(let j=0;j<=150;j++){const a=j/150*Math.PI*1.87;points.push(new THREE.Vector3(Math.cos(a)*(2.4+i*.13),Math.sin(a)*(2.4+i*.13),0));}
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:i===0?0xe28c37:0x909c92,transparent:true,opacity:i===0?.8:.3}));pivot.add(line);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.025,8,8),new THREE.MeshBasicMaterial({color:0xef8d38}));pivot.add(dot);
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.012,.055,5),dot.material);pivot.add(arrow);
  orbits.push({pivot,line,dot,arrow,radius:2.4+i*.13,phase:[2.6,.2,4.1,5.5][i]});anchors.push(new THREE.Vector3());
 }
 let seed=41;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const dustCount=1800,dustBase=new Float32Array(dustCount*3),dustPositions=new Float32Array(dustCount*3);
 for(let i=0;i<dustCount;i++){const y=random()*2-1,a=random()*Math.PI*2,r=1.45+random()*.25;dustBase[i*3]=Math.sqrt(1-y*y)*Math.cos(a)*r;dustBase[i*3+1]=y*r;dustBase[i*3+2]=Math.sqrt(1-y*y)*Math.sin(a)*r;}
 const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.009,color:0x9aaea9,transparent:true,opacity:.65,depthWrite:false}));world.add(dust);
 const positions=[];for(let i=0;i<700;i++)positions.push((random()-.5)*22,(random()-.5)*14,(random()-.5)*10-5);
 const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)),new THREE.PointsMaterial({size:.009,color:0x6d807c,transparent:true,opacity:.6}));scene.add(stars);
 const shock=new THREE.Mesh(new THREE.RingGeometry(1.4,1.405,128),new THREE.MeshBasicMaterial({color:0xe79344,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));shock.rotation.x=.9;world.add(shock);
 let off=document.documentElement.dataset.motion==='off',visible=true,mobile=false,mx=0,my=0,time=0,frame=0,last=0,progress=0,target=0,stage=-1;
 const projected=new THREE.Vector3(),earthCenter=new THREE.Vector3();
 const ns='http://www.w3.org/2000/svg',leaders=document.createElementNS(ns,'svg');leaders.setAttribute('class','orbit-leaders');leaders.setAttribute('aria-hidden','true');host.parentElement.insertBefore(leaders,document.querySelector('.satellites'));
 const paths=labels.map(()=>{const path=document.createElementNS(ns,'path');leaders.appendChild(path);return path;});
 function readProgress(){const span=story.offsetHeight-innerHeight;target=off?0:clamp(-story.getBoundingClientRect().top/Math.max(1,span));}
 function resize(){const w=host.clientWidth,h=host.clientHeight;mobile=w<700;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();readProgress();draw();}
 function draw(){
  const p=off?0:progress,approach=smooth(.08,.38,p),release=smooth(.38,.7,p),settle=smooth(.72,1,p),burst=Math.sin(smooth(.38,.8,p)*Math.PI);
  const scale=mobile?.53:1;world.scale.setScalar(scale*(1+approach*.47-release*.55+settle*.08));world.position.y=mobile?.73:.72;world.rotation.y=mx*.09;world.rotation.x=my*.035;
  earth.rotation.y=4.4+time*.025+p*1.5;clouds.rotation.y=earth.rotation.y+time*.008;earthGroup.rotation.z=-.16+p*.14;
  orbitGroup.rotation.y=p*.9+time*.025;orbitGroup.rotation.z=-p*.27;
  orbits.forEach((o,i)=>{const a=o.phase+time*.04+p*.8;o.dot.position.set(Math.cos(a)*o.radius,Math.sin(a)*o.radius,0);o.arrow.position.set(Math.cos(a+.08)*o.radius,Math.sin(a+.08)*o.radius,0);o.arrow.rotation.z=a+.08; o.line.material.opacity=(i===0?.75:.22)*(1-approach*.65+release*.65);o.pivot.scale.setScalar(1+burst*.38);});
  for(let i=0;i<dustCount;i++){const expansion=1+release*(1.4+(i%9)*.32);dustPositions[i*3]=dustBase[i*3]*expansion;dustPositions[i*3+1]=dustBase[i*3+1]*expansion;dustPositions[i*3+2]=dustBase[i*3+2]*expansion;}
  dustGeo.attributes.position.needsUpdate=true;dust.rotation.y=time*.04+p;dust.material.opacity=.55*(1-settle*.5);shock.scale.setScalar(1+release*5);shock.material.opacity=burst*.28;stars.rotation.y=p*.06+mx*.005;
  camera.position.x=mx*.08;camera.position.y=my*.05;renderer.render(scene,camera);
  world.getWorldPosition(earthCenter);earthCenter.project(camera);
  leaders.setAttribute('viewBox',`0 0 ${host.clientWidth} ${host.clientHeight}`);
  labels.forEach((label,i)=>{orbits[i].dot.getWorldPosition(anchors[i]);projected.copy(anchors[i]).project(camera);const w=host.clientWidth,h=host.clientHeight,size=label.offsetWidth;
   const placements=mobile?[[.09,.22],[.78,.19],[.06,.47],[.82,.46]]:[[.2,.27],[.77,.22],[.12,.47],[.85,.46]];
   const x=placements[i][0]*w+Math.sin(time*.15+i)*w*.008,y=placements[i][1]*h+Math.cos(time*.13+i)*h*.007;
   label.style.transform=`translate3d(${x-w/2}px,${y-h*.35}px,0)`;const opacity=off?1:1-approach*.92+release*.92;label.style.opacity=opacity;label.style.visibility=opacity<.15?'hidden':'visible';
   const ax=(projected.x*.5+.5)*w,ay=(-projected.y*.5+.5)*h;
   paths[i].setAttribute('d',`M${ax} ${ay} Q${x+size/2} ${ay} ${x+size/2} ${y-26}`);paths[i].style.opacity=opacity*.7;
  });
  story.style.setProperty('--journey',String(p));document.getElementById('orbit-progress').textContent=String(Math.round(p*100)).padStart(3,'0');
  const graph=[86,80,68,62,40,35,22,16,5],n=Math.min(7,Math.floor(p*8)),mix=p*8-n;document.getElementById('chart-dot').setAttribute('cx',String(p*1000));document.getElementById('chart-dot').setAttribute('cy',String(graph[n]+(graph[n+1]-graph[n])*mix));
  const next=p<.28?0:p<.58?1:2;if(next!==stage){stage=next;title.textContent=['FİKİRLERİN BİR DÜNYASI VAR.','YAKINDAN BAK.','HER PROJE, YENİ BİR YÖRÜNGE.'][stage];description.textContent=['Ben Muhammet. Web siteleri, otomasyonlar ve dijital deneyimler üretiyorum. Kaydır; projelerin yörüngesine gir.','Tasarım, kod ve hareket. Bir fikrin çalışan bir deneyime dönüşmesi için hepsi bir arada.','Yörüngedeki görsellere dokunarak siteleri açabilir, aşağıda tüm işlerimi inceleyebilirsin.'][stage];}
  host.dataset.progress=p.toFixed(3);
 }
 function animate(now){frame=0;if(off||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;progress+=(target-progress)*(1-Math.exp(-dt*9));draw();frame=requestAnimationFrame(animate);}
 function start(){if(!frame&&!off&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(animate);}}
 function stop(){cancelAnimationFrame(frame);frame=0;}
 new ResizeObserver(resize).observe(host);new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible){readProgress();start();}else stop();}).observe(host);
 window.addEventListener('scroll',readProgress,{passive:true});host.parentElement.addEventListener('pointermove',e=>{if(off||e.pointerType==='touch')return;mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;});host.parentElement.addEventListener('pointerleave',()=>{mx=my=0;});
 document.addEventListener('motionchange',e=>{off=e.detail;readProgress();if(off){stop();progress=0;draw();}else start();});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();host.classList.remove('scene-ready');story.style.height='100svh';labels.forEach(l=>l.style.visibility='hidden');});
 host.classList.add('scene-ready');resize();start();
}catch(e){document.getElementById('motion-toggle').hidden=true;story.style.height='100svh';labels.forEach(l=>l.hidden=true);}
