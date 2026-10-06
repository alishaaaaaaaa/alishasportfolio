/* =====================================================================
   alisha's portfolio · projects.js

   1. DETAIL POPUPS for projects and community.
      Each row's <button class="project-open"> opens a popup built from the
      <template class="detail"> inside that row:
        data-media    photos/clips for the popup's carousel, comma-separated
        data-eyebrow  the small label above the title
      Clips (.mp4) play silently on loop while their slide is showing; a
      NAME.webm next to NAME.mp4 is used if a browser can't play mp4, and
      NAME.jpg (if present) shows before it starts.
      Close with Esc, the ×, or by clicking outside. ← / → move the carousel.

   2. ABOUT PHOTO: list photos in the .about-photo's data-photos
      (comma-separated). Two or more slowly crossfade; click to advance.

   3. PHOTO STRIP on the community page: rows of photos that drift
      sideways and race faster while you scroll. Tune DRIFT / BOOST below.

   Styles live in style.css under "detail popup" and "carousels".
   ===================================================================== */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = document.getElementById('viewport') || document.body;
  const isVideo = (src) => /\.(mp4|webm|mov)$/i.test(src);
  const parse = (list) => (list || '').split(',').map((s) => s.trim()).filter(Boolean);

  function makeVideo(src) {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-hidden', 'true');
    const base = src.replace(/\.(mp4|webm|mov)$/i, '');
    video.poster = `${base}.jpg`;
    [[`${base}.mp4`, 'video/mp4'], [`${base}.webm`, 'video/webm']].forEach(([url, type]) => {
      const source = document.createElement('source');
      source.src = url;
      source.type = type;
      video.appendChild(source);
    });
    return video;
  }

  /* ================= 1. detail popups ================= */
  const openers = Array.from(document.querySelectorAll('.project-open, [data-detail]'));

  if (openers.length) {
    const modal = document.createElement('div');
    modal.className = 'detail-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="detail-card" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button class="detail-close" type="button" aria-label="Close">×</button>
        <div class="detail-media">
          <div class="detail-track"></div>
          <button class="detail-arrow is-prev" type="button" aria-label="Previous">‹</button>
          <button class="detail-arrow is-next" type="button" aria-label="Next">›</button>
          <div class="detail-dots" aria-hidden="true"></div>
        </div>
        <div class="detail-text">
          <p class="detail-eyebrow"></p>
          <h3 class="detail-title" id="detail-title"></h3>
          <div class="detail-body"></div>
        </div>
      </div>`;
    stage.appendChild(modal);   // inside the stage so the custom cursor stays on top

    const card = modal.querySelector('.detail-card');
    const media = modal.querySelector('.detail-media');
    const track = modal.querySelector('.detail-track');
    const dots = modal.querySelector('.detail-dots');
    const eyebrow = modal.querySelector('.detail-eyebrow');
    const title = modal.querySelector('.detail-title');
    const body = modal.querySelector('.detail-body');
    const textCol = modal.querySelector('.detail-text');
    let slides = [];
    let current = 0;
    let opener = null;

    function setCurrent(i) {
      current = Math.max(0, Math.min(slides.length - 1, i));
      slides.forEach((slide, k) => {
        const video = slide.querySelector('video');
        if (video) {
          if (k === current && !reducedMotion) video.play().catch(() => {});
          else video.pause();
        }
      });
      Array.from(dots.children).forEach((dot, k) => dot.classList.toggle('is-current', k === current));
      media.classList.toggle('at-start', current === 0);
      media.classList.toggle('at-end', current === slides.length - 1);
    }
    function goTo(i) {
      const target = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: target * track.clientWidth, behavior: reducedMotion ? 'auto' : 'smooth' });
      setCurrent(target);
    }
    // keep the current slide in sync when swiping
    let scrollTimer = 0;
    track.addEventListener('scroll', () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => setCurrent(Math.round(track.scrollLeft / track.clientWidth)), 80);
    }, { passive: true });

    modal.querySelector('.is-prev').addEventListener('click', () => goTo(current - 1));
    modal.querySelector('.is-next').addEventListener('click', () => goTo(current + 1));

    // tpl: the <template> to show; heading: the popup's title
    function open(tpl, heading) {
      if (!tpl) return;
      opener = document.activeElement;
      document.documentElement.classList.add('modal-open');

      eyebrow.textContent = tpl.dataset.eyebrow || '';
      title.textContent = heading;
      modal.dataset.kind = tpl.id || 'detail';
      modal.dataset.shape = tpl.dataset.shape || '';   // "portrait" = tall photos
      body.innerHTML = '';
      body.appendChild(tpl.content.cloneNode(true));

      track.innerHTML = '';
      dots.innerHTML = '';
      const list = parse(tpl.dataset.media);
      slides = list.map((src, i) => {
        const slide = document.createElement('div');
        slide.className = 'detail-slide';
        if (isVideo(src)) {
          slide.appendChild(makeVideo(src));
        } else {
          const img = document.createElement('img');
          img.src = src;
          img.alt = `${title.textContent} photo ${i + 1} of ${list.length}`;
          img.decoding = 'async';
          if (i > 1) img.loading = 'lazy';
          slide.appendChild(img);
        }
        track.appendChild(slide);
        dots.appendChild(document.createElement('span'));
        return slide;
      });
      modal.classList.toggle('has-media', slides.length > 0);
      modal.classList.toggle('has-many', slides.length > 1);

      modal.hidden = false;
      track.scrollLeft = 0;
      textCol.scrollTop = 0;
      card.scrollTop = 0;
      setCurrent(0);
      requestAnimationFrame(() => modal.classList.add('is-open'));
      modal.querySelector('.detail-close').focus({ preventScroll: true });
    }

    function close() {
      if (modal.hidden) return;
      slides.forEach((slide) => { const v = slide.querySelector('video'); if (v) v.pause(); });
      modal.classList.remove('is-open');
      document.documentElement.classList.remove('modal-open');
      window.setTimeout(() => {
        modal.hidden = true;
        track.innerHTML = '';          // stops any video downloads
        slides = [];
      }, 260);
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }

    openers.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.dataset.detail) {
          const tpl = document.getElementById(button.dataset.detail);
          if (tpl) open(tpl, tpl.dataset.title || button.getAttribute('aria-label') || '');
        } else {
          const row = button.closest('.project');
          open(row.querySelector('template.detail'), button.textContent.trim());
        }
      });
    });
    modal.querySelector('.detail-close').addEventListener('click', close);
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });

    // Capture phase, so Esc closes the popup rather than the whole page
    document.addEventListener('keydown', (event) => {
      if (modal.hidden) return;
      const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
      if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); close(); }
      else if (typing) { /* let arrow keys move the text cursor */ }
      else if (event.key === 'ArrowRight' && slides.length > 1) { event.stopPropagation(); goTo(current + 1); }
      else if (event.key === 'ArrowLeft' && slides.length > 1) { event.stopPropagation(); goTo(current - 1); }
      else if (event.key === 'Tab') {
        // keep keyboard focus inside the popup
        const focusable = Array.from(card.querySelectorAll('button, a[href], input:not([tabindex="-1"]), textarea')).filter((el) => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }, true);

    // close it if the page underneath closes (e.g. the browser Back button)
    document.querySelectorAll('.page').forEach((page) => {
      new MutationObserver(() => {
        if (!page.classList.contains('is-active') && !modal.hidden && opener && page.contains(opener)) close();
      }).observe(page, { attributes: true, attributeFilter: ['class'] });
    });
  }

  /* ================= 3. photo strip (community) =================
     Each .marquee-row drifts slowly in its data-direction. Scrolling the
     page adds the scroll speed on top, so the photos race past while you
     scroll and ease back to a drift when you stop. */
  const marquee = document.querySelector('.marquee');
  if (marquee && !reducedMotion) {
    const DRIFT = 28;        // px per second when you're not scrolling
    const BOOST = 0.9;       // how much scroll speed is added (1 = same speed as the page)
    const rows = Array.from(marquee.querySelectorAll('.marquee-row')).map((el) => ({
      el,
      dir: Number(el.dataset.direction) || -1,
      originals: Array.from(el.children),
      setWidth: 0,
      offset: 0,
    }));
    const scroller = marquee.closest('.page-scroll');
    const page = marquee.closest('.page');

    // repeat each row's photos until it's comfortably wider than the screen,
    // so it can loop forever without a gap
    function measure() {
      rows.forEach((row) => {
        Array.from(row.el.children).slice(row.originals.length).forEach((n) => n.remove());
        const gap = parseFloat(getComputedStyle(row.el).columnGap) || 0;
        row.setWidth = row.originals.reduce((w, img) => w + img.getBoundingClientRect().width + gap, 0);
        if (!row.setWidth) return;
        const copies = Math.ceil((window.innerWidth * 2) / row.setWidth);
        for (let c = 0; c < copies; c += 1) {
          row.originals.forEach((img) => row.el.appendChild(img.cloneNode(true)));
        }
        row.offset = row.dir < 0 ? 0 : -row.setWidth;
      });
    }

    let lastScroll = scroller ? scroller.scrollTop : 0;
    let speed = 0;           // smoothed scroll speed, px per second
    let last = 0;
    let raf = 0;

    function frame(now) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const top = scroller ? scroller.scrollTop : 0;
      const raw = dt > 0 ? (top - lastScroll) / dt : 0;
      lastScroll = top;
      speed += (Math.abs(raw) - speed) * 0.12;      // ease in and out of the boost
      rows.forEach((row) => {
        if (!row.setWidth) return;
        row.offset += row.dir * (DRIFT + speed * BOOST) * dt;
        // wrap around seamlessly
        if (row.offset <= -row.setWidth) row.offset += row.setWidth;
        if (row.offset > 0) row.offset -= row.setWidth;
        row.el.style.transform = `translate3d(${row.offset}px, 0, 0)`;
      });
      raf = requestAnimationFrame(frame);
    }

    // only run while the community page is open (no work in the background)
    let measured = false;
    const sync = () => {
      const on = !page || page.classList.contains('is-active');
      if (on && !raf) {
        if (!measured) { measure(); measured = true; }
        last = 0;
        lastScroll = scroller ? scroller.scrollTop : 0;
        raf = requestAnimationFrame(frame);
      } else if (!on && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    if (page) new MutationObserver(sync).observe(page, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', () => { if (measured) measure(); });
    sync();
  }

  /* ================= 2. about photo ================= */
  const about = document.querySelector('.about-photo[data-photos]');
  const photos = about ? parse(about.dataset.photos) : [];
  if (about && photos.length) {
    about.classList.remove('is-empty');
    const label = about.getAttribute('aria-label') || 'Photo of Alisha';
    about.removeAttribute('role');
    about.removeAttribute('aria-label');

    const deck = document.createElement('div');
    deck.className = 'deck';
    const slides = photos.map((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'deck-slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = photos.length > 1 ? `${label} (${i + 1} of ${photos.length})` : label;
      img.decoding = 'async';
      slide.appendChild(img);
      deck.appendChild(slide);
      return slide;
    });
    about.appendChild(deck);

    let index = 0;
    slides[0].classList.add('is-current');
    if (slides.length > 1) {
      const dotRow = document.createElement('div');
      dotRow.className = 'deck-dots';
      photos.forEach(() => { const d = document.createElement('span'); d.className = 'deck-dot'; dotRow.appendChild(d); });
      deck.appendChild(dotRow);
      dotRow.children[0].classList.add('is-current');
      const show = (i) => {
        slides[index].classList.remove('is-current');
        dotRow.children[index].classList.remove('is-current');
        index = (i + slides.length) % slides.length;
        slides[index].classList.add('is-current');
        dotRow.children[index].classList.add('is-current');
      };
      about.classList.add('is-clickable');
      about.addEventListener('click', () => show(index + 1));
      if (!reducedMotion) {
        const page = about.closest('.page');
        window.setInterval(() => {
          if (!page || page.classList.contains('is-active')) show(index + 1);
        }, 4500);
      }
    }
  }
})();
