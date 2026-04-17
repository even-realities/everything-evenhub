# ASR Add-on (`--with-asr`)

Scaffolds a **live speech-to-text** demo on G2: microphone audio → your chosen STT provider → transcript rendered on the glasses and mirrored in the companion-app WebView. Includes double-tap-to-exit wiring.

The audio pipeline, UI, and event handling are all built out. The STT client itself is a **blank stub** — you plug in whichever provider you prefer. No vendor code is included.

---

### A. Dependencies

No extra npm packages are needed for the scaffold itself. If your chosen STT provider ships an SDK, install it yourself after scaffolding.

---

### B. `app.json` permissions

Append these two entries to the `permissions` array in `app.json`:

```json
{ "name": "g2-microphone", "desc": "Capture audio from the glasses mic for live transcription." },
{
  "name": "network",
  "desc": "Stream audio to your chosen speech-to-text service.",
  "whitelist": []
}
```

Fill in `whitelist` with your provider's hosts once you choose one (e.g. `["https://api.example.com", "wss://stream.example.com"]`). Leave empty until then — the companion app will block outbound traffic until you add the hosts.

---

### C. Environment variables

Write `.env.example` at the project root:

```
# API key for your chosen speech-to-text provider.
# Copy this file to `.env.local` and fill in your key. Never commit `.env.local`.
VITE_STT_API_KEY=
```

Vite's default `.gitignore` already excludes `*.local` — verify before committing.

---

### D. Source files

Create the following files under `src/`. Every file below is scaffolded to compile and run; you fill in the STT provider logic in `stt.ts`.

---

**`src/asr/stt.ts`** — provider-agnostic STT interface. Ship this as a **blank stub**; the user picks a provider and implements the three functions themselves.

```typescript
// Speech-to-text client for the G2 microphone.
//
// The G2 mic emits PCM s16le @ 16 kHz, mono via `bridge.audioControl(true)`.
// Each onEvenHubEvent callback with `audioEvent.audioPcm` delivers a chunk.
//
// ─────────────────────────────────────────────────────────────────────
// choose your own implementation here
// ─────────────────────────────────────────────────────────────────────
// Pick whichever STT provider you prefer — streaming or batch, hosted
// or self-hosted — and implement the three functions below. The rest
// of the scaffold (main.ts, ui.ts) already wires the mic into
// `sendPcm` and renders whatever `onSnapshot` emits.
//
// Treat each snapshot as a full transcript state, not a delta:
//   - finalText: text the provider is confident about
//   - interimText: unstable tail that may still change
//   - finished: true on the terminal message, after which no more
//     snapshots will be emitted
// ─────────────────────────────────────────────────────────────────────

export interface SttSnapshot {
  finalText: string
  interimText: string
  finished: boolean
}

export interface SttClient {
  sendPcm(chunk: Uint8Array): void
  close(): void
}

export function startSttStream(
  _apiKey: string,
  _onSnapshot: (snap: SttSnapshot) => void,
  _onError?: (err: unknown) => void,
): SttClient {
  throw new Error(
    'STT provider not implemented — open src/asr/stt.ts and wire up your chosen STT service.',
  )
}
```

---

**`src/ui.ts`** — minimal companion-app UI: status chip + live transcript mirror.

