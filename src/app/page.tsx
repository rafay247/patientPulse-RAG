"use client";

import React, { useState, useEffect } from "react";
import { Activity, FileText, MessageSquare, Zap, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getDocumentsFromStorage, ParsedDocument } from "@/lib/pdfParser";
import { loadVectorStore, getChunkCount } from "@/lib/vectorStore";

export default function Home() {
    const [documents, setDocuments] = useState<ParsedDocument[]>([]);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [chunkCount, setChunkCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    // Load documents from storage on mount
    useEffect(() => {
        setMounted(true);
        const loadData = async () => {
            const stored = await getDocumentsFromStorage();
            setDocuments(stored);
            await loadVectorStore();
            setChunkCount(getChunkCount());
        };
        loadData();
    }, []);

    const handleDocumentAdded = (doc: ParsedDocument) => {
        setDocuments((prev) => [...prev, doc]);
        setChunkCount(getChunkCount());
    };

    const handleDocumentRemoved = async (docId: string) => {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        // Note: The actual deletion from storage happens in DocumentList
        // We just update the UI state here
        // But we re-fetch chunk count after a slight delay to ensure sync inside DocumentList logic completed
        // Or better, we trust DocumentList to have called the removal functions.
        // Actually, we can just update the chunk count here?
        // Ideally handleDocumentRemoved should just update UI.

        // Let's refactor: The parent (Page) should own the deletion logic if possible 
        // OR the child calls the deletion and tells parent to update.
        // DocumentList calls onDocumentRemoved AFTER deletion.
        // So we just update the chunk count.

        // Since deletion in vectorStore is async, we might need to wait, but onDocumentRemoved is synchronous callback.
        // We will assume DocumentList handles the async await internally before calling this.

        // Wait, if DocumentList calls onDocumentRemoved AFTER await, then we are good.
        // If it calls it BEFORE, then getChunkCount might be stale.
        // Let's check DocumentList.

        setChunkCount(getChunkCount());
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Activity className="h-8 w-8 text-primary animate-pulse" />
            </div>
        );
    }

    return (
        <main className="min-h-screen p-4 md:p-6 lg:p-8 fade-in">
            {/* Header */}
            <header className="mb-8 slide-up flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/10 pulse-glow">
                        <Heart className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold gradient-text">PatientPulse</h1>
                </div>
                <ThemeToggle />
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
                {/* Left Panel - Documents */}
                <div className="lg:col-span-1 flex flex-col gap-4 stagger-children">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="glass hover-lift">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                                    <FileText className="h-5 w-5 text-sky-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{documents.length}</p>
                                    <p className="text-xs text-muted-foreground">Documents</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="glass hover-lift">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{chunkCount}</p>
                                    <p className="text-xs text-muted-foreground">Embeddings</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Upload */}
                    <Card className="glass">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Upload Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DocumentUpload
                                onDocumentAdded={handleDocumentAdded}
                                onModelLoading={setIsModelLoading}
                            />
                        </CardContent>
                    </Card>

                    {/* Document List */}
                    <Card className="glass flex-1 overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Your Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-y-auto max-h-[300px]">
                            <DocumentList
                                documents={documents}
                                onDocumentRemoved={handleDocumentRemoved}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Chat */}
                <Card className="lg:col-span-2 glass flex flex-col overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Ask PatientPulse
                            {isModelLoading && (
                                <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-primary pulse-dot"></span>
                                    Loading AI...
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ChatInterface
                            hasDocuments={documents.length > 0}
                            isModelLoading={isModelLoading}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <footer className="mt-6 text-center text-xs text-muted-foreground">
                <p>
                    🔒 Your documents are processed locally. Only your questions are sent to Claude AI.
                </p>
            </footer>
        </main>
    );
}
