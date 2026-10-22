import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
/* ============================================================
   EDIT ME — your details and gallery.
   Put your screenshots/renders in the assets/ folder using the
   file names below (or change the file names here).
   ============================================================ */
const CONFIG = {
  name: '90bj/portfolio',
  email: 'mustafa.b.kanakri@gmail.com',
};

const WORKS = [
  { file: 'assets/crimson-hair.jpg',  title: 'Crimson Flame Hair',   cat: 'hair' },
  { file: 'assets/green-sword.jpg',   title: 'Verdant Blade',        cat: 'weapon' },
  { file: 'assets/outfit-front.jpg',  title: 'Wanderer Outfit',      cat: 'outfit' },
  { file: 'assets/cat-keychain.jpg',  title: 'Spirit Cat Keychain',  cat: 'accessory' },
  { file: 'assets/teal-hair.jpg',     title: 'Teal Gradient Hair',   cat: 'hair' },
  { file: 'assets/spear-and-bow.jpg', title: 'Halberd & Crystal Bow', cat: 'weapon' },
  { file: 'assets/black-hair.jpg',    title: 'Midnight Long Hair',   cat: 'hair' },
  { file: 'assets/outfit-back.jpg',   title: 'Wanderer Outfit - Back', cat: 'outfit' },
  { file: 'assets/dual-hooks.jpg',    title: 'Dual Hook Swords',     cat: 'weapon' },
  { file: 'assets/brown-hair.jpg',    title: 'Gilded Updo',          cat: 'hair' },
];


const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt));

/* ---------- brand / contact ---------- */
$$('[data-brand]').forEach(el => (el.textContent = CONFIG.name));
document.title = CONFIG.name;
$('#year').textContent = new Date().getFullYear();
const mail = $('#mail');
mail.href = `mailto:${CONFIG.email}`;
mail.textContent = CONFIG.email;

/* ---------- scroll reveal (fires once) ---------- */
const revealIO = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
}, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
$$('.reveal').filter(el => !el.closest('.hero')).forEach(el => revealIO.observe(el));

/* ---------- gallery ---------- */
const grid = $('#grid');
const labels = { hair: 'Hair', weapon: 'Weapon', outfit: 'Outfit', accessory: 'Accessory' };
// IntersectionObserver treats a fully clip-path'd element as hidden, so tiles are revealed from scroll position instead.
const pending = new Set();
function revealTiles() {
  for (const t of pending) {
    const r = t.getBoundingClientRect();
    if (r.top < innerHeight - 40 && r.bottom > 0) { t.classList.add('in'); pending.delete(t); }
  }
}
addEventListener('scroll', revealTiles, { passive: true });
addEventListener('resize', revealTiles);
const tileIO = { observe: t => pending.add(t) };

