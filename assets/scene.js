import * as THREE from './vendor/three.module.js';
const host=document.getElementById('scene'),canvas=document.getElementById('universe');
// Static layered composition remains visible if WebGL is unavailable.
try {
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x080a0d,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(0,.1,7.8);
 const group=new THREE.Group();scene.add(group);
 scene.add(new THREE.AmbientLight(0x6893c9,2));
 const key=new THREE.DirectionalLight(0xc6e0ff,4);key.position.set(-3,4,5);scene.add(key);
 const side=new THREE.PointLight(0x3884ff,70);side.position.set(3,0,2);scene.add(side);
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.24,4),new THREE.MeshPhysicalMaterial({color:0x193552,metalness:.7,roughness:.28,clearcoat:1,flatShading:true}));group.add(core);
 const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(1.31,2),new THREE.MeshBasicMaterial({color:0x80baff,wireframe:true,transparent:true,opacity:.22}));group.add(wire);
 const lattice=new THREE.Group();group.add(lattice);
 for(let i=0;i<15;i++){const lat=(i/14)*Math.PI,r=Math.sin(lat)*1.37;if(r<.01)continue;const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.004,4,90),new THREE.MeshBasicMaterial({color:0x96c8f5,transparent:true,opacity:.22}));ring.rotation.x=Math.PI/2;ring.position.y=Math.cos(lat)*1.37;lattice.add(ring);}
 for(let i=0;i<9;i++){const meridian=new THREE.Mesh(new THREE.TorusGeometry(1.37,.004,4,90),new THREE.MeshBasicMaterial({color:0xa2cfff,transparent:true,opacity:.22}));meridian.rotation.y=i*Math.PI/9;lattice.add(meridian);}
 const orbitGroup=new THREE.Group();orbitGroup.rotation.set(.65,.1,-.4);group.add(orbitGroup);
 for(let i=0;i<3;i++){const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.85+i*.23,.009-i*.002,6,180),new THREE.MeshBasicMaterial({color:i===0?0xc5dfff:0x608cc3,transparent:true,opacity:i===0?.85:.35}));orbit.rotation.x=Math.PI/2+i*.16;orbitGroup.add(orbit);}
 const nodes=new THREE.Group();group.add(nodes);
 for(let i=0;i<12;i++){const a=i*Math.PI*2/12;const node=new THREE.Mesh(new THREE.SphereGeometry(i%3===0?.045:.022,8,8),new THREE.MeshBasicMaterial({color:0xc0ddff}));node.position.set(Math.cos(a)*1.85,Math.sin(a)*.7,Math.sin(a)*1.7);nodes.add(node);}
 let seed=42;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 const positions=[];for(let i=0;i<320;i++)positions.push((random()-.5)*13,(random()-.5)*10,(random()-.5)*7-3);
 const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xa0b9dd,size:.014,transparent:true,opacity:.6}));scene.add(stars);
 let off=document.documentElement.dataset.motion==='off',visible=true,mx=0,my=0,scroll=0,frame=0,last=0,time=0;
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderStill();}
 function renderStill(){renderer.render(scene,camera);}
 function animate(now){frame=0;if(off||!visible||document.hidden)return;const dt=Math.min((now-last)/1000,.05);last=now;time+=dt;
  group.rotation.y=time*.12+mx*.13+scroll*.5;group.rotation.x=.12+my*.09;orbitGroup.rotation.z=-.4+Math.sin(time*.16)*.13;
  stars.rotation.y=time*.015;camera.position.z=7.8+scroll*.8;group.position.y=Math.sin(time*.7)*.045;renderer.render(scene,camera);frame=requestAnimationFrame(animate);
 }
 function start(){if(!frame&&!off&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(animate);}}
 function stop(){cancelAnimationFrame(frame);frame=0;}
 new ResizeObserver(resize).observe(host);
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)start();else stop();},{rootMargin:'100px'}).observe(host);
 host.addEventListener('pointermove',e=>{if(off||e.pointerType==='touch')return;const r=host.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5;host.style.setProperty('--mx',mx);host.style.setProperty('--my',my);});
 host.addEventListener('pointerleave',()=>{mx=my=0;host.style.setProperty('--mx',0);host.style.setProperty('--my',0);});
 let queued=false;window.addEventListener('scroll',()=>{if(queued||off||!visible)return;queued=true;requestAnimationFrame(()=>{scroll=Math.min(window.scrollY/650,1);host.style.setProperty('--scroll',scroll);queued=false;});},{passive:true});
 document.addEventListener('motionchange',e=>{off=e.detail;if(off){stop();host.style.setProperty('--scroll',0);host.style.setProperty('--mx',0);host.style.setProperty('--my',0);}else start();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();host.classList.remove('scene-ready');});
 host.classList.add('scene-ready');resize();start();
} catch(e) { document.getElementById('motion-toggle').hidden=true; }
