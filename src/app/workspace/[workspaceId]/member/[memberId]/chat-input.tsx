import dynamic from "next/dynamic";
import {useRef, useState} from "react";
import {toast} from "sonner";
import Quill from "quill";

import {useWorkspaceId} from "@/hooks/use-workspace-id";
import {useCreateMessage} from "@/features/messages/api/use-create-message";
import {useGenerateUploadUrl} from "@/features/upload/api/use-generate-upload-url";
import {useGetTypingStatuses} from "@/features/typing-statuses/api/use-get-typing-statuses";
import {useTypingIndicator} from "@/hooks/use-typing-indicator";
import {useCurrentMember} from "@/features/members/api/use-current-member";
import {TypingIndicator} from "@/components/typing-indicator";
import {useHistoryContext} from "@/hooks/use-history-context";

import {Id} from "../../../../../../convex/_generated/dataModel";

const Editor = dynamic(() => import("@/components/editor"), {ssr: false});

interface ChatInputProps {
    placeholder: string;
    conversationId: Id<"conversations">;
}

type CreateMessageValues = {
    conversationId: Id<"conversations">;
    workspaceId: Id<"workspaces">;
    body: string;
    image: Id<"_storage"> | undefined;
}

export const ChatInput = ({placeholder, conversationId}: ChatInputProps) => {
    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPending] = useState(false);

    const editorRef = useRef<Quill | null>(null);

    const workspaceId = useWorkspaceId();

    const {data: currentMember} = useCurrentMember({workspaceId});
    const {data: typingUsers} = useGetTypingStatuses({
        workspaceId,
        conversationId,
    });

    const {mutate: createMessage} = useCreateMessage();
    const {mutate: generateUploadUrl} = useGenerateUploadUrl();

    // placeholder is Name Conversation
    const {historyContext} = useHistoryContext({
        conversationId,
        topic: placeholder
    });

    const memberId = currentMember?._id;
    const {notifyTyping} = useTypingIndicator({
        workspaceId,
        memberId: memberId!,
        conversationId,
    });

    const handleTyping = () => {
        if (memberId) {
            notifyTyping();
        }
    };


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
                conversationId,
                workspaceId,
                body,
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

    return (
        <div className="px-5 w-full">
            <TypingIndicator typingUsers={typingUsers || []}/>
            <Editor
                key={editorKey}
                placeholder={placeholder}
                variant="create"
                onSubmit={handeSubmit}
                disabled={isPending}
                innerRef={editorRef}
                onTyping={handleTyping}
                historyContext={historyContext}
            />
        </div>
    )
}