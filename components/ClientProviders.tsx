"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { UserProvider } from "@/context/UserContext";
import { AgentProvider } from "@/context/AgentContext";
import { ChatThemeProvider } from "@/context/ChatThemeContext";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ChatThemeProvider>
          <UserProvider>
            <AgentProvider>
              {children}
            </AgentProvider>
          </UserProvider>
        </ChatThemeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
