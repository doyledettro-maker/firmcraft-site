/**
 * firmcraft-brand — Hermes dashboard plugin
 *
 * Slot-only white-label. Touches header-left, footer-right, favicon, and
 * uses a MutationObserver to hide the "Update" button (more resilient than
 * relying on CSS class names that may rename across Hermes releases).
 *
 * No external dependencies. No network calls beyond the Google Fonts link.
 */

(function () {
  'use strict';

  const PALETTE = {
    cream:      '#FBF4EA',
    terracotta: '#D97757',
    ink:        '#2D1F14',
    sage:       '#6B8E5A',
    slate:      '#3F7A8C',
  };

  const FORGE_STAMP_SVG = `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="32" cy="32" r="29" stroke="${PALETTE.ink}" stroke-width="2.5" fill="none"/>
      <text x="32" y="44" text-anchor="middle"
            font-family="'Source Serif 4', Georgia, serif"
            font-style="italic" font-weight="500"
            font-size="36" fill="${PALETTE.terracotta}"
            letter-spacing="-1">F</text>
    </svg>
  `.trim();

  const FAVICON_SVG = `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="14" fill="${PALETTE.ink}"/>
      <text x="32" y="46" text-anchor="middle"
            font-family="'Source Serif 4', Georgia, serif"
            font-style="italic" font-weight="500"
            font-size="44" fill="${PALETTE.cream}">F</text>
    </svg>
  `.trim();

  // ─── Force light mode ────────────────────────────────────────────────
  function forceLightMode() {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-dark', 'hermes-dark');
    root.classList.add('light', 'theme-light', 'firmcraft-brand');
    root.setAttribute('data-theme', 'light');
    root.setAttribute('data-firmcraft', 'true');
    root.style.colorScheme = 'light';
  }

  // ─── Page title ──────────────────────────────────────────────────────
  function setPageTitle() {
    const PAGE_TITLE = 'Firmcraft';
    if (document.title !== PAGE_TITLE && !document.title.startsWith(PAGE_TITLE)) {
      document.title = PAGE_TITLE;
    }
  }

  // ─── Favicon ─────────────────────────────────────────────────────────
  function replaceFavicon() {
    const dataUrl =
      'data:image/svg+xml;utf8,' + encodeURIComponent(FAVICON_SVG);

    document
      .querySelectorAll('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
      .forEach((el) => el.parentNode && el.parentNode.removeChild(el));

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = dataUrl;
    document.head.appendChild(link);

    const apple = document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = dataUrl;
    document.head.appendChild(apple);
  }

  // ─── Header-left slot: forge stamp + wordmark ────────────────────────
  function renderHeaderLeft(slot) {
    if (!slot) return;
    slot.innerHTML = '';
    slot.classList.add('firmcraft-header-left');

    const link = document.createElement('a');
    link.href = '/';
    link.className = 'firmcraft-brand-link';
    link.setAttribute('aria-label', 'Firmcraft home');

    const mark = document.createElement('span');
    mark.className = 'firmcraft-mark';
    mark.innerHTML = FORGE_STAMP_SVG;

    const wordmark = document.createElement('span');
    wordmark.className = 'firmcraft-wordmark';
    wordmark.textContent = 'Firmcraft';

    link.appendChild(mark);
    link.appendChild(wordmark);
    slot.appendChild(link);
  }

  // ─── Footer-right slot: powered-by credit ────────────────────────────
  function renderFooterRight(slot) {
    if (!slot) return;
    slot.innerHTML = '';
    slot.classList.add('firmcraft-footer-right');

    const credit = document.createElement('span');
    credit.className = 'firmcraft-powered-by';
    credit.innerHTML =
      'Built by <a href="https://firmcraft.ai" target="_blank" rel="noopener noreferrer">Firmcraft</a>';

    slot.appendChild(credit);
  }

  // ─── "Update" button hide (MutationObserver, label-based) ────────────
  // We match on the visible text, not a class name, so the rule survives
  // Hermes releases that rename CSS classes. Buttons that say "Update"
  // exactly (case-insensitive, trimmed) are hidden — adjust the matcher
  // if Hermes ships a different label in a future release.
  function shouldHideButton(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag !== 'BUTTON' && tag !== 'A') return false;
    const label = (el.textContent || '').trim().toLowerCase();
    if (label !== 'update') return false;
    // Don't hide buttons inside obvious form contexts (e.g. "Update profile").
    if (el.closest('form[data-firmcraft-allow-update]')) return false;
    return true;
  }

  function hideUpdateButtons(root) {
    const scope = root || document;
    scope.querySelectorAll('button, a').forEach((el) => {
      if (shouldHideButton(el) && !el.dataset.firmcraftHidden) {
        el.dataset.firmcraftHidden = '1';
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function startUpdateButtonObserver() {
    hideUpdateButtons(document);
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === 1) hideUpdateButtons(node);
          });
        } else if (m.type === 'characterData' && m.target.parentElement) {
          // Text changed inside an existing button — re-evaluate it.
          const el = m.target.parentElement.closest('button, a');
          if (el && shouldHideButton(el) && !el.dataset.firmcraftHidden) {
            el.dataset.firmcraftHidden = '1';
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
          }
        }
      }
    });
    obs.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return obs;
  }

  // ─── Notice banners ──────────────────────────────────────────────────
  // Reads ./notices.json (sibling of this script) and renders dismissible
  // banners at the top of <body>. The file is pushed by push-notice.sh.
  //
  // Schema:
  //   { "notices": [
  //       {
  //         "id":           "upgrade-2026-05-14",          // required, used for dismissal storage
  //         "type":         "maintenance-scheduled" |       // yellow
  //                         "maintenance-in-progress" |     // orange
  //                         "upgrade-complete" |            // green (auto-hides after 72h)
  //                         "info",                         // blue
  //         "title":        "Scheduled maintenance",       // optional, bolded
  //         "message":      "Hermes will be upgraded ...", // required, plain text
  //         "starts_at":    "2026-05-14T21:00:00-05:00",   // optional, ISO 8601
  //         "ends_at":      "2026-05-14T21:30:00-05:00",   // optional
  //         "created_at":   "2026-05-12T10:00:00-05:00",   // required for upgrade-complete auto-hide
  //         "dismissible":  true                            // optional, default true
  //       }
  //   ]}

  const NOTICE_REFRESH_MS  = 5 * 60 * 1000;   // re-fetch notices.json every 5 minutes
  const UPGRADE_COMPLETE_TTL_MS = 72 * 60 * 60 * 1000;
  const BANNERS_CONTAINER_ID = 'firmcraft-banners';
  const DISMISS_STORAGE_PREFIX = 'firmcraft-notice-dismissed-';

  function isDismissed(id) {
    try { return !!localStorage.getItem(DISMISS_STORAGE_PREFIX + id); }
    catch (_) { return false; }
  }

  function markDismissed(id) {
    try { localStorage.setItem(DISMISS_STORAGE_PREFIX + id, String(Date.now())); }
    catch (_) { /* ignore — private mode etc. */ }
  }

  function isExpired(notice) {
    if (notice.type !== 'upgrade-complete') return false;
    if (!notice.created_at) return false;
    const created = Date.parse(notice.created_at);
    if (Number.isNaN(created)) return false;
    return Date.now() - created > UPGRADE_COMPLETE_TTL_MS;
  }

  function getNoticesUrl() {
    // Resolve relative to the plugin script's own URL so we pick up the file
    // shipped alongside index.js in the plugin directory.
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src && /firmcraft-brand\/.*\.js/.test(s.src)) {
        return s.src.replace(/[^/]+$/, 'notices.json');
      }
    }
    // Fallback: a stable absolute path that matches the deploy.sh layout.
    return '/plugins/firmcraft-brand/notices.json';
  }

  let _cachedNotices = [];
  let _lastFetchOk = 0;

  function fetchNotices() {
    const url = getNoticesUrl() + '?t=' + Date.now();
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) return { notices: [] }; // missing file = no banners
          throw new Error('notices.json HTTP ' + r.status);
        }
        return r.json();
      })
      .then((data) => {
        _cachedNotices = Array.isArray(data && data.notices) ? data.notices : [];
        _lastFetchOk = Date.now();
        renderBanners();
      })
      .catch((err) => {
        // Quiet failure — don't block the dashboard if notices are broken.
        console.warn('[firmcraft] notices fetch failed:', err && err.message);
      });
  }

  function ensureBannersContainer() {
    let host = document.getElementById(BANNERS_CONTAINER_ID);
    if (!host || !document.body.contains(host)) {
      host = document.createElement('div');
      host.id = BANNERS_CONTAINER_ID;
      host.className = 'firmcraft-banners';
      document.body.insertBefore(host, document.body.firstChild);
    } else if (host !== document.body.firstChild) {
      // Something re-parented it — move back to the top.
      document.body.insertBefore(host, document.body.firstChild);
    }
    return host;
  }

  function renderBanners() {
    const host = ensureBannersContainer();
    const visible = _cachedNotices.filter((n) => {
      if (!n || !n.id || !n.type || !n.message) return false;
      if (isDismissed(n.id)) return false;
      if (isExpired(n)) return false;
      return true;
    });

    // Reconcile: build a set of IDs we want, remove banners that don't belong,
    // append new ones. Avoid rebuilding the DOM on every poll.
    const wantIds = new Set(visible.map((n) => n.id));
    host.querySelectorAll('[data-firmcraft-notice-id]').forEach((el) => {
      if (!wantIds.has(el.dataset.firmcraftNoticeId)) el.remove();
    });
    visible.forEach((n) => {
      if (host.querySelector(`[data-firmcraft-notice-id="${CSS.escape(n.id)}"]`)) return;
      host.appendChild(buildBannerElement(n));
    });
  }

  function buildBannerElement(notice) {
    const allowedTypes = new Set([
      'maintenance-scheduled',
      'maintenance-in-progress',
      'upgrade-complete',
      'info',
    ]);
    const type = allowedTypes.has(notice.type) ? notice.type : 'info';
    const dismissible = notice.dismissible !== false;

    const banner = document.createElement('div');
    banner.className = 'firmcraft-banner firmcraft-banner--' + type;
    banner.dataset.firmcraftNoticeId = notice.id;
    banner.setAttribute('role', type === 'info' ? 'status' : 'alert');

    const body = document.createElement('div');
    body.className = 'firmcraft-banner__body';

    if (notice.title) {
      const title = document.createElement('strong');
      title.className = 'firmcraft-banner__title';
      title.textContent = notice.title;
      body.appendChild(title);
    }

    const msg = document.createElement('span');
    msg.className = 'firmcraft-banner__msg';
    msg.textContent = notice.message;
    body.appendChild(msg);

    if (notice.starts_at || notice.ends_at) {
      const meta = document.createElement('span');
      meta.className = 'firmcraft-banner__meta';
      const parts = [];
      if (notice.starts_at) parts.push('starts ' + formatTime(notice.starts_at));
      if (notice.ends_at)   parts.push('through '  + formatTime(notice.ends_at));
      meta.textContent = parts.join(' • ');
      body.appendChild(meta);
    }

    banner.appendChild(body);

    if (dismissible) {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'firmcraft-banner__close';
      close.setAttribute('aria-label', 'Dismiss notice');
      close.textContent = '×';
      close.addEventListener('click', () => {
        markDismissed(notice.id);
        banner.remove();
      });
      banner.appendChild(close);
    }

    return banner;
  }

  function formatTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      });
    } catch (_) {
      return iso;
    }
  }

  function startNoticeSystem() {
    ensureBannersContainer();
    fetchNotices();
    setInterval(fetchNotices, NOTICE_REFRESH_MS);

    // Keep the banners container pinned to the top of <body> across SPA
    // re-renders. Reuses the existing MutationObserver pattern.
    const obs = new MutationObserver(() => {
      const host = document.getElementById(BANNERS_CONTAINER_ID);
      if (!host) {
        ensureBannersContainer();
        renderBanners();
      } else if (host !== document.body.firstChild) {
        document.body.insertBefore(host, document.body.firstChild);
      }
    });
    obs.observe(document.body, { childList: true });
    return obs;
  }

  // ─── Slot resolution ─────────────────────────────────────────────────
  // Hermes exposes plugin slots either via the Hermes plugin API or via
  // data-slot attributes on the DOM. We try the API first, then fall
  // back to attribute selectors.
  function resolveSlot(name) {
    if (window.Hermes && typeof window.Hermes.getSlot === 'function') {
      try {
        const el = window.Hermes.getSlot(name);
        if (el) return el;
      } catch (_) { /* fall through */ }
    }
    return document.querySelector(`[data-slot="${name}"]`);
  }

  function renderSlots() {
    renderHeaderLeft(resolveSlot('header-left'));
    renderFooterRight(resolveSlot('footer-right'));
  }

  // ─── Plugin entry ────────────────────────────────────────────────────
  function init() {
    forceLightMode();
    setPageTitle();
    replaceFavicon();
    renderSlots();
    startUpdateButtonObserver();
    startNoticeSystem();

    // Slots may render after the plugin loads — re-render on Hermes events
    // and on a fallback interval for the first few seconds.
    if (window.Hermes && typeof window.Hermes.on === 'function') {
      window.Hermes.on('slots:ready', renderSlots);
      window.Hermes.on('route:change', () => {
        setPageTitle();
        renderSlots();
      });
    }

    let attempts = 0;
    const retry = setInterval(() => {
      attempts += 1;
      renderSlots();
      setPageTitle();
      if (attempts >= 10) clearInterval(retry);
    }, 500);
  }

  // Register with Hermes if available; otherwise self-bootstrap.
  if (window.Hermes && typeof window.Hermes.registerPlugin === 'function') {
    window.Hermes.registerPlugin({
      name: 'firmcraft-brand',
      version: '1.0.0',
      init,
    });
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
