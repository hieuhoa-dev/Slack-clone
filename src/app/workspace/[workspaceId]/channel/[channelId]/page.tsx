"use client"

import {Loader, TriangleAlert} from "lucide-react";

import {Header} from "./header";
import {MessageList} from "@/components/message-list";
import {ChatInput} from "@/app/workspace/[workspaceId]/channel/[channelId]/chat-input";

import {useChannelId} from "@/hooks/use-channel-id";
import {useGetChannel} from "@/features/channels/api/use-get-channel";
import {useGetMessages} from "@/features/messages/api/use-get-messages";


const ChannelIdPage = () => {
    const channelId = useChannelId();

    const {results, status, loadMore} = useGetMessages({channelId});
    const {data: channel, isLoading: ChannelLoading} = useGetChannel({id: channelId});

    if (ChannelLoading || status === "LoadingFirstPage") {
        return (
            <div className="h-full flex-1 flex items-center justify-center ">
                <Loader className="size-5 animate-spin text-muted-foreground"/>
            </div>
        );
    }

    if (!channel) {
        return (
            <div className="h-full flex-1 flex flex-col gap-y-2 items-center justify-center ">
                <TriangleAlert className="size-5 text-muted-foreground"/>
                <span className="text-sm text-muted-foreground">
                Channel not found or you are not a member
            </span>
            </div>
        );
    }
    return (
        <div className="h-full flex flex-col">
            <Header title={channel.name}/>
            <MessageList
                channelName={channel.name}
                channelCreationTime={channel._creationTime}
                data={results}
                loadMore={loadMore}
                isLoadingMore={status === "LoadingMore"}
                canLoadMore={status === "CanLoadMore"}
            />
            <ChatInput placeholder={`Message # ${channel.name}`}/>
        </div>
    );
}
export default ChannelIdPage;