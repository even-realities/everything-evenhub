import {
  CreateStartUpPageContainer,
  OsEventTypeList,
  TextContainerProperty,
  TextContainerUpgrade,
  waitForEvenAppBridge,
} from "@evenrealities/even_hub_sdk";
import type { AppConfig } from "./types";

type EventHandler = (audioPcm: Uint8Array) => void;
type ControlHandler = (eventType: number) => void;

const HEADER_ID = 1;
const ORIGINAL_ID = 2;
const TRANSLATION_ID = 3;
const STATUS_ID = 4;

export class GlassesDisplay {
  private bridge: Awaited<ReturnType<typeof waitForEvenAppBridge>> | undefined;
  private renderQueue: Promise<void> = Promise.resolve();
  private unsubscribeEvents: (() => void) | undefined;
  private audioOpen = false;

  async init(config: AppConfig, onAudio: EventHandler, onControl: ControlHandler) {
    this.bridge = await waitForEvenAppBridge();

    const result = await this.bridge.createStartUpPageContainer(
      new CreateStartUpPageContainer({
        containerTotalNum: 4,
        textObject: [
          new TextContainerProperty({
            xPosition: 0,
            yPosition: 0,
            width: 576,
            height: 34,
            borderWidth: 0,
            borderColor: 12,
            paddingLength: 4,
            containerID: HEADER_ID,
            containerName: "header",
            content: `${config.sourceLanguages.join(",")} -> ${config.targetLanguage}`,
            isEventCapture: 0,
          }),
          new TextContainerProperty({
            xPosition: 0,
            yPosition: 34,
            width: 576,
            height: 104,
            borderWidth: 1,
            borderColor: 4,
            paddingLength: 5,
            containerID: ORIGINAL_ID,
            containerName: "original",
            content: "Listening...",
            isEventCapture: 0,
          }),
          new TextContainerProperty({
            xPosition: 0,
            yPosition: 138,
            width: 576,
            height: 116,
            borderWidth: 1,
            borderColor: 8,
            paddingLength: 5,
            containerID: TRANSLATION_ID,
            containerName: "translated",
            content: "Translation will appear here.",
            isEventCapture: 0,
          }),
          new TextContainerProperty({
            xPosition: 0,
            yPosition: 254,
            width: 576,
            height: 34,
            borderWidth: 0,
            borderColor: 12,
            paddingLength: 4,
            containerID: STATUS_ID,
            containerName: "status",
            content: "Connecting",
            isEventCapture: 1,
          }),
        ],
      }),
    );

    if (result !== 0) throw new Error(`createStartUpPageContainer failed with code ${result}.`);

    this.unsubscribeEvents = this.bridge.onEvenHubEvent((event) => {
      if (event.audioEvent?.audioPcm) {
        onAudio(event.audioEvent.audioPcm);
        return;
      }

      const sysEvent = event.sysEvent;
      if (!sysEvent) return;
      const eventType = sysEvent.eventType ?? 0;
      onControl(eventType);

      if (
        eventType === OsEventTypeList.ABNORMAL_EXIT_EVENT ||
        eventType === OsEventTypeList.SYSTEM_EXIT_EVENT
      ) {
        void this.cleanup();
      }
    });

    window.addEventListener("beforeunload", () => {
      void this.cleanup();
    });
  }

  async setMicrophone(open: boolean) {
    if (!this.bridge) throw new Error("Bridge is not initialized.");
    if (this.audioOpen === open) return;
    const ok = await this.bridge.audioControl(open);
    if (!ok) throw new Error(`audioControl(${open}) failed.`);
    this.audioOpen = open;
  }

  requestExitDialog() {
    if (!this.bridge) return;
    void this.bridge.shutDownPageContainer(1);
  }

  update(status: string, original: string, translation: string) {
    this.renderQueue = this.renderQueue
      .then(async () => {
        await this.upgrade(STATUS_ID, "status", status);
        await this.upgrade(ORIGINAL_ID, "original", original || "...");
        await this.upgrade(TRANSLATION_ID, "translated", translation || "...");
      })
      .catch((error) => {
        console.error("Display update failed:", error);
      });
  }

  async cleanup() {
    if (this.bridge && this.audioOpen) {
      await this.bridge.audioControl(false);
      this.audioOpen = false;
    }
    this.unsubscribeEvents?.();
    this.unsubscribeEvents = undefined;
  }

  private async upgrade(containerID: number, containerName: string, content: string) {
    if (!this.bridge) throw new Error("Bridge is not initialized.");
    await this.bridge.textContainerUpgrade(
      new TextContainerUpgrade({
        containerID,
        containerName,
        contentOffset: 0,
        contentLength: 0,
        content: limitContent(content, 900),
      }),
    );
  }
}

function limitContent(content: string, maxChars: number) {
  if (content.length <= maxChars) return content;
  return content.slice(0, maxChars);
}
