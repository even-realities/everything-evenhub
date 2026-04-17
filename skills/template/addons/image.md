# Image Add-on (`--with-image`)

> **Status: placeholder / TBD.** This file exists as a reference template for building new add-ons. The image display pipeline is not yet implemented — invoking `--with-image` will apply the scaffolding below, but the user will need to complete `src/image/renderer.ts` themselves.

Intended behaviour once implemented: load a bitmap from the app bundle (or from a URL fetched over the companion network) and render it on the 576x288 display via the SDK's image container APIs. The SDK handles grayscale conversion internally, so client-side preprocessing (dithering, explicit quantisation, thresholding) is **optional** — apply it when you want more control over how the image looks on the 16-shade panel, skip it when the SDK's default conversion is good enough.

---

### A. Dependencies

None required for the scaffold. If your implementation needs client-side image processing, install `pngjs`, `sharp`, or similar yourself.

---

### B. `app.json` permissions

**Do not append anything by default.** If your implementation fetches images over the network, add a `network` permission at that point with a non-empty `whitelist` (empty whitelists fail `evenhub pack` validation). If the app uses bundled images only, skip this entirely. Example once you know the hosts:

```json
{ "name": "network", "desc": "Fetch images for display on the glasses.", "whitelist": ["https://cdn.example.com"] }
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
// The SDK handles grayscale conversion internally via updateImageRawData, so
// you can hand it a colour PNG/JPG as-is. Minimum viable pipeline:
//   1. Load the source image (bundled asset or network fetch).
//   2. Resize / crop to the target container dimensions if needed.
//   3. Hand the bitmap to the SDK's image container API.
//
// ─────────────────────────────────────────────────────────────────────
// choose your own implementation here
// ─────────────────────────────────────────────────────────────────────
// This file is a placeholder. Decide:
//   - Where does the image come from (bundled asset, remote URL, camera feed from phone)?
//   - Do you preprocess? Client-side dithering (Floyd–Steinberg, Bayer) or custom
//     thresholding is OPTIONAL — apply only if the SDK's default grayscale
//     conversion produces muddy results for your source material.
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
- Since Section E above does not wire `renderImage()` into `src/main.ts`, the thrown error is dormant until you call it yourself. No runtime crash until you integrate it.
