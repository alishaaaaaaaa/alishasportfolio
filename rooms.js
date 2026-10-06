/* =====================================================================
   alisha's portfolio · rooms.js

   1. CLICKABLE THINGS IN THE ROOM (the cat, the books, the wall photos,
      the mug). Each is an invisible button cut to the object's exact
      outline. Hovering (or focusing) it lights the object with a soft glow
      and shows a small label, and every so often each one gives a faint
      shimmer so people notice they can click. What each opens is set in
      index.html (data-detail = a popup, data-page = a page).
      OUTLINES are x y pairs in % of the art, one per room look, because
      the four illustrations are drawn slightly differently.

   2. THE MAIN BUTTONS sit over the lower part of the window, centred on
      screen. DOCK_AT moves them: 0 = top of the window, 1 = the bottom.

   3. ON PHONES some objects fall outside the screen; they're listed as
      small links under the buttons instead.

   4. THE COFFEE CHAT FORM sends straight from the browser through
      Web3Forms (free). Get an access key at web3forms.com by typing in
      your email; the key arrives in your inbox. Paste it into
      WEB3FORMS_KEY below. Messages then arrive in that inbox.
      Until a key is added, or if sending ever fails, the form offers to
      open the visitor's email app with everything filled in instead.
   ===================================================================== */
