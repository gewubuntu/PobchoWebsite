# Poncho on Base

Official website of [$PONCHO](https://www.ponchobase.com), the cutest cat on Base.

Built with [Astro](https://astro.build) as a static site: zero framework JavaScript on the landing page, optimized images (AVIF/WebP) and small, page-specific scripts.

## Getting started

Requirements: Node.js 22+

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command           | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload                  |
| `npm run build`   | Type-check (`astro check`) and build to `dist/`       |
| `npm run preview` | Serve the production build locally                    |
| `npm test`        | Run the Playwright end-to-end tests against the build |

Before running the tests for the first time, install a browser: `npx playwright install chromium`.

## Project structure

```
public/                 Static files served as-is (favicons, CNAME, meme assets, videos, fonts)
  memes/templates/      Meme templates (+ small/ thumbnails)
  memes/assets/<group>/ Poncho traits – drop a PNG in a folder and it shows up in the generator
src/
  assets/img/           Images optimized at build time (resized, AVIF/WebP)
  components/           Page sections (Hero, About, Nfts, Tokenomics, Roadmap, BearHunt, Faq, …)
  data/site.ts          Addresses, links, token facts, roadmap – edit content here
  data/memes.ts         Meme templates and their default text boxes
  layouts/              Base layout: <head>, SEO, header/footer, buy dialog
  pages/                index (landing page), memes (meme generator), 404, robots.txt
  scripts/              Client scripts (live token data, carousel, meme generator)
  styles/               Global styles and breakpoints
tests/                  Playwright tests
```

## Common edits

- **Links, contract address, holders count, roadmap:** `src/data/site.ts`
  The holder count is not available from DEX Screener, so update `token.holders` by hand.
- **Poncho Bear Hunt:** set `bearHunt.url` in `src/data/site.ts` once the game is deployed. Until then the section shows "Coming Soon".
- **New meme template:** add `<Name>.png` to `public/memes/templates/`, a 300×300 thumbnail to `public/memes/templates/small/`, and an entry in `src/data/memes.ts`.

## Live data

Price, market cap, 24h volume and 24h transactions are fetched in the browser from the
[DEX Screener API](https://docs.dexscreener.com/api/reference) and refreshed every minute while the tab is visible.

## Deployment

- `dev` – integration branch; every push runs CI (type check, build, tests).
- `main` – production. Pushes deploy to GitHub Pages via `.github/workflows/deploy.yml`.

GitHub Pages must be set to **Settings → Pages → Build and deployment → Source: GitHub Actions** (the old setup served the repository root directly). The custom domain comes from `public/CNAME`.

Legacy links keep working: `/?modal=buy` opens the buy dialog and `/?modal=memes` redirects to `/memes/`.

## Credits

[Astro](https://astro.build) · [Fabric.js](https://fabricjs.com/) · [SortableJS](https://sortablejs.github.io/Sortable/) ·
[emoji-picker-element](https://github.com/nolanlawson/emoji-picker-element) · [Font Awesome](https://fontawesome.com/) icons via [Iconify](https://iconify.design/) ·
[Montserrat](https://fonts.google.com/specimen/Montserrat) via [Fontsource](https://fontsource.org/)

Disclaimer: $PONCHO is a meme coin with no intrinsic value or expectation of financial return.
