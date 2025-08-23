interface WorkspaceIdProps {
    params: Promise<{
        workspaceId: string
    }>
}

const WorkspaceIdPage = async ({params}: WorkspaceIdProps) => {
    const {workspaceId} = await params;

    return (
        <div>
            ID: {workspaceId}
        </div>
    )
}

export default WorkspaceIdPage;