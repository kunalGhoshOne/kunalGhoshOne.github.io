// Five hand-drawn, animated icons. Each builds its SVG and returns a GSAP timeline.
const NS = 'http://www.w3.org/2000/svg';
function el(parent, tag, attrs, text) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text) n.textContent = text;
  parent.appendChild(n); return n;
}
const len = p => p.getTotalLength();
function draw(p) { const l = len(p); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; return l; }

// KQueue: a loom weaving three threads at the same time
function loom(svg, gsap) {
  el(svg, 'line', { x1: 34, y1: 52, x2: 206, y2: 52, class: 's', 'stroke-width': 4 });
  el(svg, 'line', { x1: 34, y1: 192, x2: 206, y2: 192, class: 's', 'stroke-width': 4 });
  el(svg, 'line', { x1: 44, y1: 40, x2: 44, y2: 204, class: 's' });
  el(svg, 'line', { x1: 196, y1: 40, x2: 196, y2: 204, class: 's' });
  for (let x = 62; x <= 178; x += 13) el(svg, 'line', { x1: x, y1: 52, x2: x, y2: 192, class: 't', opacity: .4 });
  const ys = [92, 122, 152], cls = ['g', 's', 'gl'];
  const threads = [], shuttles = [];
  ys.forEach((y, i) => {
    let d = `M50 ${y}`;
    for (let x = 62, k = 0; x <= 190; x += 13, k++) d += ` Q${x - 6.5} ${y + ((k + i) % 2 ? -6 : 6)} ${x} ${y}`;
    const p = el(svg, 'path', { d, class: cls[i] });
    threads.push(p);
    shuttles.push(el(svg, 'rect', { x: -9, y: -4, width: 18, height: 8, rx: 4, class: 'fillp', transform: `translate(50 ${y})` }));
  });
  const tl = gsap.timeline({ repeat: -1, paused: true, repeatDelay: .3 });
  threads.forEach((p, i) => {
    const l = draw(p);
    tl.fromTo(p, { strokeDashoffset: l }, { strokeDashoffset: 0, duration: 2.2, ease: 'none' }, 0);
    const pr = { v: 0 };
    tl.fromTo(pr, { v: 0 }, { v: 1, duration: 2.2, ease: 'none', onUpdate() { const pt = p.getPointAtLength(pr.v * l); shuttles[i].setAttribute('transform', `translate(${pt.x} ${pt.y})`); } }, 0);
  });
  tl.to(threads, { opacity: 0, duration: .5 }, 2.6).set(threads, { opacity: 1, strokeDashoffset: (i, t) => len(t) }, 3.1);
  return tl;
}

// GateSSH: one beam enters the arch and is routed to one of three rooms
function arch(svg, gsap) {
  el(svg, 'line', { x1: 20, y1: 200, x2: 222, y2: 200, class: 't', opacity: .5 });
  el(svg, 'path', { d: 'M38 200 V112 A44 44 0 0 1 126 112 V200', class: 's', 'stroke-width': 3 });
  el(svg, 'path', { d: 'M52 200 V114 A30 30 0 0 1 112 114 V200', class: 't', opacity: .5 });
  el(svg, 'circle', { cx: 82, cy: 96, r: 5, class: 's' });
  el(svg, 'line', { x1: 82, y1: 101, x2: 82, y2: 108, class: 's' });
  const rooms = [[192, 62], [200, 136], [186, 184]].map(([x, y]) => el(svg, 'rect', { x: x - 11, y: y - 15, width: 22, height: 28, rx: 3, class: 'fillp' }));
  const routes = [
    'M0 150 L82 150 C140 150 150 62 181 62',
    'M0 150 L82 150 C140 150 150 136 189 136',
    'M0 150 L82 150 C130 150 150 184 175 184'
  ].map(d => el(svg, 'path', { d, class: 't', opacity: .55 }));
  el(svg, 'line', { x1: 0, y1: 150, x2: 82, y2: 150, class: 'g' });
  const dot = el(svg, 'circle', { r: 5, class: 'dot', cx: 0, cy: 150 });
  const tl = gsap.timeline({ repeat: -1, paused: true });
  [0, 1, 2, 1, 0, 2].forEach((k, i) => {
    const p = routes[k], l = len(p), pr = { v: 0 };
    tl.fromTo(pr, { v: 0 }, { v: 1, duration: .9, ease: 'power1.inOut', onUpdate() { const pt = p.getPointAtLength(pr.v * l); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); } });
    tl.to(rooms[k], { attr: { fill: '#E8B65A' }, duration: .15 }).to(rooms[k], { attr: { fill: '#FFFDF8' }, duration: .5 }, '+=.15');
  });
  return tl;
}

