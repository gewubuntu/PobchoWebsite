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
| `npm test`        | Unit tests (Vitest) and end-to-end tests (Playwright) |
| `npm run lint`    | ESLint for TypeScript and Astro files                 |
| `npm run format`  | Prettier (TS, JS, JSON, SCSS, Markdown, YAML)         |
| `npm run audit`   | Security audit of production dependencies             |

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

- **Links, contract address, roadmap:** `src/data/site.ts`
- **Poncho Bear Hunt:** set `bearHunt.url` in `src/data/site.ts` once the game is deployed. Until then the section shows "Coming Soon".
- **New meme template:** add `<Name>.png` to `public/memes/templates/`, a 300×300 thumbnail to `public/memes/templates/small/`, and an entry in `src/data/memes.ts`.

## Live data

Price, market cap, 24h volume and 24h transactions are fetched in the browser from the
[DEX Screener API](https://docs.dexscreener.com/api/reference) and refreshed every minute while the tab is visible.

The holder count is fetched at build time (`src/data/holders.ts`): from Basescan (Etherscan V2 API) when the
`BASESCAN_API_KEY` environment variable is set, otherwise from the free Blockscout API for Base. If both fail, the
build uses the fallback value `token.holders` in `src/data/site.ts` and shows it with a "+". Results below half of
that fallback value are treated as a broken API response and skipped, so raise the fallback now and then. Note that Etherscan's
holder-count endpoint requires an API PRO plan; without it the build falls back to Blockscout automatically.

## Quality checks

Every push to `dev` (and every pull request) runs lint, formatting, the security audit, unit tests, the build with
type check and the Playwright tests (`.github/workflows/ci.yml`).

- **Formatting:** Prettier covers everything except `.astro` files. Its Astro plugin moves inline text onto new lines,
  which changes rendered whitespace here (`compressHTML: false`), so Astro files are formatted by hand. A test fails if
  a page ever shows a space before punctuation (e.g. "Uniswap .").
- **Security audit:** `audit-ci.jsonc` fails on high/critical advisories. Its allowlist documents two Fabric.js findings
  that don't apply to this site (SVG export is never used; `tar` is an optional server-side dependency).
- **Dependabot** opens weekly update PRs against `dev` for npm packages and GitHub Actions. Fabric major updates are
  ignored on purpose: Fabric 7 changes default object origins, so the meme templates need a manual migration.
- **Link check:** `.github/workflows/links.yml` checks all links on the built site every Monday. Hosts with bot
  protection (X, Telegram, OpenSea, …) are excluded because they always fail automated checks.

## Deployment

- `dev` – integration branch; every push runs CI (type check, build, tests).
- `main` – production. Pushes deploy to GitHub Pages via `.github/workflows/deploy.yml`. The site is also rebuilt
  daily at 04:17 UTC so the holder count stays current. Add `BASESCAN_API_KEY` under
  **Settings → Secrets and variables → Actions** to use Basescan.
  GitHub turns scheduled workflows off after 60 days without any repository activity. If the holder count stops
  updating, check **Actions → Deploy to GitHub Pages** (and **Link check**) and click **Enable workflow**.
  When no holder API answers, the deploy run shows a "Holder count not updated" warning.

GitHub Pages must be set to **Settings → Pages → Build and deployment → Source: GitHub Actions** (the old setup served the repository root directly). The custom domain comes from `public/CNAME`.

Legacy links keep working: `/?modal=buy` opens the buy dialog and `/?modal=memes` redirects to `/memes/`.
The most important images of the old site stay available under `public/dist/img/` (for listings, bots and social caches
that embed them directly) – don't use them in new code; the site uses the optimized copies in `src/assets/img/`.

## Credits

[Astro](https://astro.build) · [Fabric.js](https://fabricjs.com/) · [SortableJS](https://sortablejs.github.io/Sortable/) ·
[emoji-picker-element](https://github.com/nolanlawson/emoji-picker-element) · [Font Awesome](https://fontawesome.com/) icons via [Iconify](https://iconify.design/) ·
[Montserrat](https://fonts.google.com/specimen/Montserrat) via [Fontsource](https://fontsource.org/)

Disclaimer: $PONCHO is a meme coin with no intrinsic value or expectation of financial return.
