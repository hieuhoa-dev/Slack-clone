"use client";

import {useRouter} from "next/navigation";
import {useGetWorkspace} from "@/features/workspaces/api/use-get-workspace";
import {useCreateChannelModal} from "@/features/channels/store/use-create-channel-modal";
import {useGetChannels} from "@/features/channels/api/use-get-channels";
import {useWorkspaceId} from "@/hooks/use-workspace-id";
import {useMemo, useEffect} from "react";
import {Loader, TriangleAlert} from "lucide-react";
import {useCurrentMember} from "@/features/members/api/use-current-member";

const WorkspaceIdPage = () => {
    const workspaceId = useWorkspaceId();
    const router = useRouter();
    const [open, setOpen] = useCreateChannelModal();
    const {data: workspace, isLoading: workspaceLoading} = useGetWorkspace({id: workspaceId});
    const {data: member, isLoading: memberLoading} = useCurrentMember({workspaceId});

    const {data: channels, isLoading: channelsLoading} = useGetChannels({workspaceId});


    const isAdmin = useMemo(() => member?.role === 'admin', [member?.role]);
    const channelId = useMemo(() => channels?.[0]?._id, [channels]);

    useEffect(() => {
        if (workspaceLoading || channelsLoading || !workspace || !member || memberLoading) return;

        if (channelId) {
            router.push(`/workspace/${workspaceId}/channel/${channelId}`);
        } else if (!open && isAdmin) {
            setOpen(true);
        }
    }, [
        channelId, workspace,
        workspaceLoading, channelsLoading,
        open, setOpen, router, workspaceId, member, memberLoading, isAdmin]);

    if (workspaceLoading || channelsLoading || memberLoading) {
        return (
            <div className="h-full flex-1 flex items-center justify-center flex-col gap-y-2">
                <Loader className="size-6 animate-spin text-muted-foreground"/>
            </div>
        );
    }

    if (!workspace) {
        return (<div className="h-full flex-1 flex items-center justify-center flex-col gap-y-2">
            <TriangleAlert className="size-6 text-muted-foreground"/>
            <span className="text-sm text-muted-foreground">
                Workspace not found
            </span>
        </div>);
    }

    if (!channels) {
        return (
            <div className="h-full flex-1 flex items-center justify-center flex-col gap-y-2">
                <TriangleAlert className="size-6 text-muted-foreground"/>
                <span className="text-sm text-muted-foreground">
                No channels found, please create a new channel
            </span>
            </div>
        );
    }

    return null;

};

export default WorkspaceIdPage;