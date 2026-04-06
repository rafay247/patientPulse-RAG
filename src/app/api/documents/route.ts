import { NextResponse } from "next/server";
import { getDocumentMetas, removeDocumentData } from "@/lib/langchain";

export async function GET() {
    try {
        const metas = await getDocumentMetas();
        return NextResponse.json(metas);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        
        await removeDocumentData(id);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
