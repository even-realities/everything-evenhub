---
name: build-and-deploy
description: Package and deploy an Even Hub G2 app — validate app.json, build, pack into .ehpk, upload it as a build, invite beta testers, and promote it to the beta channel. Use when packaging, deploying, uploading, distributing to testers, putting a build on beta, or submitting an Even Hub app.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [task description]
---

You are packaging an Even Hub G2 app for distribution. Follow the steps below carefully, validating each stage before proceeding.

## Packaging Workflow

Follow these steps in order:

### Step 1 — Validate app.json

1. Locate `app.json` in the project root.
2. Read the file and validate every field against the field reference below.
3. If any field is missing, has the wrong type, or fails a validation rule, report the exact error and fix it (with user confirmation if the fix changes meaningful values like `package_id` or `name`).
4. Do not proceed until `app.json` is valid.

### Step 2 — Build

Run the build command from the project root:

```bash
npm run build
```

Check that the build succeeds (exit code 0) and that the output folder (typically `dist/`) exists and is non-empty.

### Step 3 — Pack into .ehpk

Run the pack command, substituting the app name for `<name>`:

```bash
npx evenhub pack app.json dist -o <name>.ehpk
```

Use the value of the `name` field from `app.json` (lowercased, spaces replaced with hyphens) as `<name>`. For example, if `name` is "Weather Now", use `weather-now.ehpk`.

**Exit 0** continues. **Exit 9** means local validation failed and nothing was written — read the message, fix `app.json` or the build folder, and run again. Do not retry an unchanged command on exit 9; it fails identically.

### Step 4 — Verify output

Confirm the `.ehpk` file was created:

```bash
ls -lh <name>.ehpk
```

If the file is missing, check the error output from the pack command and consult the troubleshooting table below.

### Step 5 — Distribute

The CLI covers upload, testers and the beta channel. Review and store publication stay in the portal.

**5a. Send the build.** First version of a brand-new app:

```bash
npx evenhub create <name>.ehpk --name "<display name>" --tagline "<one line>" --icon icon.png
```

Every version after that:

```bash
npx evenhub upload <name>.ehpk -m "<what changed>"
```

**Exit 0** continues. **Exit 2** means nobody is signed in — stop and tell the user to run `evenhub login` in a terminal themselves; it prompts for a password and cannot be scripted. **Exit 4** on `create` means the app already exists, so use `upload`; on `upload` it means that version number is taken, so raise `version` in `app.json` and go back to Step 2. **Exit 9** is a rejected field or icon, with the offending value in the message. **Exit 11** means the app or build was created and a local step after it failed; `partial` names what exists, so repair the local step instead of running the command again.

**5b. Invite the testers.**

```bash
npx evenhub testers add <email>[,<email>...]
```

Addresses already `Invited` or `Active` are skipped and reported, so re-running a roster is safe. Only `--reinvite` re-sends, and only to `Invited` addresses, voiding the link in the tester's earlier email - do not pass it unless the user asked for a re-send. An `Active` member stays skipped even then, since an accepted membership has no invitation link to replace.

**Exit 8** means an address hit its ten-invitation cap. **Exit 9** means one address in the batch was malformed and none were sent.

**5c. Put the build on beta.**

```bash
npx evenhub promote <version> --to beta
```

Beta is the only channel the CLI handles. `--to public` is refused locally with **exit 1** and sends nothing: publishing needs review. When the user asks to publish, stop here and point them at the portal — Builds tab, the build's `Private` tag, then Submit for review.

### Step 6 — Confirm it can actually be installed

Two gates have to hold at once, and a build that fails either shows as **test version expired** on the phone. Check both before telling the user it is done:

```bash
npx evenhub ls <package_id>              # CHANNEL must read beta
npx evenhub testers --package-id <pkg>   # the tester must read Active
```

If the tester is still `Invited`, they have not opened the invitation email yet — that is theirs to do, not something to fix by re-inviting.

Installing on the phone stays manual: the tester opens the Even Realities App, **Me → Beta tester**, and taps Install. There is no scripted install.

---

## app.json Field Reference

Every field is required unless noted. Validate each field before running `evenhub pack`.

