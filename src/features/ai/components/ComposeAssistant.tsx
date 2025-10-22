import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {cn} from "@/lib/utils";
import {Check, X, RefreshCw} from "lucide-react";
import {useState, useEffect} from "react";

interface Props {
    children?: React.ReactNode;
    generatedContent: string | null;
    isGenerating: boolean;
    onAccept: (content: string) => void;
    onReject: () => void;
    onRegenerate: () => void;
}

export const ComposeAssistant = ({
                                     children,
                                     generatedContent,
                                     isGenerating,
                                     onAccept,
                                     onReject,
                                     onRegenerate
                                 }: Props) => {
    const [open, setOpen] = useState(false);

    // Auto open popover when there is content or generating
    useEffect(() => {
        if (isGenerating || generatedContent) {
            setOpen(true);
        }
    }, [isGenerating, generatedContent]);

    const handleAccept = () => {
        if (generatedContent) {
            onAccept(generatedContent);
            setOpen(false);
        }
    };

    const handleReject = () => {
        onReject();
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent 
                className="w-96 p-0" 
                align="start"
                side="top"
            >
                <div className="flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#5E2C5F] animate-pulse" />
                            <h3 className="font-semibold text-sm text-gray-900">
                                AI Assistant
                            </h3>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            {isGenerating ? "Is creating content..." : "Suggested improvements"}
                        </p>
                    </div>

                    {/* Content Preview */}
                    <div className="p-4 max-h-64 overflow-y-auto">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-3">
                                <div className="w-8 h-8 border-4 border-purple-200 border-t-[#5E2C5F] rounded-full animate-spin" />
                                <p className="text-sm text-gray-500">
                                    AI is analyzing and improving content...
                                </p>
                            </div>
                        ) : generatedContent ? (
                            <div className="prose prose-sm max-w-none">
                                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    {generatedContent}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500">
                                    No content created yet
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {!isGenerating && generatedContent && (
                        <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRegenerate}
                                className="text-[#5E2C5F] hover:text-[#481349] hover:bg-purple-50"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                            
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReject}
                                    className="border-gray-300 hover:bg-gray-100"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                   Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAccept}
                                    className="bg-[#5E2C5F] hover:bg-[#481349] text-white"
                                >
                                    <Check className="w-4 h-4 mr-1" />
                                    Accept
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};