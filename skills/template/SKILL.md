---
name: template
description: Scaffold an Even Hub G2 smart glasses app with opt-in feature add-ons via --with-{feature} flags. Flag-driven cousin of the quickstart skill — base scaffold is identical, but feature modules (ASR, image, etc.) are layered on top. Use when you want a scaffold with extras baked in.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [project name] [--with-asr] [--with-image] [--with-...]
---

You are scaffolding an Even Hub G2 project with optional feature modules. This skill is a **flag-driven** variant of the `quickstart` skill:

- **Base scaffold** (everything below): always runs. Same as `quickstart`.
- **Add-ons**: one file per feature under `addons/`. Each `--with-{feature}` flag in `$ARGUMENTS` loads and applies the matching `addons/{feature}.md` after the base scaffold finishes.

If the user passed no flags, this skill produces the same output as `quickstart`.

---

## Step 1 — Parse `$ARGUMENTS`

1. Split `$ARGUMENTS` on whitespace. Flags may appear in any position (before, after, or interleaved with the project name).
2. Collect every token that starts with `--with-` into an `ADDONS` list. For each flag:
   - Strip everything after `=` if present (`--with-asr=anything` → `--with-asr`).
   - Strip the `--with-` prefix → the add-on name (e.g. `--with-asr` → `asr`).
   - Reject flags with an empty suffix (`--with-` or `--with-=`) with a clear error — ask the user what they meant.
   - Deduplicate — if the same flag appears twice, apply the add-on once.
3. The remaining tokens (after removing flags) concatenate to form the project name. If empty, default to `my-evenhub-app`.
4. Sanitise the project name: lowercase, replace non-alphanumeric runs with single hyphens, trim leading/trailing hyphens (e.g. `"My Cool App!"` → `my-cool-app`).
5. Derive `package_id` slug by removing hyphens (e.g. `my-cool-app` → `mycoolapp`). The `package_id` in `app.json` must be lowercase with no hyphens (e.g. `com.example.mycoolapp`).

**Validate each add-on name before continuing.** For each entry in `ADDONS`, verify that `skills/template/addons/{name}.md` exists relative to this skill file. If any requested add-on has no matching file, **stop immediately** — do not continue to Step 2. Tell the user which flag is unknown, list the available add-ons (by listing the files in `addons/`), and wait for them to confirm or correct the flag. Do not silently skip unknown flags or proceed on a best-effort basis.

---

## Step 2 — Create the project with Vite

```bash
npm create vite@latest <name> -- --template vanilla-ts
```

If the user specified a different framework (react, vue, svelte, etc.), honour that by replacing `vanilla-ts` with the appropriate Vite template. When in doubt, use `vanilla-ts`.

---

## Step 3 — Install base dependencies

```bash
cd <name> && npm install
```

---

## Step 4 — Install the Even Hub SDK

```bash
npm install @evenrealities/even_hub_sdk
```

---

## Step 5 — Install dev tools (CLI + Simulator)

The CLI currently declares a peer dependency on `typescript@^5`, but Vite's `vanilla-ts` template installs TypeScript 6, which causes an ERESOLVE error. Pin TypeScript to 5.x before installing the dev tools:

```bash
npm install -D typescript@^5
npm install -D @evenrealities/evenhub-cli @evenrealities/evenhub-simulator
```

(When the CLI publishes a version that allows `typescript@^6`, the pin can be dropped.)

---

## Step 6 — Generate the app manifest

```bash
npx evenhub init
```

Open `app.json` and correct it to match the **app.json template** below:
- Set `min_sdk_version` to `"0.0.10"`.
- Set `permissions` to `[]` unless the app actually requires specific permissions. Add-ons will append their own permission entries in Step 9.
- Verify every other field matches the template.

---

## Step 7 — Lock the WebView viewport (applies to every scaffold)

The companion-app WebView is a real browser engine, so pinch and double-tap zoom work by default — which is almost never what you want for a fixed-layout glasses plugin. Apply this **whether or not any `--with-*` flag is present.**

**1. Edit `index.html`** — replace the default viewport meta tag with a zoom-locked one:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
```

**2. Add these CSS rules** to whatever stylesheet the app uses (or inline via a `<style>` tag in `index.html` if the base scaffold has no CSS file yet):

```css
html, body {
  touch-action: manipulation;      /* kills double-tap zoom on iOS Safari, which ignores user-scalable=no */
  -webkit-text-size-adjust: 100%;  /* prevent iOS auto text size bumps */
  overscroll-behavior: none;       /* no pull-to-refresh or rubber-band scroll */
}
```

If an add-on replaces the stylesheet entirely (e.g. the ASR add-on ships `src/ui.ts` with injected CSS), make sure those same three rules remain present in the replacement stylesheet.

---

## Step 8 — Write `src/main.ts` starter

Overwrite `src/main.ts` with exactly the following content. Delete any unused boilerplate left by the Vite template (e.g., `src/counter.ts`, `src/style.css`, `src/assets/`).

```typescript
import { waitForEvenAppBridge, TextContainerProperty, CreateStartUpPageContainer } from '@evenrealities/even_hub_sdk'

