document.documentElement.classList.add('js');
(() => {
 const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
 function closeMenu(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');}
 menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
 nav?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){closeMenu();menu.focus();}});
 document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
 matchMedia('(min-width:1251px)').addEventListener('change',closeMenu);
 nav?.querySelectorAll('a').forEach(a=>{if(new URL(a.href).pathname===location.pathname&&!a.hash)a.setAttribute('aria-current','page');});
 const archive=document.querySelector('#own-projects'),clients=document.querySelector('#client-projects'),note=document.querySelector('#filter-note');
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
  const f=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  clients.hidden=f==='kendi';archive.hidden=f==='musteri';archive.open=f==='kendi';
  note.textContent=f==='kendi'?archive.querySelectorAll('.project').length+' kişisel proje':f==='musteri'?clients.querySelectorAll('.project').length+' müşteri projesi':'Önce müşteri projeleri';
 }));
 document.querySelectorAll('[data-video-filter]').forEach(b=>b.addEventListener('click',()=>{
  const f=b.dataset.videoFilter;document.querySelectorAll('[data-video-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  document.querySelectorAll('[data-video-kind]').forEach(c=>{c.hidden=f!=='all'&&!c.dataset.videoKind.split(' ').includes(f);if(c.hidden)c.querySelector('video').pause();});
 }));
 document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>document.querySelectorAll('video').forEach(x=>{if(x!==v)x.pause();})));
 const motion=document.querySelector('#motion-toggle');
 function setMotion(off){
  document.documentElement.dataset.motion=off?'off':'on';
  motion?.setAttribute('aria-pressed',String(off));
  if(motion)motion.textContent=off?'Hareketi sürdür ▷':'Hareketi durdur Ⅱ';
  document.dispatchEvent(new CustomEvent('motionchange',{detail:off}));
 }
 // Start immediately on every visit; pause remains an explicit in-page control.
 setMotion(false);
 motion?.addEventListener('click',()=>setMotion(document.documentElement.dataset.motion!=='off'));
})();
