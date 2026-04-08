---
name: design-guidelines
description: UI/UX design guidelines for Even Hub G2 smart glasses — display constraints, layout patterns, icon design, Unicode characters, and community resources. Use when designing glasses app interfaces or planning layouts.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [design question or task]
---

# Even Hub G2 Design Guidelines

## Display Constraints

- **Resolution**: 576 x 288 pixels per eye
- **Color depth**: 4-bit greyscale — 16 levels of green
- **White pixels** appear as bright green; black pixels are off (transparent)
- **No background color** or fill color property
- **No CSS, no flexbox, no DOM** — UI is built from absolute-positioned pixel containers
- **Max 4 image containers** and **8 other containers** per page

## Container Limits

- Max **12 containers total** (8 text/list + 4 image)
- Exactly **one container must have `isEventCapture: 1`**
- **`containerID`** must be unique per page (integer)
- **`containerName`** must be unique per page (string, max **16 characters**)
- **No z-index control** — declaration order determines overlap

## Font & Text

- Single **LVGL font** baked into firmware
- **Not monospaced**
- No font selection, no font size control, no bold/italic
- Characters outside the font are **silently skipped**
- Text **wraps at container width**
- Use `\n` for line breaks
- **~400-500 characters** fill a full-screen text container
- **Unicode** supported within the firmware font set

## Common UI Patterns

| Pattern | How |
|---|---|
| Fake buttons | Prefix text with `>` as cursor indicator |
| Selection highlight | Toggle `borderWidth` on individual text containers |
| Multi-row layout | Stack multiple text containers vertically (e.g., 3 containers at 96px height) |
| Progress bars | Unicode block characters: `━` (filled) and `─` (empty), or `█▇▆▅▄▃▂▁` |
| Page flipping | Pre-paginate text at ~400-500 char boundaries, rebuild on scroll events |
| "Centering" text | Manually pad with spaces (no text alignment support) |

## Icon Design Principles

- **Design at native resolution** — work at actual pixel size (e.g., 24x24). Avoid designing large and scaling down.
- **Keep it simple** — aim for immediately recognizable silhouettes with minimal internal detail.
- **Test on hardware** — green-tinted greyscale rendering differs from your monitor. Always verify legibility on actual display or simulator with glow enabled.

## Useful Unicode Characters

| Use Case | Characters |
|---|---|
| Progress bars | `━ ─ █▇▆▅▄▃▂▁` |
| Navigation | `▲△▶▷▼▽◀◁` |
| Selection | `●○ ■□ ★☆` |
| Borders | `╭╮╯╰ │─` (box drawing set) |
| Card suits | `♠♣♥♦` |

Full supported glyph tables: https://github.com/nickustinov/even-g2-notes

## Image Containers

- **Width**: 20–200 px, **Height**: 20–100 px
- **4-bit greyscale**
- Placeholder on creation — must call `updateImageRawData` to display content
- **No concurrent image sends** — wait for each to complete
- Use simple/flat colors; glasses have limited memory

## Figma Design Guidelines

Official design guidelines covering layout principles, component patterns, interaction models, and visual standards:
https://www.figma.com/design/X82y5uJvqMH95jgOfmV34j/Even-Realities---Software-Design-Guidelines--Public-?node-id=2922-80782

## App-Side Design Tokens (WebView Settings UI)

When the app has a phone-side settings or configuration screen, use these design tokens for visual consistency with the Even brand. These values come from Design Library 3.0 and even-toolkit.

### Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-text` | #232323 | #F0EBE3 | Primary text |
| `--color-text-dim` | #7B7B7B | #8A7F72 | Secondary text |
| `--color-text-muted` | #A7A7A7 | #5C5347 | Tertiary/disabled |
| `--color-bg` | #EEEEEE | #0C0A07 | Page background |
| `--color-surface` | #FFFFFF | #161310 | Card surface |
| `--color-surface-alt` | #F6F6F6 | #201C17 | Elevated surface |
| `--color-border` | #E4E4E4 | #28221A | Default border |
| `--color-accent` | #232323 | #FFFFFF | Primary CTA |
| `--color-accent-warning` | #FEF991 | #FEF991 | Brand Yellow — accent only, sparingly |
| `--color-positive` | #4BB956 | — | Success |
| `--color-negative` | #FF453A | — | Error |

- **#FEF991 (Brand Yellow)** = accent only. Never for body text.
- **#3CFA44 (OS Green)** = glasses display ONLY. Never in app UI.
- Dark mode uses warm-tinted neutrals, not neutral gray.

### Typography

| Style | Size | Weight | Letter Spacing |
|-------|------|--------|----------------|
| Very Large Title | 24px | 400 | -0.72px |
| Large Title | 20px | 400 | -0.60px |
| Medium Title | 17px | 400 | -0.17px |
| Medium Body | 17px | 300 | -0.17px |
| Normal Title | 15px | 400 | -0.15px |
| Normal Body | 15px | 300 | -0.15px |
| Subtitle | 13px | 400 | -0.13px |
| Detail | 11px | 400 | -0.11px |

- **Font**: FK Grotesk Neue. Fallback: -apple-system, sans-serif.
- Weight 400 for titles, 300 for body. Never use bold (700).
- Negative letter spacing is a brand signature — do not override.
- Minimum font size: 11px.

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-same` | 6px | Related items |
| `--spacing-margin` | 12px | Standard margin |
| `--spacing-card-margin` | 16px | Card padding |
| `--spacing-section` | 24px | Between sections |
| `--radius-default` | 6px | All cards/inputs/buttons |

### Rules

- Support BOTH light and dark themes (use `prefers-color-scheme` media query)
- Use even-toolkit components when available — do not roll custom equivalents
- Use CSS variables, not hardcoded pixel values
- No Tailwind CSS — plain CSS or CSS variables only

## Community Resources

- **even-g2-notes** (GitHub: https://github.com/nickustinov/even-g2-notes) — architecture deep-dives, full Unicode glyph tables, SDK quirks, error codes, reference implementations: chess, reddit reader, weather, Tesla vehicle status, pong, snake
- **even-toolkit** (GitHub: https://github.com/fabioglimb/even-toolkit, npm: `even-toolkit`) — 55+ React components, 191 pixel-art icons, design tokens, glasses SDK bridge utilities (useGlasses hook, buildActionBar, mapGlassEvent, canvas renderer, PNG utils, pagination helpers)
- **Discord**: https://discord.gg/Y4jHMCU4sv — developer community for support, bug reports, discussion

## Task

$ARGUMENTS
