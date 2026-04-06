import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import fs from "fs";
import path from "path";

// 1. Local Transformers Embeddings using Xenova
export class LocalTransformersEmbeddings extends Embeddings {
    private modelName: string;
    private pipelinePromise: Promise<any> | null = null;

    constructor(params?: EmbeddingsParams & { modelName?: string }) {
        super(params ?? {});
        this.modelName = params?.modelName ?? "Xenova/all-MiniLM-L6-v2";
    }

    private async getPipeline() {
        if (!this.pipelinePromise) {
            const { pipeline, env } = await import("@xenova/transformers");
            env.allowLocalModels = false;
            // Next.js routes run on the server (Node). Browser CacheStorage is unavailable there.
            env.useBrowserCache = typeof window !== "undefined";
            this.pipelinePromise = pipeline("feature-extraction", this.modelName);
        }
        return this.pipelinePromise;
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        const pipe = await this.getPipeline();
        const results = await Promise.all(
            texts.map(async (text) => {
                const res = await pipe(text, { pooling: "mean", normalize: true });
                return Array.from(res.data) as number[];
            })
        );
        return results;
    }

    async embedQuery(text: string): Promise<number[]> {
        const pipe = await this.getPipeline();
        const res = await pipe(text, { pooling: "mean", normalize: true });
        return Array.from(res.data) as number[];
    }
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "vectorstore.json");
const DOCS_PATH = path.join(DATA_DIR, "documents.json");

let vectorStoreInstance: MemoryVectorStore | null = null;
const embeddings = new LocalTransformersEmbeddings();

export async function getVectorStore(): Promise<MemoryVectorStore> {
    if (vectorStoreInstance) return vectorStoreInstance;

    vectorStoreInstance = new MemoryVectorStore(embeddings);

    if (fs.existsSync(STORE_PATH)) {
        const data = fs.readFileSync(STORE_PATH, "utf-8");
        const parsed = JSON.parse(data);
        vectorStoreInstance.memoryVectors = parsed;
    }

    return vectorStoreInstance;
}

export async function saveVectorStore(store: MemoryVectorStore) {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store.memoryVectors));
}

// Global Document Meta Storage
export interface DocumentMeta {
    id: string;
    filename: string;
    type: string;
    size: number;
    uploadDate: string;
}

export async function getDocumentMetas(): Promise<DocumentMeta[]> {
    if (fs.existsSync(DOCS_PATH)) {
        return JSON.parse(fs.readFileSync(DOCS_PATH, "utf-8"));
    }
    return [];
}

export async function addDocumentMeta(meta: DocumentMeta) {
    const docs = await getDocumentMetas();
    docs.push(meta);
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DOCS_PATH, JSON.stringify(docs));
}

export async function removeDocumentMeta(id: string) {
    let docs = await getDocumentMetas();
    docs = docs.filter((d: DocumentMeta) => d.id !== id);
    fs.writeFileSync(DOCS_PATH, JSON.stringify(docs));
}

export async function getVectorCount(): Promise<number> {
    const store = await getVectorStore();
    return store.memoryVectors.length;
}

// 2. Add full document to Vector Store
export async function ingestDocument(text: string, meta: DocumentMeta) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
    });
    
    const chunks = await splitter.splitText(text);
    const documents = chunks.map((chunk, i) => new Document({
        pageContent: chunk,
        metadata: {
            ...meta,
            chunkIndex: i
        }
    }));

    const store = await getVectorStore();
    await store.addDocuments(documents);
    await saveVectorStore(store);
    await addDocumentMeta(meta);
}

// 3. Remove document from Vector Store
export async function removeDocumentData(id: string) {
    const store = await getVectorStore();
    // MemoryVectorStore doesn't have a simple delete method, we have to filter
    store.memoryVectors = store.memoryVectors.filter((v: any) => v.metadata?.id !== id);
    await saveVectorStore(store);
    await removeDocumentMeta(id);
}
