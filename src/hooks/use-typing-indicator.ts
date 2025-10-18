import {useEffect, useRef, useCallback} from "react";
import {Id} from "../../convex/_generated/dataModel";
import {useSetTypingStatus} from "@/features/typing-statuses/api/use-set-typing-status";

interface UseTypingIndicatorProps {
    workspaceId: Id<"workspaces">;
    memberId: Id<"members">;
    channelId?: Id<"channels">;
    conversationId?: Id<"conversations">;
}

/**
 * Hook quản lý trạng thái typing indicator
 * - Gửi signal khi user đang typing
 * - Throttle để tránh spam API (chỉ gửi mỗi 2 giây)
 * - Tự động cleanup sau 5 giây không hoạt động
 */
export const useTypingIndicator = ({
                                       workspaceId,
                                       memberId,
                                       channelId,
                                       conversationId,
                                   }: UseTypingIndicatorProps) => {
    // Hook để set typing status (backend tự động handle create/update)
    const {mutate: setTypingStatus} = useSetTypingStatus();

    // Ref để lưu timeout ID, dùng để clear timeout khi cần
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Ref để lưu timestamp của lần gửi cuối, dùng cho throttling
    const lastUpdateRef = useRef<number>(0);

    /**
     * Hàm thông báo user đang typing
     * - Throttle: Chỉ gửi API nếu đã qua ít nhất 2 giây kể từ lần cuối
     * - Auto cleanup: Typing status sẽ expire sau 5 giây (backend filter)
     */
    const notifyTyping = useCallback(() => {
        const now = Date.now();

        // Throttling: Chỉ gửi update nếu đã qua ít nhất 2 giây kể từ lần cuối
        // Điều này tránh spam API khi user typing liên tục
        if (now - lastUpdateRef.current < 2000) {
            return;
        }

        // Cập nhật timestamp lần gửi cuối
        lastUpdateRef.current = now;

        // Gửi typing status lên server
        // Backend sẽ tự động tạo mới hoặc update typing status hiện có
        setTypingStatus({
            workspaceId,
            memberId,
            channelId,
            conversationId,
            lastSeenAt: now, // Timestamp hiện tại, backend dùng để filter expired status
        });

        // Clear timeout cũ nếu có
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set timeout để reset throttle sau 5 giây không hoạt động
        // Sau 5 giây, nếu user typing lại thì sẽ gửi API ngay lập tức
        timeoutRef.current = setTimeout(() => {
            lastUpdateRef.current = 0;
            setTypingStatus({
                workspaceId,
                memberId,
                channelId,
                conversationId,
                lastSeenAt: lastUpdateRef.current,
            });
            timeoutRef.current = null;
        }, 5000);
    }, [workspaceId, memberId, channelId, conversationId, setTypingStatus]);

    /**
     * Cleanup effect
     * - Clear timeout khi component unmount
     * - Không cần remove typing status vì backend tự động filter các status quá 5 giây
     */
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {notifyTyping};
};