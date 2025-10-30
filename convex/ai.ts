import {components} from "./_generated/api";
import {Agent, createThread} from "@convex-dev/agent";
import {action} from "./_generated/server";
import {v} from "convex/values";
import {google} from "@ai-sdk/google";

/**
 * AI Agent to improve and create if there is no message content
 */
const agent = new Agent(components.agent, {
    name: "Writing Assistant",
    languageModel: google('gemini-2.5-flash'),
    instructions: `You are an expert rewriting assistant. You are not a chatbot.,
Task: Rewrite the provided content to be clearer and better structured while preserving meaning, facts, terminology, and names.
If there is no content, create content based on existing context.
Do not address the user, ask questions, add greetings, or include commentary.
Keep existing links/mentions intact. Do not change code blocks or inline code content.
Output strictly in Markdown (paragraphs and optional bullet lists). Do not output any HTML or images.
Return ONLY the rewritten content. No preamble, headings, or closing.`,
    maxSteps: 3,

});

export const generate = action({
    args: {message: v.string()},
    handler: async (ctx, {message}) => {
        // Create a new thread for each request to avoid context confusion
        const threadId = await createThread(ctx, components.agent);

        // Init prompt
        const prompt = `Please rewrite or generate my message.\n${message}`;

        const result = await agent.generateText(ctx, {threadId}, {prompt});

        return result.text;
    },
});
