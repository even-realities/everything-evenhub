# Test Case: quickstart

## Simulated User Request

"Create an Even Hub app called demo-glasses"

## Context

- The user wants a new Even Hub G2 project from scratch
- No specific framework preference (use default vanilla-ts)
- Standard permissions (none needed for a demo)

## Output Directory

`harness/.output/quickstart/`

The implementer should create the project at `harness/.output/quickstart/demo-glasses/`.

## Expected Behavior

The skill should guide the agent to:
1. Scaffold a Vite + TypeScript project named "demo-glasses"
2. Install SDK, CLI, and simulator
3. Generate and correct app.json
4. Write starter code in src/main.ts
5. Clean up Vite boilerplate files
6. Print next steps (dev server, simulator, QR)
