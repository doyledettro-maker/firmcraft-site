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
      'Powered by <a href="https://firmcraft.ai" target="_blank" rel="noopener noreferrer">Firmcraft</a>';

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
