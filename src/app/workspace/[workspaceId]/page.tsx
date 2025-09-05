"use client";

import { useRouter } from "next/navigation";
import { useGetWorkspace } from "@/features/workspaces/api/use-get-workspace";
import { useCreateChannelModal } from "@/features/channels/store/use-create-channel-modal";
import { useGetChannels } from "@/features/channels/api/use-get-channels";
import { useCreateChannel } from "@/features/channels/api/use-create-channel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useMemo, useEffect, use } from "react";
import { Loader, TriangleAlert } from "lucide-react";

const WorkspaceIdPage =  ( ) => {
    const workspaceId = useWorkspaceId();
    const router = useRouter();
    const [open, setOpen] = useCreateChannelModal();
    const {data: workspace, isLoading: workspaceLoading} = useGetWorkspace({id: workspaceId});
    const {data: channel, isLoading: channelLoading} = useGetChannels({
        workspaceId,
        });

    const channelId = useMemo(() => channel?.[0]?._id , [channel]);
    useEffect(() => { 
        if (  workspaceLoading || channelLoading || !workspace) return;
        if (channelId) {
            router.push(`/workspace/${workspaceId}/channel/${channelId}`);
        } else if (!open){
            setOpen(true);
        }
    }, [channelId, workspace, workspaceLoading, channelLoading, open, setOpen, router, workspaceId]);

    if (workspaceLoading || channelLoading) {
        return <div className="h-full flex-1 flex items-center justify-center flex-col gap-y-2">
            <Loader className="size-6 animate-spin text-muted-foreground"/>
        </div>;
    }
    if (!workspace) {
        return <div className="h-full flex-1 flex items-center justify-center flex-col gap-y-2">
            <TriangleAlert className="size-6 animate-spin text-muted-foreground"/>
            <span className="text-sm text-muted-foreground">
                Workspace not found or you are not a member
            </span>
        </div>;

    }
    return null;
    // return (
    //     <div>
    //         Data: {JSON.stringify(workspace)}
    //     </div>
    // );
};

export default WorkspaceIdPage;