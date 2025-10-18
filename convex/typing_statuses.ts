import {mutation, query, QueryCtx} from "./_generated/server";
import {v} from "convex/values";
import {auth} from "./auth";
import {Doc, Id} from "./_generated/dataModel";

const getMember = async (
    ctx: QueryCtx,
    workspaceId: Id<"workspaces">,
    userId: Id<"users">) => {
    return ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id", (q) =>
            q.eq("workspaceId", workspaceId).eq("userId", userId))
        .unique();
};

export const set = mutation({
    args: {
        workspaceId: v.id("workspaces"),
        memberId: v.id("members"),
        channelId: v.optional(v.id("channels")),
        conversationId: v.optional(v.id("conversations")),
        lastSeenAt: v.number(),
    }, handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId)
            throw new Error("Unauthorized");

        const member = await getMember(ctx, args.workspaceId, userId);

        if (!member)
            return null;

        // Check if typing status already exists for this member
        let existingTypingStatus: Doc<"typingStatuses"> | null = null;
        if (args.channelId) {
            existingTypingStatus = await ctx.db
                .query("typingStatuses")
                .withIndex("by_channel_id_by_member_id", (q) =>
                    q.eq("channelId", args.channelId).eq("memberId", member._id))
                .first();
        } else if (args.conversationId) {
            existingTypingStatus = await ctx.db
                .query("typingStatuses")
                .withIndex("by_conversation_id_by_member_id", (q) =>
                    q.eq("conversationId", args.conversationId).eq("memberId", member._id))
                .first();
        }

        // If exists, update it instead of creating new one
        if (existingTypingStatus) {
            await ctx.db.patch(existingTypingStatus._id, {
                lastSeenAt: args.lastSeenAt
            });
            return existingTypingStatus._id;
        }

        // Create new typing status
        const typingStatusId = await ctx.db.insert("typingStatuses", {
            workspaceId: args.workspaceId,
            memberId: member._id,
            channelId: args.channelId,
            conversationId: args.conversationId,
            lastSeenAt: args.lastSeenAt
        });

        return typingStatusId;
    }
})



// Get all members are messaging
export const get = query({
    args: {
        workspaceId: v.id("workspaces"),
        channelId: v.optional(v.id("channels")),
        conversationId: v.optional(v.id("conversations")),
    }, handler: async (ctx, args) => {
        const userId = await auth.getUserId(ctx);

        if (!userId)
            return [];

        const member = await getMember(ctx, args.workspaceId, userId);

        if (!member)
            return [];

        const now = Date.now();
        const fiveSecondsAgo = now - 5000;

        // Get typing statuses for this channel/conversation
        let typingStatuses;
        if (args.channelId) {
            typingStatuses = await ctx.db
                .query("typingStatuses")
                .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
                .filter((q) => q.gte(q.field("lastSeenAt"), fiveSecondsAgo))
                .filter((q) => q.neq(q.field("memberId"), member._id))
                .collect();
        } else if (args.conversationId) {
            typingStatuses = await ctx.db
                .query("typingStatuses")
                .withIndex("by_conversation_id", (q) => q.eq("conversationId", args.conversationId))
                .filter((q) => q.gte(q.field("lastSeenAt"), fiveSecondsAgo))
                .filter((q) => q.neq(q.field("memberId"), member._id))
                .collect();
        } else {
            return [];
        }

        // Get member details for each typing status
        const typingMembers = await Promise.all(
            typingStatuses.map(async (status) => {
                const typingMember = await ctx.db.get(status.memberId);
                if (!typingMember) return null;

                const user = await ctx.db.get(typingMember.userId);
                if (!user) return null;

                return {
                    _id: typingMember._id,
                    userId: user._id,
                    name: user.name,
                    image: user.image,
                };
            })
        );

        return typingMembers.filter((member) => member !== null);
    }
})


