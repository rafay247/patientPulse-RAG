"use client";

import React, { useState, useEffect } from "react";
import { Activity, FileText, MessageSquare, ShieldCheck, HeartPulse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";

export interface DocumentMeta {
    id: string;
    filename: string;
    type: string;
    size: number;
    uploadDate: string;
}

export default function Home() {
    const [documents, setDocuments] = useState<DocumentMeta[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Load documents from server on mount
    useEffect(() => {
        setMounted(true);
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const res = await fetch("/api/documents");
            const data = await res.json();
            if (Array.isArray(data)) {
                setDocuments(data);
            }
        } catch (e) {
            console.error("Failed to load documents", e);
        }
    };

    const handleDocumentAdded = () => {
        loadDocuments();
    };

    const handleDocumentRemoved = async () => {
        loadDocuments();
    };

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Activity className="h-8 w-8 text-primary animate-pulse" />
            </div>
        );
    }

    return (
        <main className="min-h-screen p-4 md:p-6 lg:p-8 fade-in relative overflow-hidden bg-background">
            {/* Subtle grid + vignette */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.55] dark:opacity-[0.35]">
                <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_70%_-10%,hsl(var(--primary)/0.18),transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(800px_500px_at_-10%_30%,hsl(var(--primary)/0.10),transparent_55%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.22))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.55))]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.55)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_72%)]" />
            </div>

            {/* Header */}
            <header className="mb-8 slide-up flex items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start md:items-center gap-4 min-w-0">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-2xl vitals-strip noise-surface overflow-hidden flex items-center justify-center">
                            <HeartPulse className="h-6 w-6 text-primary drop-shadow-[0_0_18px_hsl(var(--primary)/0.25)]" />
                        </div>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-display leading-none tracking-tight">
                                PatientPulse
                            </h1>
                            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                                medical document assistant
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/40 px-3 py-1 backdrop-blur-sm">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                Source-grounded answers
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/25 px-3 py-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                LangChain RAG
                            </span>
                        </div>
                    </div>
                </div>
                <div className="pt-1">
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] relative z-10">
                {/* Left Panel - Documents */}
                <div className="lg:col-span-4 flex flex-col gap-6 stagger-children">
                    
                    {/* Upload */}
                    <Card className="glass border-border/70 shadow-xl overflow-hidden relative group noise-surface">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(600px_280px_at_20%_0%,hsl(var(--primary)/0.14),transparent_60%)]" />
                        <CardHeader className="pb-3 relative z-10">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Upload Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <DocumentUpload
                                onDocumentAdded={handleDocumentAdded}
                                onUploading={setIsUploading}
                            />
                        </CardContent>
                    </Card>

                    {/* Document List */}
                    <Card className="glass shadow-lg flex-1 overflow-hidden flex flex-col border-border/70 noise-surface">
                        <CardHeader className="pb-3 border-b border-border/60 bg-card/30">
                            <CardTitle className="text-lg flex justify-between items-center">
                                <span>Your Documents</span>
                                <span className="text-[11px] px-2.5 py-1 rounded-full border border-border/70 bg-card/40 text-primary font-medium tracking-wide">
                                    {documents.length}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-y-auto flex-1 p-0">
                            <DocumentList
                                documents={documents}
                                onDocumentRemoved={handleDocumentRemoved}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Chat */}
                <Card className="lg:col-span-8 glass shadow-2xl flex flex-col overflow-hidden border-border/70 group noise-surface">
                    <CardHeader className="pb-3 border-b border-border/60 bg-card/20">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-secondary" />
                            Ask PatientPulse
                            {isUploading && (
                                <span className="ml-auto flex items-center text-[11px] text-primary bg-card/40 px-3 py-1 rounded-full border border-border/70">
                                    <Activity className="w-3 h-3 mr-2 animate-spin" /> Indexing document…
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden bg-background/50 backdrop-blur-sm">
                        <ChatInterface
                            hasDocuments={documents.length > 0}
                        />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
