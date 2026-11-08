// Vritra: a serpent whose body is made of the things I remove.
// Glyph advances and the result lines' wrapping come from Pretext, so every
// letter sits exactly on the curve and the results land where the DOM text is.
import { prepare, prepareWithSegments, layoutWithLines, measureNaturalWidth } from '../vendor/pretext/layout.js';

const ENEMIES = [
  'bottleneck', 'downtime', 'non-productivity', 'slow deploys', 'blocked jobs', 'flaky pipelines',
  'production bugs', 'manual releases', 'exposed servers', 'backlog', 'waiting on ops', 'firefighting',
  'hour-long backups', 'single point of failure', 'config drift', 'toil', 'outages', 'alert fatigue',
  'manual provisioning', 'unaudited access', 'SSH key sprawl', 'lost emails', 'version conflicts',
  'late-night rollbacks', 'silent failures', 'context switching', 'deploy freezes', 'works on my machine',
  'queue backlog', 'root access requests', 'approval queues', 'idle workers', 'bounced mail', 'tickets'
];
const RESULTS = [
  ['~40%', ' faster deployments'],
  ['~80%', ' fewer production bugs'],
  ['60%', ' shorter backups'],
  ['1 thread,', ' thousands of jobs'],
  ['Every', ' SSH connection routed and audited']
];

const INK = [18, 18, 18], GOLD = [200, 144, 46], GOLDHI = [232, 182, 90], GOLDINK = [140, 95, 20];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
const rgb = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const INKS = rgb(INK, 1);
const GLOWRAMP = Array.from({ length: 11 }, (_, i) => rgb(mix(INK, GOLD, i / 10), 1));

const widthCache = new Map();
function gw(ch, font) {
  const k = font + '|' + ch;
  let w = widthCache.get(k);
  if (w === undefined) {
    w = ch === ' '
      ? measureNaturalWidth(prepare('a a', font)) - measureNaturalWidth(prepare('aa', font))
      : measureNaturalWidth(prepare(ch, font));
    widthCache.set(k, w);
  }
  return w;
}

export class Vritra {
  constructor(canvas, resultsEl, opts = {}) {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.resultsEl = resultsEl;
    this.wrapLeft = opts.wrapLeft || (() => 40);
    this.p = 0; this.clock = 0; this.frozen = false; this.last = performance.now();
    this.running = false;
    this.tape = (ENEMIES.join('  ·  ') + '  ·  ');
    this.resize();
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const W = this.c.clientWidth, H = this.c.clientHeight;
    this.W = W; this.H = H; this.dpr = dpr;
    this.c.width = Math.round(W * dpr); this.c.height = Math.round(H * dpr);
    const m = this.mobile = W < 700;
    this.FS = m ? 10 : 14;
    this.lanes = 5;
    this.font = `500 ${this.FS}px Geist`;
    this.HFS = this.FS * 2.6;
    this.hfont = `800 ${this.HFS}px Geist`;
    this.laneSp = this.FS * 1.12;
    this.Wmax = this.lanes * this.laneSp;
    this.R = m ? Math.min(W * 0.4, H * 0.3) : Math.min(W * 0.24, H * 0.36);
    this.cx = W * (m ? 0.42 : 0.6);
    this.cy = H * (m ? 0.7 : 0.66);
    // tape widths
    const t = this.tape;
    this.tw = new Float32Array(t.length); this.cum = new Float32Array(t.length + 1);
    for (let i = 0; i < t.length; i++) { this.tw[i] = gw(t[i], this.font); this.cum[i + 1] = this.cum[i] + this.tw[i]; }
    this.headW = 0; for (const ch of 'BOTTLENECK') this.headW += gw(ch, this.hfont);
    this.layoutResults();
    this.particles = null; // rebuilt from frozen frame on demand
  }

