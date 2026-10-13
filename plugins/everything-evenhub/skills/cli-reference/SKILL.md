---
name: cli-reference
description: Even Hub CLI command reference — login, logout, self-check, init, pack, qr, create, upload, update, ls, promote, delist, testers, rm, download. Exit codes, --json output keys, and the checks that run locally before a request is sent. Use when running any CLI command, creating or uploading an app, managing beta testers and channels, or scripting the CLI in CI.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [CLI command or task]
---

# Even Hub CLI Reference

## Installation

```bash
# Install as dev dependency (recommended)
npm install -D @evenrealities/evenhub-cli

# Install globally
npm install -g @evenrealities/evenhub-cli

# Or run without installing via npx
npx @evenrealities/evenhub-cli <command>
```

Current version: **v0.2.0**

When installed as a dev dependency, use `npx evenhub <command>`. When installed globally, `evenhub <command>` or the shorter `eh <command>`.

**`login` needs an interactive terminal** — it prompts for a password. Run it once by hand; every other command reuses the saved credentials and never prompts. Do not try to script `login`.

---

## Account

### `evenhub login`

```bash
evenhub login
evenhub login -e you@example.com
```

| Option | Description |
|---|---|
| `-e, --email <email>` | Skip the email prompt |

Before asking for a password it checks the address has an Even Realities account. One that does not exits **2** saying so — the fix is signing up in the Even Realities app, not another password.

### `evenhub self-check`

```bash
$ evenhub self-check
Account  you@example.com (Developer)
Namespace  2
Next  evenhub ls
```

`--json` keys: `id`, `namespace_id`, `email`, `role`, `username`, `contact_email`. `role` is `0` normal user, `1` developer, `42` admin.

Run this first whenever something exits 2 or 3 — it separates "not signed in" from "signed in as the wrong account".

### `evenhub logout`

Invalidates the refresh token server-side and deletes `credentials.yaml`. The local file goes even if the server call fails, and the output says so.

`--json` keys: `local_removed`, `server_invalidated`.

### Credentials

`~/.config/evenhub/credentials.yaml`, owner-only permissions. `XDG_CONFIG_HOME` wins when set; Windows uses `%APPDATA%`. Beside it: `qr.yaml` (QR cache) and `state.yaml` (upload drafts).

Access tokens refresh automatically. When the refresh token expires too, every command exits **2**.

| Variable | Effect |
|---|---|
| `EVENHUB_BASE_URL` | API base, default `https://hub.evenrealities.com` |
| `EVENHUB_API_URL` | API root directly |
| `EVENHUB_API_DEBUG` | Log each API request and status to stderr |
| `EVENHUB_NPM_REGISTRY` | Registry for the SDK `minAppVersion` lookup |
| `XDG_CONFIG_HOME` | Where credentials, QR and draft state live |

Credentials and drafts are keyed by base URL, so switching environments does not mix them.

**CI:** there is no non-interactive login. Log in once on a workstation, store `credentials.yaml` as a secret file, write it to `$XDG_CONFIG_HOME/evenhub/credentials.yaml` in the job. Give each job its own `XDG_CONFIG_HOME`.

---

## Project

### `evenhub init`

```bash
evenhub init
evenhub init -d ./my-project
evenhub init -o ./config/app.json
```

| Option | Description |
|---|---|
| `-d, --directory <dir>` | Directory to create the file in (default `./`) |
| `-o, --output <path>` | Output file path (overrides `--directory`) |

Scaffolds `app.json` with the `min_app_version` and `min_sdk_version` of the SDK release the CLI shipped against, so a fresh project packs without tripping the floor check. `--json` key: `path`. A file that already exists exits **4**.

### `evenhub qr`

```bash
evenhub qr --url "http://192.168.1.100:5173"
evenhub qr -i 192.168.1.100 -p 5173 --path /my-app
evenhub qr --external
```

