import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "PulseSend — Modern AI-Powered Email Platform",
  description: "Create, schedule, and track beautiful email campaigns at scale with AWS SES integration, responsive drag-and-drop templates, and real-time deep analytics.",
  keywords: ["email", "campaign", "newsletter", "marketing", "aws ses", "framer-motion", "next.js"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased dark`} suppressHydrationWarning>
        <body className="h-full overflow-hidden flex flex-col bg-background text-foreground selection:bg-zinc-800 selection:text-white" suppressHydrationWarning>
          <div className="flex-1 flex flex-col h-full relative overflow-hidden gradient-bg">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
