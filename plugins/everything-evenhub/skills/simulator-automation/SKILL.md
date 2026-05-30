---
name: simulator-automation
description: >-
  Automate the EvenHub glasses simulator via its HTTP API. Use when testing or
  controlling the simulator programmatically — sending glasses input (up, down,
  click, double click), capturing screenshots, or reading browser console logs.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [automation task description]
---

# EvenHub Simulator Automation

The simulator exposes an HTTP API on localhost when launched with `--automation-port <PORT>`.

```bash
evenhub-simulator https://my-app.example.com --automation-port 9898
```

Base URL: `http://127.0.0.1:<PORT>`

## API Reference

### Health check

```
GET /api/ping
→ "pong"
```

### Glasses screenshot

Returns the current LVGL framebuffer as `image/png` (576×288, RGBA).

```
GET /api/screenshot/glasses
→ image/png binary (RGBA)
```

**RGBA format — critical for image analysis:**
- Background pixels: `(R=0, G=255, B=0, A=0)` — transparent (alpha = 0)
- Lit/text pixels: `(R=0, G=255, B=0, A=255)` — opaque (alpha = 255)

Always work in RGBA mode. Do NOT convert to RGB — it drops the alpha channel and makes
background pixels indistinguishable from text pixels (both appear as pure green).

```python
from PIL import Image
img = Image.open('glasses.png')  # keep as RGBA — do NOT call img.convert('RGB')
pixels = img.load()
# Lit pixel test:
is_lit = lambda px: px[3] > 0   # alpha > 0
```

### Webview screenshot

Captures the main browser webview using html2canvas. Returns `image/png`. May take a few seconds; times out after 10s.

```
GET /api/screenshot/webview
→ image/png binary
```

### Console logs

Returns captured `console.*` output, uncaught exceptions, unhandled promise rejections, and failed `fetch` calls from the main webview.

```
GET /api/console
→ { "entries": [...], "total": N }
```

Each entry:
```json
{ "id": 0, "level": "log|warn|error|info|debug|trace", "message": "...", "ts": 1712150400000 }
```

Prefixes for non-console sources:
- `[uncaught] ...` — uncaught exception
- `[unhandledrejection] ...` — unhandled promise rejection
- `[fetch] ...` — failed fetch (non-ok status or network error)

**Poll for new entries only:**
```
GET /api/console?since_id=42
→ entries with id > 42
```

**`since_id` must be a non-negative integer.** Passing a negative value (e.g. `-1`) causes
the server to return an error, not an empty list. For the first poll, omit the parameter
entirely to retrieve all current entries, then track `last_id` from the response:

```python
# First poll — no since_id
resp = requests.get(f"{BASE_URL}/api/console")
entries = resp.json()["entries"]
last_id = max((e["id"] for e in entries), default=0)

# Subsequent polls
resp = requests.get(f"{BASE_URL}/api/console?since_id={last_id}")
```

**Clear the buffer:**
```
DELETE /api/console
```

**Timing caution:** Startup logs (e.g. a "ready" signal) are emitted once and lost if
you clear the buffer before reading them. Pattern: poll for the ready signal first,
then clear if needed.

```python
# Safe: check for ready signal BEFORE clearing
poll_until(target="APP_READY")
requests.delete(f"{BASE_URL}/api/console")  # only if you need a clean slate after
```

### Glasses input

Send a touchpad action to the glasses display.

```
POST /api/input
Content-Type: application/json

{ "action": "up" | "down" | "click" | "double_click" }
```

Response: `{ "ok": true }`

Actions map to the glasses touchpad:
- `up` / `down` — scroll through list items or text
- `click` — select the current item
- `double_click` — triggers a system-level double-click event (typically "back" or "dismiss")

## Automation workflow

1. **Verify the server is running:** `GET /api/ping`
2. **Poll for app ready** (without clearing console first): look for a known log message.
3. **Observe:** Use `/api/screenshot/glasses` (RGBA) or `/api/console` to check state.
4. **Act:** Send input via `POST /api/input`. After each action, wait briefly (~300ms) then confirm state changed.
5. **Iterate:** Use `since_id` when polling console to avoid re-reading old entries.

## Tips

- The glasses display is 576×288 pixels, monochrome green. Screenshots are RGBA PNGs.
- Input only works when the app has created an active event container. If no container is active, input is silently ignored.
- `double_click` is typically used to go back or dismiss the current view.
- Allow 4+ seconds after launching the simulator before polling — SDK init and `createStartUpPageContainer` take time.

## Task

$ARGUMENTS
