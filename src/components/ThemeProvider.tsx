'use client'

import React, { useEffect, useState } from 'react'

export type ThemeColor = 'indigo' | 'blue' | 'green' | 'rose' | 'orange' | 'violet'
export type ThemeMode = 'light' | 'dark' | 'system'

export const THEMES: Record<ThemeColor, { primary: string, ring: string, name: string }> = {
    indigo: { name: 'Indigo', primary: '#6366f1', ring: '#6366f1' },
    blue: { name: 'Blue', primary: '#3b82f6', ring: '#3b82f6' },
    green: { name: 'Emerald', primary: '#10b981', ring: '#10b981' },
    rose: { name: 'Rose', primary: '#f43f5e', ring: '#f43f5e' },
    orange: { name: 'Orange', primary: '#f97316', ring: '#f97316' },
    violet: { name: 'Violet', primary: '#8b5cf6', ring: '#8b5cf6' }
}

export function applyTheme(color: ThemeColor) {
    const theme = THEMES[color] || THEMES.indigo
    const root = document.documentElement
    root.style.setProperty('--primary', theme.primary)
    root.style.setProperty('--ring', theme.ring)
    // Dynamic contrast handling could be added here
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // 1. Load Accent Color
        const savedColor = localStorage.getItem('quiz_theme_color') as ThemeColor
        if (savedColor && THEMES[savedColor]) {
            applyTheme(savedColor)
        }

        // 2. Load Theme Mode
        const savedMode = (localStorage.getItem('quiz_theme_mode') as ThemeMode) || 'system'
        applyMode(savedMode)

        // 3. System Listener
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            const currentMode = (localStorage.getItem('quiz_theme_mode') as ThemeMode) || 'system'
            if (currentMode === 'system') applyMode('system')
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)

    }, [])

    return <>{children}</>
}

export function applyMode(mode: ThemeMode) {
    const root = document.documentElement
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    if (isDark) {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
}
