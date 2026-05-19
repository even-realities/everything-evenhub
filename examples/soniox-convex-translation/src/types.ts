export type TranslationStatus = "none" | "original" | "translation";
export type TranslationMode = "one_way" | "two_way";

export type SonioxToken = {
  text?: string;
  is_final?: boolean;
  translation_status?: TranslationStatus;
  language?: string;
  source_language?: string;
  speaker?: string | number;
  start_ms?: number;
  end_ms?: number;
};

export type SonioxResult = {
  tokens?: SonioxToken[];
  finished?: boolean;
  error_code?: string | null;
  error_message?: string | null;
};

export type RelayMessage =
  | {
      type: "relay_status";
      status: string;
      sessionId: string;
    }
  | {
      type: "relay_ready";
      sessionId: string;
    }
  | {
      type: "soniox_result";
      result: SonioxResult;
    }
  | {
      type: "relay_error";
      code?: string;
      message: string;
    };

export type TranscriptChunk = {
  sessionId: string;
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

export type AppConfig = {
  convexUrl: string;
  relayWsUrl: string;
  sessionId: string;
  userId: string;
  sourceLanguages: string[];
  targetLanguage: string;
  translationMode: TranslationMode;
  viewer: boolean;
};
