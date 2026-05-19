import { ConvexClient } from "convex/browser";
import { anyApi } from "convex/server";
import { readConfig } from "./config";
import { GlassesDisplay } from "./glasses";
import { TokenBuffer } from "./tokenBuffer";
import type { AppConfig, RelayMessage, TranscriptChunk } from "./types";
import "./style.css";

const SYS_CLICK_EVENT = 0;
const SYS_DOUBLE_CLICK_EVENT = 3;
const SYS_FOREGROUND_EXIT_EVENT = 5;

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root.");
const appRoot = root;

const state = {
  relayStatus: "booting",
  microphoneOpen: false,
  original: "",
  translation: "",
  durableChunks: [] as TranscriptChunk[],
};

let config: AppConfig;
let relay: WebSocket | undefined;
let convex: ConvexClient | undefined;
let glasses: GlassesDisplay | undefined;
let renderTimer: number | undefined;

const tokenBuffer = new TokenBuffer();

void boot().catch((error) => {
  state.relayStatus = `error: ${error.message}`;
  renderDom();
  console.error(error);
});

async function boot() {
  config = readConfig();
  renderDom();

  convex = new ConvexClient(config.convexUrl);
  convex.onUpdate(anyApi.transcripts.listChunks, { sessionId: config.sessionId }, (chunks) => {
    state.durableChunks = chunks as TranscriptChunk[];
    renderDom();
  });

  if (config.viewer) {
    state.relayStatus = "viewer (Convex subscription only)";
    renderDom();
    return;
  }

  relay = connectRelay(config);
  glasses = new GlassesDisplay();
  state.relayStatus = "waiting for glasses bridge";
  renderDom();

  await glasses.init(
    config,
    (audioPcm) => {
      if (!state.microphoneOpen) return;
      if (relay?.readyState !== WebSocket.OPEN) return;
      relay.send(audioPcm);
    },
    (eventType) => {
      if (eventType === SYS_CLICK_EVENT) {
        void toggleMicrophone();
        return;
      }

      if (eventType === SYS_DOUBLE_CLICK_EVENT) {
        finishRelay();
        glasses?.requestExitDialog();
        return;
      }

      if (eventType === SYS_FOREGROUND_EXIT_EVENT) {
        void setMicrophone(false);
      }
    },
  );
}

function connectRelay(appConfig: AppConfig) {
  const url = new URL(appConfig.relayWsUrl);
  url.searchParams.set("sessionId", appConfig.sessionId);
  url.searchParams.set("userId", appConfig.userId);
  url.searchParams.set("sourceLanguages", appConfig.sourceLanguages.join(","));
  url.searchParams.set("targetLanguage", appConfig.targetLanguage);
  url.searchParams.set("translationMode", appConfig.translationMode);

  const socket = new WebSocket(url);
  socket.binaryType = "arraybuffer";

  socket.addEventListener("open", () => {
    state.relayStatus = "relay connected";
    renderDom();
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as RelayMessage;

    if (message.type === "relay_status") {
      state.relayStatus = message.status;
      scheduleGlassesRender();
      renderDom();
      return;
    }

    if (message.type === "relay_ready") {
      state.relayStatus = "live";
      void setMicrophone(true);
      scheduleGlassesRender();
      renderDom();
      return;
    }

    if (message.type === "relay_error") {
      state.relayStatus = `error: ${message.message}`;
      void setMicrophone(false);
      scheduleGlassesRender();
      renderDom();
      return;
    }

    tokenBuffer.addResult(message.result);
    state.original = tokenBuffer.renderLane(["none", "original"], 360);
    state.translation = tokenBuffer.renderLane(["translation"], 400);
    scheduleGlassesRender();
    renderDom();
  });

  socket.addEventListener("close", () => {
    state.relayStatus = state.relayStatus === "live" ? "closed" : state.relayStatus;
    void setMicrophone(false);
    scheduleGlassesRender();
    renderDom();
  });

  socket.addEventListener("error", () => {
    state.relayStatus = "relay websocket error";
    void setMicrophone(false);
    scheduleGlassesRender();
    renderDom();
  });

  return socket;
}

async function toggleMicrophone() {
  await setMicrophone(!state.microphoneOpen);
}

async function setMicrophone(open: boolean) {
  if (!glasses) return;
  await glasses.setMicrophone(open);
  state.microphoneOpen = open;
  if (!open) finishRelay();
  scheduleGlassesRender();
  renderDom();
}

function finishRelay() {
  if (relay?.readyState === WebSocket.OPEN) {
    relay.send(JSON.stringify({ type: "finish" }));
  }
}

function scheduleGlassesRender() {
  if (renderTimer !== undefined) return;
  renderTimer = window.setTimeout(() => {
    renderTimer = undefined;
    glasses?.update(glassesStatus(), state.original, state.translation);
  }, 80);
}

function glassesStatus() {
  const mic = state.microphoneOpen ? "mic on" : "mic off";
  return `${state.relayStatus} | ${mic} | ${config?.sessionId.slice(0, 8) ?? ""}`;
}

function renderDom() {
  appRoot.innerHTML = `
    <section class="shell">
      <header>
        <div>
          <p class="eyebrow">Even G2 realtime translation PoC</p>
          <h1>Soniox fast path + Convex durable sync</h1>
        </div>
        <span class="status">${escapeHtml(state.relayStatus)}</span>
      </header>

      <dl class="meta">
        <div><dt>Session</dt><dd>${escapeHtml(config?.sessionId ?? "pending")}</dd></div>
        <div><dt>Languages</dt><dd>${escapeHtml(config ? `${config.sourceLanguages.join(", ")} -> ${config.targetLanguage}` : "pending")}</dd></div>
        <div><dt>Microphone</dt><dd>${state.microphoneOpen ? "open" : "closed"}</dd></div>
      </dl>

      <section class="live-grid">
        ${
          config?.viewer
            ? ""
            : `<article>
          <h2>Fast path</h2>
          <h3>Original</h3>
          <p>${escapeHtml(state.original || "Waiting for speech.")}</p>
          <h3>Translation</h3>
          <p>${escapeHtml(state.translation || "Waiting for translation.")}</p>
        </article>`
        }
        <article>
          <h2>${config?.viewer ? "Convex live sync" : "Convex history"}</h2>
          <ol>${renderChunks(state.durableChunks)}</ol>
        </article>
      </section>
    </section>
  `;
}

function renderChunks(chunks: TranscriptChunk[]) {
  if (chunks.length === 0) return `<li class="empty">No finalized chunks persisted yet.</li>`;

  return chunks
    .map((chunk) => {
      const label =
        chunk.translationStatus === "translation"
          ? `${chunk.sourceLanguage ?? "source"} -> ${chunk.language}`
          : chunk.language;
      return `<li><strong>${escapeHtml(label)}</strong><span>${escapeHtml(chunk.text)}</span></li>`;
    })
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("beforeunload", () => {
  finishRelay();
  void glasses?.cleanup();
  convex?.close();
});