| Option | Description |
|---|---|
| `-u, --url <url>` | Full URL (ignores the other URL options) |
| `-i, --ip <ip>` | IP address or hostname |
| `-p, --port <port>` | Port |
| `--path <path>` | URL path |
| `--https` / `--http` | Scheme |
| `-e, --external` | Open the QR as a PNG instead of drawing it in the terminal |
| `-s, --scale <n>` | Scale for the external image (default 4) |
| `--clear` | Clear the cached scheme, IP, port and path |

IP is auto-detected and settings are remembered between runs. `--json` keys: `url`, `path` (with `--external`), `cleared` (with `--clear`).

### `evenhub pack`

```bash
evenhub pack app.json dist -o myapp.ehpk
evenhub pack app.json dist --sdk-ver 0.0.14
evenhub pack app.json dist --check
```

| Argument / Option | Description |
|---|---|
| `<json>` | Path to `app.json` |
| `<project>` | Built output folder (`dist`, `build`, …) |
| `-o, --output <file>` | Output filename (default `out.ehpk`) |
| `--no-ignore` | Include dotfiles |
| `-c, --check` | Check whether the `package_id` is available |
| `--sdk-ver <version>` | SDK release to derive the `min_app_version` floor from |
| `--enforce-manual-version` | Stamp `min_app_version` from `app.json` as written, even below the floor |

`pack` needs no credentials, so it runs before login.

`--json` keys: `path`, `size`, `package_id`, `version`, `min_app_version`, `warnings`. `warnings` is an array even on success — empty is the clean case.

#### `min_app_version` is derived, not authored

At pack time the CLI reads the SDK release's `minAppVersion` from npm and stamps it into the packaged manifest. A stricter value in `app.json` is kept; a looser one is raised. The `app.json` on disk is never modified.

```bash
$ evenhub pack app.json dist --sdk-ver 0.0.14
Stamped out.ehpk (37430 bytes)
min_app_version 2.2.9  (SDK 0.0.14, --sdk-ver)
```

Pass `--sdk-ver` matching the SDK actually bundled. Without it the floor comes from whatever npm tags `latest`, which may be newer than the dependency. If npm is unreachable the CLI warns and falls back to a map bundled at release time — that map is necessarily older than the registry, so pass `--sdk-ver` when packing offline or pack again online.

`--enforce-manual-version` requires `min_app_version` in `app.json`. Below the floor it declares support for app versions whose APIs the build needs, which fails on the device rather than at pack time. Local experiments only.

A failed pack exits non-zero, so a CI packaging step fails the run instead of passing on a missing `.ehpk`.

---

## Apps

All app, build and tester commands read `package_id` from `app.json` in the current directory. Pass `--package-id <id>` to run elsewhere.

### `evenhub create`

Creates the app and its first build in one step.

```bash
evenhub create myapp.ehpk --name "My App" --tagline "One line" --icon icon.png
```

| Option | Description |
|---|---|
| `--name <text>` | Display name, required |
| `--tagline <text>` | Short description, required |
| `--description <text>` | Store description |
| `--description-file <path>` | Read the store description from a file |
| `--icon <file.png>` | 24x24 PNG, see Icon rules |
| `--package-id <id>` | Override `app.json` |
| `--new-draft` | Ignore a cached draft and upload again |

```
App       com.example.myapp created
Build     1.0.0 created (Private)
Draft     fcd6f786-a860-4372-90ed-9f72d9d7d4c3 uploaded
Icon      icon.png
Next      evenhub testers add <email> --package-id com.example.myapp; then evenhub promote 1.0.0 --to beta --package-id com.example.myapp
```

`--json` keys: `package_id`, `draft_id`, `manifest`, `initial_build`, `icon`, `description_applied`, `next`, `warning`. `icon` reads `uploaded` or `default` — `default` means a placeholder was used, which will not pass review.

Package already exists, **exit 4**, stopped at `apps/check` with nothing uploaded:

```json
{"ok":false,"exit":4,"code":null,"message":"Package com.example.myapp already exists.","hint":"Use evenhub upload after bumping the version in app.json and packing again."}
```

### `evenhub update`

Edits the listing of an app that has not been published. Same four listing options as `create`; pass only what changes.

```bash
evenhub update --name "New name"
evenhub update --description-file ./store.md
evenhub update --icon icon.png
```

