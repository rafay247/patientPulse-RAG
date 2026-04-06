"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

const exampleQueries = [
    "What was my blood pressure reading?",
    "Show me my vitamin D levels",
    "What were my cholesterol numbers?",
    "Are there any abnormal results?",
];

interface ChatInterfaceProps {
    hasDocuments: boolean;
}

export function ChatInterface({ hasDocuments }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (query: string) => {
        if (!query.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: "user",
            content: query,
        };

        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInputValue("");
        setIsLoading(true);

        // Add a temporary empty assistant message
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: currentMessages,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Failed to get response");
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No reader stream available!");

            const decoder = new TextDecoder("utf-8");
            let accumulatedMessage = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value, { stream: true });
                accumulatedMessage += textChunk;

                setMessages((prev) => {
                    const newMsgs = [...prev];
                    newMsgs[newMsgs.length - 1].content = accumulatedMessage;
                    return newMsgs;
                });
            }

        } catch (error: any) {
            setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].content = `Sorry, I encountered an error: ${error.message}`;
                return newMsgs;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(inputValue);
        }
    };

    return (
        <div className="flex flex-col h-full bg-card/10 relative">
            {/* Background elements */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:30px_30px] pointer-events-none" />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-10 hidden-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 animate-pulse" />
                            <div className="relative p-5 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 backdrop-blur-md">
                                <Sparkles className="h-10 w-10 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Ask about your medical documents</h2>
                        <p className="text-muted-foreground mb-8 max-w-md text-sm leading-relaxed">
                            Upload a medical PDF and ask questions. I'll use LangChain RAG to find relevant information and explain it clearly.
                        </p>

                        <div className="w-full max-w-lg">
                            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground/70 mb-4">Try these examples</p>
                            <div className="flex flex-wrap gap-2.5 justify-center">
                                {exampleQueries.map((query, i) => (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs bg-background/50 hover:bg-primary hover:text-primary-foreground border-border/50 transition-all duration-300 rounded-full hover:scale-105 active:scale-95 shadow-sm"
                                        onClick={() => handleSend(query)}
                                        disabled={isLoading || !hasDocuments}
                                    >
                                        {query}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {!hasDocuments && (
                            <div className="mt-8 flex items-center gap-2 text-sm text-yellow-500/80 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
                                <Info className="h-4 w-4" />
                                <span>Please upload a document to start asking questions</span>
                            </div>
                        )}
                    </div>
                ) : (
                    messages.map((message, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex gap-4 group animate-in slide-in-from-bottom-2 duration-300",
                                message.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            {message.role === "assistant" && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                            )}
                            {message.role === "user" && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shadow-md">
                                    <User className="h-5 w-5 text-accent-foreground" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "max-w-[85%] rounded-2xl px-5 py-4 shadow-sm",
                                    message.role === "user"
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-background/80 backdrop-blur-md border border-border/40 rounded-tl-sm empty:p-6"
                                )}
                            >
                                {message.content ? (
                                    <div 
                                        className="whitespace-pre-wrap text-[15px] leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html: message.content
                                                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\n\n/g, '<br/><br/>')
                                                .replace(/\n- /g, '<br/>• ') // Simple markdown list
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 border-t border-border/50 bg-background/80 backdrop-blur-xl relative z-10">
                <div className="relative flex items-center shadow-sm">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            !hasDocuments
                                ? "Upload a document first..."
                                : "Ask about your medical records..."
                        }
                        disabled={!hasDocuments || isLoading}
                        className="flex-1 pr-14 py-6 text-base rounded-full border-primary/20 focus-visible:ring-primary/30 bg-background"
                    />
                    <Button
                        onClick={() => handleSend(inputValue)}
                        disabled={!inputValue.trim() || !hasDocuments || isLoading}
                        size="icon"
                        className="absolute right-2 h-10 w-10 rounded-full transition-transform hover:scale-105"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5 ml-0.5" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
