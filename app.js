const D = window.DATA;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const inr = n => n == null ? '—' : '₹' + Math.round(n).toLocaleString('en-IN');
const lakh = n => n >= 99500 ? '₹' + (n / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L' : '₹' + Math.round(n / 1000) + 'k';
const median = a => { a = a.filter(x => x != null).sort((x, y) => x - y); if (!a.length) return null; const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const size = b => b == null ? '' : b <= 3 ? 's' : b < 5 ? 'm' : 'l';

/* ---------- routing ---------- */
function route() {
  const id = (location.hash || '#home').slice(1).split('?')[0] || 'home';
  const page = document.getElementById(id) ? id : 'home';
  $$('.page').forEach(p => p.classList.toggle('on', p.id === page));
  $$('nav a').forEach(a => a.classList.toggle('on', a.dataset.tab === page));
  window.scrollTo({ top: 0 });
  requestAnimationFrame(() => { movePill($('.nav'), $('.nav-pill:not(.sub-pill)'), $('nav a.on')); onPage(page); });
}
window.addEventListener('hashchange', route);

/* ---------- home ---------- */
const zones = ['Khopoli', 'Lonavala', 'Karjat'];
const brandsN = new Set(D.villas.filter(v => v.brand !== 'Independent').map(v => v.brand)).size;
$('#heroStats').innerHTML = `I compared <b data-n="${D.villas.length}">${D.villas.length}</b> villas and <b data-n="${D.rent.length}">${D.rent.length}</b> rentals from <b data-n="${brandsN}">${brandsN}</b> brands across <b data-n="3">3</b> locations.`;

$('#locCards').innerHTML = zones.map(z => {
  const v = D.villas.filter(x => x.zone === z), r = D.rent.filter(x => x.zone === z);
  const mp = median(v.filter(x => !x.est).map(x => x.price)), mr = median(r.map(x => x.rent));
  const nb = new Set(v.filter(x => x.brand !== 'Independent').map(x => x.brand)).size;
  return `<a class="glass card loc lens" data-zone="${z}" tabindex="0">
    <h3>${z}</h3>
    <div class="rows">
      <div><b data-n="${v.length}">${v.length}</b><span>villas</span></div>
      <div><b data-n="${r.length}">${r.length}</b><span>rentals</span></div>
      <div><b>${lakh(mp)}</b><span>median per night</span></div>
      <div><b>${lakh(mr)}</b><span>median rent</span></div>
    </div>
    <span class="go">${nb} brands · View data →</span></a>`;
}).join('');
$$('.loc').forEach(el => el.onclick = () => openVillas({ vzone: el.dataset.zone }));

const cats = [
  ['Brand villas', D.villas.filter(v => v.brand !== 'Independent').length, { vop: 'b' }],
  ['Independent villas', D.villas.filter(v => v.brand === 'Independent').length, { vop: 'i' }],
  ['1–3 BHK', D.villas.filter(v => size(v.beds) === 's').length, { vsize: 's' }],
  ['4 BHK', D.villas.filter(v => size(v.beds) === 'm').length, { vsize: 'm' }],
  ['5+ BHK', D.villas.filter(v => size(v.beds) === 'l').length, { vsize: 'l' }],
  ['With private pool', D.villas.filter(v => v.pool === 'Yes').length, { vpool: true }],
  ['With reviews', D.villas.filter(v => v.reviews).length, { vrev: true }],
  ['Rentals', D.rent.length, null],
];
$('#catCards').innerHTML = cats.map(([l, n], i) => `<button class="glass cat lens" data-i="${i}"><b data-n="${n}">${n}</b><span>${l}</span></button>`).join('');
$$('.cat').forEach(el => el.onclick = () => { const f = cats[+el.dataset.i][2]; f ? openVillas(f) : openSub('rent'); });

/* ---------- tickers ---------- */
const tick = (el, items) => { const h = items.map(t => `<span>${t}</span>`).join(''); el.innerHTML = h + h; };
tick($('#tick1'), D.villas.filter(v => !v.est).sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 60).map(v => `${esc(v.name)} <i>${v.zone} · ${inr(v.price)}</i>`));
tick($('#tick2'), D.rent.filter(r => r.rent >= 15000).map(r => `${r.beds} BHK ${esc(r.type.toLowerCase())}, ${esc(r.area)} <i>${inr(r.rent)} / month</i>`));

/* ---------- dataset previews ---------- */
const prev = (rows, cols) => `<table class="mini"><thead><tr>${cols.map(c => `<th class="${c[2] ? 'num' : ''}">${c[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${c[2] ? 'num' : ''}">${c[1](r)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const topV = D.villas.filter(v => !v.est && v.reviews && v.beds >= 4).sort((a, b) => b.reviews - a.reviews).slice(0, 4);
const furn = D.rent.filter(r => r.furnished === 'Fully').sort((a, b) => b.rent - a.rent).slice(0, 4);
const sMax = Math.max(...D.seasons.map(s => s.idx));
const dsets = [
  { k: 'villas', t: 'Villas', n: D.villas.length, src: 'Brand sites, Goibibo, Booking.com, MakeMyTrip, Airbnb', p: prev(topV, [['Villa', r => esc(r.name.length > 26 ? r.name.slice(0, 25) + '…' : r.name)], ['BHK', r => r.beds, 1], ['Per night', r => inr(r.price), 1]]) },
  { k: 'rent', t: 'Rentals', n: D.rent.length, src: '99acres, Housing.com, Mitula, Nestoria, OLX', p: prev(furn, [['Area', r => esc(String(r.area).slice(0, 22))], ['BHK', r => r.beds, 1], ['Rent', r => inr(r.rent), 1]]) },
  { k: 'market', t: 'Market bookings', n: D.market.length, src: 'AirROI · 770+ listings · Nov 2025–Oct 2026', p: prev(D.market.filter(m => m.market === 'Lonavala'), [['Lonavala', r => r.size], ['Price', r => inr(r.adr), 1], ['Booked', r => r.occ + '%', 1]]) },
  { k: 'market', t: 'Seasons', n: 12, src: 'AirROI monthly data · Lonavala', p: `<div class="spark">${D.seasons.map(s => `<i title="${s.m}" style="height:${Math.round(s.idx / sMax * 100)}%" class="${s.idx === sMax ? 'top' : ''}"></i>`).join('')}</div><div class="sparkl"><span>Jan</span><span>Dec</span></div>` },
  { k: 'brands', t: 'Brands', n: D.brands.length, src: 'Ranked by fit for this house', p: prev(D.brands.slice(0, 4), [['Brand', r => esc(r.brand)], ['Tier', r => r.tier], ['Villas', r => r.listings, 1]]) },
];
$('#dsets').innerHTML = dsets.map((d, i) => `<button class="glass ds lens ${i === 0 ? 'wide' : ''}" data-k="${d.k}"><div class="dsh"><h3>${d.t}</h3><b data-n="${d.n}">${d.n}</b></div><p class="src">${d.src}</p>${d.p}<span class="go">Open dataset →</span></button>`).join('');
$$('.ds').forEach(el => el.onclick = () => { if (el.dataset.k === 'villas') openVillas({}); else openSub(el.dataset.k); });

/* ---------- generic sortable table ---------- */
function makeTable(el, cols, rows, state) {
  const sorted = [...rows];
  if (state && state.key) {
    const c = cols.find(c => c.k === state.key);
    const val = r => c.sv ? c.sv(r) : r[c.k];
    sorted.sort((a, b) => { const x = val(a), y = val(b); if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : x < y ? -1 : 0) * state.dir; });
  }
  el.innerHTML = `<thead><tr>${cols.map(c => `<th class="${c.num ? 'num' : ''} ${state ? '' : 'ns'}" data-k="${c.k}">${c.h}${state && state.key === c.k ? `<span class="ar">${state.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('')}</tr></thead>
  <tbody>${sorted.map(r => `<tr class="${r._hl ? 'hl' : ''}">${cols.map(c => `<td class="${c.num ? 'num' : ''} ${c.wrap ? 'wrap' : ''}">${c.f ? c.f(r) : esc(r[c.k] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody>`;
  if (state) el.querySelectorAll('th').forEach(th => th.onclick = () => {
    state.dir = state.key === th.dataset.k ? -state.dir : 1; state.key = th.dataset.k; state.render();
  });
}
const link = u => u ? `<a class="view" href="${esc(u)}" target="_blank" rel="noopener">View ↗</a>` : '<span class="dim">—</span>';

/* ---------- villas ---------- */
const brandList = [...new Set(D.villas.map(v => v.brand))].sort();
$('#vbrand').innerHTML += brandList.map(b => `<option>${esc(b)}</option>`).join('');
const vCols = [
  { k: 'name', h: 'Villa', wrap: 1, f: r => `${esc(r.name)}` },
  { k: 'zone', h: 'Location' }, { k: 'area', h: 'Area', wrap: 1 }, { k: 'brand', h: 'Brand' },
  { k: 'beds', h: 'BHK', num: 1, f: r => r.beds ?? '—' }, { k: 'guests', h: 'Guests', num: 1 },
  { k: 'price', h: 'Price / night', num: 1, f: r => inr(r.price) + (r.est ? '<span class="pill">est.</span>' : '') },
  { k: 'pool', h: 'Pool' }, { k: 'meals', h: 'Meals' },
  { k: 'rating', h: 'Rating /10', num: 1, f: r => r.rating ?? '—' }, { k: 'reviews', h: 'Reviews', num: 1, f: r => r.reviews ?? '—' },
  { k: 'link', h: 'Link', f: r => link(r.link) },
];
const vState = { key: 'price', dir: -1, render: renderVillas };
function renderVillas() {
  const q = $('#vq').value.trim().toLowerCase(), z = $('#vzone').value, s = $('#vsize').value, op = $('#vop').value, br = $('#vbrand').value;
  const [lo, hi] = ($('#vprice').value || '0-1e12').split('-').map(Number);
  const rows = D.villas.filter(v =>
    (!q || (v.name + ' ' + v.area + ' ' + v.brand).toLowerCase().includes(q)) && (!z || v.zone === z) && (!s || size(v.beds) === s) &&
    (!op || (op === 'b' ? v.brand !== 'Independent' : v.brand === 'Independent')) && (!br || v.brand === br) &&
    (v.price == null ? !$('#vprice').value : v.price >= lo && v.price < hi) &&
    (!$('#vpool').checked || v.pool === 'Yes') && (!$('#vrev').checked || v.reviews) && (!$('#vreal').checked || !v.est));
  $('#vcount').innerHTML = `<b>${rows.length}</b> of ${D.villas.length} villas · median <b>${inr(median(rows.filter(r => !r.est).map(r => r.price)))}</b> per night`;
  makeTable($('#vtable'), vCols, rows, vState);
}
['#vq', '#vzone', '#vsize', '#vop', '#vbrand', '#vprice', '#vpool', '#vrev', '#vreal'].forEach(id => $(id).addEventListener('input', renderVillas));

/* ---------- rentals ---------- */
$('#rtype').innerHTML += [...new Set(D.rent.map(r => r.type))].sort().map(t => `<option>${esc(t)}</option>`).join('');
const rCols = [
  { k: 'zone', h: 'Location' }, { k: 'area', h: 'Area', wrap: 1 }, { k: 'type', h: 'Type' }, { k: 'beds', h: 'BHK', num: 1 },
  { k: 'furnished', h: 'Furnished' }, { k: 'rent', h: 'Rent / month', num: 1, f: r => inr(r.rent) },
  { k: 'sqft', h: 'Size (sq ft)', num: 1, f: r => r.sqft ? r.sqft.toLocaleString('en-IN') : '—' },
  { k: 'psf', h: '₹ / sq ft', num: 1, f: r => r.psf ?? '—' }, { k: 'link', h: 'Link', f: r => link(r.link) },
];
const rState = { key: 'rent', dir: -1, render: renderRent };
function renderRent() {
  const q = $('#rq').value.trim().toLowerCase(), z = $('#rzone').value, t = $('#rtype').value, fu = $('#rfur').value;
  const [lo, hi] = ($('#rprice').value || '0-1e12').split('-').map(Number);
  const rows = D.rent.filter(r => (!q || (r.area + ' ' + r.type).toLowerCase().includes(q)) && (!z || r.zone === z) && (!t || r.type === t) && (!fu || r.furnished === fu) && r.rent >= lo && r.rent < hi);
  $('#rcount').innerHTML = `<b>${rows.length}</b> of ${D.rent.length} rentals · median <b>${inr(median(rows.map(r => r.rent)))}</b> per month`;
  makeTable($('#rtable'), rCols, rows, rState);
}
['#rq', '#rzone', '#rtype', '#rfur', '#rprice'].forEach(id => $(id).addEventListener('input', renderRent));

/* ---------- market & brands ---------- */
makeTable($('#mtable'), [
  { k: 'market', h: 'Market' }, { k: 'size', h: 'Size' }, { k: 'listings', h: 'Listings', num: 1 },
  { k: 'adr', h: 'Avg price / night', num: 1, f: r => inr(r.adr) }, { k: 'occ', h: 'Nights booked', num: 1, f: r => r.occ + '%' },
  { k: 'rev', h: 'Avg revenue / year', num: 1, f: r => inr(r.rev) }], D.market, { key: 'adr', dir: -1, render() { } });
makeTable($('#stable'), [
  { k: 'm', h: 'Month' }, { k: 'occ', h: 'Nights booked', num: 1, f: r => r.occ.toFixed(1) + '%' },
  { k: 'adr', h: 'Avg price / night', num: 1, f: r => inr(r.adr) }, { k: 'idx', h: 'Earnings vs average', num: 1, f: r => (r.idx * 100).toFixed(0) + '%' }], D.seasons);
const bState = { key: 'score', dir: -1, render: renderBrands };
function renderBrands() {
  const q = $('#bq').value.trim().toLowerCase(), t = $('#btier').value;
  makeTable($('#btable'), [
    { k: 'brand', h: 'Brand' }, { k: 'tier', h: 'Tier' }, { k: 'listings', h: 'Villas', num: 1 }, { k: 'khopoli', h: 'In Khopoli', num: 1 },
    { k: 'big', h: '5+ BHK', num: 1 }, { k: 'perbed', h: '₹ per bedroom-night', num: 1, f: r => inr(r.perbed) },
    { k: 'rating', h: 'Best rating', num: 1, f: r => r.rating ?? '—' }, { k: 'score', h: 'Fit score', num: 1 }],
    D.brands.filter(b => (!q || b.brand.toLowerCase().includes(q)) && (!t || b.tier === t)), bState);
}
['#bq', '#btier'].forEach(id => $(id).addEventListener('input', renderBrands));

/* ---------- data navigation ---------- */
function openSub(sub) {
  $$('.subtabs button').forEach(b => b.classList.toggle('on', b.dataset.sub === sub));
  $$('.sub').forEach(s => s.hidden = s.id !== 'sub-' + sub);
  requestAnimationFrame(() => movePill($('.subtabs'), $('.sub-pill'), $('.subtabs button.on')));
  if (location.hash !== '#data') location.hash = 'data';
}
$$('.subtabs button').forEach(b => b.onclick = () => openSub(b.dataset.sub));
function resetV() { ['#vq', '#vzone', '#vsize', '#vop', '#vbrand', '#vprice'].forEach(i => $(i).value = ''); ['#vpool', '#vrev', '#vreal'].forEach(i => $(i).checked = false); }
function openVillas(f) {
  resetV();
  Object.entries(f).forEach(([k, v]) => typeof v === 'boolean' ? $('#' + k).checked = v : $('#' + k).value = v);
  renderVillas(); openSub('villas');
}
$$('.reset').forEach(b => b.onclick = () => {
  if (b.dataset.reset === 'v') { resetV(); renderVillas(); }
  else { ['#rq', '#rzone', '#rtype', '#rfur', '#rprice'].forEach(i => $(i).value = ''); renderRent(); }
});

/* ---------- analysis ---------- */
const opts = [
  ['Luxury brand – full house', '₹45,000', 139000, 190000, 242000, 1],
  ['StayVista / SaffronStays – full house', '₹35,000', 118000, 162000, 207000],
  ['Night stay, run by you – full house', '₹35,000', 98000, 144000, 190000],
  ['Rent Floor 1 + Floors 2–3 via brand', '₹24,000 + ₹38k rent', 111000, 140000, 169000],
  ['Lease whole house', '₹1.5L rent / month', 124000, 133000, 142000],
  ['Rent Floor 1 + Floors 2–3, run by you', '₹24,000 + ₹38k rent', 92000, 123000, 153000],
  ['Rent Floors 1–2 + Floor 3 via brand', '₹11,000 + ₹76k rent', 102000, 117000, 131000],
  ['Rent all floors separately', '₹38k rent / floor', 92000, 100000, 111000],
].map(([m, p, l, n, g, hl]) => ({ m, p, l, n, g, d: n / 30.4, _hl: hl }));
makeTable($('#optTable'), [
  { k: 'm', h: 'Model', wrap: 1 }, { k: 'p', h: 'Guest pays' },
  { k: 'l', h: 'Low month', num: 1, f: r => lakh(r.l) }, { k: 'n', h: 'Normal month', num: 1, f: r => `<b>${lakh(r.n)}</b>` },
  { k: 'g', h: 'Good month', num: 1, f: r => lakh(r.g) }, { k: 'd', h: 'Per day', num: 1, f: r => inr(r.d) }], opts);

makeTable($('#unitTable'), [
  { k: 'unit', h: 'Unit', wrap: 1 }, { k: 'price', h: 'Per night', num: 1, f: r => inr(r.price) },
  { k: 'normal', h: 'Night stay / month', num: 1, f: r => `<b>${lakh(r.normal)}</b>` },
  { k: 'range', h: 'Low – good', num: 1, f: r => `${lakh(r.low)} – ${lakh(r.good)}` },
  { k: 'rentnet', h: 'Rent / month', num: 1, f: r => lakh(r.rentnet) },
  { k: 'extra', h: 'Stay vs rent', num: 1, f: r => { const x = r.normal - r.rentnet; return Math.abs(x) < 1500 ? '≈ same' : (x >= 0 ? '+' : '−') + lakh(Math.abs(x)); } }], D.units);

const mx = Math.max(...D.seasons.map(s => s.idx)), mn = Math.min(...D.seasons.map(s => s.idx));
$('#bars').innerHTML = D.seasons.map(s => `<div class="bar ${s.idx === mx ? 'top' : ''}"><b>${Math.round(s.idx * 100)}%</b><i style="height:${(s.idx - mn * 0.7) / (mx - mn * 0.7) * 78 + 6}%"></i><span>${s.m}</span></div>`).join('');

makeTable($('#riskTable'), [
  { k: 'setup', h: 'Option', wrap: 1 }, { k: 'exp', h: 'Expected / month', num: 1, f: r => `<b>${lakh(r.exp)}</b>` },
  { k: 'bad', h: 'Bad year / month', num: 1, f: r => lakh(r.bad) },
  { k: 'below', h: 'Chance below lease', num: 1, f: r => r.setup === 'Lease whole house' ? '—' : r.below + '%' },
  { k: 'two', h: 'Chance of ₹2L+', num: 1, f: r => r.two + '%' }], D.risk.map((r, i) => ({ ...r, _hl: i === 0 })));

makeTable($('#pcTable'), [
  { k: 'Size', h: 'Size' }, { k: 'model', h: 'My model', num: 1, f: r => inr(r.model) },
  { k: 'real', h: 'Real booked average', num: 1, f: r => inr(r.real) }, { k: 'diff', h: 'Difference', num: 1 }], D.price_check);



/* ---------- motion ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function movePill(host, pill, el) {
  if (!host || !pill || !el) return;
  const h = host.getBoundingClientRect(), r = el.getBoundingClientRect();
  pill.style.width = r.width + 'px'; pill.style.height = r.height + 'px';
  pill.style.transform = `translate(${r.left - h.left}px, ${r.top - h.top}px)`;
}
function countUp(root) {
  if (reduce) return;
  root.querySelectorAll('[data-n]').forEach(el => {
    const end = +el.dataset.n, t0 = performance.now(), dur = 1400;
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(2, -10 * p); el.textContent = Math.round(end * (p === 1 ? 1 : e)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
let homeDone = false;
function onPage(page) {
  if (page === 'home' && !homeDone) { homeDone = true; countUp($('#home')); }
  if (page === 'analysis') { const b = $('#bars'); b.classList.remove('go'); new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { b.classList.add('go'); o.disconnect(); } }, { threshold: .35 }).observe(b); }
}
function motion() {
  // headline words rise in, one after another
  const h = $('.hero h1');
  if (h && !reduce) {
    let i = 0;
    const wrap = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) frag.append(w); else { const s = document.createElement('span'); s.className = 'word'; s.style.animationDelay = (0.15 + i++ * 0.08) + 's'; s.textContent = w; frag.append(s); } });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') wrap(n);
    });
    wrap(h);
  }
  // specular light follows the pointer on interactive glass
  document.addEventListener('pointermove', e => {
    const el = e.target.closest('.lens'); if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  $$('.lens').forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } }));
  // hills drift apart as you scroll
  if (!reduce) {
    const layers = [['.l1', .05], ['.l2', .12], ['.l3', .2], ['.sun', .3]].map(([s, f]) => [$(s), f]);
    addEventListener('scroll', () => { const y = scrollY; layers.forEach(([el, f]) => el && (el.style.transform = `translateY(${y * f}px)`)); }, { passive: true });
  }
  addEventListener('resize', () => { movePill($('.nav'), $('.nav-pill:not(.sub-pill)'), $('nav a.on')); movePill($('.subtabs'), $('.sub-pill'), $('.subtabs button.on')); });
  document.fonts && document.fonts.ready.then(() => { movePill($('.nav'), $('.nav-pill:not(.sub-pill)'), $('nav a.on')); movePill($('.subtabs'), $('.sub-pill'), $('.subtabs button.on')); });
}

renderVillas(); renderRent(); renderBrands(); motion(); route();
