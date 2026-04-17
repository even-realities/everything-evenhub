# Everything EvenHub

Everything EvenHub is a Claude Code skill set for Even Realities G2 smart glasses app development. It provides 12 AI-assisted skills covering the full development lifecycle — from project scaffolding (minimal or flag-driven with opt-in feature add-ons) to UI composition, input handling, device features, simulation testing, font measurement, and SDK/CLI reference lookups.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Claude Code](https://claude.ai/code) CLI installed and authenticated

## Installation

In Claude Code, run:

```
/plugin marketplace add even-realities/everything-evenhub
/plugin install everything-evenhub@everything-evenhub
```

The skills will be available after installation. To update later:

```
/plugin marketplace update everything-evenhub
```

## Quick Start

After installation, try these in any Claude Code session:

```bash
# Scaffold a new G2 app (minimal base)
/quickstart my-weather-app

# Scaffold with opt-in feature add-ons (flag-driven)
/template my-asr-app --with-asr
/template my-gallery-app --with-image
/template my-mixed-app --with-asr --with-image

# Build and package for distribution
/build-and-deploy

# Look up SDK APIs
/sdk-reference createStartUpPageContainer

# Look up CLI commands
/cli-reference evenhub qr

# Get design guidance
/design-guidelines settings screen with 5 options
```

During development, use these skills to implement features:

```bash
# Build glasses display UI
/glasses-ui "show a 3-item menu with a title bar"

# Add input handling
/handle-input "single press cycles screens, double press exits"

# Use hardware features (audio, IMU, storage)
/device-features "toggle microphone recording on click"

# Measure text for pixel-accurate layouts
/font-measurement "size a text container for a long paragraph with 8px padding"

# Test with the simulator
/test-with-simulator "debug my app with glow effect"

# Automate simulator testing
/simulator-automation "take a screenshot and verify text is displayed"
```

## Skills

| Tier | Skill | Description |
|------|-------|-------------|
| Tier 1 — One-Click | `quickstart` | Scaffold a new G2 app from scratch — minimal Vite + TypeScript + SDK base. |
| Tier 1 — One-Click | `template` | Flag-driven cousin of `quickstart`. Same base plus opt-in add-ons via `--with-{feature}` flags (e.g. `--with-asr`, `--with-image`). |
| Tier 1 — One-Click | `build-and-deploy` | Package and publish app to Even Hub |
| Tier 2 — Core Development | `glasses-ui` | Build glasses display UI with containers, text, images, and lists |
| Tier 2 — Core Development | `handle-input` | Handle touchpad gestures, ring input, and lifecycle events |
| Tier 2 — Core Development | `device-features` | Use audio capture, IMU, device info, and local storage |
| Tier 2 — Core Development | `test-with-simulator` | Run and debug your app in the Even Hub Simulator |
| Tier 2 — Core Development | `simulator-automation` | Automate the simulator via its HTTP API — screenshots, input, console logs |
| Tier 2 — Core Development | `font-measurement` | Pixel-accurate text and list measurement matching LVGL firmware rendering |
| Tier 3 — Reference | `sdk-reference` | Look up Even Hub SDK APIs and types |
| Tier 3 — Reference | `cli-reference` | Look up Even Hub CLI commands |
| Tier 3 — Reference | `design-guidelines` | G2 display design constraints and best practices |

## Template Add-ons

The `template` skill is a flag-driven scaffold. Each `--with-{feature}` flag loads a self-contained add-on file from `skills/template/addons/{feature}.md` that layers its permissions, source files, and wiring on top of the base project.

Available flags:

| Flag | Status | What it scaffolds |
|------|--------|-------------------|
| `--with-asr` | Ready | G2 mic → provider-agnostic STT pipeline + companion UI + double-tap-to-exit. STT client ships as a blank stub (`src/asr/stt.ts`) — plug in your own provider. |
| `--with-image` | Placeholder | 1-bit image renderer interface. Stub implementation — the scaffold lays down the file; you complete it. |

No provider lock-in: all third-party integrations are blank stubs labelled "choose your own implementation here." The scaffold provides infrastructure; you choose the vendor.

**Adding a new add-on:** drop a new file at `skills/template/addons/{feature}.md` following the A–F structure documented in `skills/template/SKILL.md`. It immediately becomes available as `--with-{feature}`.

## Harness Testing

Each skill includes a harness test to verify it produces correct output when used by an AI agent. Run a test with:

```
/harness quickstart
```

See [`harness/README.md`](harness/README.md) for details on adding tests for new skills.

## Resources

- [Even Hub Docs](https://hub.evenrealities.com/docs/getting-started/overview)
- SDK: [@evenrealities/even_hub_sdk](https://www.npmjs.com/package/@evenrealities/even_hub_sdk)
- Simulator: [@evenrealities/evenhub-simulator](https://www.npmjs.com/package/@evenrealities/evenhub-simulator)
- CLI: [@evenrealities/evenhub-cli](https://www.npmjs.com/package/@evenrealities/evenhub-cli)
- Community: [Discord](https://discord.gg/Y4jHMCU4sv)

## License

MIT
