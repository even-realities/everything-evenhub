import { createServer } from "node:http";
import process from "node:process";
import { Buffer } from "node:buffer";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { config as loadEnv } from "dotenv";
import WebSocket, { WebSocketServer } from "ws";

const SONIOX_WEBSOCKET_URL = "wss://stt-rt.soniox.com/transcribe-websocket";

loadEnv({ path: ".env.local" });
loadEnv();

type TranslationMode = "one_way" | "two_way";
type TranslationStatus = "none" | "original" | "translation";

type SonioxToken = {
  text?: string;
  is_final?: boolean;
  translation_status?: TranslationStatus;
  language?: string;
  source_language?: string;
  speaker?: string | number;
  start_ms?: number;
  end_ms?: number;
};

type SonioxResult = {
  tokens?: SonioxToken[];
  finished?: boolean;
  error_code?: string | null;
  error_message?: string | null;
};

type TranscriptChunk = {
  speakerId?: string;
  language: string;
  sourceLanguage?: string;
  translationStatus: TranslationStatus;
  text: string;
  startMs?: number;
  endMs?: number;
  isFinal: boolean;
  createdAt: number;
  order: number;
};

const port = Number(process.env.PORT ?? "8787");
const sonioxApiKey = requiredEnv("SONIOX_API_KEY");
const convexUrl = requiredEnv("CONVEX_URL");

const convex = new ConvexHttpClient(convexUrl);

const server = createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, path: "/soniox" });

wss.on("connection", (client, request) => {
  void handleClient(client, request.url ?? "/soniox").catch((error) => {
    console.error("Relay connection failed:", error);
    sendJson(client, { type: "relay_error", message: error.message });
    client.close(1011, "relay setup failed");
  });
});

server.listen(port, () => {
  console.log(`Soniox relay listening on ws://localhost:${port}/soniox`);
});

async function handleClient(client: WebSocket, requestUrl: string) {
  const url = new URL(requestUrl, `http://localhost:${port}`);
  const sessionId = required(url.searchParams.get("sessionId"), "sessionId");
  const userId = required(url.searchParams.get("userId"), "userId");
  const targetLanguage = url.searchParams.get("targetLanguage") ?? "es";
  const translationMode = parseTranslationMode(url.searchParams.get("translationMode"));
  const sourceLanguages = parseLanguageList(url.searchParams.get("sourceLanguages") ?? "en,es");

  let order = 0;
  let closed = false;
  let finished = false;
  let persistTimer: NodeJS.Timeout | undefined;
  let persistInFlight: Promise<void> | undefined;
  const pendingChunks: TranscriptChunk[] = [];

  sendJson(client, { type: "relay_status", status: "creating_session", sessionId });
  await convex.mutation(anyApi.transcripts.createSession, {
    sessionId,
    userId,
    sourceLanguages,
    targetLanguage,
    translationMode,
  });

  sendJson(client, { type: "relay_status", status: "connecting_soniox", sessionId });
  const soniox = new WebSocket(SONIOX_WEBSOCKET_URL);

  soniox.on("open", () => {
    soniox.send(JSON.stringify(buildSonioxConfig({
      apiKey: sonioxApiKey,
      sourceLanguages,
      targetLanguage,
      translationMode,
    })));
    sendJson(client, { type: "relay_ready", sessionId });
  });

  soniox.on("message", (message) => {
    const result = JSON.parse(message.toString()) as SonioxResult;

    if (result.error_code) {
      sendJson(client, {
        type: "relay_error",
        code: result.error_code,
        message: result.error_message ?? "Soniox returned an error.",
      });
      void finalize("error");
      client.close(1011, "soniox error");
      return;
    }

    sendJson(client, { type: "soniox_result", result });

    const chunks = collectFinalChunks(result.tokens ?? [], () => order++);
    if (chunks.length > 0) {
      pendingChunks.push(...chunks);
      schedulePersist();
    }

    if (result.finished) {
      void finalize("ended");
      client.close(1000, "soniox finished");
    }
  });

  soniox.on("error", (error) => {
    sendJson(client, { type: "relay_error", message: error.message });
    void finalize("error");
    client.close(1011, "soniox websocket error");
  });

  client.on("message", (message, isBinary) => {
    if (closed) return;

    if (!isBinary) {
      const control = JSON.parse(message.toString()) as { type?: string };
      if (control.type === "finish") {
        if (soniox.readyState === WebSocket.OPEN) soniox.send("");
        return;
      }
      sendJson(client, {
        type: "relay_error",
        message: `Unsupported client control message: ${control.type ?? "unknown"}`,
      });
      client.close(1003, "unsupported control message");
      return;
    }

    if (soniox.readyState !== WebSocket.OPEN) {
      client.close(1011, "soniox not ready");
      return;
    }

    const audio = Buffer.isBuffer(message) ? message : Buffer.from(message as ArrayBuffer);
    soniox.send(audio);
  });

  client.on("close", () => {
    void finalize(finished ? "ended" : "error");
    if (soniox.readyState === WebSocket.OPEN) soniox.send("");
    soniox.close();
  });

  async function finalize(status: "ended" | "error") {
    if (closed) return;
    closed = true;
    finished = status === "ended";
    if (persistTimer) clearTimeout(persistTimer);
    await flushPending();
    await convex.mutation(anyApi.transcripts.finishSession, { sessionId, status });
  }

  function schedulePersist() {
    if (persistTimer) return;
    persistTimer = setTimeout(() => {
      persistTimer = undefined;
      void flushPending().catch((error) => {
        sendJson(client, { type: "relay_error", message: error.message });
        client.close(1011, "convex persistence failed");
      });
    }, 500);
  }

  async function flushPending(): Promise<void> {
    if (persistInFlight) {
      await persistInFlight;
      if (pendingChunks.length === 0) return;
    }

    const chunks = pendingChunks.splice(0, pendingChunks.length);
    if (chunks.length === 0) return;

    persistInFlight = convex
      .mutation(anyApi.transcripts.ingestChunks, { sessionId, chunks })
      .then(() => undefined)
      .finally(() => {
        persistInFlight = undefined;
      });

    await persistInFlight;

    if (pendingChunks.length > 0) await flushPending();
  }
}

