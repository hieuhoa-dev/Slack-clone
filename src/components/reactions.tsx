import {Doc, Id} from "../../convex/_generated/dataModel";
import {useWorkspaceId} from "@/hooks/use-workspace-id";
import {useCurrentMember} from "@/features/members/api/use-current-member";
import {MdOutlineAddReaction} from "react-icons/md";

import {cn} from "@/lib/utils";

import {Hint} from "@/components/hint";
import {EmojiPopover} from "@/components/emoji-popover";

interface ReactionsProps {
    data: Array<
        Omit<Doc<"reactions">, "memberId"> & {
        count: number;
        memberIds: Id<"members">[];
    }>;
    onChange: (value: string) => void;
}

export const Reactions = ({
                              data,
                              onChange
                          }: ReactionsProps) => {
    const workspaceId = useWorkspaceId();
    const {data: member} = useCurrentMember({workspaceId});

    const currentMemberId = member?._id;

    if (data.length === 0 || !currentMemberId) {
        return null;
    }

    return (
        <div className="flex items-center gap-1 mt-1 mb-1">
            {data.map((reaction) => (
                <Hint
                    key={reaction.value}
                    label={`${reaction.count} ${reaction.count === 1 ? "person has" : "people have"} reacted with ${reaction.value}`}>
                    <button
                        onClick={() => onChange(reaction.value)}
                        className={cn(
                            "h-6 px-2 rounded-full bg-slate-200/70 border border-transparent text-slate-800 flex items-center justify-center gap-x-1",
                            reaction.memberIds.includes(currentMemberId) &&
                            "bg-blue-100/70 border-blue-500 text-white"
                        )}
                    >
                        {reaction.value}
                        <span className={cn(
                            "text-xs font-semibold text-muted-foreground",
                            reaction.memberIds.includes(currentMemberId) && "text-blue-500"
                        )}>
                        {reaction.count}
                    </span>
                    </button>
                </Hint>
            ))}
            <EmojiPopover
                hint="Add reaction"
                onEmojiSelect={(emoji) => onChange(emoji)}>
                <button
                    className="h-7 px-3 rounded-full bg-slate-200/70 border border-transparent text-slate-800
                     flex items-center justify-center hover:border-slate-500 gap-x-1">
                    <MdOutlineAddReaction className="size-3"/>
                </button>
            </EmojiPopover>
        </div>
    )
}