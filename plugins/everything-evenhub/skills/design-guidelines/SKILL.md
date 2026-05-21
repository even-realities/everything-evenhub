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

- **Width**: 20–288 px, **Height**: 20–144 px
- **4-bit greyscale**
- Placeholder on creation — must call `updateImageRawData` to display content
- **No concurrent image sends** — wait for each to complete
- Use simple/flat colors; glasses have limited memory

## Phone-Side App UI (Flutter WebView host)

The glasses render monochrome green on black, but the Flutter WebView that hosts your plugin on the phone has its own visual identity. Match the Even app design system when building phone-side config / settings / library screens so your plugin feels native inside Even Hub.

### Color tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-text` | `#232323` (TC-1st) | `#FFFFFF` | Primary text |
| `--color-text-dim` | `#7B7B7B` (TC-2nd) | `#8A8A8A` | Secondary text, timestamps, captions |
| `--color-bg` | `#FFFFFF` (BC-1st) | `#111111` | Page background |
| `--color-surface` | `#EEEEEE` (BC-3rd) | `#1A1A1A` | Card / row background |
| `--color-input-bg` | `rgba(35,35,35,0.08)` | `rgba(255,255,255,0.08)` | Search bar, input fields |
| `--color-accent` | `#FEF991` | `#FEF991` | Brand accent (sparingly — buttons, highlights) |
| `--color-text-on-accent` | `#FFFFFF` | `#FFFFFF` | Text on accent backgrounds |

**Brand rules:**
- `#FEF991` is Even brand yellow — use only for accent (buttons, highlights), never as a page background
- `#3CFA44` is glasses-display green — use ONLY on the G2 display, NEVER in phone-side UI

### Typography

Primary: **FK Grotesk Neue** (negative letter-spacing for a tight, editorial feel). Fallback: **Source Han Sans** for CJK, system sans for everything else.

| Style | Size | Weight | Letter-spacing |
|---|---|---|---|
| Display | 34 px | 700 | -0.02em |
| Title | 24 px | 600 | -0.02em |
| Subtitle | 18 px | 500 | -0.01em |
| Body | 16 px | 400 | -0.01em |
| Caption | 13 px | 400 | 0 |
| Label | 11 px | 500 | 0.04em (uppercase) |

### Spacing

Use a 4/8 px grid: `4 8 12 16 24 32 48 64`. Card padding: 16. Section spacing: 24–32. Screen edge padding: 20.

## Figma Design Guidelines

Official design guidelines covering layout principles, component patterns, interaction models, and visual standards:
https://www.figma.com/design/X82y5uJvqMH95jgOfmV34j/Even-Realities---Software-Design-Guidelines--Public-?node-id=2922-80782

## Community Resources

- **even-g2-notes** (GitHub: https://github.com/nickustinov/even-g2-notes) — architecture deep-dives, full Unicode glyph tables, SDK quirks, error codes, reference implementations: chess, reddit reader, weather, Tesla vehicle status, pong, snake
- **even-toolkit** (GitHub: https://github.com/fabioglimb/even-toolkit, npm: `even-toolkit`) — 55+ React components, 191 pixel-art icons, design tokens, glasses SDK bridge utilities (useGlasses hook, buildActionBar, mapGlassEvent, canvas renderer, PNG utils, pagination helpers)
- **Discord**: https://discord.gg/Y4jHMCU4sv — developer community for support, bug reports, discussion

## Task

$ARGUMENTS
