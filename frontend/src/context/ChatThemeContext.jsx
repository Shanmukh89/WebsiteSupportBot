import React, { createContext, useContext, useEffect, useState } from 'react';

const ChatThemeContext = createContext();

// Helper to calculate slightly darker shade, avoiding neon
const adjustColor = (colorHex, percent) => {
    let R = parseInt(colorHex.substring(1, 3), 16);
    let G = parseInt(colorHex.substring(3, 5), 16);
    let B = parseInt(colorHex.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

export function ChatThemeProvider({ children }) {
    const [chatTheme, setChatTheme] = useState(() => {
        const saved = localStorage.getItem('site2support_chat_theme');
        return saved ? JSON.parse(saved) : {
            chatPrimaryColor: '#6366f1'
        };
    });

    useEffect(() => {
        const root = document.documentElement;

        // Slightly darker shade (around 15% darker)
        const darkerPrimary = adjustColor(chatTheme.chatPrimaryColor, -15);
        // Slightly lighter for input bg
        const lighterBg = adjustColor(chatTheme.chatPrimaryColor, 40);

        root.style.setProperty('--chat-primary', chatTheme.chatPrimaryColor);
        // User bubble: primary + darker + 10% opacity blend handled in CSS if needed, 
        // Or we just provide the darker primary.
        root.style.setProperty('--chat-bubble-user', `color-mix(in srgb, ${darkerPrimary} 90%, black 10%)`);
        root.style.setProperty('--chat-bubble-agent', 'rgba(255, 255, 255, 0.05)'); // subtle dark appearance naturally
        root.style.setProperty('--chat-text', '#FFFFFF'); // assuming dark mode mostly
        root.style.setProperty('--chat-input-bg', 'rgba(255, 255, 255, 0.04)');
        root.style.setProperty('--chat-input-border', `color-mix(in srgb, ${chatTheme.chatPrimaryColor} 30%, transparent)`);

        localStorage.setItem('site2support_chat_theme', JSON.stringify(chatTheme));
    }, [chatTheme]);

    return (
        <ChatThemeContext.Provider value={{ chatTheme, setChatTheme }}>
            {children}
        </ChatThemeContext.Provider>
    );
}

export function useChatTheme() {
    return useContext(ChatThemeContext);
}
