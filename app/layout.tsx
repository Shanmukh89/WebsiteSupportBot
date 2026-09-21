import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ragify",
  description: "AI-powered customer support agent from website content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