// imap-smtp: an envelope folds into a paper plane, which leaves three trails
function plane(svg, gsap) {
  const env = el(svg, 'g', {});
  el(env, 'rect', { x: 70, y: 92, width: 100, height: 64, rx: 4, class: 'fillp' });
  el(env, 'path', { d: 'M70 94 L120 130 L170 94', class: 's' });
  const pl = el(svg, 'g', { opacity: 0 });
  el(pl, 'path', { d: 'M-34 6 L36 -20 L4 30 L-4 12 Z', class: 'fillp' });
  el(pl, 'path', { d: 'M36 -20 L-4 12', class: 's' });
  const trail = el(svg, 'path', { d: 'M40 196 C80 190 104 170 124 140', class: 'g', 'stroke-dasharray': '1 7' });
  const br = [['M124 140 C150 110 170 80 206 58', 'SMTP', 186, 44], ['M124 140 C160 128 186 122 214 120', 'IMAP', 190, 108], ['M124 140 C156 150 176 170 204 186', 'LMTP', 178, 204]]
    .map(([d, t, x, y]) => ({ p: el(svg, 'path', { d, class: 'g' }), t: el(svg, 'text', { x, y, class: 'lbl', opacity: 0 }, t) }));
  svg.appendChild(pl); // the plane flies above its own trails
  const tl = gsap.timeline({ repeat: -1, paused: true, repeatDelay: .4 });
  const tlen = draw(trail); trail.style.strokeDasharray = '1 7';
  br.forEach(b => draw(b.p));
  tl.set(pl, { opacity: 0 }).set(env, { opacity: 1, scaleY: 1, transformOrigin: '120px 124px' })
    .to(env, { scaleY: 0.05, rotation: -12, duration: .45, ease: 'power2.in', delay: .5 })
    .set(env, { opacity: 0 })
    .fromTo(pl, { opacity: 1, x: 120, y: 124, scale: .3, rotation: -20 }, { scale: 1, rotation: 0, duration: .4, ease: 'back.out(2)' });
  const pr = { v: 0 }, pathEl = el(svg, 'path', { d: 'M120 124 C100 150 80 180 40 196 M40 196', opacity: 0 });
  tl.fromTo(pl, { x: 40, y: 196 }, { x: 124, y: 140, duration: 1, ease: 'power1.inOut' }, '+=.1')
    .fromTo(trail, { strokeDashoffset: 0, opacity: 0 }, { opacity: 1, duration: 1 }, '<');
  br.forEach((b, i) => {
    const l = len(b.p);
    tl.fromTo(b.p, { strokeDashoffset: l }, { strokeDashoffset: 0, duration: .8, ease: 'power2.out' }, i === 0 ? '+=0' : '<+.12')
      .to(b.t, { opacity: 1, duration: .3 }, '<+.5');
  });
  tl.to(pl, { x: 230, y: 30, opacity: 0, duration: .8, ease: 'power2.in' }, '+=.5')
    .to([trail, ...br.map(b => b.p), ...br.map(b => b.t)], { opacity: 0, duration: .5 }, '<+.3')
    .set(br.map(b => b.p), { opacity: 1, strokeDashoffset: (i, t) => len(t) });
  pathEl.remove();
  return tl;
}

