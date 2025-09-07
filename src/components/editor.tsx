import Quill, {Delta, Op, type QuillOptions} from "quill";

import {RefObject, useEffect, useLayoutEffect, useRef, useState} from "react";
import {PiTextAa} from "react-icons/pi";
import {MdSend} from "react-icons/md";
import {ImageIcon, Smile} from "lucide-react";

import {Hint} from "@/components/hint";
import {Button} from "@/components/ui/button";

import "quill/dist/quill.snow.css";

import {cn} from "@/lib/utils";
import {EmojiPopover} from "@/components/emoji-popover";

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
}

const Editor = ({
                    defaultValue = [],
                    disabled = false,
                    variant = "create",
                    placeholder = "Write something...",
                    onSubmit, onCancel, innerRef,
                }: Props) => {
    const [text, setText] = useState("");
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);

    const submitRef = useRef(onSubmit);
    const placeholderRef = useRef(placeholder);
    const quillRef = useRef<Quill | null>(null);
    const defaultValueRef = useRef(defaultValue);
    const containerRef = useRef<HTMLDivElement>(null);
    const disabledRef = useRef(disabled);

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
                                //TODO: submit
                                return;
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

    const emojiSelect = (emoji: any) => {
        const quill = quillRef.current;
        const cursorPosition = quill?.getSelection()?.index || 0;
        quill?.insertText(cursorPosition, emoji.native);
    };

    const isEmpty = text.replace(/<(.n)*?>/g, "").trim().length === 0;

    return (
        <div className="flex flex-col">
            <div
                className="flex flex-col border border-slate-200 rounded-mmd
                overflow-hidden focus-within:ring-2 focus-within:ring-slate-400
                 focus-within:border-slate-300 focus-within:shadow-sm transition bg-white">
                <div ref={containerRef} className="h-full ql-custom"/>
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
                        <Hint label="Image">
                            <Button
                                disabled={disabled}
                                size="iconSm"
                                variant="ghost"
                                onClick={() => {
                                }}
                            >
                                <ImageIcon className="size-4"/>
                            </Button>
                        </Hint>
                    )}
                    {variant === "update" && (
                        <div className="ml-auto flex items-center gap-x-2">
                            <Button
                                disabled={disabled}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={disabled || isEmpty}
                                size="sm"
                                onClick={() => {
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