(() => {
  'use strict';

  const CONTACT_EMAIL = 'alishafaridi@gmail.com';
  const WEB3FORMS_KEY = 'ef71607c-2b1d-4196-8d36-72356bcb6513';   // ✏️ paste your Web3Forms access key between the quotes
  const DOCK_AT = 0.56;

  const OUTLINES = {
    cat: {
      'warm-day': '60.61 50.9 60.31 52.92 60.41 57.58 59.88 59.61 59.68 61.91 60.14 63.82 60.87 65.39 60.9 66.01 60.21 68.09 59.68 71.07 59.91 76.52 59.39 77.87 59.12 81.35 59.85 85.06 59.39 85.22 58.93 86.07 58.93 87.3 59.16 88.15 59.82 88.65 60.44 88.6 64.56 90 67.82 89.94 71.21 90.96 71.9 92.7 73.88 93.82 76.22 93.6 77.83 92.3 78.43 90.79 78.23 88.65 77.27 87.02 74.77 85.62 73.58 83.26 73.42 80.11 72.89 76.52 71.31 71.24 68.48 63.99 69.04 61.24 68.18 57.58 68.41 53.43 68.15 51.4 67.72 51.18 65.38 53.82 63.01 53.76 61.53 51.46',
      'cool-day': '60.67 51.35 60.34 53.65 60.44 57.87 59.91 59.89 59.72 62.02 59.91 63.2 60.61 65.28 60.94 65.67 60.94 66.18 59.82 70.17 59.72 72.92 59.91 76.4 59.52 77.47 59.09 80.11 59.39 82.81 59.95 84.89 62.68 89.16 63.11 89.21 63.08 88.54 63.57 88.2 65.28 88.54 67.52 88.26 67.52 89.27 67.79 89.83 70.65 90.67 71.05 91.85 71.71 92.7 74.01 93.82 76.15 93.6 77.47 92.58 78.26 90.96 78.13 88.65 77.14 86.97 74.7 85.67 73.52 83.15 73.42 80.28 73.02 77.53 71.38 72.08 68.45 64.38 69.01 61.63 68.77 59.89 68.21 58.03 68.41 53.26 68.18 51.69 67.89 51.46 67.03 52.25 65.51 54.38 63.11 54.33 61.46 51.97',
      'warm-night': '60.01 51.91 59.72 54.16 59.85 57.87 59.16 60.56 58.96 62.7 59.39 64.33 60.34 66.29 60.34 66.74 59.42 68.99 58.93 71.97 59.19 76.63 58.66 78.2 58.47 82.02 59.22 85.22 58.3 86.12 58.23 87.08 58.47 88.03 59.19 88.88 60.18 91.69 60.64 91.57 60.18 90.56 60.24 89.66 60.61 88.99 63.93 89.94 67.49 89.94 70.26 90.79 70.92 92.47 71.9 93.31 73.32 93.93 75.33 93.76 77.27 92.36 77.96 90.79 77.8 88.6 77.14 87.3 76.38 86.63 74.37 85.73 73.19 83.54 73.12 81.35 72.36 76.52 69.73 69.16 69.2 67.13 68.12 64.72 68.64 61.91 67.89 58.48 68.05 54.61 67.75 52.02 67.46 51.8 66.57 52.64 65.05 54.78 62.62 54.78 60.74 52.25',
      'cool-night': '60.97 51.46 60.61 54.1 60.74 58.03 60.14 60.17 59.95 62.25 60.41 64.21 61.23 65.9 61.13 66.91 60.11 70.51 60.01 71.69 60.21 76.74 59.72 78.26 59.62 81.35 59.88 83.26 60.28 84.44 61.43 86.74 63.21 88.88 63.44 88.88 63.74 88.03 65.88 88.37 67.98 88.2 67.98 89.1 68.28 89.72 71.11 90.84 71.57 92.25 73.12 93.6 73.88 93.88 75.89 93.71 77.9 92.36 78.59 90.67 78.62 89.61 78.36 88.31 77.31 86.74 75.13 85.79 73.95 83.31 73.98 81.63 73.48 77.7 72.89 75.28 69.5 65.73 68.81 64.61 69.4 62.19 69.17 59.66 68.64 57.98 68.77 53.6 68.51 51.74 68.28 51.57 67.49 52.36 65.91 54.61 64.92 54.33 63.41 54.55 62.19 52.7',
    },
    books: {
      'warm-day': '89.6 51.3 100 51.3 100 71.8 89.6 71.8',
      'cool-day': '89 51.8 100 51.8 100 72 89 72',
      'warm-night': '88.7 52.4 100 52.4 100 72.7 88.7 72.7',
      'cool-night': '88.8 52.1 100 52.1 100 72.2 88.8 72.2',
    },
    photos: {
      'warm-day': '18.7 19.6 25.8 19.6 25.8 30.6 28.5 30.6 28.5 43.9 23.4 43.9 23.4 32.2 18.7 32.2',
      'cool-day': '18.1 20.4 25 20.4 25 31.1 28 31.1 28 44.3 23 44.3 23 32.6 18.1 32.6',
      'warm-night': '17.9 20.7 24.8 20.7 24.8 31.4 27.4 31.4 27.4 44.4 22.6 44.4 22.6 33.3 17.9 33.3',
      'cool-night': '18.8 20.4 25.7 20.4 25.7 31.2 28.3 31.2 28.3 44.2 23.6 44.2 23.6 33.1 18.8 33.1',
    },
    mug: {
      'warm-day': '73.48 68.2 73.29 68.65 73.55 77.81 73.02 77.98 73.02 79.04 73.29 79.72 75.1 80.62 78 80.56 79.91 79.78 79.94 78.31 79.35 77.7 79.51 76.8 80.2 76.69 80.76 76.12 81.52 73.99 81.52 72.02 80.93 70.11 79.78 69.78 79.58 68.26 78.92 67.7 75.46 67.47 74.01 67.75',
      'cool-day': '73.62 68.88 73.32 69.49 73.29 72.08 73.52 76.97 74.08 79.38 73.48 79.21 73.39 78.26 73.12 77.92 73.45 79.94 74.21 80.56 75.63 80.9 78.1 80.79 79.64 80 79.71 78.76 79.35 78.03 79.38 77.42 80.37 76.8 81.23 75.11 81.36 73.15 81.03 71.4 80.5 70.67 79.68 70.56 79.58 69.1 79.02 68.43 75.59 68.09 74.37 68.31',
      'warm-night': '72.96 68.88 72.73 69.33 72.69 70.62 72.73 78.76 73.02 80.51 74.67 81.29 77.57 81.24 79.35 80.45 79.41 78.99 78.89 78.2 78.89 77.7 80.27 76.74 81.06 74.44 81.03 72.64 80.63 71.24 80.04 70.51 79.22 70.34 79.12 69.1 78.49 68.37 74.31 68.26',
      'cool-night': '73.78 68.76 73.62 69.21 73.62 73.6 73.88 78.31 73.58 79.04 73.85 80.39 74.93 81.07 77.54 81.24 78.66 81.07 79.94 80.34 80.04 78.88 79.41 78.09 79.41 77.64 79.64 77.13 80.24 77.02 80.8 76.4 81.62 74.44 81.55 72.42 81.16 70.67 80.7 70.06 79.97 69.83 79.81 68.93 79.15 68.2 75.36 67.98',
    },
  };

  const stage = document.getElementById('viewport');
  const scene = document.getElementById('scene');
  const objects = Array.from(document.querySelectorAll('.obj[data-obj]'));
  if (!stage || !scene) return;

  /* ---------------- 1. outlines + labels ---------------- */
  const toPoints = (str) => {
    const n = str.trim().split(/\s+/).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
    return pts;
  };
  const boxes = {};

  function applyOutlines() {
    const look = `${stage.dataset.tone || 'cool'}-${stage.dataset.time || 'night'}`;
    objects.forEach((obj) => {
      const sets = OUTLINES[obj.dataset.obj];
      if (!sets) return;
      const pts = toPoints(sets[look] || sets['warm-day']);
      obj.style.setProperty('--poly', `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(', ')})`);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const box = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
      boxes[obj.dataset.obj] = box;
      // the label sits just above the object, centred on it
      obj.style.setProperty('--lx', `${Math.min(91, Math.max(8, (box.left + box.right) / 2))}%`);   // kept away from the edges
      obj.style.setProperty('--ly', `${box.top}%`);
    });
    layout();
  }
  new MutationObserver(applyOutlines).observe(stage, { attributes: true, attributeFilter: ['data-tone', 'data-time'] });

  // stagger the occasional shimmer so objects take turns
  objects.forEach((obj, i) => obj.style.setProperty('--hint-delay', `${1.5 + i * 2.5}s`));

  /* ---------------- 2 + 3. dock position + off-screen objects ---------------- */
  const dock = document.getElementById('dock');
  const hint = dock && dock.querySelector('.room-hint');
  const windowEl = document.getElementById('window');
  let extras = null;

  function layout() {
    if (!dock || !windowEl || stage.classList.contains('is-leaving')) return;
    const win = windowEl.getBoundingClientRect();
    const sceneRect = scene.getBoundingClientRect();
    if (!win.height) return;
    stage.style.setProperty('--dock-top', `${Math.round(win.top + win.height * DOCK_AT)}px`);
    dock.classList.add('is-placed');

    // objects whose middle is off-screen at this size
    const hidden = objects.filter((obj) => {
      const b = boxes[obj.dataset.obj];
      if (!b) return false;
      const cx = sceneRect.left + sceneRect.width * ((b.left + b.right) / 200);
      const cy = sceneRect.top + sceneRect.height * ((b.top + b.bottom) / 200);
      return cx < 8 || cx > window.innerWidth - 8 || cy < 8 || cy > window.innerHeight - 8;
    });
    if (!hint) return;
    if (!extras) {
      extras = document.createElement('span');
      extras.className = 'room-extras';
      hint.appendChild(extras);
    }
    extras.innerHTML = '';
    hidden.forEach((obj) => {
      const link = document.createElement('button');
      link.type = 'button';
      link.textContent = obj.querySelector('.obj-label').textContent;
      link.addEventListener('click', () => obj.querySelector('.obj-hit').click());
      extras.appendChild(link);
    });
    hint.classList.toggle('has-extras', hidden.length > 0);
  }
  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  // the stage stops "leaving" once a page closes; re-place then
  new MutationObserver(layout).observe(stage, { attributes: true, attributeFilter: ['class'] });

  applyOutlines();

  /* ---------------- 4. coffee chat form ---------------- */
  document.addEventListener('input', (event) => {
    const form = event.target.closest && event.target.closest('.coffee-form');
    const status = form && form.querySelector('.coffee-status');
    if (status && status.dataset.state === 'error') { status.textContent = ''; status.dataset.state = ''; }
  });
  document.addEventListener('submit', async (event) => {
    const form = event.target.closest('.coffee-form');
    if (!form) return;
    event.preventDefault();
    const status = form.querySelector('.coffee-status');
    const send = form.querySelector('.coffee-send');
    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return;                          // a bot filled the hidden field

    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const message = String(data.message || '').trim();
    const missing = !name ? 'name' : !email ? 'email' : !message ? 'message' : '';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (missing || !emailOk) {
      status.textContent = missing ? 'Please fill in all three fields.' : "That email doesn't look quite right.";
      status.dataset.state = 'error';
      form.elements[missing || 'email'].focus();
      return;
    }

    const subject = `coffee chat with ${name}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n— ${name} (${email})`)}`;

    send.disabled = true;
    send.textContent = 'sending…';
    status.textContent = '';
    status.dataset.state = '';
    try {
      if (!WEB3FORMS_KEY.trim()) throw new Error('No Web3Forms key yet');
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY.trim(),
          subject,
          from_name: 'your portfolio',
          name, email, message,
          replyto: email,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || String(result.success) === 'false') throw new Error(result.message || String(response.status));
      form.innerHTML = `<div class="coffee-done"><p class="coffee-done-title">it's a date <span aria-hidden="true">☕</span></p><p>Thanks, ${escapeHtml(name)}! I'll reply to <strong>${escapeHtml(email)}</strong> soon.</p></div>`;
    } catch (error) {
      send.disabled = false;
      send.innerHTML = 'send <span aria-hidden="true">☕</span>';
      status.dataset.state = 'error';
      status.innerHTML = `Hmm, that didn't send. <a href="${mailto}">Open it in your email app instead</a>.`;
    }
  });

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
})();
