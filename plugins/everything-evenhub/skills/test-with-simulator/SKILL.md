---
name: test-with-simulator
description: Test and debug Even Hub G2 apps using the desktop simulator — launch, configure, debug, take screenshots, and understand simulator vs hardware differences. Use when testing apps without physical glasses.
allowed-tools: [Read, Grep, Glob, Bash, Write, Edit]
argument-hint: [testing task description]
---

> The simulator is a supplement to — not a replacement for — hardware testing.

## Installation

```bash
npm install -g @evenrealities/evenhub-simulator
```

Version: v0.9.0. Cross-platform: macOS, Linux, Windows.

0.9.0 tracks SDK 0.0.14: it renders the five `textColor` brightness levels, draws the contextual menu, and simulates tap then long press. Anything below 0.9.0 does none of the three - check with `evenhub-simulator --version` before trusting a green run on those features.

## Basic Usage

```bash
evenhub-simulator http://localhost:5173
evenhub-simulator -g http://localhost:5173           # with glow effect
evenhub-simulator -b spring http://localhost:5173    # with spring bounce
evenhub-simulator -c ./my-config.toml http://localhost:5173  # custom config
```

## CLI Reference

| Option | Description |
|---|---|
| `-c, --config <path>` | Path to config file |
| `-g, --glow` | Enable glow effect on glasses display |
| `--no-glow` | Disable glow effect (overrides config) |
| `-b, --bounce <type>` | Bounce animation: `default` or `spring` |
| `--list-audio-input-devices` | List available audio input devices |
| `--aid <device>` | Choose specific audio input device |
| `--no-aid` | Use default audio device (overrides config) |
| `--print-config-path` | Print default config file path and exit |
| `--automation-port <port>` | Start automation HTTP server on this port (e.g. 9898) |
| `--completions <shell>` | Generate shell completions: `bash`, `elvish`, `fish`, `powershell`, `zsh` |
| `-V, --version` | Print version |
| `-h, --help` | Print help |

## Config File Paths

| Platform | Location |
|---|---|
| macOS | `~/Library/Application Support/` |
| Linux | `$XDG_CONFIG_HOME` or `~/.config/` |
| Windows | `{FOLDERID_RoamingAppData}` |

Use `evenhub-simulator --print-config-path` to see the exact path.

## Simulator Inputs

Keyboard and mouse inputs are mapped to glasses gestures:

| Input | Glasses Equivalent |
|---|---|
| Up | Swipe up / scroll up |
| Down | Swipe down / scroll down |
| Click | Single tap |
| Double Click | Double tap |

## Audio Testing

- Sample rate: 16000 Hz
- Format: signed 16-bit little-endian PCM
- Data per event: 100ms (3200 bytes / 1600 samples)
- List devices: `--list-audio-input-devices`
- Select device: `--aid <device-id>`
- Audio data arrives via `event.audioEvent.audioPcm` (Uint8Array)

## Screenshot

Click the simulator display to export an RGBA PNG to the current working directory. The filename is timestamp-based. The file path is shown in stdout and the glasses web inspector console.

## Debugging Tips

- **Raw payload errors**: `RUST_LOG=debug evenhub-simulator <url>` — logs raw payload parse errors
- **Web inspector**: The simulator hosts a WebView — use browser dev tools for console, network, and DOM inspection
- **eventSource**: Hardcoded as `1` (`TOUCH_EVENT_FROM_GLASSES_R`) in the simulator
- **onDeviceStatusChanged**: NOT emitted — profiles are hardcoded in the simulator

## Simulator vs Hardware Differences

| Feature | Simulator | Real Glasses |
|---|---|---|
| `onDeviceStatusChanged` | NOT emitted (hardcoded) | Real-time status updates |
| `eventSource` | Hardcoded as `1` | Actual input source (left/right arm, ring) |
| `imuData` | Always `null` | Real IMU x/y/z data when enabled |
| Font rendering | Approximation | Firmware LVGL font |
| List scrolling | May differ from hardware | Native firmware scroll |
| Image memory | No limits enforced | Hardware memory limits apply |
| Error handling | May differ in edge cases | Hardware behavior |
| Text brightness (SDK 0.0.14+) | 5 levels since 0.9.0, not photometrically matched | 5 distinct brightness levels |
| Contextual menu (SDK 0.0.14+) | Drawn and navigable since 0.9.0; system slots may differ | OS renders your action items alongside its own |
| Tap then long press (SDK 0.0.14+) | In the window only since 0.9.0, not over the automation API | `LONG_PRESS_EVENT` / `LONG_PRESS_RELEASE_EVENT` fire |

## Development Implications

- **Layout & logic** — simulator is reliable for iteration
- **List scrolling UX** — verify on hardware before shipping
- **Image memory limits** — enforce size limits in code; simulator does not catch violations
- **Device status flows** — test on hardware only; `onDeviceStatusChanged` never fires in simulator
- **IMU features** — cannot test in simulator; `imuData` is always `null`
- **Multi-input sources** — simulator only emits right-arm touch (`eventSource` = 1)
- **Text brightness** - 0.9.0+ renders the five `textColor` levels, so hierarchy is checkable here; absolute legibility still needs hardware.
- **Contextual menu** - 0.9.0+ draws it, navigates it, and fires `menuItemClickEvent` with your `itemID`. It honours the rebuild contract too: carry `menuObject` forward and the menu returns identical, omit it and your items are cleared. What it can't tell you is which system slots the OS shows alongside your items.
- **Tap then long press** - 0.9.0+ simulates it in the window (holdable control, keyboard shortcut) but the automation API cannot deliver `LONG_PRESS_EVENT` / `LONG_PRESS_RELEASE_EVENT`. Scripted runs skip it; cover it manually or on hardware.

## Typical Workflow

```bash
npm run dev                                    # Start dev server
evenhub-simulator -g http://localhost:5173     # Launch simulator
# Interact via keyboard/mouse
# Click display to take screenshots
# Iterate on code — auto-reloads
# Validate on real hardware before deploy
```

## Shell Completions

```bash
evenhub-simulator --completions zsh > ~/.zsh/completions/_evenhub-simulator
evenhub-simulator --completions bash > /etc/bash_completion.d/evenhub-simulator
evenhub-simulator --completions fish > ~/.config/fish/completions/evenhub-simulator.fish
```

## Task

$ARGUMENTS
