# VibeCaster Studio Design System

## Overview

VibeCaster Studio's marketing surface should feel like a bright, tactile creator desk: buoyant enough to invite a new podcaster in, precise enough to trust with a once-only conversation. The site uses a committed crimson identity on true white, with teal reserved for recovery and amber reserved for completed output. It must not look like a video-conferencing product screenshot.

## Color

Use OKLCH values throughout.

```css
:root {
  --color-bg: oklch(1 0 0);
  --color-surface: oklch(0.97 0.012 28);
  --color-surface-strong: oklch(0.93 0.025 28);
  --color-ink: oklch(0.19 0.025 25);
  --color-muted: oklch(0.43 0.035 25);
  --color-line: oklch(0.86 0.025 28);
  --color-crimson: oklch(0.614 0.234 28.2);
  --color-crimson-dark: oklch(0.45 0.175 27);
  --color-crimson-pale: oklch(0.93 0.055 27);
  --color-teal: oklch(0.72 0.13 181);
  --color-teal-pale: oklch(0.93 0.06 181);
  --color-amber: oklch(0.82 0.15 84);
  --color-amber-pale: oklch(0.95 0.055 84);
}
```

Crimson means active capture and brand energy. Teal means backup, continuity, and recovery. Amber means assembled output. Ink, labels, icons, and shape must accompany color so meaning never depends on hue alone.

## Typography

Use local system type only so the site has no font request, privacy dependency, or layout shift.

- Display: `ui-rounded, "Arial Rounded MT Bold", "Avenir Next", system-ui, sans-serif`
- Body: `"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif`
- Headings are heavy, compact, and friendly with letter spacing no tighter than `-0.04em`.
- Body copy is at least `1rem`, uses generous leading, and stays within `65ch`.
- Use uppercase only for the few diagram labels where it behaves like equipment labeling.

## Layout

- Maximum page width: `76rem`.
- Mobile-first, with content-driven transitions near 48rem and 68rem.
- Use fluid `clamp()` spacing and a 4px-derived spacing scale.
- Alternate composition: split hero, full-width color promise, ordered process, asymmetric capabilities, then a single closing statement.
- Avoid repeated card grids. Use open layouts, horizontal rules, and differently scaled capability groups.

## Signature Visual

The hero signal map is an original inline SVG. Distinct participant marks feed isolated local tracks, a resumable backup path, and two static export frames. It is conceptual rather than a literal interface screenshot.

Motion is concentrated in the signal map: short dashes travel along the recording and backup paths, waveform bars breathe, and the final frame settles into place. All content is visible before animation. Under `prefers-reduced-motion: reduce`, paths and objects remain fully rendered with no movement.

## Shape & Surface

- Rounded shapes evoke microphones, records, and studio equipment without becoming toy-like.
- Corners range from small functional rounding to large soft stage framing; avoid one universal radius.
- Use solid fills only. No gradients, glass effects, or decorative blur panels.
- Shadows are rare and used only to lift the hero object from the white page.
- Dividers are full hairlines, never colored side stripes.

## Accessibility

- Body copy targets at least 4.5:1; primary text targets 7:1 against its surface.
- Focus rings use a dark crimson outline with clear offset.
- The hero illustration includes a title, description, and visible caption.
- Navigation remains usable by keyboard and at 200% zoom.
- Decorative SVG elements are hidden from assistive technology.
- Motion is optional and never gates information.
