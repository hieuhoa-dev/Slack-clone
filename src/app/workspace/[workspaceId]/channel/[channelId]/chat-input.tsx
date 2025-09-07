import dynamic from "next/dynamic";
import {useRef, useState} from "react";
import {toast} from "sonner";
import Quill from "quill";

import {useChannelId} from "@/hooks/use-channel-id";
import {useWorkspaceId} from "@/hooks/use-workspace-id";
import {useCreateMessage} from "@/features/messages/api/use-create-message";

const Editor = dynamic(() => import("@/components/editor"), {ssr: false});

interface ChatInputProps {
    placeholder: string;
}

export const ChatInput = ({placeholder}: ChatInputProps) => {
    const [editorKey, setEditorKey] = useState(0);
    const [isPending, setIsPending] = useState(false);

    const editorRef = useRef<Quill | null>(null);

    const channelId = useChannelId();
    const workspaceId = useWorkspaceId();

    const {mutate: createMessage} = useCreateMessage();

    const handeSubmit = async ({
                                   body, image
                               }: {
        body: string;
        image: File | null;
    }) => {
        try {
            setIsPending(true);
            await createMessage({
                workspaceId,
                channelId,
                body,
            }, {throwError: true});

            setEditorKey((prevKey) => prevKey + 1);
            // editorRef?.current?.setContents([]); // Clear the editor content

        } catch {
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="px-5 w-full">
            <Editor
                key={editorKey}
                placeholder={placeholder}
                variant="create"
                onSubmit={handeSubmit}
                disabled={isPending}
                innerRef={editorRef}
            />
        </div>
    )
}