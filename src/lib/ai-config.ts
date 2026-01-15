// AI Configuration and Prompts (Groq)

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    sources?: { documentName: string; score: number }[];
    timestamp: string;
}

export interface ContextChunk {
    text: string;
    documentName: string;
    score: number;
}

// Format context for the prompt
export function formatContextForPrompt(chunks: ContextChunk[]): string {
    if (chunks.length === 0) {
        return "No relevant documents found.";
    }

    return chunks
        .map(
            (chunk, i) =>
                `[Source ${i + 1}: ${chunk.documentName}]\n${chunk.text}`
        )
        .join("\n\n");
}

// Build the system prompt for medical Q&A
export function buildMedicalSystemPrompt(): string {
    return `You are PatientPulse AI, a helpful medical document assistant. Your role is to:

1. Answer questions about the user's medical documents accurately and clearly
2. Always cite which document and section your information comes from
3. Explain medical terms in plain language when helpful
4. Never provide medical advice or diagnoses - always recommend consulting a healthcare provider
5. If information isn't in the documents, say so clearly
6. Extract and highlight relevant dates, values, and measurements
7. Be concise but thorough in your responses

Format your responses with:
- Clear section headers when appropriate
- Bullet points for lists of values or findings
- Bold text for important values or warnings
- Always mention the source document name

Remember: You are helping users understand their own medical records, not providing medical advice.`;
}



// Example queries for the UI
export const exampleQueries = [
    "What was my blood pressure reading?",
    "Show me my vitamin D levels",
    "What were my cholesterol numbers?",
    "Are there any abnormal results?",
    "What tests were performed?",
    "What medications are mentioned?",
];
