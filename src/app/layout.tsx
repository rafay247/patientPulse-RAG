import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Fraunces({
    subsets: ["latin"],
    variable: "--font-display",
});

const sans = IBM_Plex_Sans({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-sans",
});

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
            <body className={`${display.variable} ${sans.variable} font-sans`}>
                <div className="min-h-screen bg-background">
                    {children}
                </div>
            </body>
        </html>
    );
}
