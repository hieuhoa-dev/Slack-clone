import {api} from "../../../../convex/_generated/api";
import {useAction} from "convex/react";
import {useCallback, useMemo, useState} from "react";

type RequestType = { message: string };

/**
 * Response type từ AI
 * @property text - Nội dung đã được cải thiện
 */
type ResponseType = string | null;

type Options = {
    onSuccess?: (data: ResponseType) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
    throwError?: boolean;
};

/**
 * Hook để gọi AI cải thiện nội dung tin nhắn
 * 
 * Usage:
 * ```tsx
 * const { mutate, isPending } = useGenerateContent();
 * 
 * const handleGenerate = async () => {
 *   const result = await mutate({ message: "Your text" });
 *   console.log(result); // Improved text
 * };
 * ```
 */
export const useGenerateContent = () => {
    const [data, setData] = useState<ResponseType>(null);
    const [error, setError] = useState<Error | null>(null);
    const [status, setStatus] = useState<"success" | "error" | "settled" | "pending" | null>(null);

    const isPending = useMemo(() => status === "pending", [status]);
    const isSuccess = useMemo(() => status === "success", [status]);
    const isError = useMemo(() => status === "error", [status]);
    const isSettled = useMemo(() => status === "settled", [status]);

    const action = useAction(api.ai.generate);

    const mutate = useCallback(async (values: RequestType, options?: Options) => {
        try {
            setData(null);
            setError(null);
            setStatus("pending");

            const response = await action(values);
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
    }, [action]);

    return {
        mutate,
        data,
        error,
        isPending,
        isSuccess,
        isError,
        isSettled,
    };
}