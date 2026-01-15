// PDF Text Extraction Utility
// Uses browser-based PDF.js for client-side PDF parsing

export interface ParsedDocument {
    filename: string;
    text: string;
    pageCount: number;
    uploadedAt: string;
    id: string;
}

// Generate unique ID
function generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract text from Image using Tesseract.js (client-side)
async function extractTextFromImage(file: File): Promise<string> {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text;
}

// Extract text from PDF using PDF.js (client-side)
export async function extractTextFromPDF(file: File): Promise<ParsedDocument> {
    // Dynamically import PDF.js to avoid SSR issues
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => (item.str ? item.str : ""))
            .join(" ");
        fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    return {
        filename: file.name,
        text: fullText.trim(),
        pageCount: pdf.numPages,
        uploadedAt: new Date().toISOString(),
        id: generateId(),
    };
}

export async function processDocument(file: File): Promise<ParsedDocument> {
    if (file.type === "application/pdf") {
        return extractTextFromPDF(file);
    } else if (file.type.startsWith("image/")) {
        const text = await extractTextFromImage(file);
        return {
            filename: file.name,
            text: text.trim(),
            pageCount: 1, // Images are treated as single page
            uploadedAt: new Date().toISOString(),
            id: generateId(),
        };
    }
    throw new Error("Unsupported file type");
}

import { saveDocument, getAllDocuments, deleteDocument, clearDocuments } from "./indexedDB";

// Store documents in IndexedDB
export async function saveDocumentToStorage(doc: ParsedDocument): Promise<void> {
    await saveDocument(doc);
}

// Get all documents from IndexedDB
export async function getDocumentsFromStorage(): Promise<ParsedDocument[]> {
    if (typeof window === "undefined") return [];
    return getAllDocuments();
}

// Delete document from storage
export async function deleteDocumentFromStorage(docId: string): Promise<void> {
    await deleteDocument(docId);
}

// Clear all documents
export async function clearAllDocuments(): Promise<void> {
    await clearDocuments();
}
