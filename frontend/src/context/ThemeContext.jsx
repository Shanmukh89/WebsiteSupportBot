import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Initial State defaults (could load from localStorage)
    const [themeSettings, setThemeSettings] = useState(() => {
        const saved = localStorage.getItem('site2support_theme');
        return saved ? JSON.parse(saved) : {
            primaryColor: '#0044FF',
            themeMode: 'Dark',
            fontStyle: 'Inter'
        };
    });

    useEffect(() => {
        // Apply Global CSS Variables
        const root = document.documentElement;

        // 1. Primary Colors
        root.style.setProperty('--dt-accent-blue', themeSettings.primaryColor);
        // Map to custom requirements
        root.style.setProperty('--primary-color', themeSettings.primaryColor);

        // 2. Font Style
        let fontFamily = "'Inter', system-ui, sans-serif";
        if (themeSettings.fontStyle === 'Poppins') fontFamily = "'Poppins', system-ui, sans-serif";
        if (themeSettings.fontStyle === 'System Default') fontFamily = "system-ui, -apple-system, sans-serif";
        root.style.setProperty('--font-family-base', fontFamily);

        // 3. Theme Mode Backgrounds
        if (themeSettings.themeMode === 'Light') {
            root.style.setProperty('--dt-bg-black', '#FAFAFC');
            root.style.setProperty('--dt-bg-surface', '#FFFFFF');
            root.style.setProperty('--dt-text-white', '#111827');
            root.style.setProperty('--dt-text-muted', '#6B7280');
            root.style.setProperty('--dt-accent-border', '#E5E7EB');
        } else {
            // Default Dark
            root.style.setProperty('--dt-bg-black', '#080808');
            root.style.setProperty('--dt-bg-surface', '#1E1E1E');
            root.style.setProperty('--dt-text-white', '#FFFFFF');
            root.style.setProperty('--dt-text-muted', 'rgba(255, 255, 255, 0.64)');
            root.style.setProperty('--dt-accent-border', 'rgba(255, 255, 255, 0.16)');
        }

        // Persist
        localStorage.setItem('site2support_theme', JSON.stringify(themeSettings));

    }, [themeSettings]);

    return (
        <ThemeContext.Provider value={{ themeSettings, setThemeSettings }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
