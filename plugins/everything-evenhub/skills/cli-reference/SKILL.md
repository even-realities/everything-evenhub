---
name: cli-reference
description: Even Hub CLI command reference — login, init, qr, and pack commands with all options. Use when running CLI commands, generating QR codes, initializing projects, or packaging apps.
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

Current version: **v0.1.11**

When installed as a dev dependency, use `npx evenhub <command>` to run. When installed globally, use `evenhub <command>` directly.

---

## `evenhub login`

Authenticate with your Even Hub account. Credentials are saved locally for future use.

```bash
evenhub login
evenhub login -e your@email.com
```

| Option | Description |
|---|---|
| `-e, --email <email>` | Your account email |

---

## `evenhub init`

Generate a starter `app.json` manifest file.

```bash
evenhub init
evenhub init -d ./my-project
evenhub init -o ./config/app.json
```

| Option | Description |
|---|---|
| `-d, --directory <dir>` | Directory to create file in (default: `./`) |
| `-o, --output <path>` | Output file path (overrides `--directory`) |

---

## `evenhub qr`

Primary development command. Generates a QR code pointing to your local dev server. Auto-detects local IP and remembers previous settings on subsequent runs.

Scan the QR code with the Even Realities App on your phone — the app loads on your glasses with hot reload.

```bash
evenhub qr
evenhub qr --url "http://192.168.1.100:5173"
evenhub qr -i 192.168.1.100 -p 5173 --path /my-app
evenhub qr --url "http://192.168.1.100:5173" -e
```

| Option | Description |
|---|---|
| `-u, --url <url>` | Full URL (ignores other URL options) |
| `-i, --ip <ip>` | IP address or hostname |
| `-p, --port [port]` | Port number |
| `--path <path>` | URL path |
| `--https` | Use HTTPS instead of HTTP |
| `--http` | Use HTTP (default) |
| `-e, --external` | Open QR in external program instead of terminal |
| `-s, --scale <n>` | Scale factor for file output (default: 4) |
| `--clear` | Clear cached scheme, IP, port, and path |

---

## `evenhub pack`

Package your app for distribution on Even Hub.

```bash
evenhub pack app.json dist -o myapp.ehpk
evenhub pack app.json ./build --check
```

| Argument/Option | Description |
|---|---|
| `<json>` | Path to `app.json` manifest |
| `<project>` | Path to built output folder |
| `-o, --output <file>` | Output filename (default: `out.ehpk`) |
| `--no-ignore` | Include hidden files (dotfiles) |
| `-c, --check` | Check if `package_id` is available on Even Hub |
| `--sdk-ver <version>` | SDK version you built against. The CLI reads its `minAppVersion` from npm and stamps it as the `.ehpk` floor. Omit and it resolves whatever npm tags `latest` (CLI 0.1.14+) |
| `--enforce-manual-version` | Stamp `min_app_version` from `app.json` as written, even below the SDK floor. Local testing only; not submittable (CLI 0.1.14+) |

### `min_app_version` is derived, not authored (CLI 0.1.14+)

At pack time the CLI looks up the SDK's `minAppVersion` on npm and stamps it into the packed manifest. If `app.json` declares a higher floor, the stricter value wins; a lower one is raised. The source `app.json` is left untouched.

```bash
evenhub pack app.json dist --sdk-ver 0.0.14
# min_app_version 2.2.9  (SDK 0.0.14, --sdk-ver)
```

SDK 0.0.14 publishes a floor of `2.2.9` - its contextual menu and tap-then-long-press events need bridge APIs only Even App 2.2.9 implements. Pass `--sdk-ver` matching your installed SDK; without it the floor comes from whatever npm tags `latest`, which may be newer than the SDK you bundled. If npm is unreachable the CLI warns and falls back to a bundled map.

A failed pack exits non-zero since 0.1.14, so a CI packaging step fails the run instead of passing on a missing `.ehpk`.

---

## Shell Completions

```bash
evenhub --completion-bash
evenhub --completion-zsh
evenhub --completion-fish
```

---

## `app.json` Manifest Reference

### Field Table

| Field | Type | Required | Rules |
|---|---|---|---|
| `package_id` | string | Yes | Reverse-domain, lowercase, no hyphens, min 2 segments, each segment starts with a lowercase letter |
| `edition` | string | Yes | Must be `"202601"` |
| `name` | string | Yes | Max 20 characters |
| `version` | string | Yes | Semver `x.y.z` |
| `min_app_version` | string | No | Derived from your SDK at pack time (CLI 0.1.14+). Declare it only to pin a stricter floor |
| `min_sdk_version` | string | Yes | Min SDK version (e.g., `"0.0.14"`) |
| `entrypoint` | string | Yes | Path to HTML entry relative to build folder |
| `permissions` | array | Yes | Array of permission objects. Can be `[]` |
| `supported_languages` | array | Yes | Valid: `en`, `de`, `fr`, `es`, `it`, `zh`, `ja`, `ko` |

### Template

```json
{
  "package_id": "com.example.myapp",
  "edition": "202601",
  "name": "My App",
  "version": "0.1.0",
  "min_sdk_version": "0.0.14",
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

## Troubleshooting (`evenhub pack`)

| Error | Fix |
|---|---|
| `Invalid package id` | Lowercase reverse-domain, min 2 segments, no hyphens, no uppercase, no leading numbers |
| `name: must be 20 characters or fewer` | Shorten app name |
| `version: must be in x.y.z format` | Use three-part semver |
| `min_sdk_version: expected string, received undefined` | `min_sdk_version` is required - add it, matching your installed SDK. `min_app_version` is not: the CLI derives it (0.1.14+) |
| `SDK version not published on npm: @evenrealities/even_hub_sdk@<version>` | `--sdk-ver` points at a version npm does not have. No `.ehpk` is written |
| `--enforce-manual-version needs a min_app_version in app.json` | Add one, or drop the flag and let the CLI derive the floor |
| `permissions: each permission must be an object` | Use array of objects with `name` + `desc` fields |
| `supported_languages: invalid language` | Use lowercase ISO codes from the supported set |
| `Entrypoint file not found` | Ensure the file exists in the build folder |
| `Project folder not found` | Run `npm run build` first |

---

## Task

$ARGUMENTS