| Field | Type | Required | Validation rules |
|---|---|---|---|
| `package_id` | string | yes | Reverse-domain format (e.g. `com.example.myapp`). Lowercase letters and digits only — no hyphens, no uppercase, no underscores. Minimum 2 dot-separated segments. Each segment must start with a lowercase letter and contain only lowercase letters or digits. |
| `edition` | string | yes | Must be exactly `"202601"`. |
| `name` | string | yes | Maximum 20 characters. |
| `version` | string | yes | Semver format `x.y.z` — three numeric parts separated by dots (e.g. `"1.0.0"`). No `v` prefix, no pre-release suffixes. |
| `min_app_version` | string | no | Derived from your SDK version at pack time and stamped into the packed manifest. Declare it only to pin a floor stricter than the SDK's. |
| `min_sdk_version` | string | yes | Minimum SDK version required. Match the SDK version you build against (currently `"0.0.16"`). |
| `entrypoint` | string | yes | Path to the entry HTML/JS file, relative to the build output folder. The file must exist inside the build output after `npm run build`. |
| `permissions` | array | yes | Array of permission objects (see Permissions Reference). Can be empty `[]`. Must NOT be a key-value map. |
| `supported_languages` | array | yes | Array of BCP 47 language codes from the supported set. Valid values: `en`, `de`, `fr`, `es`, `it`, `zh`, `ja`, `ko`. |

### Minimal valid app.json example

```json
{
  "package_id": "com.example.weatherapp",
  "edition": "202601",
  "name": "Weather Now",
  "version": "1.0.0",
  "min_sdk_version": "0.0.16",
  "entrypoint": "index.html",
  "permissions": [],
  "supported_languages": ["en"]
}
```

---

## Permissions Reference

`permissions` must be an **array of objects**. Each object has:

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | One of the valid permission names listed below. |
| `desc` | string | yes | Human-readable description, 1–300 characters. |
| `whitelist` | string[] | only for `network` | List of allowed URLs. Required when `name` is `"network"`. |

### Valid permission names

- `network` — outbound network access (requires `whitelist`)
- `location` — device GPS/location data
- `g2-microphone` — microphone on the G2 glasses
- `phone-microphone` — microphone on the paired phone
- `album` — access to the photo album
- `camera` — access to the camera

### Example

```json
"permissions": [
  {
    "name": "network",
    "desc": "Fetches weather data from the API.",
    "whitelist": ["https://api.weather.com"]
  },
  {
    "name": "g2-microphone",
    "desc": "Enables voice commands for hands-free control."
  }
]
```

### Common mistake

Do NOT use a key-value map format:

```json
// WRONG
"permissions": { "network": ["example.com"] }

// CORRECT
"permissions": [{ "name": "network", "desc": "...", "whitelist": ["example.com"] }]
```

---

## CORS in the WebView

The Even App runs your plugin inside a real browser engine (Chromium on Android, WKWebView on iOS). **Full CORS enforcement applies.** The `app.json` network whitelist is an Even-level permission check — it does NOT bypass CORS. You need BOTH:

1. The domain whitelisted in `app.json` `permissions.network.whitelist`, AND
2. The remote API to respond with the correct CORS headers (`Access-Control-Allow-Origin`, etc.)

If the API you're calling doesn't send CORS headers, `fetch()` will fail with a network error even though the domain is whitelisted.

| Scenario | Fix |
|---|---|
| API has CORS headers | Just whitelist the domain in `app.json` — it works |
| API has no CORS headers | Use your own backend, a Cloudflare Worker proxy (free tier), or find a CORS-enabled mirror |
| Dev server (localhost) is blocked by CORS | Add a Vite proxy in `vite.config.ts` — see below |

### Vite dev proxy