  // Results: wrapped with Pretext, rendered in the DOM, and used as landing slots.
  layoutResults() {
    const W = this.W, H = this.H, m = this.mobile;
    const RFS = this.RFS = m ? 22 : clamp(W * 0.03, 28, 46);
    const rfont = `600 ${RFS}px Geist`;
    const x0 = m ? 20 : this.wrapLeft();
    const maxW = m ? W - 40 : Math.min(W * 0.62, 900);
    const lh = RFS * 1.2;
    let y = H * (m ? 0.36 : 0.4);
    const targets = [];
    this.resultsEl.querySelectorAll('.vr-line').forEach(n => n.remove());
    for (const [a, b] of RESULTS) {
      const full = a + b;
      const { lines } = layoutWithLines(prepareWithSegments(full, rfont), maxW, lh);
      let cursor = 0;
      for (const line of lines) {
        const txt = line.text.replace(/\s+$/, '');
        const idx = full.indexOf(txt, cursor); cursor = idx + txt.length;
        const el = document.createElement('div');
        el.className = 'vr-line'; el.setAttribute('aria-hidden', 'true');
        el.style.cssText = `left:${x0}px;top:${y}px;font-size:${RFS}px;line-height:${lh}px`;
        const goldEnd = Math.max(0, Math.min(txt.length, a.length - idx));
        if (goldEnd > 0) { const s = document.createElement('span'); s.className = 'g'; s.textContent = txt.slice(0, goldEnd); el.appendChild(s); }
        el.appendChild(document.createTextNode(txt.slice(goldEnd)));
        this.resultsEl.appendChild(el);
        let x = x0;
        for (let i = 0; i < txt.length; i++) {
          const ch = txt[i], w = gw(ch, rfont);
          if (ch !== ' ') targets.push({ ch, x: x + w / 2, y: y + lh / 2, gold: idx + i < a.length });
          x += w;
        }
        y += lh;
      }
      y += RFS * 0.55;
    }
    this.targets = targets;
  }

  // ---------- spine ----------
  spine(t, coil) {
    const N = 420, R = this.R * (this.zoom || 1) * (1 - 0.08 * coil), cx = this.cx, cy = this.cy;
    // counter-clockwise coil that ends on its right side heading up, so the
    // front of the coil reads upright and the neck rises outside the body
    const SC = 0.74, turns = 1.2 + 0.25 * coil, endA = 0, th0 = endA + turns * Math.PI * 2;
    const coilPt = (u) => {
      const th = th0 - u * turns * Math.PI * 2;
      const r = R * (0.24 + 0.76 * u) + Math.sin(u * 12 - t * 1.5) * R * 0.03 * (0.35 + u);
      return [cx + r * Math.cos(th), cy + r * Math.sin(th) * 0.5];
    };
    const xs = new Float32Array(N + 1), ys = new Float32Array(N + 1);
    const P0 = coilPt(1);
    const Hx = cx + R * (1.22 + 0.05 * coil) + Math.sin(t * 0.8) * R * 0.05;
    const Hy = cy - R * (1.1 + 0.25 * coil) + Math.sin(t * 1.15) * R * 0.03;
    const C1x = P0[0] - R * 0.3, C1y = P0[1] - R * 0.75;
    const C2x = Hx - R * 0.75, C2y = Hy + R * 0.04;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      if (s <= SC) { const p = coilPt(s / SC); xs[i] = p[0]; ys[i] = p[1]; }
      else {
        const v = (s - SC) / (1 - SC), w = 1 - v;
        xs[i] = w * w * w * P0[0] + 3 * w * w * v * C1x + 3 * w * v * v * C2x + v * v * v * Hx;
        ys[i] = w * w * w * P0[1] + 3 * w * w * v * C1y + 3 * w * v * v * C2y + v * v * v * Hy;
      }
    }
    const L = new Float32Array(N + 1);
    for (let i = 1; i <= N; i++) L[i] = L[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    return { xs, ys, L, N, total: L[N] };
  }

