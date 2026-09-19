/* =====================================================================
   alisha's portfolio · script.js

   1 Settings   2 Helpers   3 Blinds   4 Weather → scene   5 Typing
   6 Scroll     7 Zoom      8 Pages    9 Start
   ===================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     1. SETTINGS: the things you'll most likely want to change
     ------------------------------------------------------------------ */
  const CONFIG = {
    greeting: 'hi, my name is alisha!',

    // Where the weather comes from. Open-Meteo needs coordinates (no account needed).
    // Currently Hamilton, Ontario. Change these to your city
    // (search "<your city> latitude longitude").
    location: { latitude: 43.2557, longitude: -79.8711 },

    // Shown in the little "this room is live" line under the greeting
    // (see locationLabel below) — just a plain name for the same place as
    // `location` above. Doesn't affect the weather lookup itself.
    locationLabel: 'Hamilton, Ontario',

    // At or above this temperature (°C) a clear or cloudy scene uses the "warm" room art.
    // Rain, snow, storms, or anything colder uses the "cool" art.
    warmAtOrAboveC: 15,

    weatherCacheMinutes: 20,   // don't ask the weather service more often than this

    slatCount: 14,             // how many blind slats
    moteCount: 18,             // how many floating dust motes drift up the screen
    typingSpeedMs: 85,         // delay between typed letters
    typingStartDelayMs: 1100,  // pause before typing starts
    zoomMs: 1300,              // length of the zoom through the window

    // Where in the window the zoom-in centers, left to right (0 = left edge,
    // 0.5 = dead centre on the mullion between the panes, 1 = right edge).
    // Lower than 0.5 shifts the page background left of the window frame,
    // higher shifts it right — tweak this rather than 0.5 so the page you
    // land on isn't centred on the frame between the two panes.
    zoomFocusX: 0.34,

    // Room art: one file per look. Put them in the images/ folder.
    rooms: {
      'warm-day':   'images/room-warm-day.png',
      'cool-day':   'images/room-cool-day.png',
      'warm-night': 'images/room-warm-night.png',
      'cool-night': 'images/room-cool-night.png',
    },

    // Weather videos: "<sky>-<time>". Missing files are fine: that sky
    // falls back to a plain colour gradient. Put them in the videos/ folder.
    // Each entry can list more than one format — the browser plays whichever
    // it supports first. Most browsers play .mp4 fine; .webm is there for
    // the few that don't (some Linux builds skip H.264 for licensing reasons).
    // A sky with no .webm yet still works: script.js skips formats that
    // don't have a path here.
    videos: {
      'clear-day':    { webm: 'videos/clear-day.webm',    mp4: 'videos/clear-day.mp4' },
      'cloudy-day':   { webm: 'videos/cloudy-day.webm',   mp4: 'videos/cloudy-day.mp4' },
      'rain-day':     { webm: 'videos/rain-day.webm',     mp4: 'videos/rain-day.mp4' },
      'snow-day':     { webm: 'videos/snow-day.webm',     mp4: 'videos/snow-day.mp4' },
      'storm-day':    { webm: 'videos/storm-day.webm',    mp4: 'videos/storm-day.mp4' },
      'clear-night':  { webm: 'videos/clear-night.webm',  mp4: 'videos/clear-night.mp4' },
      'cloudy-night': { webm: 'videos/cloudy-night.webm', mp4: 'videos/cloudy-night.mp4' },
      'rain-night':   { webm: 'videos/rain-night.webm',   mp4: 'videos/rain-night.mp4' },
      'snow-night':   { webm: 'videos/snow-night.webm',   mp4: 'videos/snow-night.mp4' },
      'storm-night':  { webm: 'videos/storm-night.webm',  mp4: 'videos/storm-night.mp4' },
    },
  };

  const SKIES = ['clear', 'cloudy', 'rain', 'snow', 'storm'];
  const CACHE_KEY = 'alisha-weather-v1';

  // For the little "this is live" caption under the greeting.
  const SKY_WORD = { clear: 'clear', cloudy: 'cloudy', rain: 'rainy', snow: 'snowy', storm: 'stormy' };
  const SKY_ICON = {
    'clear-day': '☀️',  'clear-night': '🌙',
    'cloudy-day': '☁️', 'cloudy-night': '☁️',
    'rain-day': '🌧️',  'rain-night': '🌧️',
    'snow-day': '❄️',  'snow-night': '❄️',
    'storm-day': '⛈️', 'storm-night': '⛈️',
  };


  /* ------------------------------------------------------------------
     2. HELPERS + ELEMENTS
     ------------------------------------------------------------------ */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const smooth = (t) => t * t * (3 - 2 * t);
  // 0 before `from`, 1 after `to`, eased in between
  const range = (p, from, to) => smooth(clamp01((p - from) / (to - from)));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = $('#viewport');
  const sceneEl = $('#scene');
  const windowEl = $('#window');
  const roomEl = $('#room');
  const blindsEl = $('#blinds');
  const skyVideo = $('#sky-video');
  const pageVideo = $('#page-video');
  const typedEl = $('#typed-text');
  const weatherLineEl = $('#weather-line');
  const hintEl = $('#hint');
  const dockEl = $('#dock');
  const pagesEl = $('#pages');
  const motesEl = $('#motes');

  const state = {
    target: 0,          // where scrolling says we should be (0 to 1)
    current: 0,         // where the animation currently is (eased toward target)
    raf: 0,
    videosStarted: false,
    page: null,         // name of the open page, or null
    busy: false,        // true while a zoom is running
    pushed: false,      // did we add a browser-history entry for the open page?
    opener: null,       // the button that opened the page (to return focus to)
    typed: false,       // has the greeting finished typing?
    weatherLineText: '', // filled in once real weather arrives; shown once `typed` is also true
  };

  stage.style.setProperty('--zoom-ms', `${CONFIG.zoomMs}ms`);

  // Handy debugging switches in the web address, for example:
  //   index.html?time=night&sky=rain&tone=cool     force a look
  //   index.html?align                             show window/laptop guides
  const params = new URLSearchParams(window.location.search);
  if (params.has('align')) stage.classList.add('align-mode');


  /* ------------------------------------------------------------------
     3. BLINDS: build the slats
     ------------------------------------------------------------------ */
  function buildBlinds() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < CONFIG.slatCount; i += 1) {
      const slat = document.createElement('div');
      slat.className = 'slat';
      slat.style.setProperty('--i', i);
      fragment.appendChild(slat);
    }
    blindsEl.appendChild(fragment);
  }

  // A gentle, ever-so-slightly random field of dust motes that drifts
  // upward forever. Random per element (size, position, speed, delay) so
  // it never looks mechanical, but the ranges are tight enough to stay
  // subtle rather than distracting.
  function buildMotes() {
    if (reducedMotion) return;   // respects the CSS rule that hides .motes too
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < CONFIG.moteCount; i += 1) {
      const mote = document.createElement('span');
      mote.className = 'mote';
      const size = (Math.random() * 5 + 5).toFixed(1);         // 5–10px
      mote.style.setProperty('--x', `${(Math.random() * 100).toFixed(1)}%`);
      mote.style.setProperty('--size', `${size}px`);
      mote.style.setProperty('--o', (Math.random() * 0.35 + 0.55).toFixed(2));   // 0.55–0.9
      mote.style.setProperty('--dur', `${(Math.random() * 14 + 18).toFixed(1)}s`); // 18–32s to cross the screen
      mote.style.setProperty('--delay', `${(Math.random() * -32).toFixed(1)}s`);  // negative = already mid-flight on load
      mote.style.setProperty('--drift', `${(Math.random() * 80 - 40).toFixed(0)}px`); // gentle sideways sway
      fragment.appendChild(mote);
    }
    motesEl.appendChild(fragment);
  }


  /* ------------------------------------------------------------------
     4. WEATHER → SCENE
     ------------------------------------------------------------------ */
  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { savedAt, data } = JSON.parse(raw);
      const fresh = Date.now() - savedAt < CONFIG.weatherCacheMinutes * 60000;
      return fresh ? data : null;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
    } catch { /* storage blocked: no problem */ }
  }

  async function fetchWeather() {
    const { latitude, longitude } = CONFIG.location;
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,weather_code,is_day&timezone=auto';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Weather request failed (${response.status})`);
      const { current } = await response.json();
      return { temp: current.temperature_2m, code: current.weather_code, isDay: current.is_day === 1 };
    } finally {
      clearTimeout(timer);
    }
  }

  // Turn the weather service's numeric code into one of our five skies.
  // (WMO codes: 0-1 clear, 2-3 cloud, 45/48 fog, 51-67 drizzle/rain,
  //  71-77 snow, 80-82 showers, 85-86 snow showers, 95+ thunderstorm)
  function skyFromCode(code) {
    if (code === 0 || code === 1) return 'clear';
    if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
    if (code >= 95) return 'storm';
    return 'clear';
  }

  function sceneFromWeather(weather) {
    const time = weather.isDay ? 'day' : 'night';
    const sky = skyFromCode(weather.code);
    const mild = weather.temp >= CONFIG.warmAtOrAboveC;
    const tone = mild && (sky === 'clear' || sky === 'cloudy') ? 'warm' : 'cool';
    return { time, sky, tone };
  }

  // Used until the real weather arrives (or if it can't be reached)
  function guessScene() {
    const hour = new Date().getHours();
    return { time: hour >= 7 && hour < 19 ? 'day' : 'night', sky: 'clear', tone: 'cool' };
  }

  function urlOverrides() {
    const pick = (key, allowed) => (allowed.includes(params.get(key)) ? params.get(key) : undefined);
    const found = {
      time: pick('time', ['day', 'night']),
      sky: pick('sky', SKIES),
      tone: pick('tone', ['warm', 'cool']),
    };
    return Object.fromEntries(Object.entries(found).filter(([, value]) => value !== undefined));
  }

  // Fills a <video> with <source> children (mp4 first for broadest support,
  // webm as a fallback for the few browsers that skip H.264) and only
  // rebuilds it when the sky/time key actually changed.
  function setVideo(video, formats, key) {
    if (!formats) { video.hidden = true; delete video.dataset.key; return; }
    if (video.dataset.key === key) return;
    video.dataset.key = key;
    video.hidden = false;
    video.innerHTML = '';
    ['mp4', 'webm'].forEach((format) => {
      if (!formats[format]) return;
      const source = document.createElement('source');
      source.src = formats[format];
      source.type = `video/${format}`;
      video.appendChild(source);
    });
    video.load();
    if (state.videosStarted) video.play().catch(() => {});
  }

  // Fills in and reveals the "this room is live" caption — only called with
  // real weather data (cached or freshly fetched), never the guessed
  // placeholder scene, so it's never showing something untrue.
  function setWeatherLine(weather, scene) {
    const icon = SKY_ICON[`${scene.sky}-${scene.time}`] || '';
    const temp = Math.round(weather.temp);
    state.weatherLineText =
      `${icon} it's ${temp}°C and ${SKY_WORD[scene.sky]} in ${CONFIG.locationLabel} right now — ` +
      `this room updates to match it, live.`;
    revealWeatherLine();
  }

  // Only shows once the greeting has finished typing AND we have real
  // weather text, whichever of those finishes second.
  function revealWeatherLine() {
    if (!state.weatherLineText || !state.typed) return;
    weatherLineEl.textContent = state.weatherLineText;
    weatherLineEl.classList.add('is-shown');
  }

  let currentScene = {};
  function applyScene(next) {
    const scene = { ...currentScene, ...next };
    currentScene = scene;

    stage.dataset.time = scene.time;
    stage.dataset.sky = scene.sky;
    stage.dataset.tone = scene.tone;

    const roomSrc = CONFIG.rooms[`${scene.tone}-${scene.time}`];
    if (roomSrc && roomEl.getAttribute('src') !== roomSrc) roomEl.src = roomSrc;
    const skyKey = `${scene.sky}-${scene.time}`;
    setVideo(skyVideo, CONFIG.videos[skyKey], skyKey);

    console.info('[portfolio] scene:', scene);
  }

  async function initScene() {
    const overrides = urlOverrides();
    const cached = readCache();
    const startScene = cached ? sceneFromWeather(cached) : guessScene();
    applyScene({ ...startScene, ...overrides });
    if (cached) setWeatherLine(cached, startScene);

    const everythingForced = ['time', 'sky', 'tone'].every((key) => key in overrides);
    if (cached || everythingForced) return;

    try {
      const weather = await fetchWeather();
      writeCache(weather);
      const scene = sceneFromWeather(weather);
      applyScene({ ...scene, ...overrides });
      setWeatherLine(weather, scene);
    } catch (error) {
      console.warn('[portfolio] Could not get the weather, using a default scene.', error);
    }
  }

  // Friendly messages when a file is missing
  roomEl.addEventListener('error', () => {
    stage.classList.add('missing-art');
    console.warn(`[portfolio] Couldn't load ${roomEl.getAttribute('src')}. Check the file name and that it's inside the images/ folder.`);
  });
  roomEl.addEventListener('load', () => stage.classList.remove('missing-art'));

  [skyVideo, pageVideo].forEach((video) => {
    video.muted = true;
    video.addEventListener('error', () => {
      video.hidden = true;
      console.info(`[portfolio] No playable video for "${video.dataset.key}": showing the plain colour sky instead.`);
    });
  });

  function startVideos() {
    if (state.videosStarted) return;
    state.videosStarted = true;
    skyVideo.play().catch(() => {});
  }


  /* ------------------------------------------------------------------
     5. TYPING
     ------------------------------------------------------------------ */
  function finishTyping() {
    stage.classList.add('is-typed');
    state.typed = true;
    revealWeatherLine();
  }

  async function typeGreeting() {
    const text = CONFIG.greeting;
    if (reducedMotion) {
      typedEl.textContent = text;
      finishTyping();
      return;
    }
    await wait(CONFIG.typingStartDelayMs);
    for (let i = 1; i <= text.length; i += 1) {
      typedEl.textContent = text.slice(0, i);
      const pause = ',.!?'.includes(text[i - 1]) ? 280 : 0;   // tiny breath after punctuation
      await wait(CONFIG.typingSpeedMs + Math.random() * 60 + pause);
    }
    await wait(500);
    finishTyping();
  }


  /* ------------------------------------------------------------------
     6. SCROLL → BLINDS, LIGHT AND BUTTONS
     One number (0 to 1) says how far you've scrolled. Each part of the
     animation uses its own slice of that range.
     ------------------------------------------------------------------ */
  function computeTarget() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? clamp01(window.scrollY / max) : 0;
  }

  function render(p) {
    const blinds = range(p, 0.05, 0.66);   // blinds rise
    const light = range(p, 0.10, 0.72);    // darkness fades, room lights up
    const ui = range(p, 0.74, 0.94);       // buttons appear
    const hero = 1 - range(p, 0.0, 0.08);  // intro text + hint fade out

    const style = stage.style;
    style.setProperty('--b', blinds.toFixed(4));
    style.setProperty('--light', light.toFixed(4));
    style.setProperty('--ui', ui.toFixed(4));
    style.setProperty('--hero', hero.toFixed(4));

    stage.classList.toggle('ui-visible', ui > 0.02);
    stage.classList.toggle('ui-ready', ui > 0.9);
    hintEl.classList.toggle('hint-off', hero < 0.02);

    if (blinds > 0.01) startVideos();
  }

  function schedule() {
    if (!state.raf) state.raf = requestAnimationFrame(tick);
  }

  // Ease toward the target a little each frame so it feels smooth, not jumpy
  function tick() {
    state.raf = 0;
    const diff = state.target - state.current;
    state.current = reducedMotion || Math.abs(diff) < 0.0004 ? state.target : state.current + diff * 0.14;
    render(state.current);
    if (state.current !== state.target) schedule();
  }

  function onScroll() {
    if (state.page) return;
    state.target = computeTarget();
    schedule();
  }


  /* ------------------------------------------------------------------
     7. ZOOM THROUGH THE WINDOW
     ------------------------------------------------------------------ */
  // Measure the window with the scene un-zoomed
  function measureWindow() {
    const prevTransform = sceneEl.style.transform;
    const prevTransition = sceneEl.style.transition;
    sceneEl.style.transition = 'none';
    sceneEl.style.transform = 'none';
    const win = windowEl.getBoundingClientRect();
    const scene = sceneEl.getBoundingClientRect();
    sceneEl.style.transform = prevTransform;
    void sceneEl.offsetWidth;                 // apply that instantly, without animating
    sceneEl.style.transition = prevTransition;
    return { win, scene };
  }

  function zoomIn(instant) {
    const { win, scene } = measureWindow();
    const vw = stage.clientWidth;
    const vh = stage.clientHeight;
    const scale = Math.max(vw / win.width, vh / win.height) * 1.15;   // fill the screen with the window
    const cx = win.left + win.width * CONFIG.zoomFocusX;
    const cy = win.top + win.height / 2;

    if (instant) sceneEl.style.transition = 'none';
    sceneEl.style.transformOrigin = `${cx - scene.left}px ${cy - scene.top}px`;
    sceneEl.style.transform = `translate(${vw / 2 - cx}px, ${vh / 2 - cy}px) scale(${scale.toFixed(4)})`;
    if (instant) {
      void sceneEl.offsetWidth;
      sceneEl.style.transition = '';
    }
  }

  function zoomOut(instant) {
    if (instant) sceneEl.style.transition = 'none';
    sceneEl.style.transform = '';
    if (instant) {
      void sceneEl.offsetWidth;
      sceneEl.style.transition = '';
    }
  }


  /* ------------------------------------------------------------------
     8. PAGES
     ------------------------------------------------------------------ */
  const lockScroll = () => document.documentElement.classList.add('is-locked');
  const unlockScroll = () => document.documentElement.classList.remove('is-locked');

  function startPageVideo() {
    if (skyVideo.hidden || !skyVideo.dataset.key) { pageVideo.hidden = true; return; }
    setVideo(pageVideo, CONFIG.videos[skyVideo.dataset.key], skyVideo.dataset.key);
    pageVideo.currentTime = skyVideo.currentTime;   // keep the two in sync
    pageVideo.play().catch(() => {});
  }

  async function openPage(name, { instant = false, fromHistory = false } = {}) {
    const page = document.getElementById(`page-${name}`);
    if (!page || state.page || state.busy) return;

    state.busy = true;
    state.page = name;
    state.opener = document.activeElement;
    const fast = instant || reducedMotion;

    if (instant) {
      history.replaceState({ page: name }, '', `#${name}`);
      state.pushed = false;
    } else if (fromHistory) {
      state.pushed = true;
    } else {
      history.pushState({ page: name }, '', `#${name}`);
      state.pushed = true;
    }

    lockScroll();
    stage.classList.add('is-leaving');
    dockEl.inert = true;
    zoomIn(fast);
    await wait(fast ? 80 : CONFIG.zoomMs * 0.72);

    // show the page (near the end of the zoom)
    $$('.page').forEach((p) => p.classList.toggle('is-active', p === page));
    $$('.rise', page).forEach((el, i) => el.style.setProperty('--d', i));
    $('.page-scroll', page).scrollTop = 0;
    startPageVideo();
    pagesEl.setAttribute('aria-hidden', 'false');
    void page.offsetWidth;                       // let the browser register the "before" look
    pagesEl.classList.add('is-open');

    await wait(fast ? 80 : 700);
    $('.page-title', page).focus({ preventScroll: true });
    state.busy = false;
  }

  async function closePage() {
    if (!state.page || state.busy) return;

    state.busy = true;
    const fast = reducedMotion;

    pagesEl.classList.remove('is-open');
    pagesEl.setAttribute('aria-hidden', 'true');
    await wait(fast ? 80 : 550);
    pageVideo.pause();

    zoomOut(fast);                               // zoom back out into the room
    await wait(fast ? 80 : CONFIG.zoomMs * 0.75);

    stage.classList.remove('is-leaving');
    dockEl.inert = false;
    sceneEl.style.transformOrigin = '';
    unlockScroll();

    state.page = null;
    state.pushed = false;
    state.busy = false;
    state.target = computeTarget();
    schedule();

    if (state.opener && typeof state.opener.focus === 'function') {
      state.opener.focus({ preventScroll: true });
    }
  }

  function goBack() {
    if (state.busy || !state.page) return;
    if (state.pushed) {
      history.back();                            // popstate → reconcile() → closePage()
    } else {
      closePage();
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  // Keep the browser's Back / Forward buttons in sync with the pages
  async function reconcile() {
    while (state.busy) await wait(50);
    const wanted = history.state && history.state.page;
    if (wanted && !state.page) openPage(wanted, { fromHistory: true });
    else if (!wanted && state.page) closePage();
  }

  function onResize() {
    if (state.page) { zoomIn(true); return; }    // keep the zoom lined up
    state.target = computeTarget();
    schedule();
  }


  /* ------------------------------------------------------------------
     9. START
     ------------------------------------------------------------------ */
  function init() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    buildBlinds();
    buildMotes();
    initScene();

    $$('[data-page]').forEach((button) => {
      button.addEventListener('click', () => openPage(button.dataset.page));
    });
    $$('[data-back]').forEach((button) => button.addEventListener('click', goBack));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && state.page) goBack();
    });
    hintEl.addEventListener('click', () => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('popstate', reconcile);

    // Opened a link like  yoursite.com/#projects ?  Skip the intro and go straight there.
    const directPage = window.location.hash.slice(1);
    if (document.getElementById(`page-${directPage}`)) {
      window.scrollTo(0, document.documentElement.scrollHeight);
      state.target = 1;
      state.current = 1;
      render(1);
      finishTyping();
      openPage(directPage, { instant: true });
      return;
    }

    window.scrollTo(0, 0);
    state.target = computeTarget();
    state.current = state.target;
    render(state.current);
    typeGreeting();
  }

  init();
})();