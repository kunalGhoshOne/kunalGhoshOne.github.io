import { Vritra } from './vritra.js';
import { Sea } from './sea.js';
import { buildIcons } from './icons.js';
import { createScore } from './score.js';
const score = createScore();

const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const reduce = root.classList.contains('rm');
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
$('#yr').textContent = new Date().getFullYear();

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); const t = id === '#top' ? 0 : $(id); if (t === null) return;
  e.preventDefault();
  if (lenis) lenis.scrollTo(t, { duration: 1.6 }); else (t === 0 ? scrollTo(0, 0) : t.scrollIntoView());
}));

/* ---------------- nav + glow ---------------- */
const nav = $('#nav');
ScrollTrigger.create({ start: 40, end: 'max', onToggle: s => nav.classList.toggle('scrolled', s.isActive) });
if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  document.body.classList.add('has-glow');
  const g = $('#glow'), xTo = gsap.quickTo(g, 'x', { duration: .6, ease: 'power3' }), yTo = gsap.quickTo(g, 'y', { duration: .6, ease: 'power3' });
  addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); });
}

/* ---------------- genesis ---------------- */
function emerge(delay = 0) {
  gsap.fromTo('[data-emerge]',
    { opacity: 0, y: 24, filter: 'blur(14px) brightness(1.9)' },
    { opacity: 1, y: 0, filter: 'blur(0px) brightness(1)', duration: 1.4, stagger: .12, ease: 'power3.out', delay, clearProps: 'filter,transform' });
}
function genesis(short) {
  const G = $('#genesis'), g1 = $('#g1'), g2 = $('#g2'), caret = $('#caret'), light = $('#glight');
  const L1 = 'And then the developer said, “Let there be light.”', L2 = '— Java, line 19';
  root.classList.add('intro'); G.style.display = 'flex'; G.style.opacity = 1; G.style.background = '#000';
  g1.textContent = ''; g2.textContent = ''; gsap.set(light, { scale: 0, opacity: 1 }); gsap.set('[data-emerge]', { opacity: 0 });
  lenis && lenis.stop();
  const tl = gsap.timeline();
  const type = (node, text, speed) => { const o = { n: 0 }; return gsap.to(o, { n: text.length, duration: text.length * speed, ease: 'none', onUpdate() { node.textContent = text.slice(0, Math.round(o.n)); } }); };
  // move the caret onto the first line while typing it
  const l1 = $('.g-line');
  tl.add(() => l1.appendChild(caret));
  tl.to({}, { duration: short ? .5 : .9 });
  tl.add(type(g1, L1, short ? .028 : .045));
  tl.add(() => $('.g-ref').appendChild(caret), '+=.25');
  tl.add(type(g2, L2, short ? .04 : .06), '+=.15');
  tl.to({}, { duration: short ? .5 : .7 });
  tl.add(() => {
    const r = caret.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    gsap.set(light, { x, y });
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    light.dataset.s = (far * 2.2 / 20).toFixed(1);
    score.unsay('light'); score.say('light', 'Let there be... light.');
    caret.style.animation = 'none';
  });
  tl.to(caret, { boxShadow: '0 0 24px 8px #fff, 0 0 60px 20px rgba(255,236,190,.8)', background: '#fff', duration: short ? .45 : .6, ease: 'power2.in' });
  tl.to(light, { scale: 3, duration: short ? .35 : .45, ease: 'power2.in' });
  tl.to(light, { scale: () => +light.dataset.s, duration: short ? 1.2 : 1.5, ease: 'power3.in' });
  tl.set(G, { background: '#fff' });
  tl.to(G, { opacity: 0, duration: short ? .9 : 1.1, ease: 'power2.out', onStart: () => emerge(.15) });
  tl.add(() => { G.style.display = 'none'; root.classList.remove('intro'); caret.style.animation = ''; caret.style.boxShadow = ''; caret.style.background = ''; lenis && lenis.start(); ScrollTrigger.refresh(); });
  $('#gskip').onclick = () => { tl.progress(1); };
  return tl;
}
let seen = false; try { seen = localStorage.getItem('kg-genesis') === '1'; localStorage.setItem('kg-genesis', '1'); } catch (e) {}
if (reduce) { gsap.set('[data-emerge]', { opacity: 1 }); }
else document.fonts.ready.then(() => genesis(seen));
$('#replay').addEventListener('click', () => { if (lenis) lenis.scrollTo(0, { immediate: true }); else scrollTo(0, 0); genesis(false); });

/* ---------------- scenes ---------------- */
const wrapLeft = () => { const w = $('.wrap'); const cs = getComputedStyle(w); return w.getBoundingClientRect().left + parseFloat(cs.paddingLeft); };

