import {components} from "./_generated/api";
import {Agent, createThread} from "@convex-dev/agent";
import {action} from "./_generated/server";
import {v} from "convex/values";
import {google} from "@ai-sdk/google";

/**
 * AI Agent để cải thiện nội dung tin nhắn
 * - Sử dụng Groq với model Qwen3-32B
 * - Chuyên gia về viết lách và giao tiếp
 *
 * Note: Groq API key sẽ tự động lấy từ environment variable GROQ_API_KEY
 * Cần set trong convex dashboard: https://dashboard.convex.dev
 */
const agent = new Agent(components.agent, {
    name: "Writing Assistant",
    languageModel: google('gemini-2.5-flash'),
    instructions: `"You are an expert rewriting assistant. You are not a chatbot.",
"Task: Rewrite the provided content to be clearer and better structured while preserving meaning, facts, terminology, and names.",
"Do not address the user, ask questions, add greetings, or include commentary.",
"Keep existing links/mentions intact. Do not change code blocks or inline code content.",
"Output strictly in Markdown (paragraphs and optional bullet lists). Do not output any HTML or images.",
"Return ONLY the rewritten content. No preamble, headings, or closing.`,
    maxSteps: 3,

});

export const generate = action({
    args: {message: v.string()},
    handler: async (ctx, {message}) => {
        // Tạo thread mới cho mỗi request để tránh context confusion
        const threadId = await createThread(ctx, components.agent);

        // Tạo prompt với context rõ ràng
        const prompt = `Please rewrite and improve the follow content.\n${message}`;

        // Gọi AI và trả về kết quả
        const result = await agent.generateText(ctx, {threadId}, {prompt});

        return result.text;
    },
});
