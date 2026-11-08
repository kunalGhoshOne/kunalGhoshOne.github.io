// An original, generated soundscape in a slow cinematic style: desert wind,
// breathing sine-tone chords in a big reverb, a distant drum now and then, and
// a deep swell when the bolt hits Vritra. Nothing holds a constant tone.
export function createScore() {
  let ctx = null, master = null, bus = null, on = false, struck = false, timer = null, step = 0;

  // D minor, modal: Dm, Bb, F, C (sine voices only, so nothing buzzes)
  const CHORDS = [
    [73.42, 110.0, 174.61, 220.0],   // D2 A2 F3 A3
    [58.27, 116.54, 174.61, 233.08], // Bb1 Bb2 F3 Bb3
    [87.31, 130.81, 174.61, 261.63], // F2 C3 F3 C4
    [65.41, 98.0, 164.81, 196.0],    // C2 G2 E3 G3
  ];
  const BAR = 11; // seconds per chord

  function impulse(sec, decay) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function noiseBuf(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    // cathedral-sized reverb, mostly wet
    const verb = ctx.createConvolver(); verb.buffer = impulse(6, 2.6);
    const wet = ctx.createGain(); wet.gain.value = 0.85; verb.connect(wet); wet.connect(master);
    const dry = ctx.createGain(); dry.gain.value = 0.35; dry.connect(master);
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 1400;
    soft.connect(verb); soft.connect(dry);
    bus = soft;
    wind();
  }

  // wind over sand: filtered noise, the band drifting slowly, rising and falling
  function wind() {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(8); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.value = 0.0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
    const lg = ctx.createGain(); lg.gain.value = 260; lfo.connect(lg); lg.connect(bp.frequency);
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.07;
    const lg2 = ctx.createGain(); lg2.gain.value = 0.018; lfo2.connect(lg2); lg2.connect(g.gain);
    g.gain.setValueAtTime(0.022, ctx.currentTime);
    src.connect(bp); bp.connect(g); g.connect(bus);
    src.start(); lfo.start(); lfo2.start();
  }

  // one chord: each voice swells in and dies away on its own slow curve
  function chord(t0, notes) {
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f; o2.detune.value = 4 + i; // gentle chorus, no beating buzz
      const g = ctx.createGain(); g.gain.value = 0;
      const peak = [0.075, 0.05, 0.035, 0.022][i];
      const a = t0 + i * 0.9, top = a + 4.5 + i * 0.4, end = t0 + BAR + 3.5;
      g.gain.setValueAtTime(0, a);
      g.gain.linearRampToValueAtTime(peak, top);
      g.gain.setTargetAtTime(0, top + 1.2, 2.2);
      o.connect(g); o2.connect(g); g.connect(bus);
      o.start(a); o2.start(a); o.stop(end); o2.stop(end);
    });
  }

  // a distant low drum, like a heartbeat across the dunes
  function drum(t) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(82, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 1.7);
  }

  function tick() {
    const t = ctx.currentTime + 0.1;
    chord(t, CHORDS[step % CHORDS.length]);
    if (step % 2 === 1) { drum(t + 5.5); drum(t + 6.3); }
    step++;
  }

  // the strike: a deep descending swell plus thunder
  function braam() {
    const t = ctx.currentTime;
    [36.7, 55, 73.4].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f * 1.06, t); o.frequency.exponentialRampToValueAtTime(f, t + 1.4);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime([0.5, 0.3, 0.16][i], t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 5);
      o.connect(g); g.connect(bus); g.connect(master); o.start(t); o.stop(t + 5.2);
    });
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(3);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(120, t + 2.5);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    src.connect(lp); lp.connect(g); g.connect(bus); g.connect(master); src.start(t);
  }

  function strike(p) {
    if (!on || !ctx) return;
    if (p > 0.53 && !struck) { struck = true; braam(); }
    if (p < 0.45) struck = false;
  }

  // narration: a few lines spoken by the deepest English voice the device has
  const said = new Set();
  let voice = null;
  function pickVoice() {
    const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    const en = vs.filter(v => /^en/i.test(v.lang));
    const pref = [/Daniel/i, /Google UK English Male/i, /Arthur/i, /Male/i, /Fred/i, /Alex/i, /David/i, /George/i, /Ryan/i, /Guy/i];
    for (const re of pref) { const v = en.find(v => re.test(v.name)); if (v) return v; }
    return en[0] || vs[0] || null;
  }
  if (window.speechSynthesis) { voice = pickVoice(); speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); }; }
  function say(key, text) {
    if (!on || !window.speechSynthesis || said.has(key)) return;
    said.add(key);
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 0.68; u.pitch = 0.5; u.volume = 1;
    // let the music breathe out while the voice speaks
    const duck = v => { if (!ctx) return; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime); master.gain.linearRampToValueAtTime(on ? v : 0, ctx.currentTime + 0.6); };
    u.onstart = () => duck(0.18); u.onend = () => duck(0.5);
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  function unsay(key) { said.delete(key); }

  function toggle() {
    if (!ctx) init();
    on = !on;
    ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(on ? 0.5 : 0, ctx.currentTime + (on ? 2.5 : 1.2));
    if (on && !timer) { tick(); timer = setInterval(tick, BAR * 1000); }
    if (!on && timer) { clearInterval(timer); timer = null; }
    if (!on && window.speechSynthesis) speechSynthesis.cancel();
    return on;
  }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; document.hidden ? ctx.suspend() : (on && ctx.resume()); });
  return { toggle, strike, say, unsay, get on() { return on; } };
}
