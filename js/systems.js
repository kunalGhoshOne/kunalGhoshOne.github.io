// The machinery, exploded: seven porcelain layers that pull apart with scroll.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/three/RoundedBoxGeometry.js';
import { RoomEnvironment } from '../vendor/three/RoomEnvironment.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

export class Systems {
  constructor(canvas, labels) {
    this.c = canvas; this.labels = [...labels.children];
    this.p = 0; this.running = false;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe9dfcb, 0.6));
    const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
    sun.position.set(6, 12, 7); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.radius = 6;
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -5.6; ground.receiveShadow = true; scene.add(ground);

    const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xF6F2E9, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25 });
    const porcelain2 = new THREE.MeshPhysicalMaterial({ color: 0xEDE6D7, roughness: 0.5, clearcoat: 0.3 });
    const ink = new THREE.MeshPhysicalMaterial({ color: 0x1a1a1a, roughness: 0.35, clearcoat: 0.6 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xC8902E, metalness: 1, roughness: 0.28 });
    const glow = new THREE.MeshBasicMaterial({ color: 0xF2C46A });

    this.group = new THREE.Group(); scene.add(this.group);
    this.layers = [];
    const SW = 5.2, SD = 3.4, SH = 0.3;
    const slabGeo = new RoundedBoxGeometry(SW, SH, SD, 4, 0.14);
    const rand = rng(11);
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      const slab = new THREE.Mesh(slabGeo, porcelain); slab.castShadow = true; slab.receiveShadow = true; g.add(slab);
      // gold edge line
      const edge = new THREE.Mesh(new THREE.BoxGeometry(SW - 0.5, 0.02, 0.03), gold); edge.position.set(0, 0.02, SD / 2 + 0.005); g.add(edge);
      // components on the top face, different on every layer
      const count = 4 + Math.floor(rand() * 5);
      for (let k = 0; k < count; k++) {
        const w = 0.35 + rand() * 1.0, d = 0.3 + rand() * 0.8, h = 0.06 + rand() * 0.16;
        const m = rand() < 0.18 ? ink : (rand() < 0.2 ? gold : porcelain2);
        const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(w, d, h) * 0.35), m);
        b.position.set((rand() - .5) * (SW - w - 0.6), SH / 2 + h / 2, (rand() - .5) * (SD - d - 0.6));
        b.castShadow = true; b.receiveShadow = true; g.add(b);
      }
      // traces
      for (let k = 0; k < 3; k++) {
        const len = 1 + rand() * 2.4, tr = new THREE.Mesh(new THREE.BoxGeometry(len, 0.012, 0.035), gold);
        tr.position.set((rand() - .5) * (SW - len - .6), SH / 2 + 0.006, (rand() - .5) * (SD - .8)); g.add(tr);
      }
      this.group.add(g); this.layers.push(g);
    }
    // data columns: thin gold rods and pulses travelling up through the stack
    this.cols = []; this.pulses = [];
    const colPos = [[-1.7, -0.9], [0.4, 0.7], [1.9, -0.6]];
    for (const [x, z] of colPos) {
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 8), new THREE.MeshBasicMaterial({ color: 0xE8B65A, transparent: true, opacity: 0 }));
      rod.position.set(x, 0, z); this.group.add(rod); this.cols.push(rod);
      for (let k = 0; k < 3; k++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), glow.clone());
        p.material.transparent = true; p.userData = { x, z, off: k / 3 + rand() * 0.1 };
        this.group.add(p); this.pulses.push(p);
      }
    }
    this.SW = SW; this.t = 0; this.last = performance.now();
    this.resize();
  }

  resize() {
    const W = this.c.clientWidth, H = this.c.clientHeight;
    this.W = W; this.H = H; this.mobile = W < 700;
    this.renderer.setSize(W, H, false);
    this.camera.aspect = W / H;
    const dist = this.mobile ? 40 : 32;
    this.camera.position.set(dist * 0.62, dist * 0.42, dist * 0.68);
    this.camera.lookAt(this.mobile ? 1.2 : -1.2, this.mobile ? 2.6 : -0.3, 0);
    this.camera.updateProjectionMatrix();
    this.group.position.set(this.mobile ? -0.6 : 1.4, 0, 0);
  }

  frame(now) {
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now; this.t += dt;
    const p = this.p, e = smooth(0.08, 0.62, p);
    const gap = 0.32 + e * 1.16;
    const n = this.layers.length;
    this.layers.forEach((g, i) => {
      const y = ((n - 1) / 2 - i) * gap;
      g.position.y = y;
      g.rotation.y = (i - 3) * 0.035 * e;
      g.position.x = Math.sin(i * 1.7) * 0.12 * e;
    });
    this.group.rotation.y = -0.35 + p * 0.5 + Math.sin(this.t * 0.4) * 0.03;
    const top = ((n - 1) / 2) * gap, bot = -top;
    this.cols.forEach(c => { c.scale.y = top - bot + 0.6; c.position.y = 0; c.material.opacity = 0.75 * e; });
    this.pulses.forEach(pl => {
      const u = (this.t * 0.35 + pl.userData.off) % 1;
      pl.position.set(pl.userData.x, bot - 0.3 + u * (top - bot + 0.6), pl.userData.z);
      pl.material.opacity = e * Math.sin(u * Math.PI);
    });
    this.renderer.render(this.scene, this.camera);
    // labels follow the right edge of each slab
    const v = new THREE.Vector3();
    this.layers.forEach((g, i) => {
      const lab = this.labels[i]; if (!lab) return;
      v.set(this.SW / 2 + 0.1, 0, 0); g.localToWorld(v); v.project(this.camera);
      const x = (v.x * .5 + .5) * this.W + 16, y = (-v.y * .5 + .5) * this.H - 11;
      const a = smooth(0.25 + i * 0.035, 0.45 + i * 0.035, p);
      const maxX = this.W - (this.mobile ? 190 : 340);
      lab.style.transform = `translate(${Math.min(x, maxX)}px,${y}px)`;
      lab.style.opacity = a;
    });
  }
  start() { if (this.running) return; this.running = true; this.last = performance.now(); const loop = n => { if (!this.running) return; this.frame(n); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}
