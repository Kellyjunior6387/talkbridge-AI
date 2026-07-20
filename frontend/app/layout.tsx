import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalkBridge AI - Unified Intelligent Inbox & AI Communication Bridge",
  description: "Unify TikTok, Instagram, WhatsApp, SMS, and voice into a single intelligent inbox. Powered by Claude AI, Zernio API, ElevenLabs, and Twilio.",
  keywords: ["TalkBridge AI", "AI Inbox", "Omnichannel Messaging", "Hackathon 2026", "Zernio API", "Claude AI", "Customer Support Automation"],
  authors: [{ name: "BrickLabs AI" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Load Google Fonts at runtime to support offline builds */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-body antialiased text-textPrimary bg-background"
      >
        {children}
      </body>
    </html>
  );
}
