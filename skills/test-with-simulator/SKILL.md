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

Version: v0.7.1. Cross-platform: macOS, Linux, Windows.

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

## Development Implications

- **Layout & logic** — simulator is reliable for iteration
- **List scrolling UX** — verify on hardware before shipping
- **Image memory limits** — enforce size limits in code; simulator does not catch violations
- **Device status flows** — test on hardware only; `onDeviceStatusChanged` never fires in simulator
- **IMU features** — cannot test in simulator; `imuData` is always `null`
- **Multi-input sources** — simulator only emits right-arm touch (`eventSource` = 1)

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
