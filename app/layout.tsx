import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPL Akinator — AI-Powered Cricket Player Guesser",
  description:
    "Think of any IPL cricketer. The AI will figure out who it is in smart questions. Powered by Gemini AI.",
  keywords: ["IPL", "Akinator", "Cricket", "AI", "Guessing Game", "Gemini"],
  openGraph: {
    title: "IPL Akinator — AI-Powered Cricket Player Guesser",
    description:
      "Think of any IPL cricketer. The AI will figure out who it is in smart questions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
