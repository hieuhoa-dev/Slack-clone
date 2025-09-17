import Quill from "quill";
import {toast} from "sonner";
import dynamic from "next/dynamic";
import {useRef, useState} from "react";
import {Loader, XIcon, AlertTriangle} from "lucide-react";
import {differenceInMinutes, format, isToday, isYesterday} from "date-fns";

import {Id} from "../../../../convex/_generated/dataModel";

import {Button} from "@/components/ui/button";
import {Message} from "@/components/message";

import {useChannelId} from "@/hooks/use-channel-id";
import {useWorkspaceId} from "@/hooks/use-workspace-id";
import {useGetMessage} from "@/features/messages/api/use-get-message";
import {useCurrentMember} from "@/features/members/api/use-current-member";
import {useCreateMessage} from "@/features/messages/api/use-create-message";
import {useGenerateUploadUrl} from "@/features/upload/api/use-generate-upload-url";
import {useGetMessages} from "@/features/messages/api/use-get-messages";

const Editor = dynamic(() => import("@/components/editor"), {ssr: false});

const TIME_THRESHOLD = 5;

type CreateMessageValues = {
    channelId: Id<"channels">;
    workspaceId: Id<"workspaces">;
    parentMessageId: Id<"messages">;
    body: string;
    image: Id<"_storage"> | undefined;
}

const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
        return "Today";
    } else if (isYesterday(date)) {
        return "Yesterday";
    }
    return format(date, "EEEE,MMMM d");
}


interface ThreadProps {
    messageId: Id<"messages">;
    onClose: () => void;
}

export const Thread = ({messageId, onClose}: ThreadProps) => {
    const channelId = useChannelId();
    const workspaceId = useWorkspaceId();

    const {mutate: createMessage} = useCreateMessage();
    const {mutate: generateUploadUrl} = useGenerateUploadUrl();
    const {data: currentMember} = useCurrentMember({workspaceId});
    const {results, status, loadMore} = useGetMessages({
        channelId,
        parentMessageId: messageId
    });

    const canLoadMore = status === "CanLoadMore";
    const isLoadingMore = status === "LoadingMore";

    const {data: message, isLoading: loadingMessage} = useGetMessage({id: messageId});

    const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPending] = useState(false);

    const editorRef = useRef<Quill | null>(null);

    const handeSubmit = async ({
                                   body, image
                               }: {
        body: string;
        image: File | null;
    }) => {
        try {
            setIsPending(true);
            editorRef?.current?.enable(false);

            const values: CreateMessageValues = {
                channelId,
                workspaceId,
                body,
                parentMessageId: messageId,
                image: undefined,
            };

            if (image) {
                const url = await generateUploadUrl({throwError: true});

                if (!url) {
                    throw new Error("Url not found");
                }

                const result = await fetch(url, {
                    method: "POST",
                    headers: {"Content-Type": image.type},
                    body: image,
                });

                if (!result.ok) {
                    throw new Error("Failed to upload image");
                }

                const {storageId} = await result.json();
                values.image = storageId;
            }

            await createMessage(values, {throwError: true});

            setEditorKey((prevKey) => prevKey + 1);
            // editorRef?.current?.setContents([]); // Clear the editor content

        } catch {
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsPending(false);
            editorRef?.current?.enable(true);
        }
    };

    const groupMessages = results?.reduce(
        (group, message) => {
            const date = new Date(message._creationTime);
            const dateKey = format(date, "yyyy-MM-dd");
            if (!group[dateKey]) {
                group[dateKey] = [];
            }
            group[dateKey].unshift(message);
            return group;
        },
        {} as Record<string, typeof results>,
    );

    if (loadingMessage || status === "LoadingFirstPage") {
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
            <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
                {Object.entries(groupMessages || {}).map(([dateKey, messages]) => (
                    <div key={dateKey}>
                        <div className="text-center my-2 relative">
                            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300"/>
                            <span className="relative inline-block bg-white px-4 p-1 rounded-full text-xs
                        border border-gray-300  shadow-sm">
                            {formatDateLabel(dateKey)}
                        </span>
                        </div>
                        {messages.map((message, index) => {
                            const prevMessage = messages[index - 1];
                            const isCompact =
                                prevMessage &&
                                prevMessage.user?._id === message.user?._id &&
                                differenceInMinutes(
                                    new Date(message._creationTime),
                                    new Date(prevMessage._creationTime)
                                ) < TIME_THRESHOLD;

                            return (
                                <Message
                                    key={message._id}
                                    id={message._id}
                                    memberId={message.memberId}
                                    authorImage={message.user.image}
                                    authorName={message.user.name}
                                    isAuthor={message.memberId === currentMember?._id}
                                    reactions={message.reactions}
                                    body={message.body}
                                    image={message.image}
                                    updatedAt={message.updatedAt}
                                    createdAt={message._creationTime}
                                    isEditing={editingId === message._id}
                                    setIsEditing={setEditingId}
                                    isCompact={isCompact}
                                    hideThreadButton
                                    threadCount={message.threadCount}
                                    threadImage={message.threadImage}
                                    threadName={message.threadName}
                                    threadTimestamp={message.threadTimestamp}
                                    parentMessageId={message.parentMessageId}
                                />
                            )
                        })}
                    </div>
                ))}
                <div className="h-1"
                     ref={(el) => {
                         if (el) {
                             const observer = new IntersectionObserver(([entry]) => {
                                     if (entry.isIntersecting && canLoadMore) {
                                         loadMore();
                                     }
                                 }
                                 , {threshold: 1.0}
                             );
                             observer.observe(el);
                             return () => observer.disconnect();
                         }
                     }}
                />
                {isLoadingMore && (
                    <div className="text-center my-2 relative">
                        <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300"/>
                        <span className="relative inline-block bg-white px-4 p-1 rounded-full text-xs
                        border border-gray-300  shadow-sm">
                           <Loader className="size-4"/>
                        </span>
                    </div>
                )}
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
            <div className="px-4">
                <Editor
                    key={editorKey}
                    innerRef={editorRef}
                    onSubmit={handeSubmit}
                    disabled={isPending}
                    placeholder="Reply..."
                />
            </div>
        </div>
    )
}