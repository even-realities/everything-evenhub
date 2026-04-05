# evenhub-skills

Claude Code plugin for Even Realities G2 smart glasses app development. Provides 9 AI-assisted skills covering the full development lifecycle — from project setup to UI composition, input handling, device features, simulation testing, and reference lookups.

## Installation

**Marketplace (recommended)**

```
/plugin marketplace add evenhub-skills
```

**Manual clone**

```bash
git clone https://github.com/niceven/evenhub-skills ~/.claude/plugins/evenhub-skills
```

**npm**

```bash
npm install -g @evenrealities/evenhub-skills
```

## Skills

| Tier | Skill | Description |
|------|-------|-------------|
| Tier 1 — One-Click | `quickstart` | Scaffold a new G2 app from scratch |
| Tier 1 — One-Click | `build-and-deploy` | Package and publish app to Even Hub |
| Tier 2 — Core Development | `glasses-ui` | Build glasses display UI with containers, text, images, and lists |
| Tier 2 — Core Development | `handle-input` | Handle touchpad gestures, ring input, and lifecycle events |
| Tier 2 — Core Development | `device-features` | Use audio capture, IMU, device info, and local storage |
| Tier 2 — Core Development | `test-with-simulator` | Run and debug your app in the Even Hub Simulator |
| Tier 3 — Reference | `sdk-reference` | Look up Even Hub SDK APIs and types |
| Tier 3 — Reference | `cli-reference` | Look up Even Hub CLI commands |
| Tier 3 — Reference | `design-guidelines` | G2 display design constraints and best practices |

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
