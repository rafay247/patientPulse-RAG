import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "PatientPulse | AI Medical Document Assistant",
    description: "Upload your medical documents and ask questions. Get instant, AI-powered answers with source citations.",
    keywords: ["medical", "AI", "documents", "health", "RAG", "assistant"],
    icons: {
        icon: "/favicon.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={inter.className}>
                <div className="min-h-screen bg-background">
                    {children}
                </div>
            </body>
        </html>
    );
}
