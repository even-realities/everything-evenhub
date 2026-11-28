---
name: widgets
description: Add or update the optional Widget experience of an Even Hub app: Dashboard Card and Expanded layouts, manifest data requests, settings, images and offline previews. Use for Widgets; interactive Plugin UI uses glasses-ui.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [Widget task]
---

# Widgets

An Even Hub app contains a Plugin experience and an optional Widget experience in one `.ehpk`. The Plugin page provides account connection and settings. Widgets display information on the glasses Dashboard, without custom tap actions. Users can expand Card to Expanded. One app provides one Widget.

## Implement

1. Inspect the existing app and build output. Preserve its Plugin experience and identity. Requires Even Realities App 2.5.0+ and `min_sdk_version` 0.0.16+.
2. Start from [assets/layout.json](assets/layout.json) and [assets/manifest.json](assets/manifest.json). For Vite, place them in `public/widget/`; they must build to `dist/widget/` beside the entrypoint. Replace the example backend URL in both endpoint fields.
3. Declare both views. Card is 352×288, Expanded 576×288. Each view has 1 or more containers, at most 8 text and 4 image containers; each image is 1–100 px on both axes. Counts, IDs, names and bounds must validate. IDs and names are unique within a view; repeated names across views share a binding.
4. Text uses fixed size 20, line height 28, top-left alignment, wrapping and clipping. Use heights in multiples of 28. Initial layout text has a 32 UTF-8 byte limit per container, refreshed text 512 bytes. Return formatted display strings from the backend.
5. Map JSON through `data.responseMap`, then `bindings` using `from: data.<field>` or `config.<field>`. `responseMap` paths start with `$`; no expressions or calculations in bindings. Unknown paths render empty. For templates and settings types, read [reference.md](reference.md).
6. Bind settings via `source.localStorage` to the exact SDK storage key. Check `setLocalStorage` succeeds. Missing or invalid required configuration prevents requests; closing settings reloads configuration.

## Data requests

The App initiates requests to `data.endpoint` at `data.interval` (positive integer seconds, clamped to at least 60). Keep matching legacy fields `interval.seconds` and `data.request.url` for upload compatibility. New manifests use `data.interval` / `data.endpoint`; do not add `timer` or `endpoint_notif`.

Use GET with `data.request.query` for packaged apps. The runtime also supports POST with `data.request.body`, but upload validation accepts GET. GET with body or POST with query is invalid. POST preserves numbers, booleans and unjoined arrays. Data requests contain only mapped business parameters, never notification flags or acknowledgment IDs.

Native App networking is independent of WebView CORS. Use HTTPS for release packages. Responses must be 2xx UTF-8 JSON within 256 KB, including base64 images, with a 15-second timeout. App sends `Accept` and `X-EvenHub-Plugin-Version`; with notifications declared and bound glasses it also sends `X-EvenHub-Device-SN`. No automatic Authorization credential is supplied.

GET follows at most five redirects, never HTTPS to HTTP; cross-origin redirects drop `X-EvenHub-` headers. POST does not follow redirects. Settings, foreground and glasses reconnection can trigger data refresh without affecting notification polling. Requests do not overlap. Last successful data survives fetch failures; App must remain running to refresh.

## Images and previews

Images are base64 files in the JSON response, not URLs: PNG, BMP, JPEG, WebP, GIF first frame. Bind with `from`. App scales and center-crops to container dimensions and converts to 16 grayscale levels; transparency is unlit. Missing or invalid live values clear old images. Invalid default images reject the Widget. Prefer exact-size images with clear contrast.

Optional `icon` names a bundled 24×24 status icon. Layout and icon filenames cannot contain separators or `..`. Optional `widget/fixture.json` has `{ "config": {}, "response": {} }`, matching the real response shape. It provides offline selection-preview data; without it, use `defaultData`. Fixture content is not sent to glasses. Initial `defaultData` is sent while live data loads. Neither offline preview sends notifications or acknowledges IDs.

## Verify and package

- Run a LAN-accessible dev server and `evenhub qr --url http://<lan-ip>:5173/`. Verify `/widget/manifest.json` returns JSON.
- Scan in Even Hub → profile → Developer hub → **Widget preview**. Prototype mode opens only the Plugin page. Check both views, default/live data, settings, Reload and Add to Dashboard. Five Dashboard slots are shared with built-in Widgets.
- **The Simulator previews only the Plugin experience; it does not preview Widgets.** QR preview cannot test notifications, even after Dashboard addition.
- Build and inspect the actual package using [build-and-deploy](../build-and-deploy/SKILL.md). Include manifest, layout, any icon and fixture; test installed behavior without the dev server. A successful pack does not prove runtime parsing.
- Use [notifications](../notifications/SKILL.md) only if requested: it adds independent App-managed POST polling through `notify`, with its own endpoint and interval. Data responses containing `notification` are ignored.

Report file changes and which checks ran; distinguish static checks, phone preview and glasses validation. Do not claim device behavior from JSON validation.
