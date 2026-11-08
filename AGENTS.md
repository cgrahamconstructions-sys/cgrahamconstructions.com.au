# Repository notes

## What this is

A hand-written static marketing site for C Graham Constructions, published via
GitHub Pages (see `CNAME` → `cgrahamconstructions.com.au`). There is **no build
step, no package manager, no framework and no database** — every page is plain
HTML with inline CSS/JS.

| Path | Purpose |
| --- | --- |
| `index.html` | Home page (also contains the contact form markup) |
| `store.html`, `store/index.html` | Store landing page (the root copy exists for GitHub Pages) |
| `store/downloads/*.pdf` | Downloadable guides sold/linked from the store |
| `chatbot.js` | Floating chat widget, loaded by `index.html` |
| `404.html` | GitHub Pages not-found page |
| `robots.txt`, `sitemap.xml`, `CNAME` | SEO / GitHub Pages metadata |

## Running it locally

```bash
docker compose -f docker-compose.base44.yml up -d
# http://localhost:3000/
```

`web` is `nginx:alpine` serving the site's public files bind-mounted read-only,
so edited files are served immediately — **there is no hot reload**, reload the
browser (or the preview) after an edit. Nothing needs rebuilding after a change;
only a compose edit needs `docker compose -f docker-compose.base44.yml up -d`.

The checkout root is mode `0700`, which nginx's worker user cannot traverse, so
the volumes list mounts each public path (`index.html`, `store.html`, `404.html`,
`chatbot.js`, `robots.txt`, `sitemap.xml`, `CNAME`, and the whole `store/`
directory) instead of the repo root. **A new top-level page or file must be added
to that volumes list** or it will 404 in the preview.

## Quirks worth knowing

- `index.html` loads `chatbot.js` and `store.html` is a near-duplicate of
  `store/index.html`; edit both if a change must appear on the GitHub Pages
  store URL and the `/store/` path.
- The two pages keep their styles inline in a single `<style>` block; there is no
  shared stylesheet, so a global look change has to be applied in each page.
- `store.html` has no external asset references; images/fonts are only used on
  `index.html`.
- No environment variables are read anywhere and no secrets are needed to run
  the site. The chatbot posts leads to a public base44.app function URL
  (`captureWebsiteLead`) hardcoded in `chatbot.js`; that call needs no key and is
  a no-op failure (`.catch(() => {})`) when offline.
- No tests or linters exist in the repo.
