"use client";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup,} from "@/components/ui/resizable";
import {Sidebar} from "@/app/workspace/[workspaceId]/sidebar";
import {Toolbar} from "./toolbar";
import {WorkspaceSidebar} from "./workspace-sidebar";
import {Thread} from "@/features/messages/components/thread";

import {usePanel} from "@/hooks/use-panel";
import {Loader} from "lucide-react";
import {Id} from "../../../../convex/_generated/dataModel";

interface WorkspaceIdLayoutProps {
    children: React.ReactNode;
}

const WorkspaceIdLayout = ({
                               children
                           }: WorkspaceIdLayoutProps) => {
    const {parentMessageId, onClose} = usePanel();

    const showPanel = !!parentMessageId;

    return (
        <div className="h-full">
            <Toolbar/>
            <div className="flex h-[calc(100vh-40px)]">
                <Sidebar/>
                <ResizablePanelGroup
                    direction="horizontal"
                    autoSaveId="ca-workspace-layout">
                    <ResizablePanel
                        defaultSize={20}
                        minSize={11}
                        className="bg-[#5E2C5F]">
                        <WorkspaceSidebar/>
                    </ResizablePanel>
                    <ResizableHandle withHandle/>
                    <ResizablePanel minSize={20}>

                        {children}
                    </ResizablePanel>
                    {showPanel && (
                        <>
                            <ResizableHandle withHandle/>
                            <ResizablePanel minSize={20} defaultSize={29}>
                                {parentMessageId ? (
                                    <Thread
                                        messageId={parentMessageId as Id<"messages">}
                                        onClose={onClose}
                                    />
                                ) : (
                                    <div className="flex items-center justify-between h-full">
                                        <Loader className="size-5 animate-spin text-muted-foreground"/>
                                    </div>
                                )}
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>

            </div>
        </div>
    )
}

export default WorkspaceIdLayout;