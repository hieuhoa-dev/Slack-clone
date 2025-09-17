import {toast} from 'sonner';
import {useState} from "react";
import {useRouter} from "next/navigation";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';

import {useWorkspaceId} from "@/hooks/use-workspace-id";
import {useCreateChannel} from "@/features/channels/api/use-create-channel";
import {useCreateChannelModal} from "@/features/channels/store/use-create-channel-modal";

export const CreateChannelModal = () => {
    
    const router = useRouter();
    const workspaceId = useWorkspaceId();

    const [open, setOpen] = useCreateChannelModal();
    const [name, setName] = useState("");

    const {mutate, isPending} = useCreateChannel();

    const handleClose = () => {
        setOpen(false);
        setName("");
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        mutate({name, workspaceId}, {
            onSuccess: async (id) => {
                toast.success("Channel created");
                router.push(`/workspace/${workspaceId}/channel/${id}`);
                handleClose();
            },
            onError: (error) => {
                toast.error(error.message || "Failed to create channel");
            }
        })
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\s+/g, '-').toLowerCase();
        setName(value);
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Add a channel
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        value={name}
                        onChange={handleChange}
                        disabled={isPending}
                        required
                        autoFocus
                        minLength={3}
                        maxLength={80}
                        placeholder="e.g. plan-budget"
                    />
                    <div className="flex justify-end">
                        <Button disabled={isPending}>
                            Create
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}