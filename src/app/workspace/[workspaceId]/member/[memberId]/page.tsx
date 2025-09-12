"use client";
import {toast} from "sonner";
import {useEffect, useState} from "react";
import {Loader, TriangleAlert} from "lucide-react";

import {useMemberId} from "@/hooks/use-member-id";
import {useWorkspaceId} from "@/hooks/use-workspace-id";
import {Conversation} from "@/app/workspace/[workspaceId]/member/[memberId]/conversation";
import {useCreateOrGetConversation} from "@/features/conversations/api/use-create-or-get-conversation";

import {Id} from "../../../../../../convex/_generated/dataModel";

const MemberIdPage = () => {
    const memberId = useMemberId();
    const workspaceId = useWorkspaceId();

    const [conversationId, setConversationId] = useState<Id<"conversations"> | null>(null);

    const {data, mutate, isPending} = useCreateOrGetConversation();

    useEffect(() => {
        mutate({
            workspaceId,
            memberId
        }, {
            onSuccess: (data) => {
                setConversationId(data);
            },
            onError: () => {
                toast.error("Failed to create or get conversation");
            }
        });
    }, [workspaceId, memberId, mutate]);

    if (isPending) {
        return (
            <div className="h-full flex-1 flex items-center justify-center ">
                <Loader className="size-6 animate-spin text-muted-foreground"/>
            </div>
        )
    }

    if (!conversationId) {
        return (
            <div className="h-full flex-1 flex flex-col gap-y-2 items-center justify-center ">
                <TriangleAlert className="size-6 text-muted-foreground"/>
                <span className="text-sm text-muted-foreground">
                Conversation not found
            </span>
            </div>
        );
    }

    return <Conversation id={conversationId} />;
};

export default MemberIdPage;