`--json` keys: `package_id`, `updated` (the field names that changed).

Published or in review, **exit 7**, nothing sent — listing edits go through portal review.

### `evenhub ls`

```bash
evenhub ls                  # every app
evenhub ls --channels       # add beta/public columns
evenhub ls <package_id>     # every build of one app
evenhub ls <package_id> --verbose
```

`--json` keys, apps: `apps`, `total`, `next`. One app: `package_id`, `total`, `review`, `versions`, `app`, `next`.

Bare `ls` is **one request**; `--channels` costs one request per app. In a loop, call `ls --json` once and read `apps`.

Builds come back ordered by semantic version, so `1.0.10` sits above `1.0.9`.

---

## Builds and channels

### `evenhub upload`

```bash
evenhub upload myapp.ehpk -m "What changed"
```

| Option | Description |
|---|---|
| `-m, --changelog <text>` | Required, up to 500 characters |
| `--new-draft` | Ignore a cached draft and upload again |

`--json` keys: `package_id`, `version`, `id`, `status`, `size`, `next`.

Raise `version` in `app.json` and pack again first. Re-uploading an existing version exits **4**, stopped at `versions/draft`.

### `evenhub promote` / `evenhub delist`

```bash
evenhub promote 1.0.1 --to beta
evenhub delist --from beta
```

`promote` handles **beta only**. `--to public` is refused locally with **exit 1** and no request — publishing needs review in the portal. `delist --from` takes `beta` or `public`.

`--json` keys: `package_id`, `branch`, `version`, `next`.

### `evenhub download`

```bash
evenhub download 1.0.1 -o ./build.ehpk
```

Asks for a fresh signed storage URL, then fetches the package from it **without sending credentials**. `--json` keys: `package_id`, `version`, `path`, `size`, `public_key`.

### `evenhub rm`

```bash
evenhub rm 1.0.1                           # one build
evenhub rm --app com.example.myapp --yes   # app and everything under it
```

A build a channel still points at cannot be deleted — **exit 5**, naming the channel. Delist first.

```json
{"ok":false,"exit":5,"code":1020,"message":"version is referenced by branch(es): beta","hint":"Delist the referenced channel before deleting this build."}
```

Deleting an app is irreversible and prompts unless `--yes`. `--json` keys: `package_id`, plus `removed_version` or `removed_app`.

### Resuming an interrupted upload

`create` and `upload` send the package first and commit second. On a second-step failure the draft id, package SHA-256 and base URL go to `~/.config/evenhub/state.yaml`, and re-running the same package reuses the draft — the output says `reused` instead of `uploaded`.

Drafts live **30 minutes** server-side. An older entry, or one for a different account, app or manifest, is discarded and the package is sent again. `--new-draft` always re-sends.

---

## Testers

A tester installs a beta build only when **both** gates hold: their membership is `Active`, and a build is on the `beta` channel.

```bash
evenhub testers                                  # roster and status
evenhub testers --search name@
evenhub testers add a@example.com,b@example.com
evenhub testers add --from ./testers.csv
evenhub testers add a@example.com --reinvite
evenhub testers rm a@example.com
```

| Option | Description |
|---|---|
| `--search <keyword>` | Filter the listing by email |
| `--from <file>` | Read addresses from a file |
| `--reinvite` | Re-send to addresses already Invited or Active |

`--json` keys — list: `package_id`, `testers`, `total`. `add`: `invited`, `skipped`, `reinvited`. `rm`: `removed`.

### Re-running a list is safe

Addresses already `Invited` or `Active` are **skipped by default** and reported:

```json
{"invited":[],"skipped":[{"email":"a@example.com","reason":"Invited"}],"reinvited":[],"ok":true}
```

The server resets any address handed back to it to Pending and issues a new token, voiding the link in the email the tester already has. The default skip is what stops a re-run from breaking everyone's invitation.

`--reinvite` deliberately re-sends and **voids the earlier link**. Use it when a tester lost the mail or the seven days expired, never to "refresh" a list.

### File format

