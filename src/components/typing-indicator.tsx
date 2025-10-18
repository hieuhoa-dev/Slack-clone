"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TypingIndicatorProps {
    typingUsers: Array<{
        _id: string;
        userId: string;
        name?: string;
        image?: string;
    }>;
}

export const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
    if (!typingUsers || typingUsers.length === 0) {
        return null;
    }

    const getTypingText = () => {
        const count = typingUsers.length;
        
        if (count === 1) {
            return `${typingUsers[0].name || "Someone"} is composing a message`;
        } else if (count === 2) {
            return `${typingUsers[0].name || "Someone"} and ${typingUsers[1].name || "someone"} are composing a message`;
        } else if (count === 3) {
            return `${typingUsers[0].name}, ${typingUsers[1].name} and ${typingUsers[2].name} are composing a message`;
        } else {
            return `${typingUsers[0].name}, ${typingUsers[1].name} and ${count - 2} the others are composing a message`;
        }
    };

    return (
        <div className="flex items-center gap-2 px-5 py-2 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
                {typingUsers.slice(0, 3).map((user) => (
                    <Avatar key={user._id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="text-xs">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                ))}
            </div>
            <span className="italic">{getTypingText()}</span>
            <div className="flex gap-1">
                <span className="animate-bounce font-bold" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce font-bold" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce font-bold" style={{ animationDelay: "300ms" }}>.</span>
            </div>
        </div>
    );
};
