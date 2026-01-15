// Vector Store with Xenova Transformers for embedding generation
// Uses in-memory storage + localStorage for persistence

import { ParsedDocument } from "./pdfParser";

export interface TextChunk {
    id: string;
    documentId: string;
    documentName: string;
    text: string;
    embedding?: number[];
    startIndex: number;
    endIndex: number;
}

export interface VectorStore {
    chunks: TextChunk[];
    isModelLoaded: boolean;
}

// Global store state
let vectorStore: VectorStore = {
    chunks: [],
    isModelLoaded: false,
};

// Model instance (lazy loaded)
let embeddingPipeline: ((text: string) => Promise<{ data: Float32Array }>) | null = null;

// Split text into overlapping chunks
export function splitIntoChunks(
    doc: ParsedDocument,
    chunkSize: number = 500,
    overlap: number = 100
): TextChunk[] {
    const text = doc.text;
    const chunks: TextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length);
        const chunkText = text.slice(startIndex, endIndex);

        chunks.push({
            id: `${doc.id}_chunk_${chunkIndex}`,
            documentId: doc.id,
            documentName: doc.filename,
            text: chunkText,
            startIndex,
            endIndex,
        });

        chunkIndex++;
        startIndex = endIndex - overlap;

        // Prevent infinite loop for very small texts
        if (startIndex >= text.length - overlap && startIndex < text.length) {
            break;
        }
    }

    return chunks;
}

// Initialize the embedding model
export async function initializeModel(
    onProgress?: (progress: number) => void
): Promise<void> {
    if (embeddingPipeline) {
        vectorStore.isModelLoaded = true;
        return;
    }

    try {
        // Dynamic import to avoid SSR issues
        const { pipeline, env } = await import("@xenova/transformers");

        // Configure for browser usage
        env.allowLocalModels = false;
        env.useBrowserCache = true;

        // Load embedding model with progress callback
        embeddingPipeline = (await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2",
            {
                progress_callback: (data: { progress?: number }) => {
                    if (onProgress && data.progress) {
                        onProgress(data.progress);
                    }
                },
            }
        )) as (text: string) => Promise<{ data: Float32Array }>;

        vectorStore.isModelLoaded = true;
    } catch (error) {
        console.error("Failed to load embedding model:", error);
        throw error;
    }
}

// Generate embedding for text
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!embeddingPipeline) {
        await initializeModel();
    }

    const result = await embeddingPipeline!(text);
    // Convert to array and normalize
    const embedding = Array.from(result.data);
    return normalizeVector(embedding);
}

// Normalize vector for cosine similarity
function normalizeVector(vec: number[]): number[] {
    const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vec.map((val) => val / magnitude) : vec;
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

import { saveVectors, getAllVectors, deleteVectorsByDocument, clearVectors } from "./indexedDB";

// Add chunks with embeddings to the store
export async function addDocumentToStore(
    doc: ParsedDocument,
    onProgress?: (current: number, total: number) => void
): Promise<void> {
    const chunks = splitIntoChunks(doc);
    const newChunks: TextChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        chunk.embedding = await generateEmbedding(chunk.text);
        newChunks.push(chunk);

        if (onProgress) {
            onProgress(i + 1, chunks.length);
        }
    }

    // Update in-memory store
    vectorStore.chunks.push(...newChunks);

    // Persist to IndexedDB
    await saveVectors(newChunks);
}

// Search for similar chunks
export async function searchSimilar(
    query: string,
    topK: number = 3
): Promise<{ chunk: TextChunk; score: number }[]> {
    if (vectorStore.chunks.length === 0) {
        return [];
    }

    const queryEmbedding = await generateEmbedding(query);

    const results = vectorStore.chunks
        .filter((chunk) => chunk.embedding)
        .map((chunk) => ({
            chunk,
            score: cosineSimilarity(queryEmbedding, chunk.embedding!),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

    return results;
}

// Remove document from store
export async function removeDocumentFromStore(docId: string): Promise<void> {
    // Update in-memory store
    vectorStore.chunks = vectorStore.chunks.filter(
        (chunk) => chunk.documentId !== docId
    );
    // Remove from IndexedDB
    await deleteVectorsByDocument(docId);
}

// Load store from IndexedDB
export async function loadVectorStore(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
        const storedChunks = await getAllVectors();
        if (storedChunks && storedChunks.length > 0) {
            vectorStore.chunks = storedChunks;
        }
    } catch (error) {
        console.error("Failed to load vectors from IndexedDB:", error);
    }
}

// Check if model is loaded
export function isModelReady(): boolean {
    return vectorStore.isModelLoaded;
}

// Get chunk count
export function getChunkCount(): number {
    return vectorStore.chunks.length;
}

// Clear all vectors
export async function clearVectorStore(): Promise<void> {
    vectorStore.chunks = [];
    await clearVectors();
}