One address per line, or a single-column CSV whose `email` header row is skipped — the same file the portal's Import CSV takes. Addresses are lower-cased and de-duplicated. The whole batch is validated first: one malformed address rejects the file with **exit 9** and leaves the roster untouched.

### States and limits

| Status | Meaning |
|---|---|
| `Invited` | Sent, not yet accepted |
| `Active` | Accepted — the only state that can install |
| `Rejected` | Declined |
| `Expired` | Seven days passed |

A single address can be invited **ten times** per app and branch; the eleventh exits **8**. Testing groups have no size limit. `--reinvite` spends one each time.

---

## Exit codes

One code per failure type. Branch on these, not on message text.

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Usage or argument error |
| 2 | Not signed in, or both tokens expired, or the email has no account |
| 3 | Target does not exist, or this account does not own it |
| 4 | Target already exists |
| 5 | Version is pinned to a channel and cannot be deleted |
| 6 | Icon rejected by the server |
| 7 | App is published or under review; listing edits go through review |
| 8 | Limit reached or rate limited |
| 9 | Local validation failed, nothing was sent |
| 10 | Network or server error |
| 130 | Interrupted |

**Exit 9 means the request was never made** — the input is wrong and retrying it unchanged fails identically. **Exit 10** is the opposite: an in-flight write may have landed, so check state before retrying.

Every authenticated endpoint shares **60 requests per minute per user**. Crossing it exits 8 and the CLI does not retry on its own; wait a minute.

---

## `--json`

Every command takes `--json`. Under it **stdout carries exactly one JSON object and nothing else**; prompts, warnings and progress go to stderr. Success objects carry `"ok": true`.

Failures are JSON too:

```json
{"ok": false, "exit": 5, "code": 1020, "message": "...", "hint": "...", "partial": {}}
```

| Key | Meaning |
|---|---|
| `ok` | `false` on every failure |
| `exit` | The process exit code, repeated |
| `code` | Server error code, or `null` for a local failure |
| `message` | What went wrong |
| `hint` | What to do about it |
| `partial` | Present when a write partly landed; the effects that completed |

Output keys per command are listed with each command above.

---

## Local validation

These run before any request. A failure exits **9** with nothing sent, and the message carries the offending value — fix the input from the message rather than retrying.

| Check | Rule |
|---|---|
| `name` | 1 to 20 characters |
| `tagline` | 1 to 50 characters |
| `description` | 1 to 2000 characters |
| `changelog` | Up to 500 characters |
| Counting | Unicode **code points**, not bytes and not UTF-16 length |
| Normalisation | `\r\n` → `\n`, then trim, then measure |
| `.ehpk` | Extension must be `.ehpk`, at most 100 MB |
| Email | Valid format, at most 200 characters, de-duplicated and lower-cased per batch |
| `package_id` | Reverse domain, at least two segments |
| `promote --to public` | Refused locally |

### Icon rules

The server is stricter than the portal's upload box. All four run locally and name the failing pixel.

1. PNG, at most 1 MB.
2. Exactly 24x24.
3. Every pixel either fully transparent or opaque `#F4F4F4`.
4. Lit pixels in raster-aligned 2x2 blocks: scanning in raster order, each unconsumed lit pixel needs lit neighbours right, below and below-right, and cannot sit in the last row or column.

Colour is checked across the whole image before blocks, so a coloured pixel inside an otherwise valid block is reported at its own coordinate with its colour:

```
icon pixel (11, 13) is #3CFA44; every visible pixel must be opaque #F4F4F4. Nothing was sent.
```

Draw icons on the portal canvas. The CLI takes a finished PNG, it does not draw one. The server stores an SVG generated from the bitmap; the PNG is not kept.

---

## `app.json` Manifest Reference

### Field Table

