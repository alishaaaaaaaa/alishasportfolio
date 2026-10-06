/* =====================================================================
   alisha's portfolio · films.js

   The videography page.
   - Tiles: a silent preview loop plays while you hover a film (computer),
     or while it's the film most in view (phone). Otherwise the still shows.
   - Clicking a film opens it full size, with sound, in a player that sits
     over the page. ← / → (or the arrow buttons) move between films;
     Esc, the × or clicking outside closes it.
   Previews load only when needed and full films only when opened, so the
   page stays light. Styles live in style.css under "videography".
   ===================================================================== */
(() => {
  'use strict';

  const films = Array.from(document.querySelectorAll('.film[data-film]'));
  if (!films.length) return;

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.getElementById('viewport') || document.body;
  const titleOf = (film) => {
    const t = film.querySelector('.film-title');
    return t ? t.textContent.trim() : '';
  };

  function addSources(video, base, suffix) {
    // mp4 first (plays almost everywhere); webm if the browser can't do mp4
    [[`${base}${suffix}.mp4`, 'video/mp4'], [`${base}${suffix}.webm`, 'video/webm']].forEach(([src, type]) => {
      const source = document.createElement('source');
      source.src = src;
      source.type = type;
      video.appendChild(source);
    });
  }

  /* ---------------- tile previews ---------------- */
  function previewFor(film) {
    let video = film.querySelector('.film-preview');
    if (!video) {
      video = document.createElement('video');
      video.className = 'film-preview';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.setAttribute('aria-hidden', 'true');
      addSources(video, film.dataset.film, '-preview');
      video.addEventListener('playing', () => film.classList.add('is-playing'));
      film.insertBefore(video, film.querySelector('.film-meta'));
    }
    return video;
  }
  function startPreview(film) {
    if (reducedMotion) return;
    previewFor(film).play().catch(() => {});
  }
  function stopPreview(film) {
    const video = film.querySelector('.film-preview');
    if (video) video.pause();
    film.classList.remove('is-playing');
  }

  if (finePointer) {
    films.forEach((film) => {
      film.addEventListener('pointerenter', () => startPreview(film));
      film.addEventListener('pointerleave', () => stopPreview(film));
      film.addEventListener('focus', () => startPreview(film));
      film.addEventListener('blur', () => stopPreview(film));
    });
  } else if ('IntersectionObserver' in window) {
    // phones: only the film most in view plays, so it never gets heavy
    const ratios = new Map();
    let current = null;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, intersectionRatio }) => ratios.set(target, intersectionRatio));
      let best = null;
      let bestRatio = 0.55;
      ratios.forEach((ratio, film) => { if (ratio > bestRatio) { best = film; bestRatio = ratio; } });
      if (best !== current) {
        if (current) stopPreview(current);
        current = best;
        if (current) startPreview(current);
      }
    }, { threshold: [0, 0.25, 0.55, 0.75, 1] });
    films.forEach((film) => observer.observe(film));
  }

  /* ---------------- full-size player ---------------- */
  const box = document.createElement('div');
  box.className = 'film-player';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Film player');
  box.innerHTML = `
    <button class="film-player-close" type="button" aria-label="Close">×</button>
    <button class="film-player-nav is-prev" type="button" aria-label="Previous film">‹</button>
    <figure class="film-player-frame">
      <video controls playsinline></video>
      <figcaption></figcaption>
    </figure>
    <button class="film-player-nav is-next" type="button" aria-label="Next film">›</button>`;
  stage.appendChild(box);   // inside the stage so the custom cursor stays on top

  const player = box.querySelector('video');
  const caption = box.querySelector('figcaption');
  let index = -1;
  let opener = null;

  function show(i) {
    index = (i + films.length) % films.length;
    const film = films[index];
    player.pause();
    player.innerHTML = '';
    player.removeAttribute('src');
    player.poster = `${film.dataset.film}.jpg`;
    addSources(player, film.dataset.film, '');
    player.load();
    player.play().catch(() => {});
    const time = film.querySelector('.film-time');
    caption.textContent = titleOf(film) + (time ? `  ·  ${time.textContent.trim()}` : '');
    box.classList.toggle('is-vertical', Number(getComputedStyle(film).getPropertyValue('--h')) > Number(getComputedStyle(film).getPropertyValue('--w')));
  }

  function open(i) {
    opener = document.activeElement;
    films.forEach(stopPreview);
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('is-open'));
    show(i);
    box.querySelector('.film-player-close').focus({ preventScroll: true });
  }

  function close() {
    if (box.hidden) return;
    player.pause();
    box.classList.remove('is-open');
    window.setTimeout(() => {
      box.hidden = true;
      player.innerHTML = '';
      player.removeAttribute('src');
      player.load();                       // stop downloading
    }, 250);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  films.forEach((film, i) => film.addEventListener('click', () => open(i)));
  box.querySelector('.film-player-close').addEventListener('click', close);
  box.querySelector('.is-prev').addEventListener('click', () => show(index - 1));
  box.querySelector('.is-next').addEventListener('click', () => show(index + 1));
  box.addEventListener('click', (event) => { if (event.target === box) close(); });

  // Capture phase, so Esc closes the player instead of the whole page
  document.addEventListener('keydown', (event) => {
    if (box.hidden) return;
    if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); close(); }
    else if (event.key === 'ArrowRight') { event.stopPropagation(); show(index + 1); }
    else if (event.key === 'ArrowLeft') { event.stopPropagation(); show(index - 1); }
  }, true);

  // close it if the page itself closes (e.g. the browser Back button)
  const page = films[0].closest('.page');
  if (page) {
    new MutationObserver(() => {
      if (!page.classList.contains('is-active')) { close(); films.forEach(stopPreview); }
    }).observe(page, { attributes: true, attributeFilter: ['class'] });
  }
})();
