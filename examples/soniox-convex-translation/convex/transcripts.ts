import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const translationStatus = v.union(
  v.literal("none"),
  v.literal("original"),
  v.literal("translation"),
);

export const createSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
    sourceLanguages: v.array(v.string()),
    targetLanguage: v.string(),
    translationMode: v.union(v.literal("one_way"), v.literal("two_way")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (existing) {
      if (existing.status === "active") return existing._id;
      throw new Error(`Session ${args.sessionId} already exists and is not active.`);
    }

    return await ctx.db.insert("sessions", {
      ...args,
      startedAt: Date.now(),
      status: "active",
    });
  },
});

export const finishSession = mutation({
  args: {
    sessionId: v.string(),
    status: v.union(v.literal("ended"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session) throw new Error(`Cannot finish missing session ${args.sessionId}.`);

    await ctx.db.patch(session._id, {
      status: args.status,
      endedAt: Date.now(),
    });
  },
});

export const ingestChunks = mutation({
  args: {
    sessionId: v.string(),
    chunks: v.array(
      v.object({
        speakerId: v.optional(v.string()),
        language: v.string(),
        sourceLanguage: v.optional(v.string()),
        translationStatus,
        text: v.string(),
        startMs: v.optional(v.number()),
        endMs: v.optional(v.number()),
        isFinal: v.boolean(),
        createdAt: v.number(),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (!session) throw new Error(`Cannot ingest chunks for missing session ${args.sessionId}.`);
    if (session.status !== "active") {
      throw new Error(`Cannot ingest chunks for ${session.status} session ${args.sessionId}.`);
    }

    for (const chunk of args.chunks) {
      if (chunk.text.trim().length === 0) continue;
      await ctx.db.insert("transcriptChunks", {
        ...chunk,
        sessionId: args.sessionId,
      });
    }
  },
});

export const listChunks = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcriptChunks")
      .withIndex("by_session_order", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const getSession = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .unique();
  },
});
