# Even G2 Soniox + Convex Realtime Translation PoC

This example demonstrates the split-path architecture:

- Fast path: Even G2 microphone PCM streams to a local Node WebSocket relay, which streams to Soniox and relays token events straight back to the active glasses UI.
- Durable path: the relay batches finalized Soniox tokens into transcript chunks and persists them to Convex.
- Sync path: the web dashboard subscribes to Convex with a reactive query, so another tab/device can replay finalized history without connecting to Soniox.

The relay is intentionally outside the browser so `SONIOX_API_KEY` is never exposed. It uses Soniox realtime `pcm_s16le` because G2 audio events are already 16 kHz signed 16-bit little-endian mono PCM.

## Files

- `src/main.ts` - active G2 app and browser dashboard.
- `src/glasses.ts` - EvenHub bridge setup, text containers, microphone control, and input cleanup.
- `server/index.ts` - backend relay from browser WebSocket to Soniox WebSocket plus Convex persistence.
- `convex/schema.ts` - `sessions` and `transcriptChunks` tables.
- `convex/transcripts.ts` - session lifecycle, chunk ingest, and history query functions.

## Setup

```bash
cd examples/soniox-convex-translation
npm install
cp .env.example .env.local
```

Fill in:

```bash
SONIOX_API_KEY=...
CONVEX_URL=...
VITE_CONVEX_URL=...
VITE_RELAY_WS_URL=ws://<your-computer-lan-ip>:8787/soniox
```

For simulator-only testing on the same machine, `ws://localhost:8787/soniox` is fine. For real glasses, use your computer's LAN IP because the companion app cannot reach your laptop's `localhost`.

## Run

Terminal 1:

```bash
npx convex dev
```

Terminal 2:

```bash
npm run relay
```

Terminal 3:

```bash
npm run dev
```

Then test with the simulator:

```bash
npx evenhub-simulator -g http://localhost:5173
```

Or sideload to glasses:

```bash
npx evenhub qr --url http://<your-computer-lan-ip>:5173
```

## Behavior

- Single press toggles the G2 microphone.
- Double press opens the system exit dialog and asks the relay to finish the Soniox stream.
- The active display updates from direct Soniox token events.
- Convex only receives finalized, batched chunks, not every partial token.

## Multi-device viewer

Open a second tab as a passive subscriber that does not start a relay, microphone, or Soniox stream:

```text
http://localhost:5173/?viewer=1&session=<sessionId>
```

Copy the active device's `Session` value into `<sessionId>`. The viewer only subscribes to Convex finalized chunks, demonstrating the durable-sync path independently of the fast path.

## Notes

This PoC uses a Node relay rather than putting the bidirectional streaming transport inside Convex. Convex remains the persistence and synchronization layer; the relay owns the low-latency WebSocket path and Soniox credentials.
