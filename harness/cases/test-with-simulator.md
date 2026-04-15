# Test Case: test-with-simulator

## Simulated User Request

"How do I test my Even Hub app with the simulator? What are the keyboard shortcuts and what limitations should I know about?"

## Context

- The user has a working Even Hub project running on a local dev server (e.g. `npm run dev` on port 5173)
- They want to test it without physical glasses hardware
- They need to know how to install and run the simulator, how to simulate button/gesture input, and what behaviours differ from real hardware

## Output Directory

N/A — this is a reference/guidance skill. The implementer produces an explanation, not files.

## Expected Behavior

The skill should guide the agent to:
1. Show the installation command for the simulator npm package
2. Show the basic invocation with a localhost URL
3. List all keyboard shortcuts that map to glasses input events
4. Mention the `--glow` / `-g` display option
5. List the key differences between simulator behaviour and real hardware (at least 3)
6. Specifically call out: `onDeviceStatusChanged` not emitted, `eventSource` hardcoded to 1, `imuData` always null
7. Show how to enable debug logging with `RUST_LOG=debug`
8. Recommend validating on real hardware before submitting for deployment
