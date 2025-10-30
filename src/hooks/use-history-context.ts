import {useMemo} from "react";
import {useGetMessages} from "@/features/messages/api/use-get-messages";
import {Id} from "../../convex/_generated/dataModel";

interface UseHistoryContextProps {
    channelId?: Id<"channels">;
    conversationId?: Id<"conversations">;
    parentMessageId?: Id<"messages">;
    topic?: string;
}

export const useHistoryContext = ({
                                      channelId,
                                      conversationId,
                                      parentMessageId,
                                      topic
                                  }: UseHistoryContextProps) => {
    const {results, status} = useGetMessages({
        channelId,
        conversationId,
        parentMessageId,
    });

    const historyContext = useMemo(() => {
        if (!results || results.length === 0) {
            return `this is ${topic} topic`;
        }

        return results
            .map(message =>
                `${message.user.name} : ${message.body}`
            ).join("\n");

    }, [results, topic]);

    return {
        historyContext,
        isLoading: status === "LoadingFirstPage",
        messageCount: results?.length || 0,
    };
};
