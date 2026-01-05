'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Save, Clock, Volume2, Palette, Moon, Sun, Monitor, Laptop } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { THEMES, ThemeColor, ThemeMode, applyTheme, applyMode } from '@/components/ThemeProvider'

export default function SettingsPage() {
    // State for settings
    const [defaultTime, setDefaultTime] = useState(20)
    const [enableSound, setEnableSound] = useState(true)
    const [themeColor, setThemeColor] = useState<ThemeColor>('indigo')
    const [themeMode, setThemeMode] = useState<ThemeMode>('system')
    const [hasMounted, setHasMounted] = useState(false)

    // Load settings on mount
    useEffect(() => {
        setHasMounted(true)
        const savedTime = localStorage.getItem('quiz_default_time')
        const savedSound = localStorage.getItem('quiz_enable_sound')
        const savedTheme = localStorage.getItem('quiz_theme_color') as ThemeColor
        const savedMode = localStorage.getItem('quiz_theme_mode') as ThemeMode

        if (savedTime) setDefaultTime(parseInt(savedTime))
        if (savedSound !== null) setEnableSound(savedSound === 'true')
        if (savedTheme && THEMES[savedTheme]) setThemeColor(savedTheme)
        if (savedMode) setThemeMode(savedMode)
    }, [])

    const handleSave = () => {
        localStorage.setItem('quiz_default_time', defaultTime.toString())
        localStorage.setItem('quiz_enable_sound', enableSound.toString())
        localStorage.setItem('quiz_theme_color', themeColor)
        localStorage.setItem('quiz_theme_mode', themeMode)

        applyTheme(themeColor)
        applyMode(themeMode)

        toast.success("Settings saved successfully")
    }

    if (!hasMounted) return null

    return (
        <div className="space-y-8 pb-20 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Settings</h2>
                <p className="text-muted-foreground mt-1 text-lg">Configure global preferences for your quizzes and games.</p>
            </div>

            {/* Game Defaults */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Game Defaults</CardTitle>
                            <CardDescription>Set default values for new quizzes and game sessions.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                        <div className="flex items-center gap-4">
                            <Clock className="text-muted-foreground" size={24} />
                            <div>
                                <h3 className="font-medium text-foreground">Default Question Timer</h3>
                                <p className="text-sm text-muted-foreground">Initial time duration (seconds) for new questions.</p>
                            </div>
                        </div>
                        <div className="w-32">
                            <Input
                                type="number"
                                value={defaultTime}
                                onChange={(e) => setDefaultTime(Number(e.target.value))}
                                className="text-right font-mono"
                                min={5}
                                max={300}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                        <div className="flex items-center gap-4">
                            <Volume2 className="text-muted-foreground" size={24} />
                            <div>
                                <h3 className="font-medium text-foreground">Enable Sound Effects</h3>
                                <p className="text-sm text-muted-foreground">Play sounds during games by default (Host only).</p>
                            </div>
                        </div>
                        <Switch
                            checked={enableSound}
                            onCheckedChange={setEnableSound}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Palette size={20} />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Appearance</CardTitle>
                            <CardDescription>Customize the application's look and feel.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Theme Mode */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Theme Mode</label>
                        <div className="grid grid-cols-3 gap-4">
                            <div
                                onClick={() => {
                                    setThemeMode('light')
                                    localStorage.setItem('quiz_theme_mode', 'light')
                                    applyMode('light')
                                }}
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all hover:bg-muted/50",
                                    themeMode === 'light' ? "border-primary bg-primary/5" : "border-border"
                                )}
                            >
                                <Sun size={24} className={themeMode === 'light' ? "text-primary" : "text-muted-foreground"} />
                                <span className="font-medium text-sm">Light</span>
                            </div>
                            <div
                                onClick={() => {
                                    setThemeMode('dark')
                                    localStorage.setItem('quiz_theme_mode', 'dark')
                                    applyMode('dark')
                                }}
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all hover:bg-muted/50",
                                    themeMode === 'dark' ? "border-primary bg-primary/5" : "border-border"
                                )}
                            >
                                <Moon size={24} className={themeMode === 'dark' ? "text-primary" : "text-muted-foreground"} />
                                <span className="font-medium text-sm">Dark</span>
                            </div>
                            <div
                                onClick={() => {
                                    setThemeMode('system')
                                    localStorage.setItem('quiz_theme_mode', 'system')
                                    applyMode('system')
                                }}
                                className={cn(
                                    "cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all hover:bg-muted/50",
                                    themeMode === 'system' ? "border-primary bg-primary/5" : "border-border"
                                )}
                            >
                                <Laptop size={24} className={themeMode === 'system' ? "text-primary" : "text-muted-foreground"} />
                                <span className="font-medium text-sm">System</span>
                            </div>
                        </div>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Accent Color</label>
                        <div className="flex flex-wrap gap-6">
                            {(Object.keys(THEMES) as ThemeColor[]).map((color) => (
                                <div
                                    key={color}
                                    className={cn(
                                        "flex flex-col items-center gap-2 cursor-pointer group",
                                        themeColor === color ? "opacity-100" : "opacity-60 hover:opacity-100"
                                    )}
                                    onClick={() => {
                                        setThemeColor(color)
                                        localStorage.setItem('quiz_theme_color', color)
                                        applyTheme(color)
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "w-16 h-16 rounded-full border-4 transition-all duration-300 shadow-sm",
                                            themeColor === color ? "border-primary scale-110 shadow-lg" : "border-border hover:scale-105"
                                        )}
                                        style={{ backgroundColor: THEMES[color].primary }}
                                    >
                                        {themeColor === color && (
                                            <div className="w-full h-full flex items-center justify-center text-white">
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        themeColor === color ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {THEMES[color].name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button size="lg" onClick={handleSave} className="gap-2 shadow-lg font-bold">
                    <Save size={18} /> Save Changes
                </Button>
            </div>
        </div>
    )
}
