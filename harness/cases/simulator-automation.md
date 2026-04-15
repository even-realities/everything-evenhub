# Test Case: simulator-automation

## Simulated User Request

"I want to automate testing of my Even Hub app using the simulator's HTTP API. Show me how to launch the simulator with automation enabled, take a glasses screenshot, send a click input, and poll console logs for errors."

## Context

- The user has a working Even Hub app running on a local dev server
- They want to write an automation script (Python or shell) that interacts with the simulator programmatically
- They need to understand the RGBA screenshot format, the input API, and console log polling with `since_id`
- They should know about timing considerations (startup delay, wait after input)

## Output Directory

N/A -- this is a reference/guidance skill. The implementer produces an explanation with code examples, not project files.

## Expected Behavior

The skill should guide the agent to:
1. Show the simulator launch command with `--automation-port`
2. Show the health check endpoint (`GET /api/ping`)
3. Explain the glasses screenshot endpoint and RGBA format (alpha channel distinguishes lit vs background pixels)
4. Warn against converting RGBA to RGB (loses alpha information)
5. Show the input endpoint (`POST /api/input`) with valid actions: `up`, `down`, `click`, `double_click`
6. Show the console log endpoint with `since_id` polling pattern
7. Warn that `since_id` must be non-negative (not `-1`)
8. Show the correct first-poll pattern: omit `since_id`, then track `last_id`
9. Mention timing: wait 4+ seconds after launch, ~300ms after input
10. Show the `DELETE /api/console` endpoint with the safety pattern (poll for ready signal before clearing)
