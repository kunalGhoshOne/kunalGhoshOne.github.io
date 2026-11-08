// The sea: a wall of production noise, laid out into lines with Pretext,
// that parts down the middle so the tools can walk through.
import { prepare, prepareWithSegments, layoutWithLines, measureNaturalWidth } from '../vendor/pretext/layout.js';

const NOISE = [
  'ERROR upstream timed out after 30s', 'WARN queue depth 12,408 and rising', 'deploy #4821 failed at step 7/9',
  'ALERT disk /var 97% full on db-02', 'ssh: Permission denied (publickey)', '503 Service Unavailable',
  'retrying in 5s (attempt 4/5)', 'ticket #2231 reopened', 'backup job exceeded window by 2h14m',
  'OOMKilled worker-7', 'pipeline blocked: waiting for approval', 'merge conflict in config/prod.yaml',
  'cron: job overlapped with previous run', '550 mailbox unavailable', 'certificate expires in 3 days',
  'node nomad-c3 unreachable', 'PHP Fatal error: version mismatch', 'rollback started 02:47',
  'p99 latency 4.8s', 'who has root on staging?', 'connection reset by peer', 'manual hotfix applied',
  'flaky test retried 3x', 'SLA breach: support queue', 'kernel: TCP: out of memory', 'jobs stuck in pending'
];
const TOOLS = ['Go', 'Node.js', 'Python', 'PHP', 'Docker', 'Nomad', 'GitLab CI', 'Linux'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export class Sea {
  constructor(canvas, head) {
    this.c = canvas; this.ctx = canvas.getContext('2d'); this.head = head;
    this.p = 0; this.t = 0; this.last = performance.now(); this.running = false;
    this.resize();
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2), W = this.c.clientWidth, H = this.c.clientHeight;
    Object.assign(this, { W, H, dpr });
    this.c.width = Math.round(W * dpr); this.c.height = Math.round(H * dpr);
    this.FS = W < 700 ? 11 : 13;
    this.font = `400 ${this.FS}px "JetBrains Mono"`;
    this.lh = this.FS * 1.55;
    this.cw = measureNaturalWidth(prepare('0000000000', this.font)) / 10;
    const rows = Math.ceil(H / this.lh) + 2;
    const r = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(5);
    let text = '';
    for (let i = 0; i < rows * 6; i++) text += NOISE[Math.floor(r() * NOISE.length)] + '  ·  ';
    const width = W + this.cw * 4;
    const { lines } = layoutWithLines(prepareWithSegments(text, this.font), width, this.lh);
    this.lines = lines.slice(0, rows).map(l => l.text);
    this.tfont = `600 ${W < 700 ? 20 : 26}px Geist`;
  }
  frame(now) {
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt;
    const { ctx, W, H, dpr, p, cw, lh } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.font = this.font; ctx.textBaseline = 'middle';
    const part = smooth(0.22, 0.44, p);
    const gapMax = Math.min(W * 0.2, 230);
    const center = W / 2;
    const splitCol = Math.round(center / cw);
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i], y = i * lh + lh / 2;
      const wave = Math.sin(i * 0.33 + this.t * 1.3) * 7 + Math.sin(i * 0.11 - this.t * .7) * 5;
      const g = part * (gapMax + wave * 1.4);
      const drift = Math.sin(i * 0.5 + this.t * 0.6) * 2 * (1 - part);
      const L = line.slice(0, splitCol), Rr = line.slice(splitCol);
      // far water: pale; the wall faces near the parting: darker
      const edgeN = 12;
      const lx = center - g + drift, rx = center + g + drift;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(122,116,104,.38)'; ctx.fillText(L.slice(0, Math.max(0, L.length - edgeN)), lx - Math.min(edgeN, L.length) * cw, y);
      ctx.fillStyle = `rgba(63,60,54,${.45 + .35 * part})`; ctx.fillText(L.slice(-edgeN), lx, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = `rgba(63,60,54,${.45 + .35 * part})`; ctx.fillText(Rr.slice(0, edgeN), rx, y);
      ctx.fillStyle = 'rgba(122,116,104,.38)'; ctx.fillText(Rr.slice(edgeN), rx + edgeN * cw, y);
    }
    // light on the floor of the path
    if (part > 0) {
      const grd = ctx.createLinearGradient(center - gapMax, 0, center + gapMax, 0);
      grd.addColorStop(0, 'rgba(232,182,90,0)'); grd.addColorStop(.5, `rgba(232,182,90,${.18 * part})`); grd.addColorStop(1, 'rgba(232,182,90,0)');
      ctx.fillStyle = grd; ctx.fillRect(center - gapMax, 0, gapMax * 2, H);
    }
    // the command: "Let my code pass" rises out of the sea, letter by letter
    const cmd = 'Let my code pass';
    const cFS = W < 700 ? 30 : 54;
    ctx.font = `italic 400 ${cFS}px "Instrument Serif"`; ctx.textAlign = 'left';
    const cw2 = ctx.measureText(cmd).width;
    const appear = smooth(0.06, 0.2, p);
    // after the parting, the command walks first through the path, like Moses
    const lead = smooth(0.44, 0.72, p);
    const cy = H / 2 - (H / 2 + 80) * lead;
    if (appear > 0 && lead < 1) {
      // a clearing of light behind it, so it reads against the noise
      const rg = ctx.createRadialGradient(center, cy, 0, center, cy, cw2 * 0.75);
      rg.addColorStop(0, `rgba(251,248,241,${.96 * appear})`); rg.addColorStop(.7, `rgba(251,248,241,${.75 * appear * (1 - part)})`); rg.addColorStop(1, 'rgba(251,248,241,0)');
      ctx.save(); ctx.translate(center, cy); ctx.scale(1, 0.32); ctx.translate(-center, -cy);
      ctx.fillStyle = rg; ctx.fillRect(center - cw2, cy - cw2, cw2 * 2, cw2 * 2);
      ctx.restore();
      let x = center - cw2 / 2;
      for (let i = 0; i < cmd.length; i++) {
        const ch = cmd[i], w = ctx.measureText(ch).width;
        const a = smooth(i / cmd.length * 0.75, i / cmd.length * 0.75 + 0.25, appear);
        ctx.fillStyle = `rgba(140,95,20,${a})`;
        ctx.fillText(ch, x, cy + (1 - a) * 14);
        x += w;
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(200,144,46,${appear})`; ctx.beginPath(); ctx.arc(center, cy + cFS * 0.75, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    // and the tools follow it through, one after another
    ctx.font = this.tfont; ctx.textAlign = 'center';
    TOOLS.forEach((w, k) => {
      const s = 0.47 + k * 0.058, e = clamp((p - s) / 0.27, 0, 1);
      if (e <= 0 || e >= 1) return;
      const y = H + 40 - (H + 80) * e;
      const a = smooth(0, .12, e) * (1 - smooth(.88, 1, e));
      ctx.fillStyle = `rgba(18,18,18,${a})`; ctx.fillText(w, center, y);
      ctx.fillStyle = `rgba(200,144,46,${a})`; ctx.beginPath(); ctx.arc(center, y + 24, 3, 0, Math.PI * 2); ctx.fill();
    });
    // the heading waits until the crossing is over
    if (this.head) this.head.style.opacity = String(smooth(0.9, 0.97, p));
  }
  start() { if (this.running) return; this.running = true; this.last = performance.now(); const loop = n => { if (!this.running) return; this.frame(n); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}
