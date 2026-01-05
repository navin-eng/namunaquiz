'use client'

import React, { useMemo } from 'react'
import { Trophy, Medal, Award, TrendingUp, Users, Target, Home, BarChart3, Check, X, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Player {
    id: string
    name: string
    score: number
    correct_count: number
    wrong_count: number
}

interface HostGameOverviewProps {
    players: Player[]
    sessionId: string
    totalQuestions: number
}

export default function HostGameOverview({ players, sessionId, totalQuestions }: HostGameOverviewProps) {
    const router = useRouter()

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => b.score - a.score)
    }, [players])

    const stats = useMemo(() => {
        const totalPlayers = players.length
        const totalScore = players.reduce((sum, p) => sum + (p.score || 0), 0)
        const avgScore = totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0
        const totalCorrect = players.reduce((sum, p) => sum + (p.correct_count || 0), 0)
        const totalWrong = players.reduce((sum, p) => sum + (p.wrong_count || 0), 0)
        const avgAccuracy = totalQuestions > 0 && totalPlayers > 0
            ? Math.round((totalCorrect / (totalPlayers * totalQuestions)) * 100)
            : 0

        return { totalPlayers, avgScore, avgAccuracy, totalCorrect, totalWrong }
    }, [players, totalQuestions])

    const getMedalIcon = (rank: number) => {
        if (rank === 0) return <Trophy className="text-yellow-400" size={32} />
        if (rank === 1) return <Medal className="text-slate-300" size={28} />
        if (rank === 2) return <Award className="text-orange-600" size={28} />
        return null
    }

    return (
        <div className="min-h-screen bg-background text-foreground overflow-y-auto">
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-top duration-700">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-card border border-border rounded-full mb-4 sm:mb-6 shadow-xl shadow-yellow-500/10">
                        <Trophy size={40} className="text-yellow-500 sm:w-12 sm:h-12 fill-yellow-500/20" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-3 sm:mb-4 tracking-tight text-foreground">
                        Game Complete!
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground font-medium">Here's how everyone performed</p>
                </div>

                {/* Overall Statistics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
                    <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:scale-105 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                                <Users className="text-primary" size={24} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">{stats.totalPlayers}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-bold">Players</div>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                                <Target className="text-purple-600" size={24} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">{totalQuestions}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-bold">Questions</div>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-green-500/50 transition-all duration-300 hover:scale-105 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                                <TrendingUp className="text-green-600" size={24} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">{stats.avgScore}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-bold">Avg Score</div>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 shadow-sm">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                                <BarChart3 className="text-blue-600" size={24} />
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-foreground mb-1">{stats.avgAccuracy}%</div>
                            <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-bold">Avg Accuracy</div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                        <Trophy className="text-primary" size={32} />
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Final Leaderboard</h2>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {sortedPlayers.map((player, index) => (
                            <div
                                key={player.id}
                                className={cn(
                                    "bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 transition-all duration-300 hover:shadow-md hover:scale-[1.01]",
                                    index === 0 && "ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/10",
                                    index === 1 && "ring-2 ring-slate-400 bg-slate-50 dark:bg-slate-900/10",
                                    index === 2 && "ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/10"
                                )}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    {/* Rank */}
                                    <div className={cn(
                                        "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl flex-shrink-0 shadow-sm border border-black/5",
                                        index === 0 ? "bg-yellow-400 text-black" :
                                            index === 1 ? "bg-slate-300 text-black" :
                                                index === 2 ? "bg-orange-400 text-white" :
                                                    "bg-muted text-muted-foreground"
                                    )}>
                                        {index < 3 ? getMedalIcon(index) : index + 1}
                                    </div>

                                    {/* Player Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-lg sm:text-xl lg:text-2xl text-foreground truncate mb-1">
                                            {player.name}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                            <div className="flex items-center gap-1 text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-lg">
                                                <Check size={14} strokeWidth={3} />
                                                <span className="font-bold">{player.correct_count || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-lg">
                                                <X size={14} strokeWidth={3} />
                                                <span className="font-bold">{player.wrong_count || 0}</span>
                                            </div>
                                            <div className="text-muted-foreground font-medium">
                                                {totalQuestions > 0 ? Math.round(((player.correct_count || 0) / totalQuestions) * 100) : 0}% accuracy
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary font-mono tracking-tight">
                                            {player.score?.toLocaleString() || 0}
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold">points</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <Button
                        size="lg"
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 sm:py-7 text-base sm:text-lg rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1"
                        onClick={() => router.push('/admin')}
                    >
                        <Home className="mr-2" size={24} />
                        Back to Dashboard
                    </Button>
                    <Button
                        size="lg"
                        className="flex-1 bg-card hover:bg-muted border border-border text-foreground font-bold py-6 sm:py-7 text-base sm:text-lg rounded-xl transition-all hover:-translate-y-1 hover:shadow-md"
                        onClick={() => router.push('/admin/quizzes')}
                    >
                        <Play className="mr-2" size={24} />
                        Start New Game
                    </Button>
                </div>
            </div>
        </div>
    )
}