function buildSonioxConfig(args: {
  apiKey: string;
  sourceLanguages: string[];
  targetLanguage: string;
  translationMode: TranslationMode;
}) {
  const config: Record<string, unknown> = {
    api_key: args.apiKey,
    model: "stt-rt-v4",
    audio_format: "pcm_s16le",
    sample_rate: 16000,
    num_channels: 1,
    language_hints: args.sourceLanguages,
    enable_language_identification: true,
    enable_speaker_diarization: true,
    enable_endpoint_detection: true,
    context: {
      general: [
        { key: "domain", value: "Smart glasses realtime captions" },
        { key: "device", value: "Even Realities G2" },
      ],
      terms: ["Even Realities", "Even G2", "G2", "Soniox", "Convex"],
    },
  };

  if (args.translationMode === "one_way") {
    config.translation = {
      type: "one_way",
      target_language: args.targetLanguage,
    };
  } else {
    config.translation = {
      type: "two_way",
      language_a: args.sourceLanguages[0],
      language_b: args.targetLanguage,
    };
  }

  return config;
}

function collectFinalChunks(tokens: SonioxToken[], nextOrder: () => number): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];
  let current: Omit<TranscriptChunk, "order"> | undefined;

  for (const token of tokens) {
    if (!token.text || !token.is_final) continue;

    const language = token.language ?? "und";
    const translationStatus = token.translation_status ?? "none";
    const speakerId = token.speaker == null ? undefined : String(token.speaker);
    const sourceLanguage = token.source_language;
    const sameGroup =
      current &&
      current.language === language &&
      current.translationStatus === translationStatus &&
      current.speakerId === speakerId &&
      current.sourceLanguage === sourceLanguage;

    if (!sameGroup) {
      if (current) chunks.push({ ...current, order: nextOrder() });
      current = {
        speakerId,
        language,
        sourceLanguage,
        translationStatus,
        text: token.text,
        startMs: token.start_ms,
        endMs: token.end_ms,
        isFinal: true,
        createdAt: Date.now(),
      };
      continue;
    }

    if (!current) throw new Error("Final token grouping invariant failed.");
    current.text += token.text;
    current.startMs = minDefined(current.startMs, token.start_ms);
    current.endMs = maxDefined(current.endMs, token.end_ms);
  }

  if (current) chunks.push({ ...current, order: nextOrder() });
  return chunks;
}

function minDefined(left: number | undefined, right: number | undefined) {
  if (left == null) return right;
  if (right == null) return left;
  return Math.min(left, right);
}

function maxDefined(left: number | undefined, right: number | undefined) {
  if (left == null) return right;
  if (right == null) return left;
  return Math.max(left, right);
}

function parseTranslationMode(value: string | null): TranslationMode {
  if (value === null || value === "one_way") return "one_way";
  if (value === "two_way") return "two_way";
  throw new Error(`Unsupported translationMode: ${value}`);
}

function parseLanguageList(value: string) {
  const languages = value
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);

  if (languages.length === 0) throw new Error("sourceLanguages must include at least one language.");
  return languages;
}

function required(value: string | null, name: string) {
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function sendJson(socket: WebSocket, value: unknown) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(value));
}
