"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
    onDocumentAdded: () => void;
    onUploading: (loading: boolean) => void;
}

export function DocumentUpload({ onDocumentAdded, onUploading }: DocumentUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [error, setError] = useState<string | null>(null);

    const processFile = async (file: File) => {
        if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
            setError("Please upload a PDF or Image (PNG, JPG) file");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("File size must be less than 10MB");
            return;
        }

        setError(null);
        setIsProcessing(true);
        onUploading(true);

        try {
            setProcessingStatus("Uploading and processing with LangChain...");
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to process document");
            }

            onDocumentAdded();
            setProcessingStatus("");
        } catch (err: any) {
            console.error("Processing error:", err);
            setError(err.message || "Failed to process document");
        } finally {
            setIsProcessing(false);
            onUploading(false);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
        e.target.value = ""; // Reset input
    }, []);

    return (
        <div className="w-full">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "drop-zone relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 bg-background/50 backdrop-blur-sm",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-primary/20 hover:border-primary/50",
                    isProcessing && "pointer-events-none opacity-70"
                )}
            >
                {isProcessing ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="text-muted-foreground">{processingStatus}</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground">Drop your medical document here</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    PDF, PNG, JPG accepted
                                </p>
                            </div>
                            <input
                                type="file"
                                accept=".pdf,application/pdf,image/png,image/jpeg,image/jpg"
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={isProcessing}
                            />
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>PDF & Images up to 10MB</span>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
