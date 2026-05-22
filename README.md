# Everything EvenHub

Everything EvenHub is an AI coding agent skill set for Even Realities G2 smart glasses app development. It provides 13 AI-assisted skills covering the full development lifecycle — from project scaffolding to UI composition, input handling, device features, simulation testing, font measurement, and SDK/CLI reference lookups.

Works with [Claude Code](https://claude.ai/code) and [Codex CLI](https://developers.openai.com/codex/cli).

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An AI coding agent: [Claude Code](https://claude.ai/code) or [Codex CLI](https://developers.openai.com/codex/cli)

## Installation

### Claude Code

```
/plugin marketplace add even-realities/everything-evenhub
/plugin install everything-evenhub@everything-evenhub
```

To update later:

```
/plugin marketplace update everything-evenhub
```

### Codex CLI

From your terminal (outside Codex):

```bash
codex plugin marketplace add even-realities/everything-evenhub
```

Then restart Codex and open the plugin browser:

```
/plugins
```

Select the `everything-evenhub` marketplace and install. Requires Codex CLI v0.121 or later (April 2026+).

## Invoking Skills

Skills are invoked with a prefix and the skill name:

- Claude Code: `/quickstart my-app`
- Codex CLI: `$quickstart my-app`

The examples below use `/` — substitute `$` if you're on Codex.

## Quick Start

Try these in any session:

```bash
# Scaffold a new G2 app from scratch (blank Vite base)
/quickstart my-weather-app

# Or scaffold from a curated starter template — pick the one closest to what you're building
/template my-reader --text-heavy
/template --asr my-transcription-app
/template --image photo-frame
/template --minimal hello-glasses

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
| Tier 1 — One-Click | `quickstart` | Scaffold a blank G2 app from scratch (Vite + TS + SDK) |
| Tier 1 — One-Click | `template` | Scaffold from a curated starter (`minimal`, `asr`, `image`, `text-heavy`) via degit |
| Tier 1 — One-Click | `build-and-deploy` | Package and publish app to Even Hub |
| Tier 2 — Core Development | `glasses-ui` | Build glasses display UI with containers, text, images, and lists |
| Tier 2 — Core Development | `handle-input` | Handle touchpad gestures, ring input, and lifecycle events |
| Tier 2 — Core Development | `device-features` | Use audio capture, IMU, device info, and local storage |
| Tier 2 — Core Development | `test-with-simulator` | Run and debug your app in the Even Hub Simulator |
| Tier 2 — Core Development | `simulator-automation` | Automate the simulator via its HTTP API — screenshots, input, console logs |
| Tier 2 — Core Development | `font-measurement` | Pixel-accurate text and list measurement matching LVGL firmware rendering |
| Tier 2 — Core Development | `background-state` | Persist plugin state across background/foreground transitions with `setBackgroundState` / `onBackgroundRestore` |
| Tier 3 — Reference | `sdk-reference` | Look up Even Hub SDK APIs and types |
| Tier 3 — Reference | `cli-reference` | Look up Even Hub CLI commands |
| Tier 3 — Reference | `design-guidelines` | G2 display design constraints and best practices |

## Harness Testing

Each skill includes a harness test to verify it produces correct output when used by an AI agent. The harness itself runs in Claude Code (it uses Claude's subagent dispatch). Run a test with:

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
