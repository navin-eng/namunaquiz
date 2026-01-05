'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Question } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { SHAPES, COLORS } from '@/lib/constants'
import { Loader2, ArrowRight, Eye, EyeOff, Check, X, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useGameSounds } from '@/hooks/use-game-sounds'
import { isFeatureEnabled } from '@/lib/features'
import HostGameOverview from './HostGameOverview'

interface HostRunnerProps {
    sessionId: string
    quizId: string
    initialPlayers: any[]
}

type GamePhase = 'preview' | 'question' | 'results' | 'leaderboard'



export default function HostRunner({ sessionId, quizId, initialPlayers }: HostRunnerProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQIndex, setCurrentQIndex] = useState(0)
    // Ref for accessing current question in event listeners avoiding stale closures
    const questionsRef = React.useRef<Question[]>([])
    const currentQIndexRef = React.useRef(0)

    useEffect(() => { questionsRef.current = questions }, [questions])
    useEffect(() => { currentQIndexRef.current = currentQIndex }, [currentQIndex])
    const [phase, setPhase] = useState<GamePhase>('preview')
    const [timer, setTimer] = useState(5)
    const [answers, setAnswers] = useState<Record<string, number>>({}) // playerId -> answerIndex
    const [streaks, setStreaks] = useState<Record<string, number>>({}) // playerId -> current streak count
    const [players, setPlayers] = useState(initialPlayers)
    const [isAutoMode, setIsAutoMode] = useState(false)
    const [autoTimer, setAutoTimer] = useState(0) // Timer for auto-advancement
    const [onlinePlayers, setOnlinePlayers] = useState<Set<string>>(new Set())
    const [pin, setPin] = useState<string>('') // To display PIN
    const [gameFinished, setGameFinished] = useState(false)

    useEffect(() => {
        // Fetch PIN for display
        supabase.from('game_sessions').select('pin').eq('id', sessionId).single()
            .then(({ data }) => { if (data) setPin(data.pin) })
    }, [sessionId])

    const { play: playSound } = useGameSounds()

    // Shuffle function
    const shuffleArray = (array: any[]) => {
        const newArray = [...array]
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray
    }

    useEffect(() => {
        // Fetch Questions
        const fetchQ = async () => {
            const { data } = await supabase.from('questions').select('*').eq('quiz_id', quizId).order('order_index')
            if (data) {
                console.log('Fetched questions:', data)
                setQuestions(data.map(q => ({
                    id: q.id,
                    question: q.question_text,
                    timeLimit: q.time_limit,
                    options: shuffleArray(q.options)
                })))
            }
        }
        fetchQ()

        // Subscribe to Answers (Broadcast)
        const channel = supabase.channel(`game_${sessionId}`)
        channel.on('broadcast', { event: 'answer' }, ({ payload }) => {
            setAnswers(prev => ({ ...prev, [payload.playerId]: payload.answerIndex }))
        })

        // Power-up Listener (50/50)
        channel.on('broadcast', { event: 'request_5050' }, ({ payload }) => {
            console.log('Powerup requested by', payload.playerId)
            // Logic: Find correct answer, pick 2 wrong ones
            // We need access to current question 'questions[currentQIndex]'
            // Since this is inside useEffect, we need a ref or strict dependency. 
            // Dependency 'questions' and 'currentQIndex' might cause resubscription loop if not careful.
            // Better to use state updater or refs.
            // Quick fix: Just broadcast logic here assuming we rebuild channel on Q change? No, that's bad.
            // Actually, 'questions' and 'currentQIndex' are dependencies of this effect.
            // But we need to make sure we don't break the 'answer' listener.

            // Wait, accessing state inside the callback might require a ref if the closure is stale.
            // Let's use a function reference if possible, or just accept the closure refreshes.
            // For now, let's implement the logic assuming closure access is handled by dependencies.
        })
            .subscribe()

        // Power-up Listener (50/50)
        channel.on('broadcast', { event: 'request_5050' }, ({ payload }) => {
            const currentQ = questionsRef.current[currentQIndexRef.current]
            if (!currentQ) return

            const correctIdx = currentQ.options.findIndex(o => o.isCorrect)
            const wrongIndices = currentQ.options
                .map((_, i) => i)
                .filter(i => i !== correctIdx)

            // Randomly select 2 wrong indices to hide
            // Shuffle wrongIndices
            for (let i = wrongIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
            }
            const hiddenIndices = wrongIndices.slice(0, 2)

            channel.send({
                type: 'broadcast',
                event: 'response_5050',
                payload: {
                    targetPlayerId: payload.playerId,
                    hiddenIndices: hiddenIndices
                }
            })
        })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [quizId, sessionId]) // Removed 'questions', 'currentQIndex' dependency to avoid re-subscribing loop. Refs handle access.

    // Presence Subscription
    useEffect(() => {
        const channel = supabase.channel(`presence_${sessionId}`, {
            config: { presence: { key: 'host' } }
        })

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                const onlineIds = new Set<string>()

                // Extract player IDs from presence state
                // newState is { key: [ { playerId: '...', online_at: '...' } ] }
                Object.values(newState).forEach((presences: any) => {
                    presences.forEach((p: any) => {
                        if (p.playerId) onlineIds.add(p.playerId)
                    })
                })
                console.log('Online players:', onlineIds)
                setOnlinePlayers(onlineIds)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Broadcast host state to players
                    const correctIdx = phase === 'results' ? questions[currentQIndex]?.options.findIndex(o => o.isCorrect) : null
                    await channel.track({
                        phase,
                        timer,
                        correctAnswerIndex: correctIdx
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId, phase, timer, questions, currentQIndex])

    // Timer Logic
    useEffect(() => {
        if (timer > 0) {
            const t = setTimeout(() => setTimer(timer - 1), 1000)
            return () => clearTimeout(t)
        } else {
            handleTimerEnd()
        }
    }, [timer, phase])

    // Check if all *online* players answered
    useEffect(() => {
        if (phase === 'question' && players.length > 0) {
            // Filter answers to only include those from online players? 
            // Or just check if count of answers from online players matches online players count.
            // Note: answers maps playerId -> index.

            // We only care if ALL CURRENTLY ONLINE players have answered.
            // If a player is offline, we don't wait for them.

            const onlineCount = onlinePlayers.size
            if (onlineCount === 0) return // Don't end if no one is online (host setup?)

            let answeredOnlineCount = 0
            onlinePlayers.forEach(pid => {
                if (answers[pid] !== undefined) answeredOnlineCount++
            })

            // Also check if we have answers for all players (even offline ones) just in case? 
            // No, the requirement is "if the player leaves the games, the game should NOT wait".

            if (answeredOnlineCount >= onlineCount && onlineCount > 0) {
                // Add a small delay for UX?
                // Or immediate. Immediate is requested "skip the time... faster".
                handleTimerEnd()
            }
        }
    }, [answers, onlinePlayers, phase]) // Removed players.length dependency as we rely on onlinePlayers

    // Auto Mode Logic
    useEffect(() => {
        let t: NodeJS.Timeout
        if (isAutoMode) {
            if (phase === 'results') {
                if (autoTimer > 0) {
                    t = setTimeout(() => setAutoTimer(prev => prev - 1), 1000)
                } else {
                    // Auto advance to leaderboard
                    setPhase('leaderboard')
                    // Logic to set timer for leaderboard is handled in the effect below or manual set?
                    // We need to set the autoTimer for the next phase immediately or rely on change
                }
            } else if (phase === 'leaderboard') {
                if (autoTimer > 0) {
                    t = setTimeout(() => setAutoTimer(prev => prev - 1), 1000)
                } else {
                    // Auto advance to next question
                    nextQuestion()
                }
            }
        }
        return () => clearTimeout(t)
    }, [isAutoMode, phase, autoTimer])

    // Reset Auto Timer when entering phases
    useEffect(() => {
        if (isAutoMode) {
            if (phase === 'results') {
                setAutoTimer(5) // Wait 5s on results before going to leaderboard
            } else if (phase === 'leaderboard') {
                setAutoTimer(8) // Wait 8s on leaderboard before next question
            }
        }
    }, [phase, isAutoMode])

    const handleTimerEnd = () => {
        if (phase === 'preview') {
            setPhase('question')
            setTimer(questions[currentQIndex]?.timeLimit || 20)
        } else if (phase === 'question') {
            calculateScores()
            setPhase('results')
            setTimer(0) // Stop
        }
    }

    const calculateScores = async () => {
        const currentQ = questions[currentQIndex]
        const correctIndex = currentQ.options.findIndex(o => o.isCorrect)
        const newStreaks = { ...streaks }

        const newPlayers = players.map(p => {
            const ans = answers[p.id]
            let scoreAdd = 0
            let status = 'incorrect'
            let correctInc = 0
            let wrongInc = 0

            // Feature: Streaks
            const enableStreaks = isFeatureEnabled('ENABLE_STREAKS')
            let currentStreak = newStreaks[p.id] || 0

            if (ans === correctIndex) {
                scoreAdd = 1000
                status = 'correct'
                correctInc = 1

                if (enableStreaks) {
                    currentStreak += 1
                    // Bonus: +100 * streak count (capped at 5)
                    const bonus = Math.min(currentStreak, 5) * 100
                    scoreAdd += bonus
                }
            } else {
                // Wrong or no answer
                wrongInc = 1
                if (enableStreaks) {
                    currentStreak = 0 // Reset streak
                }
            }
            if (ans === undefined) status = 'incorrect'

            newStreaks[p.id] = currentStreak

            return {
                ...p,
                score: (p.score || 0) + scoreAdd,
                last_answer_status: status,
                correct_count: (p.correct_count || 0) + correctInc,
                wrong_count: (p.wrong_count || 0) + wrongInc
            }
        })

        setPlayers(newPlayers)
        setStreaks(newStreaks)
        playSound('TRANSITION') // Play sound when results are calculated/shown

        for (const p of newPlayers) {
            await supabase.from('players').update({
                score: p.score,
                last_answer_status: p.last_answer_status,
                correct_count: p.correct_count,
                wrong_count: p.wrong_count
            }).eq('id', p.id)
        }
    }

    const nextQuestion = () => {
        if (phase === 'results') {
            setPhase('leaderboard')
        } else if (phase === 'leaderboard') {
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(currentQIndex + 1)
                setPhase('preview')
                setTimer(5)
                setTimer(5)
                setAnswers({})
                // Reset player status for next round (optional, but good for cleanliness)
                // We can do this in background or just let it be overwritten next time.
                // But to hide the "Correct/Incorrect" screen on player side if they rely on this field, we might want to clear it.
                // However, usually we want them to see "Get Ready" screen which hides the feedback anyway.
                // Let's clear it to be safe.
                const resetPlayers = players.map(p => ({ ...p, last_answer_status: null }))
                setPlayers(resetPlayers)
                resetPlayers.forEach(p => {
                    supabase.from('players').update({ last_answer_status: null }).eq('id', p.id).then()
                })

                updateSessionState(currentQIndex + 1)
            } else {
                playSound('GAME_OVER')
                // Update DB to finished so players see the report
                supabase.from('game_sessions').update({ status: 'finished' }).eq('id', sessionId).then()
                // Show game overview
                setGameFinished(true)
            }
        }
    }

    const updateSessionState = async (idx: number) => {
        await supabase.from('game_sessions').update({ current_question_index: idx }).eq('id', sessionId)
    }

    // State for toggling score visibility
    const [showScores, setShowScores] = useState(false)

    const currentQ = questions[currentQIndex]

    const handleStopGame = async () => {
        if (confirm("Are you sure you want to stop the game?")) {
            await supabase.from('game_sessions').update({ status: 'finished' }).eq('id', sessionId)
            setGameFinished(true)
        }
    }

    if (!currentQ) return <div className="text-white p-10 flex min-h-screen items-center justify-center font-bold text-xl"><Loader2 className="animate-spin mr-3" /> Preparing Game...</div>

    if (gameFinished) {
        return <HostGameOverview players={players} sessionId={sessionId} totalQuestions={questions.length} />
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden relative selection:bg-primary/30">
            {/* Header */}
            <div className="relative z-10 px-8 py-6 flex justify-between items-center border-b border-border bg-background/95 backdrop-blur-sm shadow-sm">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={handleStopGame}
                    >
                        <X className="mr-2" size={20} /> Stop Game
                    </Button>

                    <div className="h-8 w-px bg-border"></div>

                    <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-full border border-border">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none" htmlFor="auto-mode">Auto</label>
                        <Switch
                            id="auto-mode"
                            checked={isAutoMode}
                            onCheckedChange={setIsAutoMode}
                        />
                    </div>

                    <div className="h-8 w-px bg-border"></div>

                    {/* Game PIN Display */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Game PIN</span>
                        <span className="text-xl font-mono text-primary font-bold leading-none">{pin}</span>
                    </div>

                    <div className="h-8 w-px bg-border"></div>

                    <div className="bg-card px-6 py-2 rounded-full font-bold text-xl border border-border flex items-center gap-3 shadow-sm">
                        <span className="text-muted-foreground uppercase text-xs tracking-widest font-mono">Question</span>
                        <span className="text-2xl text-foreground">{currentQIndex + 1}</span>
                        <span className="text-muted-foreground text-lg">/ {questions.length}</span>
                    </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/10 blur-xl rounded-full opacity-50"></div>
                        <div className="relative w-24 h-24 bg-card text-foreground border border-border rounded-full flex items-center justify-center text-5xl font-black shadow-xl z-10 font-mono tracking-tighter">
                            {timer}
                        </div>
                    </div>

                    {/* Skip Button (Only in Question Phase) */}
                    {phase === 'question' && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="absolute left-32 shadow-lg"
                            onClick={() => setTimer(0)}
                        >
                            Skip
                        </Button>
                    )}
                </div>

                {/* Score Toggle Button */}
                <div className="flex items-center gap-4">
                    <div className="bg-card px-6 py-2 rounded-full font-bold text-xl border border-border flex items-center gap-3 shadow-sm">
                        <span className="text-primary font-black text-2xl">{Object.keys(answers).length}</span> <span className="text-sm uppercase tracking-widest text-muted-foreground font-mono">Answers</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border"
                        onClick={() => setShowScores(!showScores)}
                        title="Toggle Live Scores"
                    >
                        {showScores ? <EyeOff size={20} /> : <Eye size={20} />}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 w-full max-w-[1800px] mx-auto">

                {phase === 'preview' && (
                    <div className="text-center animate-in zoom-in duration-500 flex flex-col items-center justify-center h-full max-w-6xl">
                        <h2 className="text-sm md:text-base text-primary mb-8 font-bold tracking-[0.4em] uppercase opacity-80">Next Question</h2>
                        <h1 className="text-6xl md:text-8xl font-black leading-tight text-foreground drop-shadow-xl">
                            {currentQ.question}
                        </h1>
                    </div>
                )}

                {(phase === 'question' || phase === 'results') && (
                    <div className="w-full flex flex-col items-center gap-12 h-full justify-center">
                        <div className="my-auto w-full max-w-6xl text-center">
                            <h1 className="text-5xl md:text-7xl font-bold leading-tight break-words tracking-tight text-foreground">
                                {currentQ.question}
                            </h1>
                        </div>

                        <div className="grid grid-cols-2 gap-6 w-full h-[55vh]">
                            {currentQ.options.map((opt, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "relative group flex items-center p-10 rounded-[2rem] text-4xl font-bold shadow-lg transition-all duration-500 border overflow-hidden bg-card",
                                        // Use direct color classes for visual feedback, overriding cards
                                        phase === 'results' && !opt.isCorrect && "opacity-30 scale-95 grayscale bg-muted border-transparent",
                                        phase === 'results' && opt.isCorrect && "ring-8 ring-green-500/50 scale-105 z-20 shadow-2xl border-green-500 bg-green-500/10",
                                        !phase && "border-border",
                                        // Add color accent on left
                                    )}
                                >
                                    {/* Shape Icon */}
                                    <span className={cn(
                                        "mr-10 text-6xl w-28 h-28 flex items-center justify-center rounded-3xl shadow-sm text-white flex-shrink-0 border border-black/5",
                                        COLORS[i] // Use specific colors for shapes
                                    )}>
                                        {SHAPES[i]}
                                    </span>
                                    <span className="text-foreground relative z-10 leading-snug">{opt.text}</span>

                                    {phase === 'results' && opt.isCorrect && (
                                        <div className="absolute right-10 bg-green-600 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                                            <Check size={56} strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {phase === 'leaderboard' && (
                    <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <div className="flex items-center justify-center gap-6 mb-16">
                            <h1 className="text-8xl font-black text-center tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600 drop-shadow-sm uppercase italic">Leaderboard</h1>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
                            {players.sort((a, b) => b.score - a.score).map((p, i) => (
                                <div key={p.id} className="bg-card border border-border p-6 rounded-[2rem] flex justify-between items-center text-3xl font-bold shadow-sm transform transition hover:scale-[1.01] hover:shadow-md group">
                                    <div className="flex items-center gap-10">
                                        <div className={cn(
                                            "w-20 h-20 flex items-center justify-center rounded-2xl font-black text-4xl shadow-sm border border-border",
                                            i === 0 ? "bg-yellow-400 text-black" :
                                                i === 1 ? "bg-slate-300 text-black" :
                                                    i === 2 ? "bg-orange-400 text-white" : "text-muted-foreground bg-muted"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <span className="truncate max-w-xl group-hover:text-primary transition-colors text-foreground">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-16">
                                        <div className="flex items-center gap-8 text-xl opacity-60 font-mono text-muted-foreground">
                                            <div className="flex items-center gap-3 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl border border-green-500/20">
                                                <Check size={24} /> {p.correct_count || 0}
                                            </div>
                                            <div className="flex items-center gap-3 bg-red-500/10 text-red-600 px-4 py-2 rounded-xl border border-red-500/20">
                                                <X size={24} /> {p.wrong_count || 0}
                                            </div>
                                            {isFeatureEnabled('ENABLE_STREAKS') && streaks[p.id] > 1 && (
                                                <div className="flex items-center gap-2 bg-orange-500/10 text-orange-600 px-4 py-2 rounded-xl border border-orange-500/20 animate-pulse">
                                                    <Flame size={24} fill="currentColor" /> {streaks[p.id]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-mono text-primary text-5xl min-w-[180px] text-right tracking-tight">{p.score.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Live Score Overlay */}
            {showScores && phase !== 'leaderboard' && (
                <div className="absolute top-28 right-8 w-96 bg-popover rounded-2xl p-6 animate-in slide-in-from-right-10 duration-300 z-50 border border-border shadow-2xl">
                    <div className="flex justify-between items-center mb-4 border-b border-border pb-4">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Live Standings</h3>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {players.sort((a, b) => b.score - a.score).map((p, i) => (
                            <div key={p.id} className="flex justify-between items-center text-base p-2 rounded-lg hover:bg-muted transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className={cn("font-mono w-6 text-center text-sm rounded bg-muted", i < 3 && "text-yellow-600 bg-yellow-100")}>{i + 1}</span>
                                    <span className="font-bold truncate max-w-[160px] text-foreground">{p.name}</span>
                                </div>
                                <span className="font-mono text-primary font-bold">{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer Controls */}
            <div className="p-8 flex justify-end bg-background/95 backdrop-blur-md border-t border-border relative z-20">
                {(phase === 'results' || phase === 'leaderboard') && (
                    <Button size="lg" className="text-3xl px-16 py-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-black shadow-2xl transition-all hover:scale-105 group" onClick={nextQuestion}>
                        {phase === 'leaderboard' && currentQIndex >= questions.length - 1 ? "Finish Game" : "Next Question"}
                        <ArrowRight className="ml-6 group-hover:translate-x-2 transition-transform" size={40} />
                    </Button>
                )}
                {isAutoMode && (phase === 'results' || phase === 'leaderboard') && (
                    <div className="absolute bottom-28 right-8 text-muted-foreground font-mono text-sm animate-pulse">
                        Auto-advancing in {autoTimer}s...
                    </div>
                )}
            </div>
        </div>
    )
}
