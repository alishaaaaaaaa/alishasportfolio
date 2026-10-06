/* =====================================================================
   alisha's portfolio · cursor.js

   A little firefly cursor: a bright dot that sits exactly where your
   mouse is, a soft halo that drifts lazily behind it, and a short trail
   of dust specks (like the floating motes) when you move.
   Everything is tinted with the room's current weather colour (--glow),
   so it's amber on warm days and blue on cool nights.

   It only switches on for a real mouse / trackpad. Phones, tablets and
   anyone with "reduce motion" turned on keep their normal cursor.
   The styles live in style.css, section 11.
   ===================================================================== */
(() => {
  'use strict';

  const SETTINGS = {
    haloLag: 0.16,       // 0–1: how quickly the halo catches up (lower = lazier)
    trail: true,         // set to false for just the dot + halo
    specksPerMove: 1,    // how many specks each mouse move drops
    maxSpecks: 46,       // cap, so the trail never gets heavy
    speckLifeMs: 900,    // how long a speck lingers before fading out
  };

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion) return;

  // Live inside the stage so the cursor inherits --glow from it
  const stage = document.getElementById('viewport') || document.body;

  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  stage.append(canvas, halo, dot);
  document.documentElement.classList.add('has-custom-cursor');

  const ctx = canvas.getContext('2d');
  let dpr = 1;
  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  // Read the weather colour from CSS, as "r, g, b"
  let glowRGB = '255, 236, 200';
  function readGlow() {
    const raw = getComputedStyle(stage).getPropertyValue('--glow');
    const match = raw.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) glowRGB = `${match[1]}, ${match[2]}, ${match[3]}`;
  }
  readGlow();
  // the weather (and so the colour) can change after load
  new MutationObserver(readGlow).observe(stage, { attributes: true, attributeFilter: ['data-tone', 'data-time'] });

  const mouse = { x: -100, y: -100 };
  const haloPos = { x: -100, y: -100 };
  const specks = [];
  let visible = false;
  let raf = 0;

  const INTERACTIVE = 'a, button, [role="button"], .card, label, summary';

  function addSpecks(x, y) {
    if (!SETTINGS.trail) return;
    for (let i = 0; i < SETTINGS.specksPerMove; i += 1) {
      if (specks.length >= SETTINGS.maxSpecks) specks.shift();
      specks.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.35 + 0.1),       // drift upward, like the motes
        r: Math.random() * 1.6 + 0.8,
        born: performance.now(),
      });
    }
  }

  function onMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (!visible) {
      visible = true;
      haloPos.x = mouse.x;
      haloPos.y = mouse.y;
      document.documentElement.classList.add('cursor-visible');
    }
    addSpecks(mouse.x, mouse.y);
    start();
  }

  function onOver(event) {
    const hit = event.target.closest && event.target.closest(INTERACTIVE);
    document.documentElement.classList.toggle('cursor-hover', Boolean(hit));
  }

  function frame(now) {
    haloPos.x += (mouse.x - haloPos.x) * SETTINGS.haloLag;
    haloPos.y += (mouse.y - haloPos.y) * SETTINGS.haloLag;

    dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
    halo.style.transform = `translate3d(${haloPos.x}px, ${haloPos.y}px, 0)`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = specks.length - 1; i >= 0; i -= 1) {
      const s = specks[i];
      const age = (now - s.born) / SETTINGS.speckLifeMs;
      if (age >= 1) { specks.splice(i, 1); continue; }
      s.x += s.vx;
      s.y += s.vy;
      const alpha = (1 - age) * (1 - age) * 0.9;
      const x = s.x * dpr;
      const y = s.y * dpr;
      const r = s.r * dpr;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      g.addColorStop(0.35, `rgba(${glowRGB}, ${alpha * 0.8})`);
      g.addColorStop(1, `rgba(${glowRGB}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // keep animating while the halo is still catching up or specks remain
    const settling = Math.abs(mouse.x - haloPos.x) + Math.abs(mouse.y - haloPos.y) > 0.3;
    if (settling || specks.length) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
    }
  }

  function start() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerdown', () => document.documentElement.classList.add('cursor-down'));
  document.addEventListener('pointerup', () => document.documentElement.classList.remove('cursor-down'));
  document.documentElement.addEventListener('pointerleave', () => {
    visible = false;
    document.documentElement.classList.remove('cursor-visible');
  });
})();