Use a Vite proxy to avoid CORS during local development:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
```

This proxy only works in dev. For the production `.ehpk`, the WebView makes requests directly — your API must have CORS headers, or you must route through your own proxy.

### Free CORS proxy services are unreliable

Public proxies like `corsproxy.io`, `allorigins.win`, and `api.codetabs.com` go down, return 403s, or timeout without warning. If your app depends on a third-party API without CORS, deploy your own Cloudflare Worker (free tier, ~5 min setup) or find a mirror that serves CORS headers natively.

---

## evenhub pack Options

```
npx evenhub pack <app.json> <build-folder> [options]
```

| Option | Description |
|---|---|
| `-o <file>` / `--output <file>` | Output filename. Defaults to `out.ehpk` if not specified. |
| `--no-ignore` | Include dotfiles and other normally-ignored files in the package. |
| `-c` / `--check` | Check whether the `package_id` is available on the Even Hub store before packing. |
| `--sdk-ver <version>` | SDK version you built against. The CLI reads that release's `minAppVersion` from npm and stamps it as the package's `min_app_version` floor. |
| `--enforce-manual-version` | Stamp `min_app_version` from `app.json` as written, even below the SDK floor. Local testing only; the result is not submittable. |

`min_app_version` is derived, not authored. At pack time the CLI resolves the SDK's
`minAppVersion` from npm and stamps it in; a stricter value in `app.json` is kept, a
looser one is raised. Pass `--sdk-ver` matching your installed SDK - omitted, the CLI
reads whatever npm tags `latest`, which may be newer than what you bundled. If npm is
unreachable the CLI warns and falls back to a map bundled at release time, which is
necessarily older than the registry.

A failed pack exits non-zero, so a packaging step in CI fails the run rather than
passing on a missing `.ehpk`.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `Invalid package id` | Use lowercase reverse-domain format with a minimum of 2 dot-separated segments. No hyphens, no uppercase letters, no underscores, no segments starting with a digit. Example: `com.example.myapp`. |
| `name: must be 20 characters or fewer` | Shorten the `name` value in `app.json` to 20 characters or fewer. |
| `version: must be in x.y.z format` | Use a three-part numeric semver string such as `"1.0.0"`. Do not use `"1.0"`, `"v1.0.0"`, or pre-release tags. |
| `SDK version not published on npm: @evenrealities/even_hub_sdk@<version>` | `--sdk-ver` names a version npm does not have. Correct it - no `.ehpk` is written. |
| `--enforce-manual-version needs a min_app_version in app.json` | Add `min_app_version`, or drop the flag and let the CLI derive the floor. |
| `min_sdk_version: expected string, received undefined` | `min_sdk_version` is required. Add it to `app.json` (e.g. `"0.0.16"`). |
| `permissions: each permission must be an object with name and desc keys` | `permissions` must be an array of objects, each with `name` and `desc`. See the Permissions Reference above. |
| `supported_languages: invalid language` | Use only the supported lowercase ISO codes: `en`, `de`, `fr`, `es`, `it`, `zh`, `ja`, `ko`. |
| `Entrypoint file not found` | Ensure `entrypoint` in `app.json` points to a file that exists inside the build output folder after running `npm run build`. |
| `Project folder not found` | The build output folder does not exist. Run `npm run build` first, then retry `evenhub pack`. |

---

## Distribution

| Step | Where it runs |
|---|---|
| Create the app, upload a build | `evenhub create` / `evenhub upload` |
| Invite, list and remove testers | `evenhub testers` |
| Put a build on beta, take it off | `evenhub promote --to beta` / `evenhub delist --from beta` |
| Edit the listing of an unpublished app | `evenhub update` |
| Submit for review | Portal only |
| Publish to the store, cancel a review | Portal only |
| Edit the listing of a published app | Portal only, it re-enters review |

A build that has never been promoted is `Private`: only its own developer sees it. Promoting to beta makes it installable by testers whose membership is `Active`, and nobody else — a beta build stays off the public store.

Review and publication are the boundary. When a task reaches "submit" or "publish", stop and hand the user the portal path rather than looking for a command; there is none, and `promote --to public` is refused locally by design.

### Exit codes

Branch on these rather than on message text.

| Code | Meaning | What to do |
|---|---|---|
| 0 | Success | Continue |
| 1 | Usage or argument error | Fix the command |
| 2 | Not signed in | Stop; the user runs `evenhub login` in a terminal |
| 3 | Not found, or not this account's app | Check the package ID with `evenhub ls` |
| 4 | Already exists | `create` → use `upload`; `upload` → raise `version` |
| 5 | Build is pinned to a channel | `evenhub delist --from <branch>` first |
| 6 | Server rejected the icon | Rebuild the icon to the 24x24 `#F4F4F4` 2x2-block rules |
| 7 | Listing edit needs review | Portal only |
| 8 | Limit reached or rate limited | 60 requests a minute; invitations cap at ten per address |
| 9 | Local step failed, server state unchanged | Nothing changed on the server. Fix the input from the message, never retry unchanged |
| 10 | Network or server error | A write may have landed — check state before retrying |
| 11 | A write landed, then a local step failed | `partial` lists what landed. Repair the local step named in the hint rather than replaying the command |

Add `--json` to any command to get one JSON object on stdout with these same codes in an `exit` field, plus `message` and `hint`.

---

## Task

$ARGUMENTS
