import { NextResponse } from "next/server";
import { ingestDocument, DocumentMeta } from "@/lib/langchain";
import pdf from "pdf-parse";
import { v4 as uuidv4 } from "uuid";

// We disable body parsing locally to handle streaming standard Next.js approach
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";

        if (file.type === "application/pdf") {
            const data = await pdf(buffer);
            text = data.text;
        } else if (file.type.startsWith("image/")) {
            // Because Tesseract.js is hard to use perfectly server-side without issues,
            // For images we can use a simpler approach or skip them if it's too much, 
            // but the UI currently expects them to work. We can import tesseract.js dynamically.
            const Tesseract = (await import("tesseract.js")).default;
            const { data: { text: tesseractText } } = await Tesseract.recognize(buffer, "eng");
            text = tesseractText;
        } else {
            text = buffer.toString("utf-8");
        }

        if (!text || text.trim() === "") {
            return NextResponse.json({ error: "Could not extract text from file" }, { status: 400 });
        }

        const meta: DocumentMeta = {
            id: uuidv4(),
            filename: file.name,
            type: file.type,
            size: file.size,
            uploadDate: new Date().toISOString(),
        };

        // LangChain Ingestion!
        await ingestDocument(text, meta);

        return NextResponse.json({ success: true, document: meta });
    } catch (e: any) {
        console.error("Upload error", e);
        return NextResponse.json({ error: e.message || "Failed to upload" }, { status: 500 });
    }
}
