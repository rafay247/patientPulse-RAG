# PatientPulse - AI Medical Document Assistant

PatientPulse is a powerful, privacy-focused RAG (Retrieval-Augmented Generation) application designed to help users understand their medical documents. It allows you to upload medical reports in PDF or image format (PNG, JPG) and ask natural language questions about them.

## 🚀 Key Features

- **Multi-Format Support**: Upload PDF documents or medical images (PNG, JPG) for analysis.
- **Client-Side Processing**:
  - **OCR**: Uses `Tesseract.js` for text extraction from images directly in the browser.
  - **PDF Parsing**: Uses `PDF.js` for client-side text extraction.
  - **Embeddings**: Generates vector embeddings locally using `Transformers.js` (`Xenova/all-MiniLM-L6-v2`).
- **Privacy Native**: Document text and embeddings are stored locally in your browser's **IndexedDB**. Only the relevant context and your questions are sent to the LLM.
- **AI Intelligence**: Powered by **Groq** (using `llama-3.3-70b-versatile`) for lightning-fast, accurate responses with source citations.
- **Modern UI**: Sleek, responsive interface built with Next.js, Tailwind CSS, and Shadcn/UI, featuring dark mode and smooth animations.

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Shadcn/UI](https://ui.shadcn.com/)
- **LLM API**: [Groq SDK](https://console.groq.com/)
- **ML/Embeddings**: [Transformers.js](https://huggingface.co/docs/transformers.js/)
- **OCR**: [Tesseract.js](https://tesseract.projectnaptha.com/)
- **Storage**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb` library)

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

1. **Upload**: When you upload a file, PatientPulse extracts the text (using PDF.js or Tesseract OCR).
2. **Chunking**: The text is split into smaller, overlapping sections.
3. **Embedding**: Each section is converted into a vector embedding locally in your browser.
4. **Storage**: The chunks and their embeddings are saved to **IndexedDB** for persistence across sessions.
5. **Retrieval**: When you ask a question, the app generates an embedding for your query and performs a cosine similarity search against your local database.
6. **Generation**: The top relevant chunks are sent along with your question to the Groq LLM to generate a precise, cited response.

## 🔒 Privacy Note

PatientPulse is built with privacy in mind. Your actual medical documents never leave your browser. Only the specific snippets identified as relevant to your question are transmitted to the LLM API to provide an answer.

---

Built for health clarity and data ownership.
