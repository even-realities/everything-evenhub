# Verification Checklist: cli-reference

Read actual files/output. Do NOT trust the implementer's report.

## 1. Command Syntax (2 items)

- [ ] `evenhub qr` command is shown with its usage/synopsis
- [ ] It is shown that all flags are optional and the command works with no arguments (auto-detects IP)

## 2. Option Flags (9 items)

- [ ] `--url` flag is listed and described
- [ ] `-i` / `--ip` flag is listed and described
- [ ] `-p` / `--port` flag is listed and described
- [ ] `--path` flag is listed and described
- [ ] `--https` flag is listed and described
- [ ] `--http` flag is listed and described
- [ ] `-e` / `--external` flag is listed and described
- [ ] `-s` / `--scale` flag is listed and described
- [ ] `--clear` flag is listed and described

## 3. Behavior Notes (3 items)

- [ ] Auto-detection of local network IP address is mentioned
- [ ] Caching/persistence of previous QR settings between runs is mentioned
- [ ] Hot reload support during development is mentioned

## 4. Usage Examples & Scanning (3 items)

- [ ] At least 2 concrete usage examples are shown (different flag combinations)
- [ ] Scanning with the Even Realities companion app on the user's phone is mentioned
- [ ] The purpose (sideloading onto physical G2 glasses) is clearly stated

## Scoring

- **Total items:** 17
- **Pass threshold:** 17/17 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
