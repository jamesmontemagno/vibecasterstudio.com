# VibeCaster Studio

The public coming-soon site for [vibecasterstudio.com](https://vibecasterstudio.com).

VibeCaster Studio is a browser-based remote audio and video podcast recording studio for independent podcasters and small creator teams. This repository contains a dependency-free static site designed for GitHub Pages.

## Local preview

From the repository root:

```sh
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Structure

- `index.html` — semantic page content and original inline signal-map artwork
- `styles.css` — responsive design system, layout, and reduced-motion support
- `assets/` — favicon and social sharing artwork
- `PRODUCT.md` — public product and brand context
- `DESIGN.md` — public visual system and implementation guidance
- `CNAME` — canonical GitHub Pages custom domain

## Deployment

GitHub Pages publishes from the root of the `main` branch. The canonical domain is `vibecasterstudio.com`.
