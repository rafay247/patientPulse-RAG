"use client";

import React, { useCallback, useState } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { processDocument, saveDocumentToStorage, ParsedDocument } from "@/lib/pdfParser";
import { addDocumentToStore, initializeModel } from "@/lib/vectorStore";

interface DocumentUploadProps {
    onDocumentAdded: (doc: ParsedDocument) => void;
    onModelLoading: (loading: boolean, progress?: number) => void;
}

export function DocumentUpload({ onDocumentAdded, onModelLoading }: DocumentUploadProps) {
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

        try {
            // Step 1: Initialize model (first time only)
            setProcessingStatus("Loading AI model...");
            onModelLoading(true);
            await initializeModel((progress) => {
                setProcessingStatus(`Loading AI model... ${Math.round(progress)}%`);
            });
            onModelLoading(false);

            // Step 2: Extract text from PDF
            // Step 2: Extract text from document
            setProcessingStatus("Extracting text from document...");
            const doc = await processDocument(file);

            // Step 3: Generate embeddings
            setProcessingStatus("Generating embeddings...");
            await addDocumentToStore(doc, (current, total) => {
                setProcessingStatus(`Embedding chunks... ${current}/${total}`);
            });

            // Step 4: Save to storage
            await saveDocumentToStorage(doc);
            onDocumentAdded(doc);

            setProcessingStatus("");
        } catch (err) {
            console.error("Processing error:", err);
            setError(err instanceof Error ? err.message : "Failed to process document");
        } finally {
            setIsProcessing(false);
            onModelLoading(false);
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
                    "drop-zone relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-muted-foreground/30 hover:border-primary/50",
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
                            <div className="p-4 rounded-full bg-primary/10">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-medium">Drop your medical document here</p>
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
                <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
