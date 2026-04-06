"use client";

import React, { useState } from "react";
import { FileText, Trash2, Calendar, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentMeta {
    id: string;
    filename: string;
    type: string;
    size: number;
    uploadDate: string;
}

interface DocumentListProps {
    documents: DocumentMeta[];
    onDocumentRemoved: () => void;
}

export function DocumentList({ documents, onDocumentRemoved }: DocumentListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                onDocumentRemoved();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (isoDate: string) => {
        return new Date(isoDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    if (documents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-muted/30">
                <div className="p-4 bg-muted/20 rounded-full mb-3">
                    <FileText className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium text-foreground/70">No documents yet</p>
                <p className="text-xs mt-1 text-center">Upload a medical report to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 p-2 hidden-scrollbar">
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    className="group flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/50 transition-all border border-border/40 shadow-sm hover:shadow-md"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0 border border-primary/10 group-hover:from-primary/30 transition-colors">
                            <File className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold truncate text-sm text-foreground/90" title={doc.filename}>
                                {doc.filename}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1.5 bg-background px-1.5 py-0.5 rounded-md border border-border/50 shadow-sm">
                                    <Calendar className="h-3 w-3 text-primary/70" />
                                    {formatDate(doc.uploadDate)}
                                </span>
                                <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 ml-2 flex-shrink-0"
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                    >
                        {deletingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            ))}
        </div>
    );
}
