import { openDB, DBSchema, IDBPDatabase } from "idb";
import { ParsedDocument } from "./pdfParser";
import { TextChunk } from "./vectorStore";

interface PatientPulseDB extends DBSchema {
    documents: {
        key: string;
        value: ParsedDocument;
    };
    vectors: {
        key: string;
        value: TextChunk;
        indexes: { "by-document": string };
    };
}

let dbPromise: Promise<IDBPDatabase<PatientPulseDB>>;

export function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<PatientPulseDB>("patientpulse-db", 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains("documents")) {
                    db.createObjectStore("documents", { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains("vectors")) {
                    const vectorStore = db.createObjectStore("vectors", { keyPath: "id" });
                    vectorStore.createIndex("by-document", "documentId");
                }
            },
        });
    }
    return dbPromise;
}

// Document Operations
export async function saveDocument(doc: ParsedDocument) {
    const db = await getDB();
    await db.put("documents", doc);
}

export async function getAllDocuments(): Promise<ParsedDocument[]> {
    const db = await getDB();
    return db.getAll("documents");
}

export async function deleteDocument(id: string) {
    const db = await getDB();
    await db.delete("documents", id);
}

export async function clearDocuments() {
    const db = await getDB();
    await db.clear("documents");
}

// Vector Operations
export async function saveVectors(chunks: TextChunk[]) {
    const db = await getDB();
    const tx = db.transaction("vectors", "readwrite");
    await Promise.all(chunks.map(chunk => tx.store.put(chunk)));
    await tx.done;
}

export async function getAllVectors(): Promise<TextChunk[]> {
    const db = await getDB();
    return db.getAll("vectors");
}

export async function getVectorsByDocument(documentId: string): Promise<TextChunk[]> {
    const db = await getDB();
    return db.getAllFromIndex("vectors", "by-document", documentId);
}

export async function deleteVectorsByDocument(documentId: string) {
    const db = await getDB();
    const tx = db.transaction("vectors", "readwrite");
    const index = tx.store.index("by-document");
    let cursor = await index.openCursor(IDBKeyRange.only(documentId));

    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
}

export async function clearVectors() {
    const db = await getDB();
    await db.clear("vectors");
}
