# Verification Checklist: simulator-automation

Read actual files/output. Do NOT trust the implementer's report.

## 1. Launch and Health Check (3 items)

- [ ] Simulator launch command includes `--automation-port <PORT>` flag
- [ ] Base URL format is shown as `http://127.0.0.1:<PORT>`
- [ ] Health check endpoint `GET /api/ping` is shown with expected response `"pong"`

## 2. Glasses Screenshot (3 items)

- [ ] Screenshot endpoint `GET /api/screenshot/glasses` is shown
- [ ] RGBA format is explained: background pixels have `alpha = 0`, lit/text pixels have `alpha = 255`
- [ ] Warning against converting RGBA to RGB is present (both appear as green, losing the alpha distinction)

## 3. Input API (3 items)

- [ ] Input endpoint `POST /api/input` with JSON body `{ "action": "..." }` is shown
- [ ] All four valid actions are listed: `up`, `down`, `click`, `double_click`
- [ ] At least one action is explained with its glasses touchpad mapping (e.g., `click` = select current item)

## 4. Console Log Polling (5 items)

- [ ] Console endpoint `GET /api/console` is shown with response shape `{ "entries": [...], "total": N }`
- [ ] `since_id` query parameter is explained for incremental polling
- [ ] Warning that `since_id` must be non-negative (not `-1`) is present
- [ ] Correct first-poll pattern: omit `since_id` on initial request, then track `last_id` from response
- [ ] `DELETE /api/console` is shown for clearing the buffer

## 5. Timing and Workflow (3 items)

- [ ] Startup delay is mentioned: wait 4+ seconds after launching the simulator
- [ ] Post-input delay is mentioned: wait briefly (~300ms) after sending input before checking state
- [ ] The safe console-clear pattern is shown: poll for ready signal before clearing (not clear-then-poll)

## 6. Automation Workflow (2 items)

- [ ] A recommended workflow sequence is presented (launch, verify, observe, act, iterate)
- [ ] At least one complete code example or script snippet is provided demonstrating the automation flow

## Scoring

- **Total items:** 19
- **Pass threshold:** 19/19 (all must pass)
- For each FAIL: explain what's wrong and whether it's an agent error or a skill guidance gap
- **Skill improvement suggestions:** list any changes to the SKILL.md that would prevent the failure
