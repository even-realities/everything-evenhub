# Test Case: cli-reference

## Simulated User Request

"How do I generate a QR code for sideloading my app? What options does the qr command have?"

## Context

- The user has a built Even Hub app and wants to sideload it onto physical G2 glasses via QR code
- They need to know the full CLI syntax for the `evenhub qr` command and all its flags
- They want to understand how to scan the QR code and what dev features (like hot reload) are available

## Output Directory

N/A — this is a reference skill. The implementer produces an explanation, not files.

## Expected Behavior

The skill should guide the agent to:
1. Show the `evenhub qr` command with its full usage signature
2. List every available option flag with descriptions
3. Explain the auto-detection of the local network IP address
4. Explain that previous QR settings are cached between runs
5. Provide at least 2 concrete usage examples (e.g. basic usage, custom IP/port)
6. Explain that the QR code is scanned with the Even Realities companion app on the user's phone
7. Mention that hot reload is supported during development
