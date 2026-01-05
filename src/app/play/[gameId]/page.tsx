
'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Check, X, Smartphone, Zap, Sparkles } from 'lucide-react'
import { SHAPES, COLORS } from '@/lib/constants'
import { isFeatureEnabled } from '@/lib/features'
import PlayerReport from '@/components/game/PlayerReport'
import { useGameSounds } from '@/hooks/use-game-sounds'

interface GameHistoryItem {
    questionText: string
    isCorrect: boolean
    playerAnswerIndex?: number
    correctAnswerIndex?: number
    options?: string[]
}

// Unused React.use removed implicitly by not using it.
export default function PlayerGameController() { // Removed prop
    const params = useParams()
    const gameId = params?.gameId as string // Cast as string
    // const { gameId } = React.use(params) // Removed
    const [playerId, setPlayerId] = useState<string | null>(null)
    const [playerData, setPlayerData] = useState<any>(null)
    const [status, setStatus] = useState<string>('waiting')
    const [hasAnswered, setHasAnswered] = useState(false)
    const [currentQIndex, setCurrentQIndex] = useState(0)
    const [playerAnswerIndex, setPlayerAnswerIndex] = useState<number | null>(null)

    const [currentQText, setCurrentQText] = useState<string>('')
    const [currentOptions, setCurrentOptions] = useState<any[]>([])
    const [currentCorrectIndex, setCurrentCorrectIndex] = useState<number | null>(null)
    const { play: playSound } = useGameSounds()
    const [hostPhase, setHostPhase] = useState<string>('active')
    const [timer, setTimer] = useState<number>(0)
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(null)

    // Power-up State
    const [hiddenOptions, setHiddenOptions] = useState<number[]>([])
    const [is5050Used, setIs5050Used] = useState(false)

    const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([])

    useEffect(() => {
        // Initialize history from storage
        try {
            const hist = sessionStorage.getItem(`history_${gameId}`)
            if (hist) setGameHistory(JSON.parse(hist))
        } catch (e) {
            console.error(e)
        }
    }, [gameId])

    useEffect(() => {
        // Tab Encapsulation: Initialize from storage
        const storedPid = sessionStorage.getItem('playerId')
        if (storedPid) setPlayerId(storedPid)
    }, [])

    useEffect(() => {
        if (!playerId) return
        const pid = playerId // Local alias to keep rest of code working

        const fetchStatus = async () => {
            const { data } = await supabase.from('game_sessions').select('*').eq('id', gameId).single()
            if (data) {
                setStatus(data.status)
                setCurrentQIndex(data.current_question_index)
                if (data.status === 'active' || data.status === 'waiting') { // 'waiting' might be pre-game, 'active' has questions
                    // Fetch complete question data including options
                    const { data: qData } = await supabase.from('questions')
                        .select('question_text, options')
                        .eq('quiz_id', data.quiz_id)
                        .eq('order_index', data.current_question_index)
                        .single()

                    if (qData) {
                        setCurrentQText(qData.question_text)
                        setCurrentOptions(qData.options || [])
                        const correctIdx = qData.options?.findIndex((opt: any) => opt.isCorrect) ?? null
                        setCurrentCorrectIndex(correctIdx)
                    }
                }
            }
        }
        fetchStatus()

        const fetchPlayer = async () => {
            const { data } = await supabase.from('players').select('*').eq('id', pid).single()
            setPlayerData(data)
        }
        fetchPlayer()

        const sessionChannel = supabase.channel(`session_${gameId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${gameId}` }, async (payload: any) => {
                const newStatus = payload.new.status
                const newIndex = payload.new.current_question_index
                const quizId = payload.new.quiz_id

                if (newIndex !== currentQIndex) {
                    setHasAnswered(false)
                    setPlayerAnswerIndex(null) // Reset for new question
                    setCurrentQIndex(newIndex)

                    // Fetch new question with complete data
                    const { data: qData } = await supabase.from('questions')
                        .select('question_text, options')
                        .eq('quiz_id', quizId)
                        .eq('order_index', newIndex)
                        .single()
                    if (qData) {
                        setCurrentQText(qData.question_text)
                        setCurrentOptions(qData.options || [])
                        const correctIdx = qData.options?.findIndex((opt: any) => opt.isCorrect) ?? null
                        setCurrentCorrectIndex(correctIdx)
                    }
                }
                if (newStatus === 'finished') {
                    // Final fetch of player data to ensure we have latest score
                    const { data: latestPlayer } = await supabase.from('players').select('*').eq('id', pid).single()
                    if (latestPlayer) setPlayerData(latestPlayer)
                }
                setStatus(newStatus)
            })
            .subscribe()

        const playerChannel = supabase.channel(`player_${pid}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${pid}` }, (payload: any) => {
                setPlayerData(payload.new)
            })
            .subscribe()

        // Presence Channel (Track Online Status & Listen to Host)
        const presenceChannel = supabase.channel(`presence_${gameId}`, {
            config: {
                presence: {
                    key: pid,
                },
            },
        })

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = presenceChannel.presenceState()
                // Find Host state
                if (newState['host']) {
                    const hostState = newState['host'][0] as any
                    if (hostState?.phase) {
                        setHostPhase(hostState.phase)
                    }
                    if (hostState?.timer !== undefined) {
                        setTimer(hostState.timer)
                    }
                    if (hostState?.correctAnswerIndex !== undefined) {
                        setCorrectAnswerIndex(hostState.correctAnswerIndex)
                    }
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        online_at: new Date().toISOString(),
                        playerId: pid
                    })
                }
            })

        return () => {
            supabase.removeChannel(sessionChannel)
            supabase.removeChannel(playerChannel)
            supabase.removeChannel(presenceChannel)
        }
    }, [gameId, currentQIndex, playerId])

    // Effect for Result Sounds and History Tracking
    useEffect(() => {
        if (playerData?.last_answer_status && currentQText) {
            const isCorrect = playerData.last_answer_status === 'correct'

            // Track History with complete details
            setGameHistory(prev => {
                // Avoid duplicates: check if last item matches current question
                if (prev.length > 0 && prev[prev.length - 1].questionText === currentQText) {
                    return prev
                }
                const newItem: GameHistoryItem = {
                    questionText: currentQText || `Question ${currentQIndex + 1}`,
                    isCorrect: isCorrect,
                    playerAnswerIndex: playerAnswerIndex ?? undefined,
                    correctAnswerIndex: currentCorrectIndex ?? undefined,
                    options: currentOptions && currentOptions.length > 0
                        ? currentOptions.map((opt: any) => opt.text || opt)
                        : undefined
                }
                const newHistory = [...prev, newItem]
                sessionStorage.setItem(`history_${gameId}`, JSON.stringify(newHistory))
                console.log('Saved history item:', newItem) // Debug log
                return newHistory
            })
        }
    }, [playerData?.last_answer_status, currentQText, playerAnswerIndex, currentCorrectIndex, currentOptions, gameId, currentQIndex])

    // Specific effect for sounds to avoid multiple playings
    useEffect(() => {
        if (playerData?.last_answer_status) {
            if (playerData.last_answer_status === 'correct') playSound('CORRECT')
            else playSound('WRONG')
        }
    }, [playerData?.last_answer_status, playSound])

    const handleRequest5050 = async () => {
        if (is5050Used || hasAnswered) return
        setIs5050Used(true)
        playSound('TRANSITION') // reused sound for effect

        await supabase.channel(`game_${gameId}`).send({
            type: 'broadcast',
            event: 'request_5050',
            payload: { playerId }
        })
    }

    // Listen for power-up response inside connection effect or new effect?
    // The channel is already set up in useEffect but logic is minimal there.
    // Let's add a robust listener here.
    useEffect(() => {
        if (!playerId) return

        const channel = supabase.channel(`game_${gameId}`)
        channel.on('broadcast', { event: 'response_5050' }, ({ payload }) => {
            if (payload.targetPlayerId === playerId) {
                setHiddenOptions(payload.hiddenIndices)
                playSound('TICK') // reused for feedback
            }
        }).subscribe()

        return () => {
            // Removing channel here might conflict with other effect. 
            // Ideally we should merge all channel logic.
            // But existing code uses multiple subscriptions to same channel name (supabase js handles this via multiplexing usually, or just careful management).
            // The previous effect does NOT use the generic `game_${gameId}` for *listening* (Wait, check previous code).
            // Ah, previous code only Sends to `game_${gameId}`. It listens to `session_${gameId}` (postgres changes).
            // So this is the FIRST listener on the broadcast channel for the player. Safe.
            supabase.removeChannel(channel)
        }
    }, [gameId, playerId])

    // Reset hidden options when new question comes
    useEffect(() => {
        setHiddenOptions([])
    }, [currentQIndex])

    const handleAnswer = async (index: number) => {
        if (hasAnswered || status !== 'active' || timer === 0 || hostPhase === 'results') return

        setHasAnswered(true)
        setPlayerAnswerIndex(index) // Track player's answer

        await supabase.channel(`game_${gameId}`).send({
            type: 'broadcast',
            event: 'answer',
            payload: {
                playerId: playerId,
                answerIndex: index
            }
        })
        playSound('TICK') // Or a specific click sound
    }

    if (!playerId) return <div className="text-white min-h-screen bg-[#030014] flex items-center justify-center">Connecting...</div>

    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Smartphone size={32} className="text-white" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-3">You're In!</h1>
                        <p className="text-slate-400 text-base sm:text-lg mb-6">Look at the host screen</p>
                        <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl px-6 py-4">
                            <p className="text-sm text-slate-400 mb-1">Your Name</p>
                            <p className="text-xl sm:text-2xl font-bold text-white">{playerData?.name}</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (status === 'finished') {
        return <PlayerReport playerData={playerData} history={gameHistory} />
    }

    // Active Game
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 transition-colors duration-500 max-w-lg mx-auto w-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 sticky top-0 z-50 py-3 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="bg-card border border-border rounded-xl px-4 py-1.5 shadow-sm">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none mb-1">Player</p>
                    <p className="font-bold text-xs md:text-sm tracking-tight truncate max-w-[100px]">{playerData?.name}</p>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                    {(hostPhase === 'question' || hostPhase === 'active') && timer > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-1.5 flex flex-col items-center min-w-[50px] md:min-w-[60px]">
                            <span className="text-[8px] md:text-[10px] uppercase font-bold text-yellow-600/70 leading-none mb-1">Time</span>
                            <span className="text-sm md:text-lg font-bold text-yellow-600 tabular-nums leading-none">{timer}</span>
                        </div>
                    )}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5 flex flex-col items-center min-w-[60px] md:min-w-[70px]">
                        <span className="text-[8px] md:text-[10px] uppercase font-bold text-indigo-600/70 leading-none mb-1">Score</span>
                        <span className="text-sm md:text-lg font-bold text-indigo-600 tabular-nums leading-none">{playerData?.score || 0}</span>
                    </div>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col w-full">

                {/* Phase: Preview (Get Ready) */}
                {!hasAnswered && hostPhase === 'preview' && (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-2xl w-full">
                            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <span className="text-5xl">👀</span>
                            </div>
                            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Get Ready!</h2>
                            <p className="text-muted-foreground text-lg">Eyes on the host screen</p>
                        </div>
                    </div>
                )}

                {/* Phase: Question (Show Options) */}
                {!hasAnswered && (hostPhase === 'question' || hostPhase === 'active' || !hostPhase) && timer > 0 && (
                    <div className="flex-1 flex flex-col h-full">
                        <div className="flex-1 flex flex-col items-center justify-center py-4 md:py-8 gap-6 h-full">
                            {currentQText && (
                                <div className="bg-card border border-border p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-md w-full animate-in fade-in slide-in-from-top-4 duration-500">
                                    <h2 className="text-lg md:text-2xl font-black text-center leading-tight tracking-tight text-foreground">{currentQText}</h2>
                                </div>
                            )}
                            <div className="text-center space-y-1">
                                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-1">
                                    Your Turn
                                </div>
                                <p className="text-muted-foreground text-xs md:text-sm font-medium">Match the shape on the screen</p>
                            </div>
                        </div>

                        {/* Powerups Section */}
                        {isFeatureEnabled('ENABLE_POWERUPS') && (
                            <div className="mb-4 flex justify-center">
                                <button
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-sm border",
                                        is5050Used
                                            ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-50"
                                            : "bg-background text-pink-600 border-pink-200 hover:bg-pink-50 hover:border-pink-300 shadow-pink-100/50"
                                    )}
                                    onClick={handleRequest5050}
                                    disabled={is5050Used}
                                >
                                    <Sparkles size={14} className={is5050Used ? "" : "fill-pink-600"} />
                                    <span>50/50 Chance</span>
                                </button>
                            </div>
                        )}

                        {/* Answer Buttons - Mobile Optimized Grid */}
                        <div className="grid grid-cols-2 gap-4 pb-4">
                            {COLORS.map((color, i) => (
                                <button
                                    key={i}
                                    className={cn(
                                        "aspect-square rounded-2xl shadow-sm flex items-center justify-center transition-all active:scale-95 hover:-translate-y-1 relative overflow-hidden group border-b-4",
                                        // Specific semantic colors for shapes using standardized palette
                                        i === 0 ? "bg-red-500 border-red-700 hover:bg-red-400" :
                                            i === 1 ? "bg-blue-500 border-blue-700 hover:bg-blue-400" :
                                                i === 2 ? "bg-yellow-500 border-yellow-700 hover:bg-yellow-400" :
                                                    "bg-green-500 border-green-700 hover:bg-green-400",
                                        hiddenOptions.includes(i) && "opacity-20 grayscale pointer-events-none border-transparent shadow-none"
                                    )}
                                    onClick={() => handleAnswer(i)}
                                    disabled={hiddenOptions.includes(i)}
                                >
                                    <span className="text-6xl text-white drop-shadow-md transform transition-transform group-active:scale-75">{SHAPES[i]}</span>
                                    {/* Ripple effect can be added here or relied on active:scale */}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Time's Up */}
                {!hasAnswered && timer === 0 && (hostPhase === 'question' || hostPhase === 'active') && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-xl w-full max-w-sm">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-4xl">⏰</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-3 text-foreground">Time's Up!</h2>
                            <p className="text-muted-foreground">You didn't answer in time.</p>
                        </div>
                    </div>
                )}

                {/* Answer Sent */}
                {hasAnswered && !playerData?.last_answer_status ? (
                    <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
                        <div className="bg-card border border-border rounded-3xl p-10 text-center shadow-xl w-full max-w-sm">
                            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-100">
                                <Zap size={32} className="text-yellow-500 fill-current" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Answer Sent</h2>
                            <p className="text-muted-foreground text-sm">Waiting for results...</p>
                        </div>
                    </div>
                ) : hostPhase === 'results' && correctAnswerIndex !== null ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-foreground mb-1">Correct Answer</h2>
                            <p className="text-muted-foreground text-sm">Did you get it right?</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            {COLORS.map((color, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "aspect-square rounded-2xl flex items-center justify-center relative transition-all duration-500",
                                        // Colors mapping
                                        i === 0 ? "bg-red-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-yellow-500" : "bg-green-500",
                                        i !== correctAnswerIndex && "opacity-10 grayscale scale-95",
                                        i === correctAnswerIndex && "ring-4 ring-offset-4 ring-offset-background ring-green-500 shadow-xl scale-105 z-10"
                                    )}
                                >
                                    <span className="text-5xl text-white drop-shadow-md">{SHAPES[i]}</span>
                                    {i === correctAnswerIndex && (
                                        <div className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg border border-green-100">
                                            <Check size={20} className="text-green-600" strokeWidth={4} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : playerData?.last_answer_status === 'correct' ? (
                    <div className="flex-1 flex items-center justify-center animate-in zoom-in duration-300">
                        <div className="bg-card border border-green-100 rounded-3xl p-10 text-center shadow-2xl shadow-green-500/10 w-full max-w-sm relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-green-500"></div>
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Check size={48} className="text-green-600" strokeWidth={4} />
                            </div>
                            <h1 className="text-4xl font-extrabold text-green-700 mb-2">Correct!</h1>
                            <p className="text-green-600/80 font-medium mb-6">Great job!</p>
                            <div className="bg-green-500 text-white rounded-xl px-6 py-3 font-bold text-xl inline-flex items-center gap-2 shadow-lg shadow-green-500/20">
                                <span className="text-sm uppercase opacity-80">Points</span>
                                <span>+1000</span>
                            </div>
                        </div>
                    </div>
                ) : playerData?.last_answer_status === 'incorrect' ? (
                    <div className="flex-1 flex items-center justify-center animate-in zoom-in duration-300">
                        <div className="bg-card border border-red-100 rounded-3xl p-10 text-center shadow-2xl shadow-red-500/10 w-full max-w-sm relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-red-500"></div>
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <X size={48} className="text-red-600" strokeWidth={4} />
                            </div>
                            <h1 className="text-4xl font-extrabold text-red-700 mb-2">Wrong</h1>
                            <p className="text-muted-foreground">Don't give up, try the next one!</p>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
