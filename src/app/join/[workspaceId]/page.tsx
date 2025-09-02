"use client";

import {toast} from "sonner";
import Link from "next/link";
import {useEffect, useMemo} from "react";
import Image from "next/image";
import {Loader} from "lucide-react";
import {useRouter} from "next/navigation";
import VerificationInput from "react-verification-input";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {useWorkspaceId} from "@/hooks/use-workspace-id";
import {useJoin} from "@/features/workspaces/api/use-join";
import {useGetWorkspaceInfo} from "@/features/workspaces/api/use-get-workspace-info";


const JoinPage = () => {
    const workspaceId = useWorkspaceId();

    const router = useRouter();
    const {mutate, isPending} = useJoin();
    const {data, isLoading} = useGetWorkspaceInfo({id: workspaceId});

    const isMember = useMemo(() => data?.isMember, [data?.isMember]);

    useEffect(() => {
        if (isMember) {
            toast.success("You are already a member of this workspace");
            router.replace(`/workspace/${workspaceId}`);
        }
    }, [isMember, router, workspaceId]);

    const handleComplete = (value: string) => {
        mutate({workspaceId, joinCode: value}, {
            onSuccess: (id) => {
                toast.success("Workspace joined successfully!");
                router.replace(`/workspace/${id}`);
            },
            onError: () => {
                toast.error("Failed to join workspace");
            }
        });
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader className="size-6 text-muted-foreground"/>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col gap-y-8 items-center justify-center bg-white rounded-lg shadow-md">
            <Image src="/logo.svg" alt="Logo" width={60} height={60}/>
            <div className="flex flex-col gap-y-4 items-center justify-center max-w-md">
                <div className="flex flex-col gap-y-2 items-center justify-center ">
                    <h1 className="text-2xl font-bold ">
                        Join {data?.name}
                    </h1>
                    <p className="text-md text-muted-foreground">
                        Enter the workspace to collaborate with your team.
                    </p>
                </div>
                <VerificationInput
                    onComplete={handleComplete}
                    length={6}
                    classNames={{
                        container: cn("!flex !gap-2", isPending && "!opacity-50 !pointer-not-allowed"),
                        character: "!uppercase !h-auto !rounded-md !border !border-gray-300 !flex !items-center !justify-center !text-lg !font-medium !text-gray-500",
                        characterInactive: "!bg-muted",
                        characterSelected: "!bg-white !text-black",
                        characterFilled: "!bg-white !text-black",
                    }}
                    autoFocus
                />
                <div className="flex gap-x-4">
                    <Button
                        size="lg"
                        variant="outline"
                        asChild
                    >
                        <Link href="/">
                            Back to home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default JoinPage;