# Image Add-on (`--with-image`)

> **Status: placeholder / TBD.** This file exists as a reference template for building new add-ons. The image display pipeline is not yet implemented — invoking `--with-image` will apply the scaffolding below, but the user will need to complete `src/image/renderer.ts` themselves.

Intended behaviour once implemented: load a bitmap from the app bundle (or from a URL fetched over the companion network), convert it to the G2's 1-bit monochrome format, and render it on the 576x288 display via the SDK's image container APIs.

---

### A. Dependencies

None required for the scaffold. If your implementation needs client-side image processing, install `pngjs`, `sharp`, or similar yourself.

---

### B. `app.json` permissions

Append only if the app will fetch images over the network. For app-bundled images, skip this section.

```json
{
  "name": "network",
  "desc": "Fetch images for display on the glasses.",
  "whitelist": []
}
```

---

### C. Environment variables

None by default.

---

### D. Source files

Create `src/image/renderer.ts` as a blank stub:

```typescript
// Render a bitmap on the G2 display.
//
// The G2 is a 576x288, 4-bit greyscale panel (16 shades of green).
// Typical pipeline:
//   1. Load the source image (PNG/JPG from the bundle or over the network).
//   2. Resize / crop to 576x288 keeping aspect.
//   3. Quantise to 16 grey levels (or 1-bit for maximum contrast).
//   4. Hand the bitmap to the SDK's image container API.
//
// ─────────────────────────────────────────────────────────────────────
// choose your own implementation here
// ─────────────────────────────────────────────────────────────────────
// This file is a placeholder. Decide:
//   - Where does the image come from (bundled asset, remote URL, camera feed from phone)?
//   - How is it quantised (naive threshold, Floyd–Steinberg dither, custom)?
//   - Which SDK method are you using (ImageContainerProperty + createStartUpPageContainer,
//     or container upgrade mid-session)?
// Wire those choices up in the function below.
// ─────────────────────────────────────────────────────────────────────

export interface ImageRenderOptions {
  source: string | ArrayBuffer // URL, data URL, or raw bytes
  x?: number
  y?: number
  width?: number
  height?: number
}

export async function renderImage(_options: ImageRenderOptions): Promise<void> {
  throw new Error(
    'Image renderer not implemented — open src/image/renderer.ts and wire up your chosen image pipeline.',
  )
}
```

---

### E. Wiring

Leave the base `src/main.ts` from Step 8 alone unless the user explicitly asks for an image demo. When a demo flow is defined, this section will be updated to show the exact wiring.

---

### F. Runtime notes

Print to the user after scaffolding:

- `--with-image` currently scaffolds a **placeholder** — `src/image/renderer.ts` throws when called.
- Implement the renderer using the G2 SDK's image container APIs (see the `sdk-reference` skill for the exact surface).
- Until implemented, remove the image-related code paths from `src/main.ts` or catch the thrown error.