```typescript
type Status = 'connecting' | 'listening' | 'error'

let statusEl: HTMLDivElement
let finalEl: HTMLSpanElement
let interimEl: HTMLSpanElement

export function mountUi() {
  const app = document.querySelector<HTMLDivElement>('#app')!
  app.innerHTML = `
    <main class="panel">
      <header>
        <h1>ASR Demo</h1>
        <div id="status" class="status status-connecting">Connecting…</div>
      </header>
      <section class="transcript" aria-live="polite">
        <span id="final"></span><span id="interim" class="interim"></span>
      </section>
      <footer>Double-tap the glasses temple to exit.</footer>
    </main>
  `
  statusEl = app.querySelector<HTMLDivElement>('#status')!
  finalEl = app.querySelector<HTMLSpanElement>('#final')!
  interimEl = app.querySelector<HTMLSpanElement>('#interim')!
  injectStyles()
}

export function setStatus(kind: Status, text: string) {
  if (!statusEl) return
  statusEl.className = `status status-${kind}`
  statusEl.textContent = text
}

export function setTranscript(finalText: string, interimText: string) {
  if (!finalEl) return
  finalEl.textContent = finalText
  interimEl.textContent = interimText
}

function injectStyles() {
  const css = `
    :root { color-scheme: dark; }
    html, body { margin: 0; height: 100%; background: #0a0a0a; color: #e6e6e6;
      font: 16px/1.4 -apple-system, BlinkMacSystemFont, 'Helvetica Neue', system-ui, sans-serif;
      touch-action: manipulation; -webkit-text-size-adjust: 100%;
      overscroll-behavior: none; }
    #app { display: flex; height: 100%; }
    .panel { display: flex; flex-direction: column; gap: 16px;
      width: 100%; max-width: 640px; margin: 0 auto; padding: 24px; box-sizing: border-box; }
    header { display: flex; align-items: center; justify-content: space-between; }
    h1 { font-size: 18px; font-weight: 600; margin: 0; letter-spacing: 0.02em; }
    .status { font-size: 12px; padding: 4px 10px; border-radius: 999px;
      border: 1px solid transparent; letter-spacing: 0.04em; text-transform: uppercase; }
    .status-connecting { color: #a0a0a0; border-color: #333; }
    .status-listening  { color: #3cfa44; border-color: #1f6b24; background: rgba(60,250,68,0.06); }
    .status-error      { color: #ff6b6b; border-color: #5a1f1f; background: rgba(255,107,107,0.06); }
    .transcript { flex: 1; overflow: auto; background: #141414; border: 1px solid #262626;
      border-radius: 12px; padding: 20px; font-size: 18px; line-height: 1.5;
      min-height: 180px; white-space: pre-wrap; word-break: break-word; }
    .interim { color: #8a8a8a; }
    footer { font-size: 12px; color: #707070; text-align: center; }
  `
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}
```

---

### E. Wiring (`src/main.ts`)

Overwrite the base `src/main.ts` from Step 8 with:

```typescript
import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  TextContainerUpgrade,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'
import { startSttStream } from './asr/stt'
import { mountUi, setStatus, setTranscript } from './ui'

mountUi()

const API_KEY = import.meta.env.VITE_STT_API_KEY as string
if (!API_KEY) {
  setStatus('error', 'VITE_STT_API_KEY not set — copy .env.example to .env.local')
  console.warn('VITE_STT_API_KEY is not set.')
}

const bridge = await waitForEvenAppBridge()

const transcript = new TextContainerProperty({
  xPosition: 0,
  yPosition: 0,
  width: 576,
  height: 288,
  borderWidth: 0,
  borderColor: 5,
  paddingLength: 4,
  containerID: 1,
  containerName: 'transcript',
  content: 'Listening…',
  isEventCapture: 1, // required so the container receives click/double-click events
})

const created = await bridge.createStartUpPageContainer(new CreateStartUpPageContainer({
  containerTotalNum: 1,
  textObject: [transcript],
}))
if (created !== 0) {
  setStatus('error', `createStartUpPageContainer failed: ${created}`)
  console.error('Failed to create startup page')
}

let lastRender = ''
let renderTimer: number | null = null
let currentContent = 'Listening…'

function scheduleGlassesRender() {
  if (renderTimer !== null) return
  renderTimer = window.setTimeout(async () => {
    renderTimer = null
    if (currentContent === lastRender) return
    lastRender = currentContent
    await bridge.textContainerUpgrade(new TextContainerUpgrade({
      containerID: 1,
      containerName: 'transcript',
      content: currentContent,
    }))
  }, 120) // debounce display writes — BLE render queue is slow
}

const stt = startSttStream(
  API_KEY,
  ({ finalText, interimText }) => {
    const combined = (finalText + interimText).trim()
    currentContent = combined ? combined.slice(-240) : 'Listening…'
    setTranscript(finalText, interimText)
    scheduleGlassesRender()
  },
  err => {
    setStatus('error', `STT error: ${(err as Error)?.message ?? err}`)
    console.error('STT error:', err)
  },
)

await bridge.audioControl(true)
setStatus('listening', 'Microphone live · double-tap the temple to exit')

let cleanedUp = false
function cleanup() {
  if (cleanedUp) return
  cleanedUp = true
  bridge.audioControl(false)
  stt.close()
  unsubscribe()
}

const unsubscribe = bridge.onEvenHubEvent(event => {
  const pcm = event.audioEvent?.audioPcm
  if (pcm) stt.sendPcm(pcm)

  const sys = event.sysEvent
  if (!sys) return
  const eventType = OsEventTypeList.fromJson(sys.eventType)
  if (eventType === OsEventTypeList.DOUBLE_CLICK_EVENT) {
    // Show the system exit confirmation dialog. The user can still cancel;
    // if they confirm, SYSTEM_EXIT_EVENT fires and we clean up there.
    bridge.shutDownPageContainer(1)
    return
  }
  if (eventType === OsEventTypeList.SYSTEM_EXIT_EVENT ||
      eventType === OsEventTypeList.ABNORMAL_EXIT_EVENT) {
    cleanup()
  }
})

window.addEventListener('beforeunload', cleanup)
```

Notice that this file will **throw at runtime** until the user implements `src/asr/stt.ts`. That's intentional — the error message points them at the right file. The rest of the scaffold (audio capture, glasses render, event wiring) is already working.

---

### F. Runtime notes

Print these to the user after scaffolding:

- Open **`src/asr/stt.ts`** and wire up your preferred STT provider. Until you do, the app will throw on startup with a message pointing you at that file.
- Copy **`.env.example` → `.env.local`** and paste your provider's API key into `VITE_STT_API_KEY`.
- Add your provider's WebSocket / HTTP hosts to the `network` permission's `whitelist` in **`app.json`**. The companion app blocks outbound traffic to un-whitelisted hosts.
- The G2 mic emits **PCM s16le @ 16 kHz, mono**. Most providers accept this format directly. Resample if yours doesn't.
- On first run the G2 prompts the wearer to grant mic access.
- Display updates are debounced to 120 ms because the BLE render queue can't keep up with per-token writes.
- The companion app shows a live mirror of the transcript and a status chip.
- **Double-tap the temple** to bring up the system exit confirmation dialog.