document.fonts.ready.then(async () => {
  try { await Promise.all(['500 14px Geist', '600 14px Geist', '800 14px Geist', '400 13px "JetBrains Mono"', 'italic 400 54px "Instrument Serif"'].map(f => document.fonts.load(f))); } catch (e) {}

  if (reduce) { buildIcons(gsap, ScrollTrigger, reduce); return; }

  gsap.to('.portrait img', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-copy', { yPercent: -12, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // --- Vritra
  const vr = new Vritra($('#vritraCanvas'), $('#vrResults'), { wrapLeft });
  const vrA = $('#vrA'), vrB = $('#vrB'), vrRes = $('#vrResults'), vrHint = $('#vrHint');
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  ScrollTrigger.create({
    trigger: '#vritra', start: 'top top', end: '+=2600', pin: '#vritraPin', scrub: 0.6, anticipatePin: 1,
    onUpdate: s => {
      const p = vr.p = s.progress;
      vrA.style.opacity = 1 - sm(.42, .5, p);
      vrB.style.opacity = sm(.86, .93, p);
      vrRes.style.opacity = sm(.9, .95, p);
      vrHint.style.opacity = (1 - sm(.3, .45, p)) * sm(0, .05, p + .05);
      score.strike(p);
      if (p > 0.12) score.say('vritra', 'Every team... has a Vritra.'); else score.unsay('vritra');
      if (p > 0.9) score.say('flows', "What flows... when it's gone."); else if (p < 0.8) score.unsay('flows');
    },
    onToggle: s => s.isActive ? vr.start() : vr.stop(),
    onRefresh: () => { vr.resize(); },
  });
  // keep it alive while visible but before the pin starts
  ScrollTrigger.create({ trigger: '#vritra', start: 'top bottom', end: 'bottom top', onToggle: s => s.isActive ? vr.start() : vr.stop() });

  // --- Systems (WebGL)
  let gl = false;
  try { const c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
  if (gl) {
    try {
      const { Systems } = await import('./systems.js');
      const sy = new Systems($('#syCanvas'), $('#syLabels'));
      ScrollTrigger.create({
        trigger: '#systems', start: 'top top', end: '+=2200', pin: '#systemsPin', scrub: 0.6, anticipatePin: 1,
        onUpdate: s => {
          sy.p = s.progress;
          if (s.progress > 0.04) score.say('systems', 'The machinery... exploded.'); else score.unsay('systems');
        },
        onRefresh: () => sy.resize()
      });
      ScrollTrigger.create({ trigger: '#systems', start: 'top bottom', end: 'bottom top', onToggle: s => s.isActive ? sy.start() : sy.stop() });
      sy.frame(performance.now());
    } catch (e) { console.warn(e); root.classList.add('nogl'); }
  } else root.classList.add('nogl');

  // --- The sea
  const sea = new Sea($('#seaCanvas'), $('#seaHead'));
  ScrollTrigger.create({
    trigger: '#sea', start: 'top top', end: '+=2600', pin: '#seaPin', scrub: 0.6, anticipatePin: 1,
    onUpdate: s => {
      sea.p = s.progress;
      if (s.progress > 0.1) score.say('pass', 'Let my code... pass.'); else score.unsay('pass');
      if (s.progress > 0.92) score.say('seahead', 'A path... through the noise.'); else if (s.progress < 0.85) score.unsay('seahead');
    },
    onRefresh: () => sea.resize()
  });
  ScrollTrigger.create({ trigger: '#sea', start: 'top bottom', end: 'bottom top', onToggle: s => s.isActive ? sea.start() : sea.stop() });

  // created after the pins, so their positions include the pin spacing
  buildIcons(gsap, ScrollTrigger, reduce);
  $$('.sec-head, .proj .txt, .spec > div, .tl li, .contact .wrap > *').forEach(n => { if (!n.closest('.pin')) n.classList.add('rv'); });
  ScrollTrigger.batch('.rv', { start: 'top 88%', onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1, stagger: .08, ease: 'power3.out', overwrite: true }) });

  ScrollTrigger.create({ trigger: '#contact', start: 'top 55%', onEnter: () => score.say('avail', 'Now available... for senior backend and platform roles.'), onLeaveBack: () => score.unsay('avail') });
  ScrollTrigger.create({ trigger: '#specs', start: 'top 60%', onEnter: () => score.say('specs', 'Kunal Ghosh... as specified.'), onLeaveBack: () => score.unsay('specs') });
  // headlines the narrator reads as you reach them
  ScrollTrigger.create({ trigger: '#hero', start: 'top 40%', end: 'bottom 40%', onEnterBack: () => score.say('hero', HERO_LINE), onLeave: () => score.unsay('hero') });
  ScrollTrigger.create({ trigger: '#projects', start: 'top 60%', onEnter: () => score.say('projects', 'Five tools... each with a reason to exist.'), onLeaveBack: () => score.unsay('projects') });
  ScrollTrigger.create({ trigger: '#story', start: 'top 60%', onEnter: () => score.say('story', 'An economics student... who ended up under the hood.'), onLeaveBack: () => score.unsay('story') });

  // tools land in the spec sheet
  $$('.spec .hl').forEach(r => ScrollTrigger.create({ trigger: r, start: 'top 80%', end: 'bottom 20%', toggleClass: 'lit' }));

  ScrollTrigger.refresh();
});

/* ---------------- score + narration (off by default) ---------------- */
const HERO_LINE = "You've never seen my work... That's the point.";
$('#sound').addEventListener('click', () => {
  const on = score.toggle();
  $('#sound').setAttribute('aria-pressed', String(on));
  // turned on at the top of the page: the narrator opens with the headline
  if (on && scrollY < innerHeight * 0.6) { score.unsay('hero'); setTimeout(() => score.say('hero', HERO_LINE), 900); }
});
