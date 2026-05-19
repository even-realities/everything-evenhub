import type { AppConfig, TranslationMode } from "./types";

export function readConfig(): AppConfig {
  const params = new URLSearchParams(window.location.search);
  const convexUrl = import.meta.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    throw new Error("Missing VITE_CONVEX_URL. Run Convex and set it in .env.local.");
  }

  const viewer = params.get("viewer") === "1";
  const sessionParam = params.get("session");

  if (viewer && !sessionParam) {
    throw new Error("Viewer mode requires ?session=<sessionId> to subscribe to.");
  }

  return {
    convexUrl,
    relayWsUrl:
      import.meta.env.VITE_RELAY_WS_URL ??
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:8787/soniox`,
    sessionId: sessionParam ?? crypto.randomUUID(),
    userId: params.get("user") ?? "g2-active-user",
    sourceLanguages: parseLanguages(params.get("source") ?? "en,es"),
    targetLanguage: params.get("target") ?? "es",
    translationMode: parseTranslationMode(params.get("mode")),
    viewer,
  };
}

function parseLanguages(value: string) {
  const languages = value
    .split(",")
    .map((language) => language.trim())
    .filter(Boolean);

  if (languages.length === 0) throw new Error("At least one source language is required.");
  return languages;
}

function parseTranslationMode(value: string | null): TranslationMode {
  if (value === null || value === "one_way") return "one_way";
  if (value === "two_way") return "two_way";
  throw new Error(`Unsupported mode: ${value}`);
}
