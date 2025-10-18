import {useQuery} from "convex/react";
import {Id} from "../../../../convex/_generated/dataModel";
import {api} from "../../../../convex/_generated/api";


interface useGetTypingStatusesProps {
    workspaceId: Id<"workspaces">;
    channelId?: Id<"channels">;
    conversationId?: Id<"conversations">;
}

export const useGetTypingStatuses = ({
                                         workspaceId,
                                         channelId,
                                         conversationId,
                                     }: useGetTypingStatusesProps) => {
    const data = useQuery(api.typing_statuses.get, {
        workspaceId,
        channelId,
        conversationId,
    });
    const isLoading = data === undefined;

    return {data, isLoading};
}