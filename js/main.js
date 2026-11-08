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
        onUpdate: s => { sy.p = s.progress; },
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
    },
    onRefresh: () => sea.resize()
  });
  ScrollTrigger.create({ trigger: '#sea', start: 'top bottom', end: 'bottom top', onToggle: s => s.isActive ? sea.start() : sea.stop() });

  // created after the pins, so their positions include the pin spacing
  buildIcons(gsap, ScrollTrigger, reduce);
  $$('.sec-head, .proj .txt, .spec > div, .tl li, .contact .wrap > *').forEach(n => { if (!n.closest('.pin')) n.classList.add('rv'); });
  ScrollTrigger.batch('.rv', { start: 'top 88%', onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1, stagger: .08, ease: 'power3.out', overwrite: true }) });

  // the narrator's lines, read as you reach them
  ScrollTrigger.create({ trigger: '#hero', start: 'top 40%', end: 'bottom 40%', onEnterBack: () => score.say('hero', HERO_LINE), onLeave: () => score.unsay('hero') });
  ScrollTrigger.create({ trigger: '#story', start: 'top 60%', onEnter: () => score.say('story', 'An economics student... who ended up under the hood.'), onLeaveBack: () => score.unsay('story') });
  ScrollTrigger.create({ trigger: '#contact', start: 'top 55%', onEnter: () => score.say('avail', 'Now available... For senior backend and platform roles.'), onLeaveBack: () => score.unsay('avail') });

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
  if (on) startTour(); else stopTour();
});

/* ---------------- auto-tour: with sound on, the page scrolls itself ---------------- */
let tour = null;
const hint = $('#tourHint');
function showHint(v) { if (hint) hint.classList.toggle('on', v); }
function stopTour() { if (tour) { tour.kill(); tour = null; } showHint(false); }
function startTour() {
  stopTour();
  if (reduce) return;
  const pin = id => ScrollTrigger.getAll().find(s => s.pin && s.trigger.id === id);
  const top = sel => { const e = $(sel); return e ? e.getBoundingClientRect().top + scrollY : null; };
  const at = (st, f) => st.start + (st.end - st.start) * f;
  const V = pin('vritra'), S = pin('systems'), E = pin('sea');
  const max = ScrollTrigger.maxScroll(window);
  // [scroll position, seconds to get there, seconds to hold]
  const steps = [
    [0, 0, 4.2],                                   // hero: the opening line
    V && [V.start, 2.4, .6],
    V && [at(V, .3), 4, 1.8],                      // Vritra coils: "Every team has a Vritra"
    V && [at(V, .5), 3, .2],                       // the storm gathers
    V && [at(V, .64), 2.2, .6],                    // the strike
    V && [V.end, 5.5, 2.4],                        // the results land
    S && [S.start, 2.2, .3],
    S && [S.end, 8, 1],                            // the machinery comes apart
    [top('#projects'), 2.4, .5],
    E && [E.start, 22, .4],                        // the five projects
    E && [at(E, .2), 3.2, 2.2],                    // "Let my code pass"
    E && [E.end, 10, 1.2],                         // the crossing
    [top('#specs'), 2.4, 1],
    [top('#story'), 7, 4.5],                       // "An economics student..."
    [top('#contact'), 6, .5],
    [max, 2.5, 0],                                 // "Now available"
  ].filter(s => s && s[0] != null && s[0] > scrollY + 4 || (s && s[0] === 0 && scrollY < 4));
  if (!steps.length) return;
  const proxy = { y: scrollY };
  const apply = () => { if (lenis) lenis.scrollTo(proxy.y, { immediate: true, force: true }); else scrollTo(0, proxy.y); };
  tour = gsap.timeline({ onComplete: () => { tour = null; showHint(false); } });
  for (const [y, dur, hold] of steps) {
    if (dur > 0) tour.to(proxy, { y: Math.min(y, max), duration: dur, ease: 'sine.inOut', onUpdate: apply });
    if (hold > 0) tour.to({}, { duration: hold });
  }
  showHint(true);
}
// any real input hands control back to the visitor
['wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => { if (tour) stopTour(); }, { passive: true }));
addEventListener('pointerdown', e => { if (tour && !e.target.closest('#sound')) stopTour(); });
