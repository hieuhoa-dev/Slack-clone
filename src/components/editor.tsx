import Image from "next/image";
import Quill, {Delta, Op, type QuillOptions} from "quill";
import {RefObject, useEffect, useLayoutEffect, useRef, useState} from "react";

import {PiTextAa} from "react-icons/pi";
import {MdSend} from "react-icons/md";
import {ImageIcon, Smile, XIcon, SparklesIcon} from "lucide-react";

import {Hint} from "@/components/hint";
import {Button} from "@/components/ui/button";
import {EmojiPopover} from "@/components/emoji-popover";

import "quill/dist/quill.snow.css";

import {cn} from "@/lib/utils";
import {useGenerateContent} from "@/features/ai/api/generate-content";
import {ComposeAssistant} from "@/features/ai/components/ComposeAssistant";

type EditorValue = {
    image: File | null;
    body: string;
}

interface Props {
    onSubmit: ({image, body}: EditorValue) => void;
    onCancel?: () => void;
    placeholder?: string;
    defaultValue?: Delta | Op[];
    disabled?: boolean;
    innerRef?: RefObject<Quill | null>;
    variant?: "create" | "update";
    onTyping?: () => void;
}

const Editor = ({
                    defaultValue = [],
                    disabled = false,
                    variant = "create",
                    placeholder = "Write something...",
                    onSubmit, onCancel, innerRef, onTyping,
                }: Props) => {
    const [text, setText] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);
    const [generatedContent, setGeneratedContent] = useState<string | null>(null);

    const submitRef = useRef(onSubmit);
    const placeholderRef = useRef(placeholder);
    const quillRef = useRef<Quill | null>(null);
    const defaultValueRef = useRef(defaultValue);
    const containerRef = useRef<HTMLDivElement>(null);
    const disabledRef = useRef(disabled);
    const imageElementRef = useRef<HTMLInputElement>(null);

    const {mutate: generateContent, isPending: isGenerating} = useGenerateContent();

    const handleGenerateContent = async () => {
        const quill = quillRef.current;
        if (!quill) return;

        const currentText = quill.getText().trim();
        if (!currentText) {
            return;
        }

        // Reset generated content trước khi generate mới
        setGeneratedContent(null);

        try {
            const improvedText = await generateContent(
                {message: currentText},
                {throwError: true}
            );

            if (improvedText) {
                setGeneratedContent(improvedText);
            }
        } catch (error) {
            console.error("Failed to generate content:", error);
            setGeneratedContent(null);
        }
    };


    const handleAcceptContent = (content: string) => {
        const quill = quillRef.current;
        if (!quill) return;

        quill.setText(content);
        setText(content);
        setGeneratedContent(null);
    };


    const handleRejectContent = () => {
        setGeneratedContent(null);
    };


    const handleRegenerateContent = () => {
        handleGenerateContent();
    };

    useLayoutEffect(() => {
        submitRef.current = onSubmit;
        placeholderRef.current = placeholder;
        defaultValueRef.current = defaultValue;
        disabledRef.current = disabled;
    });

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const editorContainer = container.appendChild(
            container.ownerDocument.createElement("div"),
        );

        const options: QuillOptions = {
            theme: "snow",
            placeholder: placeholderRef.current,
            modules: {
                toolbar: [
                    ["bold", "italic", "strike"],
                    ["link"],
                    [{list: "ordered"}, {list: "bullet"}],
                ],
                keyboard: {
                    bindings: {
                        enter: {
                            key: "Enter",
                            handler: () => {
                                const text = quill.getText();
                                const addedImage = imageElementRef.current?.files?.[0] || null;

                                const isEmpty = !addedImage && text.replace(/<(.n)*?>/g, "").trim().length === 0;

                                if (isEmpty) return;

                                const body = JSON.stringify(quill.getContents());
                                submitRef.current?.({body, image: addedImage});
                            }
                        },
                        shift_enter: {
                            key: "Enter",
                            shiftKey: true,
                            handler: () => {
                                quill.insertText(quill.getSelection()?.index || 0, "\n");
                            },
                        },
                    },
                },
            },
        };

        const quill = new Quill(editorContainer, options);
        quillRef.current = quill;
        quillRef.current.focus();

        if (innerRef)
            innerRef.current = quill;

        quill.setContents(defaultValueRef.current);
        setText(quill.getText());

        quill.on(Quill.events.TEXT_CHANGE, () => {
            setText(quill.getText());
            onTyping?.();
        })

        return () => {
            quill.off(Quill.events.TEXT_CHANGE);
            if (container) {
                container.innerHTML = "";
            }
            if (quillRef.current) {
                quillRef.current = null;
            }
            if (innerRef) {
                innerRef.current = null;
            }
        }
    }, [innerRef]);

    const toggleToolbar = () => {
        setIsToolbarVisible((current) => !current);
        const toolbarElement = containerRef.current?.querySelector(".ql-toolbar");

        if (toolbarElement) {
            if (isToolbarVisible) {
                toolbarElement.classList.toggle("hidden");
            }
        }
    }

    const emojiSelect = (emojiValue: string) => {
        const quill = quillRef.current;
        const cursorPosition = quill?.getSelection()?.index || 0;
        quill?.insertText(cursorPosition, emojiValue);
    };

    const isEmpty = !image && text.replace(/<(.n)*?>/g, "").trim().length === 0;

    return (
        <div className="flex flex-col">
            <input
                type="file"
                accept="image/*"
                ref={imageElementRef}
                onChange={(e) => setImage(e.target.files![0])}
                className="hidden"
            />
            <div
                className={cn(
                    "flex flex-col border border-slate-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-slate-400 focus-within:border-slate-300 focus-within:shadow-sm z-[1] transition bg-white",
                    disabled && "opacity-50"
                )}>
                <div ref={containerRef} className="h-full ql-custom"/>
                {!!image && (
                    <div className="p-2">
                        <div className="relative size-[62px] flex items-center justify-center group/image">
                            <Hint label="Remove image">
                                <button
                                    onClick={() => {
                                        setImage(null);
                                        imageElementRef.current!.value = "";
                                    }}
                                    className="hidden group-hover/image:flex rounded-full bg-black/70
                                hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4]
                                border-2 border-white items-center justify-center"
                                >
                                    <XIcon className="size-3.5"/>
                                </button>
                            </Hint>
                            <Image
                                src={URL.createObjectURL(image)}
                                alt="Uploaded image"
                                fill
                                className="rounded-xl overflow-hidden border object-cover"
                            />
                        </div>
                    </div>
                )}
                <div className="flex px-2 pb-2 z-[5]">
                    <Hint label={isToolbarVisible ? "Hide formatting" : "Show formatting"}>
                        <Button
                            disabled={disabled}
                            size="iconSm"
                            variant="ghost"
                            onClick={toggleToolbar}
                        >
                            <PiTextAa className="size-4"/>
                        </Button>
                    </Hint>
                    <Hint label="Emoji">
                        <EmojiPopover
                            onEmojiSelect={emojiSelect}
                        >
                            <Button
                                disabled={disabled}
                                size="iconSm"
                                variant="ghost"
                            >
                                <Smile className="size-4"/>
                            </Button>
                        </EmojiPopover>
                    </Hint>
                    {variant === "create" && (
                        <>
                            <Hint label="Image">
                                <Button
                                    disabled={disabled}
                                    size="iconSm"
                                    variant="ghost"
                                    onClick={() => imageElementRef.current?.click()}
                                >
                                    <ImageIcon className="size-4"/>
                                </Button>
                            </Hint>
                            <Hint label="Improve with AI">
                                <ComposeAssistant
                                    generatedContent={generatedContent}
                                    isGenerating={isGenerating}
                                    onAccept={handleAcceptContent}
                                    onReject={handleRejectContent}
                                    onRegenerate={handleRegenerateContent}
                                >
                                    <Button
                                        disabled={
                                            text.replace(/<(.n)*?>/g, "").trim().length === 0
                                            || isGenerating
                                        }
                                        size="iconSm"
                                        variant="ghost"
                                        onClick={handleGenerateContent}
                                    >
                                        <SparklesIcon
                                            className={cn(
                                                "size-4 text-muted-foreground transition-all duration-300",
                                                isGenerating && "rainbow"
                                            )}
                                        />
                                    </Button>
                                </ComposeAssistant>
                            </Hint>
                        </>
                    )}
                    {variant === "update" && (
                        <div className="ml-auto flex items-center gap-x-2">
                            <Button
                                disabled={disabled}
                                variant="outline"
                                size="sm"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={disabled || isEmpty}
                                size="sm"
                                onClick={() => {
                                    onSubmit({
                                        body: JSON.stringify(quillRef.current?.getContents()),
                                        image,
                                    })
                                }}
                                className=" bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
                            >
                                Save
                            </Button>
                        </div>
                    )}
                    {variant === "create" && (
                        <Button
                            disabled={disabled || isEmpty}
                            onClick={() => {
                                onSubmit({
                                    body: JSON.stringify(quillRef.current?.getContents()),
                                    image,
                                })
                            }}
                            size="sm"
                            className={cn(
                                "ml-auto",
                                isEmpty
                                    ? "bg-white  hover:bg-white text-muted-foreground"
                                    : "bg-[#007a5a] hover:bg-[#007a5a]/80 text-white")}
                        >
                            <MdSend className="size-4"/>
                        </Button>
                    )}
                </div>
            </div>
            {variant === "create" && (
                <div className={cn(
                    "p-2 text-[10px] text-muted-foreground flex justify-end opacity-0 transition",
                    !isEmpty && "opacity-100"
                )}>
                    <p>
                        <strong>Shift + Return</strong> to add a new line.
                    </p>
                </div>
            )}
        </div>
    )
}

export default Editor;