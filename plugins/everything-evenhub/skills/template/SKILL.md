---
name: template
description: Scaffold an Even Hub G2 app from a curated starter template (minimal, asr, image, text-heavy). Use when the user wants a ready-made starting point with working wiring, not a blank Vite project. Flag-driven — pick the template with --asr, --image, --text-heavy, or --minimal.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [project name] [--minimal | --asr | --image | --text-heavy]
---

Scaffold a new Even Hub G2 project by cloning one of the starter templates from [`even-realities/evenhub-templates`](https://github.com/even-realities/evenhub-templates) via `degit`. Unlike `/quickstart` (which bootstraps a blank Vite app from scratch), this skill drops the user into a template that already has the wiring they asked for — mic pipeline, image container, paginated reader, etc.

## Available templates

| Template | What's inside |
|---|---|
| `minimal` | Bare Vite + TS + SDK scaffold. Shows "Hello from G2!" on the glasses. |
| `asr` | Mic → STT pipeline with companion UI, double-tap exit. STT provider is a blank stub — user picks their own. |
| `image` | `ImageContainerProperty` demo with test-pattern bitmap, tap-to-redraw, event-capture layer pattern. |
| `text-heavy` | Long-form reader: pixel-accurate pagination via [`@evenrealities/pretext`](https://www.npmjs.com/package/@evenrealities/pretext) (measures each paragraph at the glyph widths LVGL uses on G2), flicker-free page turns via `textContainerUpgrade`, tap/swipe navigation. |

## How to interpret `$ARGUMENTS`

Arguments can arrive in any order and in many spellings. Be lenient — this is loose pattern matching, not formal parsing.

1. **Split `$ARGUMENTS` on whitespace.** Separate tokens starting with `--` (or `-`) from non-flag tokens.
2. **Normalize flag tokens:** lowercase them, strip leading dashes, strip a leading `with-` or `with` prefix, strip internal dashes and underscores. Examples that must all map to the same thing:
   - `--asr`, `--with-asr`, `--withasr`, `--ASR`, `-asr`, `--with_asr` → `asr`
   - `--image`, `--with-image`, `--withimage`, `--img` → `image`
   - `--text-heavy`, `--textheavy`, `--with-text-heavy`, `--text`, `--reader` → `text-heavy`
   - `--minimal`, `--min`, `--blank`, `--base`, `--empty` → `minimal`
3. **Fuzzy-match the normalized token against the available templates.** Accept an exact match, a prefix match, or any template whose name contains the token. If multiple templates match, prefer the shorter one (`image` beats `image-something`). If nothing matches confidently, default to `minimal` and tell the user which template you picked and why.
4. **The remaining non-flag tokens form the project name.** Join them with spaces, then slugify: lowercase, replace whitespace/underscores with `-`, strip anything that isn't `[a-z0-9-]`. If the user provided no non-flag tokens, default to `my-<template>-app` (e.g. `my-asr-app`).
5. **Derive `package_id` slug** from the project name by removing hyphens (e.g. `my-asr-app` → `myasrapp`). The template already ships an `app.json` with a placeholder `package_id` — edit it to `com.example.<slug>` after degit completes.

If the user passes no flags at all (just a project name or nothing), default to `minimal` and mention the other options so they can rerun with the flag they actually want.

## Steps

### 1. Interpret arguments

Apply the interpretation rules above. Print a one-line summary before running: `Scaffolding <template> template → <project-dir>/`. If you defaulted to `minimal` because the flag was ambiguous or missing, say so explicitly.

### 2. Fetch the template via degit

```bash
npx --yes degit even-realities/evenhub-templates/<template> <project-dir>
```

This pulls just the chosen template directory (no git history). Use `--yes` so npx doesn't prompt on first run.

### 3. Rename the project

Edit these files to replace placeholders with the user's project name:

- `package.json` — change `"name"` from the template default (e.g. `"evenhub-asr"`) to the slugified project name.
- `app.json` — change `"package_id"` to `com.example.<slug>` and `"name"` to a human-readable form of the project name.

### 4. Install dependencies

```bash
cd <project-dir> && npm install
```

### 5. Template-specific follow-ups

- **`asr`** → Tell the user:
  - Copy `.env.example` to `.env.local` and paste their STT provider's API key into `VITE_STT_API_KEY`.
  - Open `src/asr/stt.ts` and implement `startSttStream()` for their chosen provider (Deepgram, AssemblyAI, Whisper, Soniox, self-hosted — their call).
  - Add a `network` permission to `app.json` with the provider's hosts in the `whitelist` array once they pick one. `evenhub pack` rejects an empty whitelist, which is why the template ships without it.
- **`image`** → Tell the user they can either keep the test-pattern generator or swap `makeTestPattern` for `loadImageBytes` in `src/image/renderer.ts` once they have a real asset. Remind them preprocessing is optional (the SDK handles greyscale conversion).
- **`text-heavy`** → Tell the user to replace `src/sample.ts` with their actual content. Pagination is driven by the container's pixel box via `@evenrealities/pretext` — if they resize the body, edit `BODY_W` / `BODY_H` / `BODY_PAD` at the top of `src/main.ts` and pagination re-fits automatically (no char-budget to tune).
- **`minimal`** → No follow-up.

### 6. Print next steps

```
cd <project-dir>
npm run dev                                    # start Vite dev server
npm run simulate                               # desktop simulator
npx @evenrealities/evenhub-cli qr --url http://<your-ip>:5173    # QR for real glasses
npx @evenrealities/evenhub-cli pack                              # build .ehpk for distribution
```

Point the user at the template's own `README.md` for deeper specifics (it's the authoritative doc).

## Design notes

- **Templates live in a separate public repo**, not inside this skill suite. That's intentional: the templates evolve independently (new examples, SDK version bumps) without re-releasing the skill. The skill is a thin degit wrapper.
- **Fuzzy flag matching, not strict.** Users will type `--withasr`, `--asr`, `--with-ASR` — all of these should land on the same template. Normalize aggressively before matching.
- **Do not edit the templates from this skill.** If a template needs a fix, open a PR against [`even-realities/evenhub-templates`](https://github.com/even-realities/evenhub-templates) instead.
- **Prefer `/quickstart` for a truly blank slate.** `/template --minimal` is close but still ships with an `index.html` + zoom-lock CSS + our preferred `tsconfig`; `/quickstart` runs `npm create vite@latest` and wires the SDK in fresh.

## Hardware quick reference

| Property | Value |
|---|---|
| Display | 576 x 288 px, 4-bit greyscale (16 shades of green) |
| Microphone | PCM s16le @ 16 kHz mono |
| Camera | None |
| Speaker | None |
| Input | Touchpad on the temple, optional R1 ring |

## Task

Interpret `$ARGUMENTS`, pick the template, scaffold it, apply template-specific follow-ups, and print next steps: $ARGUMENTS