| Field | Type | Required | Rules |
|---|---|---|---|
| `package_id` | string | Yes | Reverse-domain, lowercase, no hyphens, min 2 segments, each segment starts with a lowercase letter |
| `edition` | string | Yes | Must be `"202601"` |
| `name` | string | Yes | Max 20 characters |
| `version` | string | Yes | Semver `x.y.z` |
| `min_app_version` | string | No | Derived from your SDK at pack time and stamped into the packed manifest. Declare it only to pin a floor stricter than the SDK's |
| `min_sdk_version` | string | Yes | Min SDK version, matching the SDK you build against |
| `entrypoint` | string | Yes | Path to HTML entry relative to build folder |
| `permissions` | array | Yes | Array of permission objects. Can be `[]` |
| `supported_languages` | array | Yes | Valid: `en`, `de`, `fr`, `es`, `it`, `zh`, `ja`, `ko` |

### Template

`evenhub init` writes this with the current floors filled in:

```json
{
  "package_id": "com.example.myapp",
  "edition": "202601",
  "name": "My App",
  "version": "0.1.0",
  "min_sdk_version": "0.0.16",
  "entrypoint": "index.html",
  "permissions": [],
  "supported_languages": ["en"]
}
```

---

## Permissions Format

Permissions is an array of objects. Each object requires:

- `name` (string, required) — permission identifier
- `desc` (string, required) — description, 1-300 characters
- `whitelist` (string[]) — only valid for the `network` permission

**Valid permission names:** `network`, `location`, `g2-microphone`, `phone-microphone`, `album`, `camera`

**Common mistake:** permissions must be an array of objects, NOT a key-value map.

```json
// Correct
"permissions": [
  { "name": "network", "desc": "Access the internet", "whitelist": ["https://api.example.com"] },
  { "name": "location", "desc": "Access device location" }
]

// Wrong — do NOT use a map/object
"permissions": {
  "network": "Access the internet"
}
```

---

## Troubleshooting

### Packing

| Error | Exit | Fix |
|---|---|---|
| `Invalid package id` | 9 | Lowercase reverse-domain, min 2 segments, no hyphens, no uppercase, no leading numbers |
| `name: must be 20 characters or fewer` | 9 | Shorten the name |
| `version: must be in x.y.z format` | 9 | Three-part semver |
| `min_sdk_version: expected string, received undefined` | 9 | Required — add it, matching the installed SDK. `min_app_version` is not: the CLI derives it |
| `SDK version not published on npm` | 9 | `--sdk-ver` names a version npm lacks. No `.ehpk` is written |
| `--enforce-manual-version needs a min_app_version in app.json` | 9 | Add one, or drop the flag |
| `permissions: each permission must be an object` | 9 | Array of objects with `name` + `desc` |
| `supported_languages: invalid language` | 9 | Lowercase ISO codes from the supported set |
| `Entrypoint file not found` | 9 | The file must exist in the build folder |
| `Project folder not found` | 9 | Run `npm run build` first |
| `File must have the .ehpk extension` | 9 | Pass the packed file, not `app.json` |

### Apps, builds and testers

| Error | Exit | Fix |
|---|---|---|
| `Not authenticated or credentials are invalid` | 2 | `evenhub login` in a terminal. Not scriptable |
| `Package ... already exists` | 4 | The app exists — use `upload`, not `create` |
| `Version ... already exists` | 4 | Raise `version` in `app.json` and pack again |
| `data not found` | 3 | Wrong package ID, or the app belongs to another account. Check `evenhub self-check` and `evenhub ls` |
| `version is referenced by branch(es): ...` | 5 | `evenhub delist --from <branch>` first, then delete |
| Icon rejected | 6 or 9 | Rejected locally is 9 with a pixel coordinate; 6 is the server rejecting one that passed locally |
| Listing edit on a published app | 7 | Make it in the portal; it enters the review queue |
| Invitation cap reached | 8 | Ten invitations per address per app and branch |
| Rate limited | 8 | 60 requests a minute. Wait, do not retry immediately |
| `Draft cache entry is expired or does not match ...` | — | Informational; the package is uploaded again |

### The build will not install

Two gates, check both:

```bash
evenhub ls <package_id>              # CHANNEL must read beta
evenhub testers --package-id <pkg>   # the tester must read Active
```

`test version expired` on the phone means one of them is missing. If a tester accepted and the build then vanished, someone ran `--reinvite`, which reset them to Pending.

---

## Task

$ARGUMENTS
