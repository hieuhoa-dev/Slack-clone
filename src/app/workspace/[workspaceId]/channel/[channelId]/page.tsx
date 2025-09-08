"use client"

import {useGetChannel} from "@/features/channels/api/use-get-channel";
import {useChannelId} from "@/hooks/use-channel-id";
import {Loader, TriangleAlert} from "lucide-react";
import {Header} from "./header";
import {ChatInput} from "@/app/workspace/[workspaceId]/channel/[channelId]/chat-input";
import {useGetMessages} from "@/features/messages/api/use-get-messages";

const ChannelIdPage = () => {
    const channelId = useChannelId();

    const {results} = useGetMessages({channelId});
    const {data: channel, isLoading: ChannelLoading} = useGetChannel({id: channelId});

    if (ChannelLoading) {
        return (<div className="h-full flex-1 flex items-center justify-center ">
            <Loader className="size- animate-spin text-muted-foreground"/>
        </div>);
    }
    if (!channel) {
        return (<div className="h-full flex-1 flex flex-col gap-y-2 items-center justify-center ">
            <TriangleAlert className="size-5 text-muted-foreground"/>
            <span className="text-sm text-muted-foreground">
                Channel not found or you are not a member
            </span>
        </div>);
    }
    return (
        <div className="h-full flex flex-col">
            <Header title={channel.name}/>
            <div className="flex-1">
                {JSON.stringify(results, null, 2)}
            </div>
            <ChatInput placeholder={`Message # ${channel.name}`}/>
        </div>
    );
}
export default ChannelIdPage;