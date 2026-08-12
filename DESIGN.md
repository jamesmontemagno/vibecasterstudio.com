---
name: Rill & Pine
description: A calm, dependable remote recording room for independent podcast hosts.
colors:
  night: "#071b1c"
  pine: "#0c2b2c"
  pine-light: "#174143"
  river: "#76d2c2"
  river-pale: "#b9eee3"
  brass: "#edc874"
  signal: "#f27c62"
  paper: "#e9eee8"
  paper-muted: "#c5d0ca"
  stone: "#8fa49e"
typography:
  display:
    fontFamily: "Avenir Next, Avenir, Helvetica Neue, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 4.8vw, 4.75rem)"
    fontWeight: 640
    lineHeight: 0.98
    letterSpacing: "-0.06em"
  body:
    fontFamily: "Avenir Next, Avenir, Helvetica Neue, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
spacing:
  compact: "0.7rem"
  standard: "1.5rem"
  section: "clamp(2rem, 6vw, 5rem)"
components:
  button-primary:
    backgroundColor: "{colors.river}"
    textColor: "{colors.night}"
    padding: "0.75rem 1.05rem"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.river-pale}"
    textColor: "{colors.night}"
    padding: "0.75rem 1.05rem"
    height: "48px"
---

# Design System: Rill & Pine

## Overview

**Creative North Star: "The River-Gauge Field Station"**

Rill & Pine is a reliable field instrument, not a feature-packed content platform. The system translates the Pacific Northwest into practical conditions: rain-dark working surfaces, clear river-level signals, restrained brass calibration marks, and a pale paper clearing when the conversation needs room.

The character is calm but never soft-focus. The page leads with real operational clarity—what is recording, what is protected, and what changes when the connection gets rough—then supports it with tactile, weather-ready details.

**Key Characteristics:**

- Reliability is visible as a condition, not promised through inflated claims.
- Dark instrument surfaces carry status and action; pale paper surfaces carry relief and reflection.
- The product is precise without using technical styling as costume.
- AI spectacle, decorative dashboards, pills, and generic SaaS-card grids are out of bounds.

## Colors

The palette is a night recording station beside a cold river: dark enough for focused work, with cool signals and a single weathered calibration accent.

### Primary

- **River Signal** (`#76d2c2`): primary action, recorded-state indicators, and essential active information.
- **Deep Pine** (`#0c2b2c`): durable field surfaces and sectional grounding.

### Secondary

- **Weathered Brass** (`#edc874`): calibration marks, host-track signal, and deliberately rare emphasis.
- **Rough Weather** (`#f27c62`): unstable-connection state only. Never use as decoration.

### Neutral

- **Night Water** (`#071b1c`): primary page ground.
- **Pale Paper** (`#e9eee8`): relief section ground and high-contrast editorial field.
- **River Mist** (`#b9eee3`) and **Fogged Stone** (`#8fa49e`): readable on-dark copy hierarchy and quiet secondary information.

**The Condition Rule.** Accent colors must communicate a real state or action. Brass marks calibration; river marks protection or action; orange marks rough conditions.

## Typography

**Display Font:** Avenir Next, Avenir, Helvetica Neue, Segoe UI, sans-serif  
**Body Font:** Avenir Next, Avenir, Helvetica Neue, Segoe UI, sans-serif

**Character:** Close tracking and medium-heavy display weights create an assured, practical voice without technology theatrics. Body copy stays open and comfortably paced.

### Hierarchy

- **Display** (640, `clamp(2.5rem, 4.8vw, 4.75rem)`, 0.98): page propositions and major section statements.
- **Headline** (600, 1.1rem, 1.25): condition-list anchors and question prompts.
- **Body** (400, 1rem–1.1rem, 1.5–1.7): explanatory copy, held to roughly 42–49ch where possible.
- **Label** (700, 0.68–0.78rem, 1.3): real session status, field markings, and control metadata; uppercase with generous tracking.

## Layout

The desktop container is `min(1200px, calc(100% - 3rem))`. The first viewport is a paired layout: proposition and signup on the left, operational recording instrument on the right. At tablet width, the instrument moves below the proposition; at phone width, forms stack, session lanes simplify, and the main story remains linear.

Use broad structural regions rather than a repeated card grid. Section rhythm is generous, commonly 6–10rem vertically on large screens, then 3–6rem on small screens. More space belongs above a proposition than below it.

## Elevation & Depth

Depth is structural and sparse. The recording instrument and waitlist field use a hard-offset shadow (`18px 20px` or `15px 16px`) to feel like physical station panels. Do not add glows, floating frosted surfaces, or decorative blur.

## Shapes

Corners remain square. Borders are hairline, weathered, and functional: they divide session lanes, condition rows, and equipment edges. The only rounded form is the small recording-state dot.

## Components

- **Primary button:** square river-signal field with night ink; lightens and rises 2px on hover.
- **Input:** square, translucent dark field with a quiet mist border; river outline on focus.
- **Condition instrument:** functional rows for tracks and connection state. Treat measurements, marks, and animation as product explanation—not decoration.
- **FAQ:** border-separated native disclosure rows. The plus rotates only to communicate the expanded state.
- **Links:** river signal by default; brass on hover for an intentional directional cue.

## Do's and Don'ts

**Do**

- Make local recording, connection state, and host/guest roles instantly legible.
- Use pine, river, rain, and field-station cues as functional metaphors.
- Let one useful interaction demonstrate the product's core reliability promise.
- Respect reduced-motion preferences and maintain a high-contrast fallback.

**Don't**

- Use AI imagery, generated-person portraits, invented testimonials, customer logos, or unsupported performance claims.
- Turn every benefit into a card or every section into a dashboard.
- Use neon cyberpunk, waveform decoration without session meaning, or generic glassmorphism.
- Soften the identity into cream-paper editorial styling or a conventional SaaS hero.