  at(sp, a) {
    const { xs, ys, L, N } = sp;
    a = clamp(a, 0, L[N]);
    let lo = 0, hi = N;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (L[mid] < a) lo = mid; else hi = mid; }
    const seg = L[hi] - L[lo] || 1, f = (a - L[lo]) / seg;
    const x = lerp(xs[lo], xs[hi], f), y = lerp(ys[lo], ys[hi], f);
    let dx = xs[hi] - xs[lo], dy = ys[hi] - ys[lo]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    return { x, y, dx, dy, nx: -dy, ny: dx, s: lo / N };
  }

  bodyW(a, sp, t) {
    const s = a / sp.total;
    let w = this.Wmax * (0.1 + 0.9 * smooth(0, 0.32, s));
    const headStart = (sp.total - this.headW - this.FS * 1.6) / sp.total;
    w *= 1 - 0.45 * smooth(headStart - 0.1, headStart, s);
    return w * (1 + 0.045 * Math.sin(t * 1.7 + s * 6));
  }

  // Draw the living snake. If collect is set, also return every glyph's pose.
  drawSnake(t, coil, glowP, collect) {
    const ctx = this.ctx, dpr = this.dpr, sp = this.spine(t, coil);
    const out = collect ? [] : null;
    const headStart = sp.total - this.headW - this.FS * 1.6;
    ctx.font = this.font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const L = this.lanes, mid = (L - 1) / 2, n = this.tape.length, TL = this.cum[n];
    for (let j = 0; j < L; j++) {
      const o = (j - mid) * this.laneSp;
      const edge = Math.abs(j - mid) / (mid || 1);
      const k = 1 - 0.22 * edge, alpha = 0.92 - 0.5 * edge;
      // visible range along the spine for this lane
      let a0 = -1, a1 = -1;
      for (let a = 0; a <= headStart; a += 6) { if (Math.abs(o) <= this.bodyW(a, sp, t) / 2) { if (a0 < 0) a0 = a; a1 = a; } }
      if (a0 < 0) continue;
      // tape: text slides along the body like scales
      const speed = 16 + j * 1.5;
      let tapePos = ((t * speed + j * 211) % (TL * k) + TL * k) % (TL * k);
      let ci = 0; while (ci < n - 1 && this.cum[ci + 1] * k <= tapePos) ci++;
      let a = a0 - (tapePos - this.cum[ci] * k);
      while (a < a1) {
        const ch = this.tape[ci], w = this.tw[ci] * k;
        const ac = a + w / 2;
        if (ac >= a0 && ch !== ' ') {
          const P = this.at(sp, ac);
          const x = P.x + P.nx * o, y = P.y + P.ny * o;
          const ang = Math.atan2(P.dy, P.dx);
          const s = ac / sp.total;
          const glow = glowP > 0 ? smooth(1 - glowP * 1.05, 1 - glowP * 1.05 + 0.08, s) : 0;
          const c = Math.cos(ang) * k, sn = Math.sin(ang) * k;
          ctx.setTransform(c * dpr, sn * dpr, -sn * dpr, c * dpr, x * dpr, y * dpr);
          const depth = y < this.cy && s < 0.74 ? 0.55 : 1; // far side of the coil sits back
          ctx.fillStyle = glow > 0 ? GLOWRAMP[Math.round(glow * 10)] : INKS;
          ctx.globalAlpha = alpha * depth * (0.35 + 0.65 * smooth(0, 0.12, s));
          ctx.fillText(ch, 0, 0);
          if (out) out.push({ ch, x, y, ang, k, s, a: alpha });
        }
        a += w; ci = (ci + 1) % n;
      }
    }
    ctx.globalAlpha = 1;
    // head: BOTTLENECK along the neck
    ctx.font = this.hfont;
    let a = headStart + this.FS * 0.8;
    // if the neck points left, set the word the other way round so it never reads upside down
    const mid0 = this.at(sp, a + this.headW / 2), flip = mid0.dx < 0;
    const word = flip ? 'BOTTLENECK'.split('').reverse().join('') : 'BOTTLENECK';
    for (const ch of word) {
      const w = gw(ch, this.hfont), P = this.at(sp, a + w / 2), ang = Math.atan2(P.dy, P.dx) + (flip ? Math.PI : 0);
      const c = Math.cos(ang), sn = Math.sin(ang);
      const glow = glowP > 0 ? clamp(glowP * 4, 0, 1) : 0;
      ctx.setTransform(c * dpr, sn * dpr, -sn * dpr, c * dpr, P.x * dpr, P.y * dpr);
      ctx.fillStyle = rgb(mix(INK, GOLD, glow), 1);
      ctx.fillText(ch, 0, 0);
      if (out) out.push({ ch, x: P.x, y: P.y, ang, k: this.HFS / this.FS, s: 1, a: 1, head: true });
      a += w;
    }
    // eye and tongue
    const tip = this.at(sp, sp.total);
    const eye = this.at(sp, sp.total - this.HFS * 1.0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = rgb(GOLD, 1);
    ctx.shadowColor = rgb(GOLDHI, .9); ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(eye.x - eye.nx * this.HFS * 0.62, eye.y - eye.ny * this.HFS * 0.62, this.FS * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    const flick = Math.pow(Math.max(0, Math.sin(t * 2.1)), 10);
    if (flick > 0.02 && glowP === 0) {
      const len = this.FS * 2.2 * flick;
      const bx = tip.x + tip.dx * this.FS * 0.6, by = tip.y + tip.dy * this.FS * 0.6;
      const ex = bx + tip.dx * len, ey = by + tip.dy * len;
      ctx.strokeStyle = rgb(GOLDINK, .9); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
      const f = this.FS * 0.6 * flick, ang = Math.atan2(tip.dy, tip.dx);
      ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(ang - .5) * f, ey + Math.sin(ang - .5) * f);
      ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(ang + .5) * f, ey + Math.sin(ang + .5) * f);
      ctx.stroke();
    }
    this.headPt = { x: tip.x, y: tip.y };
    return out;
  }

  buildBolt() {
    const r = rng(9), hx = this.headPt.x, hy = this.headPt.y;
    const pts = [];
    const rec = (x1, y1, x2, y2, d, lvl) => {
      if (lvl === 0) { pts.push([x2, y2]); return; }
      const mx = (x1 + x2) / 2 + (r() - .5) * d, my = (y1 + y2) / 2 + (r() - .5) * d * .3;
      rec(x1, y1, mx, my, d / 2, lvl - 1); rec(mx, my, x2, y2, d / 2, lvl - 1);
    };
    const { sx, sy } = this.missileStart();
    pts.push([sx, sy]); rec(sx, sy, hx, hy, this.H * 0.28, 7);
    const branches = [];
    for (const f of [.32, .55, .7]) {
      const i = Math.floor(pts.length * f), [bx, by] = pts[i], bp = [[bx, by]];
      const ex = bx + (r() - .3) * 160, ey = by + 60 + r() * 90;
      const sub = []; const rr = (x1, y1, x2, y2, d, l) => { if (!l) { sub.push([x2, y2]); return; } const mx = (x1 + x2) / 2 + (r() - .5) * d, my = (y1 + y2) / 2 + (r() - .5) * d * .3; rr(x1, y1, mx, my, d / 2, l - 1); rr(mx, my, x2, y2, d / 2, l - 1); };
      rr(bx, by, ex, ey, 70, 4); branches.push({ at: f, pts: bp.concat(sub) });
    }
    this.bolt = { pts, branches };
  }

  missileStart() {
    const hx = this.headPt.x;
    return { sx: Math.min(this.W + 40, hx + this.W * 0.22), sy: -80 };
  }

  // Indra's vajra as a lightning missile: an accelerating white-gold warhead with
  // crackling tendrils and a jagged trail, then a shockwave and sparks on impact.
  drawMissile(p, rt) {
    const ctx = this.ctx, E = this.headPt, { sx, sy } = this.missileStart();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const jit = rng(1 + Math.floor(rt * 40)); // re-rolled ~40x a second, so it crackles
    const dx = E.x - sx, dy = E.y - sy, D = Math.hypot(dx, dy), ux = dx / D, uy = dy / D, nx = -uy, ny = ux;
    const travel = smooth(0.455, 0.53, p);
    if (travel > 0 && travel < 1) {
      const m = travel * travel; // accelerating
      const Mx = sx + dx * m, My = sy + dy * m;
      // jagged trail behind the warhead
      const tail = Math.max(0, m - 0.45), n = 26, pts = [];
      for (let i = 0; i <= n; i++) {
        const f = tail + (m - tail) * i / n, amp = (1 - i / n) * 26 + 3;
        const j = i === n ? 0 : (jit() - .5) * amp;
        pts.push([sx + dx * f + nx * j, sy + dy * f + ny * j]);
      }
      // one path per pass with a gradient along the trail: no per-segment blur, so it stays fast
      const tx0 = pts[0][0], ty0 = pts[0][1];
      const trail = (lw, rgbc, amax) => {
        const gr = ctx.createLinearGradient(tx0, ty0, Mx, My);
        gr.addColorStop(0, rgb(rgbc, 0)); gr.addColorStop(1, rgb(rgbc, amax));
        ctx.lineWidth = lw; ctx.strokeStyle = gr;
        ctx.beginPath(); ctx.moveTo(tx0, ty0); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
      };
      ctx.shadowBlur = 0;
      trail(22, GOLDHI, .12); trail(12, GOLDHI, .22);
      trail(5, GOLD, .9);
      trail(1.8, [255, 255, 255], 1);
      // crackling tendrils around the warhead
      ctx.lineWidth = 1.4;
      for (let k = 0; k < 6; k++) {
        const ang = jit() * Math.PI * 2, len = 18 + jit() * 42;
        ctx.strokeStyle = rgb(k % 2 ? GOLDHI : [255, 250, 235], .85);
        ctx.beginPath(); ctx.moveTo(Mx, My);
        let x = Mx, y = My;
        for (let s = 1; s <= 4; s++) { x = Mx + Math.cos(ang) * len * s / 4 + (jit() - .5) * 10; y = My + Math.sin(ang) * len * s / 4 + (jit() - .5) * 10; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      // the warhead: a stretched comet of light pointing where it's going
      ctx.save(); ctx.translate(Mx, My); ctx.rotate(Math.atan2(uy, ux));
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 46);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,240,200,.95)'); g.addColorStop(.6, rgb(GOLDHI, .45)); g.addColorStop(1, rgb(GOLDHI, 0));
      ctx.shadowBlur = 0; ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(-26, 0, 72, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); ctx.shadowBlur = 0;
    }
    // impact: shockwave rings and sparks
    const hit = clamp((p - 0.53) / 0.08, 0, 1);
    if (hit > 0 && hit < 1) {
      const maxR = Math.min(this.W, this.H) * 0.55;
      ctx.shadowBlur = 0;
      for (const [d, w] of [[0, 4], [0.18, 2]]) {
        const h = clamp((hit - d) / (1 - d), 0, 1); if (h <= 0) continue;
        const rx = maxR * easeOut(h), ry = rx * .62;
        ctx.lineWidth = (w * (1 - h) + .5) * 4; ctx.strokeStyle = rgb(GOLDHI, (1 - h) * .18);
        ctx.beginPath(); ctx.ellipse(E.x, E.y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = w * (1 - h) + .5; ctx.strokeStyle = rgb(GOLD, (1 - h) * .9);
        ctx.beginPath(); ctx.ellipse(E.x, E.y, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      }
      const sr = rng(31);
      ctx.lineWidth = 2;
      for (let k = 0; k < 44; k++) {
        const ang = sr() * Math.PI * 2, dist = (50 + sr() * 220) * easeOut(hit), len = 10 + sr() * 18;
        const x1 = E.x + Math.cos(ang) * dist, y1 = E.y + Math.sin(ang) * dist + hit * hit * 60;
        ctx.strokeStyle = rgb(k % 3 ? GOLDHI : [255, 255, 255], 1 - hit);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(ang) * len, y1 - Math.sin(ang) * len); ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }
  }

  drawBolt(f, alpha) {
    if (!this.bolt || alpha <= 0) return;
    const ctx = this.ctx; ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const path = (pts, frac) => { const n = Math.max(2, Math.floor(pts.length * frac)); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
    const strokeAll = (lw, col) => {
      ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.shadowBlur = 0;
      path(this.bolt.pts, f); ctx.stroke();
      for (const b of this.bolt.branches) if (f > b.at) { path(b.pts, clamp((f - b.at) / (1 - b.at) * 1.4, 0, 1)); ctx.stroke(); }
    };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    strokeAll(22, rgb(GOLDHI, .1 * alpha));
    strokeAll(11, rgb(GOLDHI, .2 * alpha));
    strokeAll(5, rgb(GOLD, .9 * alpha));
    strokeAll(1.8, `rgba(255,255,255,${alpha})`);
    ctx.shadowBlur = 0;
  }

  buildParticles(glyphs) {
    const r = rng(77), T = this.targets, hp = this.headPt;
    const order = glyphs.map((g, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const ps = glyphs.map(g => {
      const dx = g.x - hp.x, dy = g.y - hp.y, d = Math.hypot(dx, dy) || 1;
      const sp = 60 + r() * 180;
      return {
        ...g, vx: dx / d * sp + (r() - .5) * 120, vy: -(120 + r() * 280) + dy / d * 40,
        spin: (r() - .5) * 8, wob: r() * 6.28, target: null
      };
    });
    for (let i = 0; i < T.length && i < order.length; i++) ps[order[i]].target = T[i];
    for (const p of ps) if (!p.target) p.fall = { x: p.x + (r() - .5) * 80, y: this.H + 40 + r() * 160 };
    // keep every letter that lands, and a third of the ones that pour away
    this.particles = ps.filter((p, i) => p.target || i % 3 === 0);
  }

  drawParticles(q, fade) {
    const ctx = this.ctx, dpr = this.dpr, scaleT = this.RFS / this.FS;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 ${this.FS}px Geist`;
    // colours precomputed in 11 steps; alpha goes through globalAlpha, so no strings per letter
    if (!this.ramps) {
      const ramp = (a, b) => Array.from({ length: 11 }, (_, i) => rgb(mix(a, b, i / 10), 1));
      this.ramps = { ink: ramp(GOLDHI, INK), goldink: ramp(GOLDHI, GOLDINK), gold: ramp(GOLDHI, GOLD), body: rgb(GOLD, 1) };
    }
    const R = this.ramps;
    for (const p of this.particles) {
      const qi = clamp((q - 0.28 * (1 - p.s)) / 0.72, 0, 1);
      if (qi <= 0) { // not yet released: hold as glowing body
        const c = Math.cos(p.ang) * p.k, sn = Math.sin(p.ang) * p.k;
        ctx.setTransform(c * dpr, sn * dpr, -sn * dpr, c * dpr, p.x * dpr, p.y * dpr);
        ctx.globalAlpha = p.a * fade; ctx.fillStyle = R.body; ctx.fillText(p.ch, 0, 0); continue;
      }
      const b = clamp(qi / 0.3, 0, 1), e = clamp((qi - 0.3) / 0.7, 0, 1);
      const bx = p.x + p.vx * easeOut(b), by = p.y + p.vy * easeOut(b);
      let x, y, k, ang, ch = p.ch, col, a;
      const dest = p.target || p.fall;
      const ee = easeInOut(e);
      x = lerp(bx, dest.x, ee) + Math.sin(e * Math.PI) * Math.sin(p.wob) * 40;
      y = lerp(by, dest.y, e * e * (3 - 2 * e));
      ang = p.ang + p.spin * easeOut(b) * (1 - ee);
      if (p.target) {
        k = lerp(p.k, scaleT, smooth(.55, 1, e));
        if (e > 0.82) ch = p.target.ch;
        col = (p.target.gold ? R.goldink : R.ink)[Math.round(smooth(.6, 1, e) * 10)];
        a = 1;
      } else {
        k = p.k * (1 - .3 * e); col = R.gold[Math.round(e * 10)]; a = 1 - smooth(.6, 1, e);
      }
      a *= fade;
      if (a <= 0.01) continue;
      const c = Math.cos(ang) * k, sn = Math.sin(ang) * k;
      ctx.setTransform(c * dpr, sn * dpr, -sn * dpr, c * dpr, x * dpr, y * dpr);
      ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillText(ch, 0, 0);
    }
    ctx.globalAlpha = 1;
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    const p = this.p;
    if (p < 0.5) { this.clock += dt; this.frozen = false; this.particles = null; }
    const t = this.clock, coil = smooth(0.0, 0.48, p);
    // Vritra grows toward you from the first pixel of scroll, so the pin never feels stuck
    this.zoom = 0.86 + 0.22 * smooth(0, 0.46, Math.min(p, 0.5));
    const ctx = this.ctx, W = this.W, H = this.H, dpr = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.c.width, this.c.height);

    const glowP = smooth(0.53, 0.585, p);
    const q = clamp((p - 0.585) / 0.3, 0, 1);
    if (q <= 0) this.drawSnake(t, coil, glowP, false);
    else {
      if (!this.particles) { const g = this.drawSnake(t, 1, 1, true); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.c.width, this.c.height); this.buildParticles(g); }
      this.drawParticles(q, 1 - smooth(0.9, 0.95, p));
    }
    if (p >= 0.5 && !this.bolt) this.buildBolt();
    if (p < 0.45) this.bolt = null;
    // storm: dim, missile, flash, the scorched channel it leaves behind
    const dim = 0.18 * smooth(0.42, 0.48, p) * (1 - smooth(0.58, 0.68, p));
    if (dim > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(18,18,18,${dim})`; ctx.fillRect(0, 0, this.c.width, this.c.height); }
    const flash = p < 0.53 ? smooth(0.526, 0.53, p) : 1 - smooth(0.53, 0.6, p);
    if (flash > 0 && p > 0.525) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(255,253,246,${0.62 * flash})`; ctx.fillRect(0, 0, this.c.width, this.c.height); }
    if (p >= 0.53 && p < 0.68) this.drawBolt(1, 0.85 * (1 - smooth(0.54, 0.68, p)));
    if (p > 0.45 && p < 0.62) this.drawMissile(p, now / 1000);
  }

  start() { if (this.running) return; this.running = true; this.last = performance.now(); const loop = (n) => { if (!this.running) return; this.frame(n); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}
