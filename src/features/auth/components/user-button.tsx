"use client";

import {
    Avatar,
    AvatarFallback,
    AvatarImage
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import {useAuthActions} from "@convex-dev/auth/react";
import {Loader, LogOut} from "lucide-react";
import {useCurrentUser} from "@/features/auth/api/use-current-user";


export const UserButton = () => {
    const {signOut} = useAuthActions();
    const {data, isLoading} = useCurrentUser();

    if (isLoading)
        return <Loader className="size-4 animate-spin text-muted-foreground"/>;

    if (!data) return null;

    const {name, image} = data;

    const avatarImage = name!.charAt(0).toUpperCase();

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="outline-none relative">
                <Avatar className="size-10 hover:opacity-75 transition">
                    <AvatarImage src={image} alt={name}/>
                    <AvatarFallback className="bg-sky-100 text-white">
                        {avatarImage}
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="right" className="w-60">
                <DropdownMenuItem onClick={signOut} className="h-10">
                    <LogOut className="size-4 mr-2"/>
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}