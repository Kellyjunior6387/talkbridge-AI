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
      <body
        className="font-sans antialiased text-slate-900 bg-slate-50"
      >
        {children}
      </body>
    </html>
  );
}
