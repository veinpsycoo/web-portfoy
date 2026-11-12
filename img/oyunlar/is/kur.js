sessionStorage.setItem('__kat', `(async (path) => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const vis = () => [...document.querySelectorAll('.category-card')].filter(c => c.offsetParent);
  const log = [];
  for (const t of path) {
    let c = null;
    for (let i = 0; i < 20 && !c; i++) { c = vis().find(x => (x.dataset.title || x.textContent).trim() === t); if (!c) await w(300); }
    if (!c) { log.push('YOK ' + t + ' mevcut ' + vis().map(x => (x.dataset.title || x.textContent).trim()).join(';')); break; }
    c.click(); await w(700);
    const b = [...document.querySelectorAll('button')].filter(b => /Devam Et/.test(b.textContent) && b.offsetParent && !b.disabled).pop();
    if (b) { b.click(); log.push('ok ' + t); } else log.push('btnyok ' + t);
    await w(1500);
  }
  const s2 = document.querySelector('[name=IlanBasligi]');
  log.push('detay ' + !!(s2 && s2.offsetParent));
  log.push('kartlar ' + vis().map(x => (x.dataset.title || x.textContent).trim()).join(';'));
  return log.join(' | ').replace(/[^\\wçğıöşüÇĞİÖŞÜ .,;|-]/g, '');
})`);
sessionStorage.setItem('__yay', `(async (kod) => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const btn = re => [...document.querySelectorAll('button, a')].filter(b => re.test(b.textContent) && b.offsetParent && !b.disabled).pop();
  const gor = re => [...document.querySelectorAll('h1,h2,h3,h4,span,div,p')].some(e => e.children.length === 0 && re.test(e.textContent) && e.offsetParent);
  const V = JSON.parse(sessionStorage.getItem('__son'))[kod];
  const log = [kod];
  const net = document.querySelector('[name=IlanNetUcret]').value, fy = document.querySelector('[name=IlanUcreti]').value, bs = document.querySelector('[name=IlanBasligi]').value;
  log.push('fiyat ' + fy + ' net ' + net);
  if (bs !== V.baslik || Number(fy) !== V.fiyat || !(parseFloat(net) > 0)) return log.concat('DUR alan uyusmuyor').join(' | ');
  btn(/Sonraki Adım/).click(); await w(1500);
  let b = btn(/Hayır, Devam Et/); if (b) { b.click(); await w(1500); }
  if (!gor(/^Doping Seçimi$/) || !gor(/Seçim yapılmadı/)) return log.concat('DUR doping adimi yok ya da secim var').join(' | ');
  btn(/Sonraki Adım/).click(); await w(1500);
  const t = [...document.querySelectorAll('label, span, div, p')].filter(e => /okudum, kabul ediyorum/.test(e.textContent) && e.offsetParent).pop();
  if (!t) return log.concat('DUR onay metni yok').join(' | ');
  const kutu = () => { let p = t; for (let i = 0; i < 4 && p; i++) { const c = p.querySelector && p.querySelector('input[type=checkbox]'); if (c) return c; p = p.parentElement; } return null; };
  let cb = kutu(); if (!cb || !cb.checked) { t.click(); await w(500); cb = kutu(); }
  log.push('onay ' + (cb ? cb.checked : 'kutu-bulunamadi'));
  btn(/İlanı Yayınla/).click();
  let a = null; for (let i = 0; i < 30 && !a; i++) { await w(500); a = [...document.querySelectorAll('a')].find(x => /İlanı Görüntüle/.test(x.textContent) && x.offsetParent); }
  if (!a) return log.concat('DUR yayin onayi gorunmedi').join(' | ');
  const id = (a.getAttribute('href').match(/-(\\d+)\\.html/) || [0, '?'])[1];
  sessionStorage.setItem('__ids', (sessionStorage.getItem('__ids') || '') + ' ' + kod + ':' + id);
  log.push('YAYINDA ' + id);
  return log.join(' | ');
})`);
sessionStorage.setItem('__fn', `(async (kod, imgs) => {
  const v = JSON.parse(sessionStorage.getItem('__son'))[kod];
  const set = (el, val) => { const p = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(el, val); ['input', 'change', 'keyup', 'blur'].forEach(e => el.dispatchEvent(new Event(e, {bubbles: true}))); };
  set(document.querySelector('[name=IlanBasligi]'), v.baslik);
  const esc = s => s.replace(/[<>]/g, '');
  let h = '', ul = false;
  for (const l of v.aciklama.split('\\n')) { if (l.startsWith('- ')) { if (!ul) { h += '<ul>'; ul = true; } h += '<li>' + esc(l.slice(2)) + '</li>'; } else { if (ul) { h += '</ul>'; ul = false; } if (l) h += /:$/.test(l) ? '<p><b>' + esc(l) + '</b></p>' : '<p>' + esc(l) + '</p>'; } }
  if (ul) h += '</ul>';
  const a = document.querySelector('#ilan-aciklama'); a.focus(); a.innerHTML = h; ['input', 'keyup', 'change', 'blur'].forEach(e => a.dispatchEvent(new Event(e, {bubbles: true})));
  const sel = document.querySelector('[name=IlanTeslimati]'); const o = [...sel.options].find(x => x.text.trim().startsWith(v.gun + ' ')); set(sel, o.value);
  set(document.querySelector('[name=IlanUcreti]'), String(v.fiyat));
  let ni = 0;
  if (imgs && imgs.length) { const dt = new DataTransfer(); for (const u of imgs) { const b = await (await fetch(u)).blob(); dt.items.add(new File([b], u.split('/').pop(), {type: b.type})); } const fi = document.querySelector('#img-input'); fi.files = dt.files; fi.dispatchEvent(new Event('change', {bubbles: true})); ni = dt.files.length; }
  await new Promise(r => setTimeout(r, 1500));
  const hid = document.querySelector('[name=IlanIcerigi]');
  return [kod, 'baslik', document.querySelector('[name=IlanBasligi]').value.length, 'aciklama', a.innerText.length, 'gizli', hid ? hid.value.length : -1, 'teslim', sel.options[sel.selectedIndex].text.trim(), 'fiyat', document.querySelector('[name=IlanUcreti]').value, 'net', document.querySelector('[name=IlanNetUcret]').value, 'img', ni].join(' ');
})`);
sessionStorage.setItem('__kat', sessionStorage.getItem('__kat').replace(".trim() === t)", ".trim().startsWith(t))"));
sessionStorage.setItem('__yy', `(async (kod, dur) => {
  const w = ms => new Promise(r => setTimeout(r, ms));
  const anla = () => { const b = [...document.querySelectorAll('button')].find(x => /Anlad/.test(x.textContent) && x.offsetParent); if (b) b.click(); return !!b; };
  if (anla()) await w(1000);
  const c = [...document.querySelectorAll('#step-2 *')].filter(e => e.children.length === 0 && /^\\d+\\/10$/.test(e.textContent.trim())).map(e => e.textContent.trim()).join(' ');
  if (c !== '3/10') return 'DUR gorsel ' + c;
  if (!/revize/.test(document.querySelector('[name=IlanIcerigi]').value)) return 'DUR revize yok';
  let r = '';
  for (let i = 0; i < 5; i++) {
    r = await eval(sessionStorage.getItem('__yay'))(kod, dur);
    if (!/DUR doping/.test(r)) return r.replace(/[&=]/g, '~');
    const m = [...document.querySelectorAll('.swal2-popup')].filter(e => e.offsetParent).map(e => e.innerText.replace(/\\s+/g, ' ').slice(0, 150)).join(' ## ');
    if (!/kleniyor/.test(m)) return (r + ' MODAL ' + m).replace(/[&=]/g, '~');
    anla(); await w(5000);
  }
  return r;
})`);
['__kat','__yay','__fn','__yy'].map(k=>k+':'+(sessionStorage.getItem(k)||'').length).join(' ')