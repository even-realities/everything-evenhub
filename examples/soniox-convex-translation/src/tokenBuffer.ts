import type { SonioxResult, SonioxToken, TranslationStatus } from "./types";

export class TokenBuffer {
  private finalTokens: SonioxToken[] = [];
  private nonFinalTokens: SonioxToken[] = [];

  addResult(result: SonioxResult) {
    const nonFinal: SonioxToken[] = [];

    for (const token of result.tokens ?? []) {
      if (!token.text) continue;
      if (token.is_final) {
        this.finalTokens.push(token);
      } else {
        nonFinal.push(token);
      }
    }

    this.nonFinalTokens = nonFinal;
  }

  renderLane(statuses: TranslationStatus[], maxChars: number) {
    const tokens = [...this.finalTokens, ...this.nonFinalTokens].filter((token) => {
      const status = token.translation_status ?? "none";
      return statuses.includes(status);
    });

    const rendered = renderTokens(tokens);
    return tail(rendered.trim(), maxChars);
  }
}

function renderTokens(tokens: SonioxToken[]) {
  const parts: string[] = [];
  let currentSpeaker: string | undefined;
  let currentLanguage: string | undefined;

  for (const token of tokens) {
    const text = token.text ?? "";
    const speaker = token.speaker == null ? undefined : String(token.speaker);
    const language = token.language;
    const isTranslation = token.translation_status === "translation";

    if (speaker && speaker !== currentSpeaker) {
      currentSpeaker = speaker;
      currentLanguage = undefined;
      parts.push(parts.length > 0 ? `\nS${speaker}: ` : `S${speaker}: `);
    }

    if (language && language !== currentLanguage) {
      currentLanguage = language;
      const label = isTranslation ? `${language} translation` : language;
      parts.push(parts.length > 0 ? `\n[${label}] ` : `[${label}] `);
      parts.push(text.trimStart());
      continue;
    }

    parts.push(text);
  }

  return parts.join("");
}

function tail(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `...${text.slice(text.length - maxChars + 3)}`;
}
