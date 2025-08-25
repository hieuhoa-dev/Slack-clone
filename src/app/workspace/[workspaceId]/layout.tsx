"use client"



import {Sidebar} from "@/app/workspace/[workspaceId]/sidebar";

interface WorkspaceIdLayoutProps {
    children: React.ReactNode;
}

const WorkspaceIdLayout = ({
                               children
                           }: WorkspaceIdLayoutProps) => {
    return (
        <div className="h-full">

            <div className="flex h-[calc(100vh-40px)]">
                <Sidebar/>
                {children}
            </div>
        </div>
    )
}

export default WorkspaceIdLayout;