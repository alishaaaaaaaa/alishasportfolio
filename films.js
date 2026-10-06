/* =====================================================================
   alisha's portfolio · films.js

   The videography showreel: one frame that plays the clips listed in
   data-clips one after another, silently, with a soft crossfade.
   - Thin bars along the top show which clip you're on and its progress.
   - Click/tap the right side for the next clip, the left side to go back;
     ← / → work too when the reel is focused.
   - Clips that don't match the frame's shape (a vertical clip in a wide
     frame, say) sit in the middle over a blurred still of themselves.
   Only the playing clip and the next one load. It only plays while the
   videography page is open and the reel is on screen.
   Styles live in style.css under "showreel".
   ===================================================================== */
(() => {
  'use strict';

  const reel = document.querySelector('.reel[data-clips]');
  if (!reel) return;
  const clips = reel.dataset.clips.split(',').map((s) => s.trim()).filter(Boolean);
  if (!clips.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  reel.setAttribute('role', 'region');
  reel.setAttribute('aria-roledescription', 'showreel');
  reel.setAttribute('aria-label', 'Showreel of short films. Click the right side for the next clip, the left side for the previous one.');
  reel.tabIndex = 0;

  // layers: blurred backdrop, two video layers (A/B) for crossfading, progress bars
  const backdrop = document.createElement('div');
  backdrop.className = 'reel-backdrop';
  const layers = [0, 1].map(() => {
    const video = document.createElement('video');
    video.className = 'reel-video';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    reel.appendChild(video);
    return video;
  });
  reel.prepend(backdrop);
  const bars = document.createElement('div');
  bars.className = 'reel-bars';
  clips.forEach(() => {
    const bar = document.createElement('span');
    bar.appendChild(document.createElement('i'));
    bars.appendChild(bar);
  });
  reel.appendChild(bars);

  let index = -1;
  let front = 0;           // which layer is showing
  let active = false;      // page open + reel on screen

  function setSource(video, base) {
    if (video.dataset.base === base) return;
    video.dataset.base = base;
    video.innerHTML = '';
    video.poster = `${base}.jpg`;
    [[`${base}.mp4`, 'video/mp4'], [`${base}.webm`, 'video/webm']].forEach(([src, type]) => {
      const s = document.createElement('source');
      s.src = src;
      s.type = type;
      video.appendChild(s);
    });
    video.load();
  }

  // a clip "fits" if its shape matches the frame's; otherwise it's centred over a blur
  function fit(video) {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const frameWide = reel.clientWidth >= reel.clientHeight;
    const clipWide = vw >= vh;
    video.classList.toggle('is-contained', frameWide !== clipWide);
  }
  layers.forEach((video) => video.addEventListener('loadedmetadata', () => fit(video)));
  window.addEventListener('resize', () => layers.forEach(fit));

  function show(i) {
    index = (i + clips.length) % clips.length;
    const base = clips[index];
    const next = layers[1 - front];
    const prev = layers[front];
    setSource(next, base);
    next.currentTime = 0;
    fit(next);
    backdrop.style.backgroundImage = `url("${base}-blur.jpg")`;
    next.classList.add('is-front');
    prev.classList.remove('is-front');
    prev.pause();
    front = 1 - front;
    if (active && !reducedMotion) next.play().catch(() => {});

    Array.from(bars.children).forEach((bar, k) => {
      bar.classList.toggle('is-done', k < index);
      bar.classList.toggle('is-current', k === index);
      bar.firstChild.style.transform = k < index ? 'scaleX(1)' : 'scaleX(0)';
    });
    // quietly get the following clip ready on the hidden layer
    window.setTimeout(() => {
      if (layers[1 - front] === prev) setSource(prev, clips[(index + 1) % clips.length]);
    }, 900);
  }

  // progress bar for the playing clip; move on when it ends
  layers.forEach((video) => {
    video.addEventListener('timeupdate', () => {
      if (video !== layers[front] || !video.duration) return;
      bars.children[index].firstChild.style.transform = `scaleX(${video.currentTime / video.duration})`;
    });
    video.addEventListener('ended', () => { if (video === layers[front]) show(index + 1); });
  });

  // click/tap: right 2/3 → next, left 1/3 → back
  reel.addEventListener('click', (event) => {
    const rect = reel.getBoundingClientRect();
    show(event.clientX - rect.left < rect.width / 3 ? index - 1 : index + 1);
  });
  reel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); show(index + 1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); show(index - 1); }
  });

  function setActive(on) {
    if (on === active) return;
    active = on;
    const video = layers[front];
    if (on && !reducedMotion) video.play().catch(() => {});
    else video.pause();
  }

  const page = reel.closest('.page');
  let onScreen = true;
  const sync = () => {
    const pageOpen = !page || (page.classList.contains('is-active') && page.closest('.pages.is-open'));
    if (pageOpen && index < 0) show(0);
    setActive(Boolean(pageOpen) && onScreen);
  };
  if (page) {
    new MutationObserver(sync).observe(page, { attributes: true, attributeFilter: ['class'] });
    const pages = page.closest('.pages');
    if (pages) new MutationObserver(sync).observe(pages, { attributes: true, attributeFilter: ['class'] });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }, { threshold: 0.25 }).observe(reel);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) setActive(false); else sync(); });
  sync();
})();