// Nomad Overlay Network: islands that couldn't talk, joined by bridges of light
function islands(svg, gsap) {
  const spots = [[58, 76], [176, 64], [70, 168], [184, 160]];
  const groups = spots.map(([x, y], i) => {
    const g = el(svg, 'g', { transform: `translate(${x} ${y})` });
    el(g, 'path', { d: 'M-30 0 Q-22 26 0 34 Q20 24 30 0', class: 'fillp' });
    el(g, 'ellipse', { cx: 0, cy: 0, rx: 30, ry: 8, class: 'fillp' });
    for (let k = 0; k < 2 + (i % 2); k++) el(g, 'rect', { x: -14 + k * 11, y: -12, width: 8, height: 8, rx: 1.5, class: k === 1 ? 'dot' : 'fillp' });
    return g;
  });
  const pairs = [[0, 1], [0, 2], [1, 3], [2, 3], [0, 3]];
  const bridges = pairs.map(([a, b]) => {
    const [x1, y1] = spots[a], [x2, y2] = spots[b];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 22;
    return el(svg, 'path', { d: `M${x1} ${y1 - 4} Q${mx} ${my} ${x2} ${y2 - 4}`, class: 'g' });
  });
  const tl = gsap.timeline({ repeat: -1, paused: true, repeatDelay: .6 });
  groups.forEach((g, i) => gsap.to(g, { y: '+=6', duration: 1.6 + i * .3, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: false }));
  bridges.forEach((b, i) => { const l = draw(b); tl.fromTo(b, { strokeDashoffset: l, opacity: 1 }, { strokeDashoffset: 0, duration: .55, ease: 'power2.out' }, i * .45); });
  tl.to(bridges, { opacity: 0, duration: .6 }, '+=1.4');
  return tl;
}

// pvm: a dial that clicks between PHP versions
function dial(svg, gsap) {
  el(svg, 'circle', { cx: 120, cy: 120, r: 92, class: 'fillp' });
  el(svg, 'circle', { cx: 120, cy: 120, r: 80, class: 't', opacity: .5 });
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, long = i % 5 === 0, r1 = long ? 68 : 73, r2 = 79;
    el(svg, 'line', { x1: 120 + Math.cos(a) * r1, y1: 120 + Math.sin(a) * r1, x2: 120 + Math.cos(a) * r2, y2: 120 + Math.sin(a) * r2, class: long ? 's' : 't', 'stroke-width': long ? 1.6 : 1 });
  }
  const vers = [['8.2', -50], ['8.3', 0], ['8.4', 50]];
  vers.forEach(([v, d]) => { const a = (d - 90) * Math.PI / 180; el(svg, 'text', { x: 120 + Math.cos(a) * 54, y: 120 + Math.sin(a) * 54 + 4, 'text-anchor': 'middle', class: 'lbl', style: 'font-size:11px' }, v); });
  const needle = el(svg, 'g', {});
  el(needle, 'line', { x1: 120, y1: 128, x2: 120, y2: 56, class: 'g', 'stroke-width': 3 });
  el(svg, 'circle', { cx: 120, cy: 120, r: 7, class: 'dot' });
  const read = el(svg, 'text', { x: 120, y: 166, 'text-anchor': 'middle', class: 'read' }, 'PHP 8.3');
  const tl = gsap.timeline({ repeat: -1, paused: true });
  [1, 2, 0, 1].forEach(k => {
    tl.to(needle, { rotation: vers[k][1], svgOrigin: '120 120', duration: .55, ease: 'back.out(3)', onStart() { read.textContent = 'PHP ' + vers[k][0]; } }, '+=.9');
  });
  return tl;
}

const BUILDERS = { loom, arch, plane, islands, dial };
export function buildIcons(gsap, ScrollTrigger, reduce) {
  document.querySelectorAll('svg[data-icon]').forEach(svg => {
    const b = BUILDERS[svg.dataset.icon]; if (!b) return;
    const tl = b(svg, gsap);
    if (reduce) { tl.progress(.6).pause(); return; }
    ScrollTrigger.create({ trigger: svg, start: 'top 85%', end: 'bottom 10%', onToggle: s => s.isActive ? tl.play() : tl.pause() });
    const card = svg.closest('.proj');
    if (card) { card.addEventListener('mouseenter', () => tl.timeScale(1.8)); card.addEventListener('mouseleave', () => tl.timeScale(1)); }
  });
}
