# Verification Checklist: test-with-simulator

Read actual files/output. Do NOT trust the implementer's report.

## 1. Installation & Basic Usage (3 items)

- [ ] Installation command shown: `npm install -g @evenrealities/evenhub-simulator`
- [ ] Basic invocation shown: `evenhub-simulator http://localhost:5173` (or equivalent localhost URL form)
- [ ] The `--glow` / `-g` display option is mentioned

## 2. Keyboard Input Mappings (4 items)

- [ ] Up arrow key → scroll up / SCROLL_TOP_EVENT mapping is listed
- [ ] Down arrow key → scroll down / SCROLL_BOTTOM_EVENT mapping is listed
- [ ] A key for single click / CLICK_EVENT is listed
- [ ] A key for double click / DOUBLE_CLICK_EVENT is listed

## 3. Simulator vs Hardware Differences (6 items)

- [ ] At least 3 simulator limitations are listed
- [ ] `onDeviceStatusChanged` is explicitly called out as NOT emitted in the simulator
- [ ] `eventSource` is noted as hardcoded to `1` in the simulator
- [ ] `imuData` (IMU / motion data) is noted as always `null` in the simulator
- [ ] At least one additional difference beyond the three above is mentioned
- [ ] Recommendation to validate on real hardware before deployment is present

## 4. Debugging (1 item)

- [ ] `RUST_LOG=debug` (or equivalent env var) is shown as the way to enable debug logging

## Scoring

- **Total items:** 14
- **Pass threshold:** 14/14 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
