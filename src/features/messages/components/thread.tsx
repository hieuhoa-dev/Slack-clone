import {useState} from "react";
import {Loader, XIcon, AlertTriangle} from "lucide-react";

import {Id} from "../../../../convex/_generated/dataModel";

import {Button} from "@/components/ui/button";
import {Message} from "@/components/message";

import {useGetMessage} from "@/features/messages/api/use-get-message";
import {useCurrentMember} from "@/features/members/api/use-current-member";
import {useWorkspaceId} from "@/hooks/use-workspace-id";


interface ThreadProps {
    messageId: Id<"messages">;
    onClose: () => void;
}

export const Thread = ({messageId, onClose}: ThreadProps) => {
    const workspaceId = useWorkspaceId();
    const {data: currentMember} = useCurrentMember({workspaceId});
    const {data: message, isLoading: loadingMessage} = useGetMessage({id: messageId});

    const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

    if (loadingMessage) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 h-[49px] border-b">
                    <p className="text-lg font-bold">Thread</p>
                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]"/>
                    </Button>
                </div>
                <div className="flex flex-col gap-y-2 items-center justify-between h-full">
                    <Loader className="size-5 animate-spin text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">Message not found</p>
                </div>
            </div>
        )
    }

    if (!message) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 h-[49px] border-b">
                    <p className="text-lg font-bold">Thread</p>
                    <Button onClick={onClose} size="iconSm" variant="ghost">
                        <XIcon className="size-5 stroke-[1.5]"/>
                    </Button>
                </div>
                <div className="flex flex-col gap-y-2 items-center justify-between h-full">
                    <AlertTriangle className="size-5 text-muted-foreground"/>
                    <p className="text-sm text-muted-foreground">Message not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 h-[49px] border-b">
                <p className="text-lg font-bold">Thread</p>
                <Button onClick={onClose} size="iconSm" variant="ghost">
                    <XIcon className="size-5 stroke-[1.5]"/>
                </Button>
            </div>
            <div>
                <Message
                    hideThreadButton
                    id={message._id}
                    memberId={message.memberId}
                    authorImage={message.user.image}
                    authorName={message.user.name}
                    isAuthor={message.memberId === currentMember?._id}
                    body={message.body}
                    image={message.image}
                    createdAt={message._creationTime}
                    updatedAt={message.updatedAt}
                    reactions={message.reactions}
                    isEditing={editingId === message._id}
                    setIsEditing={setEditingId}
                />
            </div>
        </div>
    )
}