/* =====================================================================
   alisha's portfolio · cursor.js

   A little firefly cursor.
   - A soft halo in the room's weather colour drifts lazily
     behind it, and opens into a ring over anything clickable.
   - A short trail of dust specks floats up when you move

   ===================================================================== */
(() => {
  'use strict';

  const SETTINGS = {
    haloSpeed: 14,       // how quickly the halo catches up (higher = snappier)
    trail: true,         // set to false for just the dot + halo
    speckEveryMs: 28,    // at most one speck this often while moving
    specks: 14,          // how many speck elements are reused for the trail
    speckLifeMs: 900,    // how long a speck lingers before fading out
  };

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion) return;

  // Live inside the stage so the halo and specks inherit --glow from it
  const stage = document.getElementById('viewport') || document.body;
  const root = document.documentElement;

  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');
  halo.appendChild(document.createElement('i'));   // the ring itself: it grows/shrinks without moving the halo
  stage.append(halo);

  // A small, reused set of specks (no canvas, nothing redrawn each frame)
  const pool = [];
  if (SETTINGS.trail) {
    for (let i = 0; i < SETTINGS.specks; i += 1) {
      const s = document.createElement('span');
      s.className = 'cursor-speck';
      s.setAttribute('aria-hidden', 'true');
      stage.append(s);
      pool.push(s);
    }
  }
  let nextSpeck = 0;
  let lastSpeck = 0;

  function dropSpeck(x, y, now) {
    if (!pool.length || now - lastSpeck < SETTINGS.speckEveryMs) return;
    lastSpeck = now;
    const s = pool[nextSpeck];
    nextSpeck = (nextSpeck + 1) % pool.length;
    // position, size and drift all live in the animation itself, so the
    // page never has to restyle anything for a speck
    const scale = 0.5 + Math.random() * 0.6;
    const x0 = x + (Math.random() - 0.5) * 6;
    const y0 = y + (Math.random() - 0.5) * 6;
    const x1 = x0 + (Math.random() - 0.5) * 14;
    const y1 = y0 - (10 + Math.random() * 22);   // drift upward, like the motes
    s.animate(
      [
        { transform: `translate3d(${x0}px, ${y0}px, 0) scale(${scale})`, opacity: 0.85 },
        { transform: `translate3d(${x1}px, ${y1}px, 0) scale(${scale * 0.5})`, opacity: 0 },
      ],
      { duration: SETTINGS.speckLifeMs, easing: 'ease-out', fill: 'forwards' },
    );
  }

  const mouse = { x: -100, y: -100 };
  const haloPos = { x: -100, y: -100 };
  let visible = false;
  let raf = 0;
  let lastFrame = 0;

  const INTERACTIVE = 'a, button, [role="button"], .project, label, summary';

  function onMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    if (!visible) {
      visible = true;
      haloPos.x = mouse.x;
      haloPos.y = mouse.y;
      halo.classList.add('is-visible');
    }
    dropSpeck(mouse.x, mouse.y, event.timeStamp || performance.now());
    if (!raf) { lastFrame = 0; raf = requestAnimationFrame(frame); }
  }

  // The halo eases toward the pointer at the same speed whatever the frame
  // rate, so a busy page makes it skip ahead rather than fall behind.
  function frame(now) {
    const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 1 / 60;
    lastFrame = now;
    const k = 1 - Math.exp(-SETTINGS.haloSpeed * dt);
    haloPos.x += (mouse.x - haloPos.x) * k;
    haloPos.y += (mouse.y - haloPos.y) * k;
    halo.style.transform = `translate3d(${haloPos.x}px, ${haloPos.y}px, 0)`;

    if (Math.abs(mouse.x - haloPos.x) + Math.abs(mouse.y - haloPos.y) > 0.3) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
    }
  }

  function onOver(event) {
    const hit = event.target.closest && event.target.closest(INTERACTIVE);
    halo.classList.toggle('is-hover', Boolean(hit));   // on the halo only, so nothing else restyles
  }

  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerover', onOver, { passive: true });
  document.addEventListener('pointerdown', () => halo.classList.add('is-down'));
  document.addEventListener('pointerup', () => halo.classList.remove('is-down'));
  root.addEventListener('pointerleave', () => {
    visible = false;
    halo.classList.remove('is-visible');
  });

  root.classList.add('has-custom-cursor');
})();