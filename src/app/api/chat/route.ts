import { NextRequest } from "next/server";
import { ChatGroq } from "@langchain/groq";
import { getVectorStore } from "@/lib/langchain";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();

        if (!messages || messages.length === 0) {
            return new Response(JSON.stringify({ error: "Missing messages" }), { status: 400 });
        }

        const currentMessageContent = messages[messages.length - 1].content;

        const vectorStore = await getVectorStore();
        const retriever = vectorStore.asRetriever({ k: 4 });

        const llm = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: "llama-3.3-70b-versatile",
            streaming: true,
        });

        const systemPrompt = `You are PatientPulse AI, an advanced medical document assistant.
Your role is to:
1. Answer questions about the user's medical documents accurately and clearly
2. Always cite which document and section your information comes from (use the source filenames)
3. Explain medical terms in plain language when helpful
4. Never provide medical advice or diagnoses - recommend consulting a healthcare provider
5. If information isn't in the provided context, clarify that clearly
6. Be concise but thorough in your responses

Use the following pieces of retrieved context to answer the user's question. 
If you don't know the answer, just say that you don't know. 

Context:
{context}
`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            new MessagesPlaceholder("chat_history"),
            ["human", "{input}"]
        ]);

        const chatHistory = messages.slice(0, -1).map((m: any) => {
            if (m.role === "user") return new HumanMessage(m.content);
            return new AIMessage(m.content);
        });

        const retrievedDocs =
            typeof (retriever as any).invoke === "function"
                ? await (retriever as any).invoke(currentMessageContent)
                : await (retriever as any).getRelevantDocuments(currentMessageContent);
        const contextSources = new Set<string>();
        const context = retrievedDocs
            .map((doc: any, i: number) => {
                const filename = doc.metadata?.filename ?? "unknown";
                const chunkIndex = doc.metadata?.chunkIndex ?? i;
                contextSources.add(filename);
                return `[${filename} · chunk ${chunkIndex}]\n${doc.pageContent}`;
            })
            .join("\n\n---\n\n");

        const formattedMessages = await prompt.formatMessages({
            context,
            chat_history: chatHistory,
            input: currentMessageContent,
        });

        const stream = await llm.stream(formattedMessages);

        // Manual ReadableStream conversion for Next.js response
        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    const text = typeof chunk === "string" ? chunk : (chunk?.content ?? "");
                    if (text) controller.enqueue(new TextEncoder().encode(text));
                }
                
                // Extra citation block appended at the end
                if (contextSources.size > 0) {
                    controller.enqueue(new TextEncoder().encode(`\n\n**Sources Analyzed:** ${Array.from(contextSources).join(', ')}`));
                }
                
                controller.close();
            }
        });

        return new Response(readableStream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
            },
        });

    } catch (e: any) {
        console.error("Chat error", e);
        return new Response(JSON.stringify({ error: e.message || "Failed to process chat" }), { status: 500 });
    }
}
