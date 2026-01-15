import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { buildMedicalSystemPrompt } from "@/lib/ai-config";

export async function POST(request: NextRequest) {
    try {
        const { query, context, chatHistory } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "API key not configured. Please add GROQ_API_KEY to .env.local" },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey });

        // Build the user message with context
        const userMessage = context
            ? `Based on the following medical document excerpts, please answer my question.

RELEVANT DOCUMENT SECTIONS:
${context}

MY QUESTION: ${query}

Please provide a clear, helpful answer based on the documents above. Always cite which document your information comes from.`
            : query;

        // Build messages array with history
        const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
            {
                role: "system",
                content: buildMedicalSystemPrompt(),
            },
        ];

        if (chatHistory && Array.isArray(chatHistory)) {
            for (const msg of chatHistory.slice(-6)) { // Keep last 6 messages for context
                messages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }

        messages.push({
            role: "user",
            content: userMessage,
        });

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            max_tokens: 1024,
            messages,
        });

        const assistantMessage = response.choices[0]?.message?.content || "I was unable to generate a response.";

        return NextResponse.json({
            message: assistantMessage,
            usage: {
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
            },
        });
    } catch (error) {
        console.error("Chat API error:", error);

        return NextResponse.json(
            { error: `API error: ${error instanceof Error ? error.message : "Unknown error"}` },
            { status: 500 }
        );
    }
}
