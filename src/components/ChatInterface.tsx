"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatMessage, exampleQueries, formatContextForPrompt } from "@/lib/ai-config";
import { searchSimilar } from "@/lib/vectorStore";

interface ChatInterfaceProps {
    hasDocuments: boolean;
    isModelLoading: boolean;
}

export function ChatInterface({ hasDocuments, isModelLoading }: ChatInterfaceProps) {
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
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            // Search for relevant chunks
            const searchResults = await searchSimilar(query, 3);
            const contextChunks = searchResults.map((r) => ({
                text: r.chunk.text,
                documentName: r.chunk.documentName,
                score: r.score,
            }));

            const context = formatContextForPrompt(contextChunks);

            // Call API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    context,
                    chatHistory: messages.slice(-6),
                }),
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                // If it's HTML (error page), try to extract message or just show generic error
                console.error("Non-JSON response:", text);
                throw new Error(response.statusText || "Server returned a non-JSON response. Check API key configuration.");
            }

            if (!response.ok) {
                throw new Error(data.error || "Failed to get response");
            }

            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: data.message,
                sources: contextChunks.map((c) => ({
                    documentName: c.documentName,
                    score: c.score,
                })),
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                role: "assistant",
                content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
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
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Ask about your medical documents</h2>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Upload a medical PDF and ask questions. I&apos;ll find relevant information and explain it clearly.
                        </p>

                        {hasDocuments && (
                            <div className="w-full max-w-md">
                                <p className="text-sm text-muted-foreground mb-3">Try these example questions:</p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {exampleQueries.slice(0, 4).map((query, i) => (
                                        <Button
                                            key={i}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() => handleSend(query)}
                                            disabled={isLoading || isModelLoading}
                                        >
                                            {query}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasDocuments && (
                            <p className="text-sm text-muted-foreground">
                                👈 Start by uploading a PDF document
                            </p>
                        )}
                    </div>
                ) : (
                    messages.map((message, i) => (
                        <div
                            key={i}
                            className={cn(
                                "message-in flex gap-3",
                                message.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            {message.role === "assistant" && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-white" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3",
                                    message.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                {message.sources && message.sources.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-border/50">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <FileText className="h-3 w-3" />
                                            <span>Sources:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {Array.from(new Set(message.sources.map((s) => s.documentName))).map(
                                                (name, j) => (
                                                    <span
                                                        key={j}
                                                        className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary"
                                                    >
                                                        {name}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {message.role === "user" && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex gap-3 message-in">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3">
                            <div className="loading-dots flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card/50">
                <div className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={
                            !hasDocuments
                                ? "Upload a document first..."
                                : isModelLoading
                                    ? "Loading AI model..."
                                    : "Ask about your medical records..."
                        }
                        disabled={!hasDocuments || isLoading || isModelLoading}
                        className="flex-1"
                    />
                    <Button
                        onClick={() => handleSend(inputValue)}
                        disabled={!inputValue.trim() || !hasDocuments || isLoading || isModelLoading}
                        size="icon"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
                {isModelLoading && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading embedding model (first time only)...
                    </p>
                )}
            </div>
        </div>
    );
}
