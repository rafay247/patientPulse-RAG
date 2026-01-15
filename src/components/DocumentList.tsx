"use client";

import React from "react";
import { FileText, Trash2, Calendar, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParsedDocument, deleteDocumentFromStorage } from "@/lib/pdfParser";
import { removeDocumentFromStore } from "@/lib/vectorStore";

interface DocumentListProps {
    documents: ParsedDocument[];
    onDocumentRemoved: (docId: string) => void;
}

export function DocumentList({ documents, onDocumentRemoved }: DocumentListProps) {
    const handleDelete = async (doc: ParsedDocument) => {
        await deleteDocumentFromStorage(doc.id);
        await removeDocumentFromStore(doc.id);
        onDocumentRemoved(doc.id);
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
            <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No documents uploaded yet</p>
                <p className="text-sm mt-1">Upload a PDF to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    className="group flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            <File className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium truncate text-sm" title={doc.filename}>
                                {doc.filename}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(doc.uploadedAt)}</span>
                                <span>•</span>
                                <span>{doc.pageCount} page{doc.pageCount !== 1 ? "s" : ""}</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(doc)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
