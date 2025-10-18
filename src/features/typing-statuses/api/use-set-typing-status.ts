import {useCallback, useMemo, useState} from "react";
import {useMutation} from "convex/react";

import {api} from "../../../../convex/_generated/api";
import {Id} from "../../../../convex/_generated/dataModel";

type RequestType = {
    workspaceId: Id<"workspaces">;
    memberId: Id<"members">;
    channelId?: Id<"channels">;
    conversationId?: Id<"conversations">;
    lastSeenAt: number;
};

type ResponseType = Id<"typingStatuses"> | null;

type Options = {
    onSuccess?: (data: ResponseType) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
    throwError?: boolean;
};

export const useSetTypingStatus = () => {
    const [data, setData] = useState<ResponseType>(null);
    const [error, setError] = useState<Error | null>(null);
    const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null);

    const isPending = useMemo(() => status === "pending", [status]);
    const isSuccess = useMemo(() => status === "success", [status]);
    const isError = useMemo(() => status === "error", [status]);
    const isSettled = useMemo(() => status === "settled", [status]);

    const mutation = useMutation(api.typing_statuses.set);

    const mutate = useCallback(async (values: RequestType, options?: Options) => {
        try {
            setData(null);
            setError(null);
            setStatus("pending");

            const response = await mutation(values);
            setData(response);
            setStatus("success");
            options?.onSuccess?.(response);
            return response;

        } catch (error) {
            setError(error as Error);
            setStatus("error");
            options?.onError?.(error as Error);
            if (options?.throwError)
                throw error;

        } finally {
            setStatus("settled");
            options?.onSettled?.();
        }
    }, [mutation]);
    
    return {
        mutate,
        data,
        error,
        isPending,
        isSuccess,
        isError,
        isSettled,
    };
};
