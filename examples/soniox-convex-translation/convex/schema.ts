import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    sessionId: v.string(),
    userId: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    sourceLanguages: v.array(v.string()),
    targetLanguage: v.string(),
    translationMode: v.union(v.literal("one_way"), v.literal("two_way")),
    status: v.union(v.literal("active"), v.literal("ended"), v.literal("error")),
  }).index("by_session_id", ["sessionId"]),

  transcriptChunks: defineTable({
    sessionId: v.string(),
    speakerId: v.optional(v.string()),
    language: v.string(),
    sourceLanguage: v.optional(v.string()),
    translationStatus: v.union(
      v.literal("none"),
      v.literal("original"),
      v.literal("translation"),
    ),
    text: v.string(),
    startMs: v.optional(v.number()),
    endMs: v.optional(v.number()),
    isFinal: v.boolean(),
    createdAt: v.number(),
    order: v.number(),
  }).index("by_session_order", ["sessionId", "order"]),
});