const bridge = await waitForEvenAppBridge()

const mainText = new TextContainerProperty({
  xPosition: 0,
  yPosition: 0,
  width: 576,
  height: 288,
  borderWidth: 0,
  borderColor: 5,
  paddingLength: 4,
  containerID: 1,
  containerName: 'main',
  content: 'Hello from G2!',
  isEventCapture: 1,
})

const result = await bridge.createStartUpPageContainer(new CreateStartUpPageContainer({
  containerTotalNum: 1,
  textObject: [mainText],
}))
console.log('Page created:', result === 0 ? 'success' : 'failed')
```

Add-ons may fully overwrite this file in Step 9.

---

## Step 9 — Apply each add-on in `ADDONS`

For each add-on name collected in Step 1, read the corresponding `addons/{name}.md` file and apply every instruction in that file. Add-ons are applied **in the order the flags were passed**.

**Handle file collisions explicitly.** If two add-ons both create/modify the same file (commonly `src/main.ts`):
1. Stop before blindly overwriting.
2. Tell the user both add-ons touch the file, summarise what each one wants, and ask how to merge.
3. Prefer a merge that keeps both sets of wiring working (e.g. run ASR *and* render an image) over "last one wins."

Only silently proceed when an add-on writes a file the other add-ons don't touch (e.g. `src/asr/stt.ts` is ASR-only; `src/image/renderer.ts` is image-only).

Each add-on file follows the same structure:

```
### A. Dependencies           # npm install lines (optional)
### B. app.json permissions   # entries to append to the permissions array (optional)
### C. Environment variables  # .env.example entries (optional)
### D. Source files           # new files to create under src/
### E. Wiring                 # edits to src/main.ts (if any)
### F. Runtime notes          # anything the user needs to know after scaffolding
```

Not every add-on uses every section — skip any section the add-on omits.

---

## Step 10 — Confirm the project structure

Print a summary of the created files and list which add-ons were applied.

---

## app.json Template

If `npx evenhub init` does not produce the file automatically, create `app.json` in the project root with this content (update values to match the project):

```json
{
  "package_id": "com.example.<name>",
  "edition": "202601",
  "name": "<Human-readable app name>",
  "version": "0.1.0",
  "min_app_version": "2.0.0",
  "min_sdk_version": "0.0.10",
  "entrypoint": "index.html",
  "permissions": [],
  "supported_languages": ["en"]
}
```

Field explanations:
- `package_id` — Reverse-domain unique identifier for your app (e.g. `com.acme.myapp`). **No hyphens allowed** — use only lowercase letters and digits in each segment.
- `edition` — Even Hub platform edition the app targets; use `"202601"` for current G2 firmware.
- `name` — Human-readable display name shown in the Even Hub app store / launcher.
- `version` — Semantic version of your app (`MAJOR.MINOR.PATCH`).
- `min_app_version` — Minimum Even Hub companion app version required to run this app.
- `min_sdk_version` — Minimum Even Hub SDK version required (`"0.0.10"` or later).
- `entrypoint` — HTML file Vite serves as the app root; leave as `"index.html"`.
- `permissions` — Array of permission objects (`{ "name": "...", "desc": "..." }`). Use `[]` for apps that need no special permissions. Valid names: `network`, `location`, `g2-microphone`, `phone-microphone`, `album`, `camera`.
- `supported_languages` — ISO 639-1 language codes the app supports.

---

## Next Steps for the user

After scaffolding, tell the user how to run the project:

1. **Start the dev server**

   ```bash
   npm run dev
   ```

2. **Preview in the simulator**

   ```bash
   npx evenhub-simulator http://localhost:5173
   ```

3. **Test on real glasses**

   ```bash
   npx evenhub qr --url http://<your-ip>:5173
   ```

If any add-on was applied, also follow the **Runtime notes** that the add-on printed in Step 9.

---

## Hardware Quick Reference

| Property | Value |
|---|---|
| Display resolution | 576 x 288 px |
| Colour depth | 4-bit greyscale (16 shades of green) |
| Camera | None |
| Speaker | None |
| Connectivity | Bluetooth 5.2 |
| Input | Touchpad on the frame; optional R1 ring controller |

---

## Adding a new add-on

To introduce a new `--with-{feature}` flag:

1. Create `skills/template/addons/{feature}.md` following the A–F structure documented in Step 9.
2. Keep the add-on self-contained: every file it writes, every permission it needs, every `npm install` it requires should be inside that one file.
3. No provider lock-in: if the feature depends on a third-party service, ship the integration as a blank stub with a `// choose your own implementation here` comment. Do **not** hard-code vendor-specific code. The scaffold is infrastructure; the provider is a user choice.
4. Update the README's flag list.

---

## Key Resources

- **SDK package**: [@evenrealities/even_hub_sdk on npm](https://www.npmjs.com/package/@evenrealities/even_hub_sdk)
- **Official docs**: https://hub.evenrealities.com/docs/getting-started/overview
- **Community Discord**: https://discord.gg/Y4jHMCU4sv

---

## Task

Scaffold a new Even Hub G2 project for: $ARGUMENTS
