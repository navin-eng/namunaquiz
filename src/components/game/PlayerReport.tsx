'use client'

import React, { useMemo } from 'react'
import { Check, X, Trophy, Activity, TrendingUp, Home, Award, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SHAPES, COLORS } from '@/lib/constants'

interface GameHistoryItem {
    questionText: string
    isCorrect: boolean
    playerAnswerIndex?: number
    correctAnswerIndex?: number
    options?: string[]
}

interface PlayerReportProps {
    playerData: any
    history: GameHistoryItem[]
}

export default function PlayerReport({ playerData, history: initialHistory }: PlayerReportProps) {
    const [history, setHistory] = React.useState(initialHistory)

    React.useEffect(() => {
        if (initialHistory && initialHistory.length > 0) {
            setHistory(initialHistory)
        } else {
            // Recovery attempt from sessionStorage
            const pathParts = window.location.pathname.split('/')
            const gameId = pathParts[pathParts.length - 1]
            if (gameId) {
                const stored = sessionStorage.getItem(`history_${gameId}`)
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored)
                        if (parsed && parsed.length > 0) setHistory(parsed)
                    } catch (e) {
                        console.error('Failed to parse history', e)
                    }
                }
            }
        }
    }, [initialHistory])

    const stats = useMemo(() => {
        const total = history.length
        const correct = history.filter(h => h.isCorrect).length
        const incorrect = total - correct
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
        return { total, correct, incorrect, accuracy }
    }, [history])

    const handlePlayAgain = () => {
        sessionStorage.clear()
        window.location.href = '/play'
    }

    return (
        <div className="min-h-screen bg-background text-foreground overflow-y-auto">
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header Section */}
                <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-top duration-700">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-card border border-border rounded-full mb-4 sm:mb-6 shadow-xl shadow-yellow-500/10">
                        <Trophy size={40} className="text-yellow-500 sm:w-12 sm:h-12 fill-yellow-500/20" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 tracking-tight text-foreground">
                        Game Complete!
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground font-medium">
                        Great job, <span className="text-primary font-bold">{playerData?.name}</span>!
                    </p>
                </div>

                {/* Score Card - Material Design Elevated Card */}
                <div className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                    <div className="bg-primary text-primary-foreground rounded-3xl sm:rounded-[2rem] p-8 sm:p-12 shadow-2xl shadow-primary/25 relative overflow-hidden text-center">
                        <div className="relative z-10">
                            <p className="text-sm sm:text-base font-bold uppercase tracking-[0.2em] opacity-80 mb-3 sm:mb-4">Final Score</p>
                            <div className="text-6xl sm:text-7xl lg:text-8xl font-black mb-2 tracking-tighter">
                                {playerData?.score?.toLocaleString() || 0}
                            </div>
                            <p className="text-base sm:text-lg opacity-80 font-medium">points</p>
                        </div>
                    </div>
                </div>

                {/* Statistics Grid - Material Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                    {/* Correct Answers */}
                    <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-green-500/50 transition-all duration-300 hover:scale-105 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                                <Check className="text-green-600" size={24} strokeWidth={3} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">{stats.correct}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-bold">Correct</div>
                        </div>
                    </div>

                    {/* Wrong Answers */}
                    <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-red-500/50 transition-all duration-300 hover:scale-105 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                                <X className="text-red-600" size={24} strokeWidth={3} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">{stats.incorrect}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-bold">Wrong</div>
                        </div>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                                <TrendingUp className="text-blue-600" size={24} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">{stats.accuracy}%</div>
                            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-bold">Accuracy</div>
                        </div>
                    </div>

                    {/* Total Questions */}
                    <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                                <Target className="text-primary" size={24} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">{stats.total}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-bold">Questions</div>
                        </div>
                    </div>
                </div>

                {/* Question Breakdown */}
                <div className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                        <Award className="text-primary" size={28} />
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Question Breakdown</h2>
                    </div>

                    {history.length === 0 ? (
                        <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-12 text-center">
                            <div className="text-muted-foreground text-lg">No questions recorded for this session.</div>
                        </div>
                    ) : (
                        <div className="space-y-4 sm:space-y-6">
                            {history.map((item, qIndex) => (
                                <div
                                    key={qIndex}
                                    className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 hover:border-primary/30 transition-all duration-300 shadow-sm"
                                >
                                    {/* Question Header */}
                                    <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                                        <div className={cn(
                                            "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border",
                                            item.isCorrect
                                                ? "bg-green-100 border-green-200"
                                                : "bg-red-100 border-red-200"
                                        )}>
                                            {item.isCorrect ? <Check size={24} className="text-green-600" strokeWidth={3} /> : <X size={24} className="text-red-600" strokeWidth={3} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="text-xs sm:text-sm text-muted-foreground font-mono font-bold">Q{qIndex + 1}</span>
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md",
                                                    item.isCorrect
                                                        ? "text-green-700 bg-green-100"
                                                        : "text-red-700 bg-red-100"
                                                )}>
                                                    {item.isCorrect ? "Correct" : "Incorrect"}
                                                </span>
                                            </div>
                                            <p className="text-base sm:text-lg lg:text-xl font-semibold text-foreground leading-relaxed">
                                                {item.questionText}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Answer Options */}
                                    {item.options && item.options.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            {item.options.map((option, optIndex) => {
                                                const isPlayerAnswer = optIndex === item.playerAnswerIndex
                                                const isCorrectAnswer = optIndex === item.correctAnswerIndex
                                                const isWrongAnswer = !isCorrectAnswer && !isPlayerAnswer

                                                return (
                                                    <div
                                                        key={optIndex}
                                                        className={cn(
                                                            "relative p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all duration-300",
                                                            isCorrectAnswer && "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
                                                            isPlayerAnswer && !isCorrectAnswer && "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800",
                                                            isWrongAnswer && "bg-muted/30 border-transparent opacity-60"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 shadow-sm border border-black/5",
                                                                // Shapes background colors need to act as "icons" so we keep their vibrant colors but maybe accessible?
                                                                // Actually let's use the standard Tailwind colors for shapes
                                                                optIndex === 0 ? "bg-red-500 text-white" :
                                                                    optIndex === 1 ? "bg-blue-500 text-white" :
                                                                        optIndex === 2 ? "bg-yellow-500 text-white" :
                                                                            "bg-green-500 text-white"
                                                            )}>
                                                                {SHAPES[optIndex % SHAPES.length]}
                                                            </div>
                                                            <p className="text-sm sm:text-base flex-1 text-foreground font-medium leading-snug">
                                                                {option}
                                                            </p>
                                                            {isCorrectAnswer && (
                                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                                                    <Check size={16} className="text-white" strokeWidth={4} />
                                                                </div>
                                                            )}
                                                            {isPlayerAnswer && !isCorrectAnswer && (
                                                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {isPlayerAnswer && (
                                                            <div className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-bold shadow-sm">
                                                                You
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation Button */}
                <div className="text-center animate-in fade-in slide-in-from-bottom duration-700 delay-400">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 sm:px-12 text-base sm:text-lg rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1"
                        onClick={handlePlayAgain}
                    >
                        <Home className="mr-2 sm:mr-3" size={24} />
                        Play Again
                    </Button>
                    <p className="text-muted-foreground text-sm sm:text-base mt-4 sm:mt-6 font-medium">Thanks for playing!</p>
                </div>
            </div>
        </div>
    )
}