WORKS.forEach((w, i) => {
  const t = document.createElement('button');
  t.className = 'tile';
  t.dataset.cat = w.cat;
  t.dataset.title = w.title;
  t.style.setProperty('--d', i % 3);
  t.setAttribute('aria-label', `${w.title} — open preview`);
  t.innerHTML = `<img loading="lazy" alt="${w.title}" src="${w.file}">
    <div class="ph"><b>${w.title}</b><span>Add ${w.file}</span></div>
    <div class="cap"><b>${w.title}</b><span>${labels[w.cat]}</span></div>`;
  const img = $('img', t);
  img.addEventListener('error', () => t.classList.add('noimg'));
  grid.appendChild(t);
  tileIO.observe(t);

  // 3D tilt: decorative, fine pointers only. Set transform on the element directly.
  if (finePointer && !reduceMotion) {
    t.addEventListener('pointermove', e => {
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      t.style.transition = 'clip-path 600ms var(--ease-in-out), opacity 300ms var(--ease-out), transform 90ms linear';
      t.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(0)`;
    });
    t.addEventListener('pointerleave', () => {
      t.style.transition = '';
      t.style.transform = '';
    });
  }
});

revealTiles();

/* filters */
$('#filters').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  $$('#filters .chip').forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
  const f = chip.dataset.f;
  $$('.tile').forEach(t => {
    const show = f === 'all' || t.dataset.cat === f;
    t.hidden = false;
    t.classList.toggle('out', !show);
    t.style.display = show ? '' : 'none';
    if (show) t.classList.add('in');
  });
});

/* lightbox */
const lb = $('#lightbox');
let lastFocus = null;
const closeLB = () => {
  lb.classList.remove('open');
  setTimeout(() => (lb.hidden = true), 250);
  lastFocus?.focus();
};
grid.addEventListener('click', e => {
  const tile = e.target.closest('.tile');
  if (!tile || tile.classList.contains('noimg')) return;
  lastFocus = tile;
  $('#lb-img').src = $('img', tile).src;
  $('#lb-img').alt = tile.dataset.title;
  $('#lb-cap').textContent = tile.dataset.title;
  lb.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('open')));
  $('.lb-close', lb).focus();
});
lb.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeLB(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLB(); });

/* ---------- nav scroll-spy + process rail ---------- */
const spyLinks = $$('[data-spy]');
const spyTargets = spyLinks.map(a => $(a.getAttribute('href')));
const railFill = $('#rail-fill');
const stepsEl = $('#steps');
function onScrollUI() {
  const mid = innerHeight * 0.4;
  let active = -1;
  spyTargets.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top < mid && r.bottom > mid) active = i; });
  spyLinks.forEach((a, i) => a.classList.toggle('on', i === active));
  const r = stepsEl.getBoundingClientRect();
  const p = clamp((innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.3), 0, 1);
  railFill.style.transform = `scaleX(${p.toFixed(3)})`;
}
addEventListener('scroll', onScrollUI, { passive: true });
onScrollUI();

/* ---------- magnetic CTA (decorative, fine pointer) ---------- */
if (finePointer && !reduceMotion) {
  const el = $('.magnetic');
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
    el.style.transform = `translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
    raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.05) ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    tx = (e.clientX - (r.left + r.width / 2)) * 0.25;
    ty = (e.clientY - (r.top + r.height / 2)) * 0.35;
    kick();
  });
  el.addEventListener('pointerleave', () => { tx = ty = 0; kick(); });
}

/* =============================================================
   3D — your real GLB models, one fixed canvas that follows the page
   ============================================================= */
const MODELS = [
  'assets/models/demon-sword.glb',
  'assets/models/akuma-hair.glb',
  'assets/models/female-hair.glb',
  'assets/models/chibi-chain.glb',
  'assets/models/crystal-bow.glb',
  'assets/models/moss-maiden.glb',
];
const canvas = $('#gl');
const stageEls = $$('[data-stage]');
const showStage = $('#stage');
const loaderEl = $('#loader');
const tabs = $$('#tabs [role="tab"]');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (err) { document.documentElement.classList.add('no-webgl'); }

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100); camera.position.set(0, 0, 10);
  const HALF_H = Math.tan(THREE.MathUtils.degToRad(35 / 2)) * 10;
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(3, 5, 6); scene.add(key);
  const rim = new THREE.PointLight(0xb9a2f2, 45, 24); rim.position.set(-4, 2, -3); scene.add(rim);
  const fill = new THREE.PointLight(0xffffff, 12, 24); fill.position.set(4, -2, 4); scene.add(fill);

  /* lazy-loaded models, cached */
  const loader = new GLTFLoader();
  const slots = MODELS.map(() => ({ holder: new THREE.Group(), state: 'idle', progress: 0, amt: 0, mats: [] }));
  slots.forEach(s => { s.holder.visible = false; scene.add(s.holder); });
  const SIZE = 3.6;
  function load(i) {
    const s = slots[i];
    if (s.state !== 'idle') return;
    s.state = 'loading';
    loader.load(MODELS[i], gltf => {
      const m = gltf.scene;
      m.traverse(o => { if (/backup/i.test(o.name)) o.visible = false; }); // exports sometimes carry a hidden backup copy
      const box = new THREE.Box3().setFromObject(m);
      const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      m.position.sub(c);
      const wrap = new THREE.Group(); wrap.add(m);
      wrap.scale.setScalar(SIZE / Math.max(size.y, size.x * 0.8, size.z * 0.8));
      s.holder.add(wrap);
      const set = new Set();
      s.holder.traverse(o => { if (o.material) { set.add(o.material); o.frustumCulled = false; } });
      s.mats = [...set]; s.mats.forEach(mt => { mt.userData.base = mt.opacity; });
      s.state = 'ready';
    }, e => { if (e.total) s.progress = e.loaded / e.total; }, () => { s.state = 'error'; });
  }
  load(0);

  let activeTab = 0;
  tabs.forEach((b, i) => b.addEventListener('click', () => {
    activeTab = i;
    tabs.forEach(t => t.setAttribute('aria-selected', String(t === b)));
    load(i);
  }));

  /* drag to rotate with momentum */
  let dragging = false, dragX = 0, angle = 0, spin = 0;
  showStage.addEventListener('pointerdown', e => { dragging = true; dragX = e.clientX; spin = 0; showStage.setPointerCapture(e.pointerId); showStage.classList.add('drag'); });
  showStage.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - dragX; dragX = e.clientX; angle += dx * 0.012; spin = dx * 0.012 * 60; });
  const endDrag = () => { dragging = false; showStage.classList.remove('drag'); };
  showStage.addEventListener('pointerup', endDrag); showStage.addEventListener('pointercancel', endDrag);
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  /* embers (ambient) */
  const N = 200, ePos = new Float32Array(N * 3), eSpd = new Float32Array(N);
  for (let i = 0; i < N; i++) { ePos.set([(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6 - 2], i * 3); eSpd[i] = 0.1 + Math.random() * 0.3; }
  const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  scene.add(new THREE.Points(eGeo, new THREE.PointsMaterial({ size: 0.04, color: 0xb9a2f2, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })));

  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();

  function pickStage() {
    let best = null, bestScore = 0;
    for (const el of stageEls) {
      const r = el.getBoundingClientRect();
      const vis = clamp(Math.min(r.bottom, innerHeight) - Math.max(r.top, 0), 0, r.height) / Math.max(r.height, 1);
      const score = vis * (1 - Math.abs((r.top + r.height / 2) / innerHeight - 0.5));
      if (score > bestScore) { bestScore = score; best = { el, r, vis }; }
    }
    return best;
  }

  const pos = new THREE.Vector3(2, 0, 0); let scale = 1, visTarget = 0, last = performance.now();
  (function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; const t = now / 1000;
    const pick = pickStage(), aspect = innerWidth / innerHeight;
    let idx = 0;
    if (pick) {
      const { r, el, vis } = pick;
      const inShow = el === showStage; idx = inShow ? activeTab : 0;
      pos.x = damp(pos.x, (((r.left + r.width / 2) / innerWidth) * 2 - 1) * HALF_H * aspect, 6, dt);
      pos.y = damp(pos.y, -(((r.top + r.height / 2) / innerHeight) * 2 - 1) * HALF_H, 6, dt);
      scale = damp(scale, (r.height / innerHeight) * (HALF_H * 2) * (inShow ? 0.8 : 0.88) / SIZE, 6, dt);
      visTarget = clamp((vis - 0.12) / 0.4, 0, 1);
    } else visTarget = 0;

    if (!dragging) { spin *= Math.exp(-2.6 * dt); angle += spin * dt; }
    pointer.sx = damp(pointer.sx, pointer.x, 4, dt); pointer.sy = damp(pointer.sy, pointer.y, 4, dt);
    const idle = reduceMotion ? 0 : t * 0.35;

    slots.forEach((s, i) => {
      const want = i === idx && s.state === 'ready' ? visTarget : 0;
      s.amt = damp(s.amt, want, i === idx ? 7 : 11, dt);
      const on = s.amt > 0.01; s.holder.visible = on; if (!on) return;
      const a = s.amt, transparent = a < 0.995;
      if (transparent !== s.tr) { s.mats.forEach(mt => { mt.transparent = transparent; mt.needsUpdate = true; }); s.tr = transparent; }
      if (transparent) s.mats.forEach(mt => { mt.opacity = a * (mt.userData.base ?? 1); });
      s.holder.position.set(pos.x, pos.y - (1 - a) * 0.5 + (reduceMotion ? 0 : Math.sin(t * 1.2) * 0.07), 0);
      s.holder.scale.setScalar(scale * (0.9 + 0.1 * a));
      s.holder.rotation.set((reduceMotion ? 0 : pointer.sy * 0.1) + 0.05, angle + idle + (1 - a) * 0.9 + (reduceMotion ? 0 : pointer.sx * 0.2), 0);
    });

    /* loader label for the active viewer tab */
    const cur = slots[activeTab];
    if (cur.state === 'ready' || cur.state === 'idle') loaderEl.hidden = true;
    else { loaderEl.hidden = false; loaderEl.textContent = cur.state === 'error' ? 'Could not load model' : `Loading model ${Math.round(cur.progress * 100)}%`; }

    if (!reduceMotion) {
      const p = eGeo.attributes.position.array;
      for (let i = 0; i < N; i++) { p[i * 3 + 1] += eSpd[i] * dt; if (p[i * 3 + 1] > 5.2) p[i * 3 + 1] = -5.2; }
      eGeo.attributes.position.needsUpdate = true;
    }
    renderer.render(scene, camera); requestAnimationFrame(frame);
  })(last);
}
