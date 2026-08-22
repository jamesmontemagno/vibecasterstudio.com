# Rill & Pine

The public coming-soon site for [rillandpine.com](https://rillandpine.com).

Rill & Pine is a calm, dependable place to record remote podcast conversations. It is built for independent podcast hosts: when a guest's internet connection gets rough, local recording holds the take. This repository contains the dependency-free static marketing site, published on GitHub Pages.

## Local preview

From the repository root:

```sh
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Structure

- `index.html` — semantic page content, social/SEO metadata, the illustrative session instrument, and the Tally waitlist embed
- `styles.css` — responsive design system, layout, and reduced-motion support
- `script.js` — the "simulate rough weather" condition toggle and footer year
- `404.html` — custom not-found page
- `assets/` — favicon and social sharing artwork
- `PRODUCT.md` — public product and brand context
- `DESIGN.md` — public visual system and implementation guidance
- `CNAME` — canonical GitHub Pages custom domain
- `test/` — static site checks (metadata, accessibility, allowed destinations)

## Quality checks

```sh
npm ci
npm test
```

The same checks run in GitHub Actions on pull requests and pushes to `main`.

## Deployment

GitHub Pages publishes from the root of the `main` branch. The canonical domain is `rillandpine.com`.
