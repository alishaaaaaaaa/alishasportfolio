/* =====================================================================
   alisha's portfolio · projects.js

   Photo / clip carousels for projects, community items and the about photo.

   PROJECTS + COMMUNITY: add a comma-separated list to an <article class="project">
     data-preview="videos/projects/roomify.mp4, images/projects/roomify-1.jpg"
   - On a computer: hovering the row shows a small card beside the cursor
     that steps through the list by itself.
   - On a phone: a swipeable strip at the top of the row.

   ABOUT PHOTO: add a comma-separated list to the .about-photo element
     data-photos="images/about/1.jpg, images/about/2.jpg, images/about/3.jpg"
   It crossfades slowly; click/tap it or use the dots to move through.

   Mix photos (.jpg .png .webp) and clips (.mp4) freely. For a clip
   NAME.mp4, a NAME.webm next to it is used as a fallback for browsers that
   can't play mp4, and NAME.jpg (if present) shows before it starts.
   Nothing loads until it's needed, so carousels don't slow the site down.
   Styles live in style.css under "carousels".
   ===================================================================== */
(() => {
  'use strict';

  const SETTINGS = {
    hoverPhotoMs: 1800,   // how long each photo shows in a hover card
    hoverClipMs: 4500,    // how long each clip plays in a hover card
    aboutMs: 4500,        // about-photo crossfade timing
  };

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src);
  const parse = (list) => (list || '').split(',').map((s) => s.trim()).filter(Boolean);

  function makeMedia(src, alt, eager) {
    if (isVideo(src)) {
      const video = document.createElement('video');
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.setAttribute('aria-hidden', 'true');
      video.dataset.src = src;                 // sources are only added when first shown
      return video;
    }
    const img = document.createElement('img');
    img.alt = alt || '';
    img.decoding = 'async';
    if (eager) img.src = src;
    else img.dataset.src = src;
    return img;
  }
  function load(el) {
    const src = el.dataset.src;
    if (!src || el.dataset.loaded) return;
    el.dataset.loaded = '1';
    if (el.tagName !== 'VIDEO') { el.src = src; return; }
    const base = src.replace(/\.(mp4|webm|mov)$/i, '');
    el.poster = `${base}.jpg`;
    // mp4 first (plays almost everywhere); webm if the browser can't do mp4
    [[`${base}.mp4`, 'video/mp4'], [`${base}.webm`, 'video/webm']].forEach(([url, type]) => {
      const source = document.createElement('source');
      source.src = url;
      source.type = type;
      el.appendChild(source);
    });
    el.load();
  }
  const play = (el) => { if (el.tagName === 'VIDEO' && !reducedMotion) { load(el); el.play().catch(() => {}); } };
  const pause = (el) => { if (el.tagName === 'VIDEO') el.pause(); };

  function makeDots(count, onPick) {
    const dots = document.createElement('div');
    dots.className = 'deck-dots';
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement(onPick ? 'button' : 'span');
      dot.className = 'deck-dot';
      if (onPick) {
        dot.type = 'button';
        dot.setAttribute('aria-label', `Show photo ${i + 1} of ${count}`);
        dot.addEventListener('click', (event) => { event.stopPropagation(); onPick(i); });
      }
      dots.appendChild(dot);
    }
    return dots;
  }

  /* A crossfading deck: slides stacked on top of each other. */
  function makeDeck(srcs, alt, { clickableDots = false } = {}) {
    const el = document.createElement('div');
    el.className = 'deck';
    const slides = srcs.map((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'deck-slide';
      slide.appendChild(makeMedia(src, srcs.length > 1 ? `${alt} (${i + 1} of ${srcs.length})` : alt));
      el.appendChild(slide);
      return slide;
    });
    let index = -1;
    let timer = 0;
    const dots = srcs.length > 1 ? makeDots(srcs.length, clickableDots ? (i) => { show(i); restart(); } : null) : null;
    if (dots) el.appendChild(dots);

    function show(i) {
      if (i === index) return;
      if (index >= 0) {
        slides[index].classList.remove('is-current');
        pause(slides[index].firstChild);
        if (dots) dots.children[index].classList.remove('is-current');
      }
      index = (i + slides.length) % slides.length;
      const media = slides[index].firstChild;
      load(media);
      play(media);
      slides[index].classList.add('is-current');
      if (dots) dots.children[index].classList.add('is-current');
      // warm up the next one so the crossfade never shows a blank
      const next = slides[(index + 1) % slides.length].firstChild;
      if (next.tagName === 'IMG') load(next);
    }

    let durations = null;
    function tick() {
      show(index + 1);
      timer = window.setTimeout(tick, durations(slides[index].firstChild));
    }
    function start(getDuration) {
      durations = getDuration;
      stop();
      if (index < 0) show(0);
      else play(slides[index].firstChild);
      if (slides.length > 1 && !reducedMotion) {
        timer = window.setTimeout(tick, durations(slides[index].firstChild));
      }
    }
    function stop() {
      window.clearTimeout(timer);
      timer = 0;
    }
    function restart() { if (durations) start(durations); }
    function pauseAll() { stop(); if (index >= 0) pause(slides[index].firstChild); }

    return { el, show, start, stop, pauseAll, next: () => { show(index + 1); restart(); }, count: slides.length };
  }

  /* A swipeable strip (phones): slides side by side with scroll-snap. */
  function makeStrip(srcs, alt) {
    const el = document.createElement('div');
    el.className = 'strip-wrap';
    const strip = document.createElement('div');
    strip.className = 'strip';
    const media = srcs.map((src, i) => {
      const cell = document.createElement('div');
      cell.className = 'strip-cell';
      const m = makeMedia(src, srcs.length > 1 ? `${alt} (${i + 1} of ${srcs.length})` : alt);
      if (m.tagName === 'IMG') m.loading = 'lazy';
      cell.appendChild(m);
      strip.appendChild(cell);
      return m;
    });
    el.appendChild(strip);
    let dots = null;
    if (srcs.length > 1) {
      dots = makeDots(srcs.length, null);
      el.appendChild(dots);
      strip.addEventListener('scroll', () => {
        const i = Math.round(strip.scrollLeft / strip.clientWidth);
        Array.from(dots.children).forEach((d, k) => d.classList.toggle('is-current', k === i));
      }, { passive: true });
      dots.children[0].classList.add('is-current');
    }
    return { el, media };
  }

  /* ================= projects + community ================= */
  const rows = Array.from(document.querySelectorAll('.project[data-preview]'))
    .filter((row) => parse(row.dataset.preview).length);
  const nameOf = (row) => {
    const name = row.querySelector('.project-name');
    return name ? name.textContent.trim() : '';
  };

  if (rows.length && !finePointer) {
    // phones / tablets: swipeable strip at the top of each row
    const observer = 'IntersectionObserver' in window && !reducedMotion
      ? new IntersectionObserver((entries) => {
          entries.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) play(target); else pause(target);
          });
        }, { threshold: 0.6 })
      : null;
    // images: load each as it nears the screen
    const imgObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries, obs) => {
          entries.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) { load(target); obs.unobserve(target); }
          });
        }, { rootMargin: '300px' })
      : null;

    rows.forEach((row) => {
      const box = document.createElement('div');
      box.className = 'project-inline-media';
      const { el, media } = makeStrip(parse(row.dataset.preview), nameOf(row));
      box.appendChild(el);
      row.prepend(box);
      media.forEach((m) => {
        if (m.tagName === 'VIDEO') {
          if (reducedMotion) { m.controls = true; load(m); m.preload = 'metadata'; }
          else if (observer) observer.observe(m);
        } else if (imgObserver) imgObserver.observe(m);
        else load(m);
      });
    });
  }

  if (rows.length && finePointer) {
    // computers: one floating card beside the cursor, one deck per row
    const card = document.createElement('div');
    card.className = 'project-preview';
    card.setAttribute('aria-hidden', 'true');
    (document.getElementById('pages') || document.body).appendChild(card);

    const decks = new Map();
    const deckFor = (row) => {
      if (!decks.has(row)) {
        const deck = makeDeck(parse(row.dataset.preview), nameOf(row));
        deck.el.hidden = true;
        card.appendChild(deck.el);
        decks.set(row, deck);
      }
      return decks.get(row);
    };
    const hoverDuration = (media) => (media.tagName === 'VIDEO' ? SETTINGS.hoverClipMs : SETTINGS.hoverPhotoMs);

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let raf = 0;
    let active = null;

    function place() {
      // beside the cursor, flipping to the left near the right edge
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      let x = target.x + 28;
      if (x + w > window.innerWidth - 16) x = target.x - w - 28;
      const y = Math.min(Math.max(target.y - h / 2, 16), window.innerHeight - h - 16);
      return { x, y };
    }
    function frame() {
      const goal = place();
      pos.x += (goal.x - pos.x) * 0.2;
      pos.y += (goal.y - pos.y) * 0.2;
      card.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      raf = active ? requestAnimationFrame(frame) : 0;
    }
    function hide() {
      if (active) decks.get(active).pauseAll();
      active = null;
      card.classList.remove('is-shown');
    }

    rows.forEach((row) => {
      row.addEventListener('pointerenter', (event) => {
        if (active && active !== row) decks.get(active).pauseAll();
        active = row;
        target.x = event.clientX;
        target.y = event.clientY;
        const goal = place();
        pos.x = goal.x;
        pos.y = goal.y;
        const deck = deckFor(row);
        decks.forEach((d) => { d.el.hidden = d !== deck; });
        deck.start(hoverDuration);
        card.classList.add('is-shown');
        if (!raf) raf = requestAnimationFrame(frame);
      });
      row.addEventListener('pointermove', (event) => {
        target.x = event.clientX;
        target.y = event.clientY;
      });
      row.addEventListener('pointerleave', hide);
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-back]')) hide();
    });
  }

  /* ================= about photo ================= */
  const about = document.querySelector('.about-photo[data-photos]');
  const aboutSrcs = about ? parse(about.dataset.photos) : [];
  if (about && aboutSrcs.length) {
    about.classList.remove('is-empty');
    about.removeAttribute('role');
    const deck = makeDeck(aboutSrcs, about.getAttribute('aria-label') || 'Photo of Alisha', { clickableDots: true });
    deck.el.querySelectorAll('img').forEach((img, i) => { if (i < 2) load(img); });
    about.appendChild(deck.el);
    about.removeAttribute('aria-label');

    if (deck.count > 1) {
      about.classList.add('is-clickable');
      about.addEventListener('click', () => deck.next());
    }
    const run = () => deck.start(() => SETTINGS.aboutMs);
    // only cycle while the About page is actually open
    const page = about.closest('.page');
    const sync = () => (page && page.classList.contains('is-active') ? run() : deck.stop());
    deck.show(0);
    if (page) new MutationObserver(sync).observe(page, { attributes: true, attributeFilter: ['class'] });
    sync();
    about.addEventListener('pointerenter', () => deck.stop());
    about.addEventListener('pointerleave', sync);
  }
})();
