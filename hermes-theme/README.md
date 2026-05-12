# Firmcraft theme for Hermes

White-label Firmcraft branding for the [Hermes](https://hermes.dev) dashboard
without forking the upstream codebase. Workstream 8 of the Firmcraft buildout.

## What this is

A theme YAML and a slot-only plugin. Together they replace the Hermes default
chrome with Firmcraft's warm palette (cream / terracotta / ink), Source Serif 4
italic display type, the brand mark, and a "Built by Firmcraft" credit.
The plugin also force-pins light mode and hides the "Update" button.

**Slot-only means:** every change happens through Hermes's published extension
points — theme tokens, named slots (`header-left`, `footer-right`, `favicon`),
and a single MutationObserver. No core files patched, no upstream merge
conflicts to babysit.

```
hermes-theme/
├── firmcraft.yaml          # theme palette, typography, sidebar, buttons
├── plugin/
│   ├── manifest.json       # plugin metadata, slot list
│   └── dashboard/
│       ├── index.js        # slot renderers + MutationObserver
│       └── styles.css      # CSS overrides scoped under [data-firmcraft]
├── deploy.sh               # idempotent installer
└── README.md               # this file
```

## Deploy

```bash
cd hermes-theme
./deploy.sh
```

Then add to `~/.hermes/config.yaml`:

```yaml
theme: firmcraft
plugins:
  - firmcraft-brand
```

Restart Hermes and hard-reload the browser (Cmd-Shift-R). Walk through the
10-point verification checklist that `deploy.sh` prints.

To target a different Hermes install root:

```bash
HERMES_HOME=/opt/hermes ./deploy.sh
```

## White-labeling for another client

Everything client-specific lives in two places:

1. **`firmcraft.yaml`** — palette, typography, sidebar accents, button colors,
   page title.
2. **`plugin/dashboard/index.js`** — the inlined SVG mark, favicon, wordmark
   text, and "Powered by …" credit.

To produce a new client theme:

1. Copy this directory to `hermes-theme-<client>/`.
2. Rename the YAML file and the `name:` field inside it.
3. Edit the palette and typography blocks.
4. Replace `FORGE_STAMP_SVG` and `FAVICON_SVG` constants in `index.js` with the
   client's mark and the wordmark text in `renderHeaderLeft()`.
5. Update the credit in `renderFooterRight()` (or remove it if the client is
   paying for unbranded).
6. Bump `manifest.json` `name` to `<client>-brand`.
7. `./deploy.sh` and walk the checklist.

A typical client rebrand is a 2–3 hour exercise — the structure is fixed; only
values change.

## Maintenance expectations

Budget **8–20 hours per year** for keeping pace with Hermes releases.

The two things that periodically break:

- **Theme token names.** When Hermes renames a CSS custom property
  (`--color-bg` → `--surface-bg`, etc.), the YAML still applies but some
  surfaces revert to the default palette. Fix: add the new alias in
  `styles.css` under the `:root[data-firmcraft="true"]` block.
- **Slot names.** If `header-left` becomes `nav-leading` in a future major,
  update the strings in `manifest.json` and the `resolveSlot()` calls in
  `index.js`. The plugin already falls back from `Hermes.getSlot(name)` to a
  `[data-slot="..."]` attribute query, so the failure mode is a missing logo,
  not a crash.

The "Update" button hider matches on visible text (`"update"`,
case-insensitive), so it survives class-name churn — but if Hermes relabels
the button to "Sync now" it'll need a one-line change in `shouldHideButton()`.

A fast review cycle on every Hermes minor release (~30 min: deploy to staging,
run the 10-point checklist) catches drift before it ships to clients.

## Known risks

### CSP headers
The plugin pulls Source Serif 4, Geist, and Geist Mono from Google Fonts via
`@import` in `styles.css`. If the host Hermes deployment ships a strict
Content-Security-Policy that omits `fonts.googleapis.com` (style-src) and
`fonts.gstatic.com` (font-src), the fonts silently fall back to system
serifs/sans. Fixes, in order of preference:

1. Add the two domains to the CSP.
2. Self-host the WOFF2 files inside `plugin/dashboard/fonts/` and reference
   them with `@font-face` instead of `@import`.

### Favicon caching
Browsers cache favicons aggressively — sometimes ignoring `Cache-Control`
headers entirely. After deploying, expect at least one user report of "still
seeing the Hermes icon." Workarounds:

- Hard-reload (Cmd-Shift-R / Ctrl-Shift-F5).
- Quit and relaunch the browser.
- Versioned `?v=2` query string on the favicon `href` (already a stable data:
  URL here, so the cache key changes whenever the SVG changes — but tabs that
  were open during deployment may still hold the old icon until reload).

### CSS selector fragility
A handful of overrides target Hermes-specific selectors (`aside.sidebar`,
`[data-slot="sidebar"]`, `[data-page="login"]`). If Hermes restructures its
DOM, those selectors miss and the affected surfaces revert to default styling.
The token-level overrides (custom properties) keep working in that scenario,
so a Hermes restructure produces a *partially* themed dashboard rather than a
broken one. Fix on a release-by-release basis.

### MutationObserver scope
The "Update" button hider observes the entire `body` subtree. On a very busy
dashboard with frequent DOM churn this is measurable but not problematic
(<1ms per batch in our testing). If profiling ever flags it, scope the
observer to a specific container (e.g. the top bar) instead of `document.body`.

## Troubleshooting

| Symptom                           | Likely cause                                            | Fix                                                         |
|-----------------------------------|---------------------------------------------------------|-------------------------------------------------------------|
| Old favicon still showing         | Browser cache                                           | Hard-reload, or quit and relaunch the browser               |
| Forge-stamp logo missing          | Slot name changed in Hermes upstream                    | Update `resolveSlot()` calls in `index.js`                  |
| Some panels still using dark/grey | Theme token renamed in Hermes upstream                  | Add the new custom-property alias in `styles.css`           |
| Fonts rendering as Times          | CSP blocks fonts.googleapis.com / fonts.gstatic.com     | Whitelist in CSP, or self-host fonts                        |
| "Update" button reappears         | Hermes relabeled the button                             | Update the label match in `shouldHideButton()`              |
| Dark mode flashing on first paint | Hermes applies its own theme before the plugin loads    | Inline a tiny FOUC-blocker `<script>` in the host HTML head |
