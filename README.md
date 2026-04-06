# PatientPulse - AI Medical Document Assistant (LangChain Edition)

PatientPulse is a powerful, privacy-focused RAG (Retrieval-Augmented Generation) application designed to help users understand their medical documents. It allows you to upload medical reports in PDF or image format and ask natural language questions about them.

**We have completely redesigned the architecture to use LangChain at the core!**

## 🚀 Key Features and Enhancements

- **LangChain Architecture**: We've replaced the bespoke client-side implementations with an industry-standard Next.js Server-Side LangChain pipeline!
  - Uses `RecursiveCharacterTextSplitter` for precise document chunking.
  - Uses `MemoryVectorStore` with local persistence for storing embeddings.
  - Uses `createRetrievalChain` and `createStuffDocumentsChain` for advanced retrieval.
- **Enhanced UI/UX**: The UI has been completely refreshed to feature a modern, glassmorphic design with subtle animations, a beautiful dark mode, and seamless streaming interactions.
- **Embeddings**: Generates vector embeddings using `Transformers.js` (`Xenova/all-MiniLM-L6-v2`) via a custom LangChain Embeddings wrapper.
- **AI Intelligence**: Powered by **Groq** (using `llama-3.3-70b-versatile` via `@langchain/groq`) for lightning-fast responses with context citations.

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) App Router
- **AI/RAG Engine**: [LangChain.js](https://js.langchain.com/)
- **LLM API**: [Groq API](https://console.groq.com/) via `@langchain/groq`
- **Vector Store**: local `MemoryVectorStore` mapped to a persistent JSON file (`data/vectorstore.json`)
- **ML/Embeddings**: [Transformers.js](https://huggingface.co/docs/transformers.js/) via `@langchain/core` interfaces.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Shadcn/UI

## 📋 Prerequisites

Before you begin, ensure you have the following:
- [Node.js](https://nodejs.org/) (v18 or higher)
- A **Groq API Key** (Get one at [Groq Console](https://console.groq.com/))

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd PatientPulse---RAG
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How it Works

1. **Upload**: You upload a document via the Next.js API route (`/api/upload`), which parses the PDF/Image into raw text (using `pdf-parse` or Tesseract).
2. **LangChain Ingestion**: The text is passed into `RecursiveCharacterTextSplitter` and mapped to `Document` objects.
3. **Embedding**: The documents are embedded using our custom `LocalTransformersEmbeddings` class running `@xenova/transformers`.
4. **Vector DB**: The embeddings are persisted continuously to the server's `.data/vectorstore.json` using LangChain's `MemoryVectorStore`.
5. **Chat**: Using `/api/chat`, a user's question triggers `createRetrievalChain` to query the Vector Store and generate an answer through `ChatGroq`.
6. **Streaming**: The response is streamed directly back to the client UI with context citations.

---

Built for health clarity, powered by LangChain.
