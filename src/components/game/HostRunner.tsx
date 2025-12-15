
'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Question } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HostRunnerProps {
    sessionId: string
    quizId: string
    initialPlayers: any[]
}

type GamePhase = 'preview' | 'question' | 'results' | 'leaderboard'

const COLORS = ['bg-[#E21B3C]', 'bg-[#1368CE]', 'bg-[#D89E00]', 'bg-[#26890C]'] // Kahoot-ish but richer
const SHAPES = ['▲', '◆', '●', '■']

export default function HostRunner({ sessionId, quizId, initialPlayers }: HostRunnerProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentQIndex, setCurrentQIndex] = useState(0)
    const [phase, setPhase] = useState<GamePhase>('preview')
    const [timer, setTimer] = useState(5)
    const [answers, setAnswers] = useState<Record<string, number>>({}) // playerId -> answerIndex
    const [players, setPlayers] = useState(initialPlayers)

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
        }).subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [quizId, sessionId])

    // Timer Logic
    useEffect(() => {
        if (timer > 0) {
            const t = setTimeout(() => setTimer(timer - 1), 1000)
            return () => clearTimeout(t)
        } else {
            handleTimerEnd()
        }
    }, [timer, phase])

    // Check if all players answered
    useEffect(() => {
        if (phase === 'question' && players.length > 0) {
            const answeredCount = Object.keys(answers).length
            if (answeredCount === players.length) {
                handleTimerEnd()
            }
        }
    }, [answers, players.length, phase])

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

        const newPlayers = players.map(p => {
            const ans = answers[p.id]
            let scoreAdd = 0
            let status = 'incorrect'
            let correctInc = 0
            let wrongInc = 0

            if (ans === correctIndex) {
                scoreAdd = 1000
                status = 'correct'
                correctInc = 1
            } else {
                // Wrong or no answer
                wrongInc = 1
            }
            if (ans === undefined) status = 'incorrect'

            return {
                ...p,
                score: (p.score || 0) + scoreAdd,
                last_answer_status: status,
                correct_count: (p.correct_count || 0) + correctInc,
                wrong_count: (p.wrong_count || 0) + wrongInc
            }
        })

        setPlayers(newPlayers)

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
                alert("Game Over")
            }
        }
    }

    const updateSessionState = async (idx: number) => {
        await supabase.from('game_sessions').update({ current_question_index: idx }).eq('id', sessionId)
    }

    const currentQ = questions[currentQIndex]

    if (!currentQ) return <div className="text-white p-10 flex min-h-screen items-center justify-center">Loading questions...</div>

    return (
        <div className="min-h-screen bg-[#030014] text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <div className="px-4 py-4 md:px-8 md:py-6 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/5">
                <div className="bg-white/10 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-xl border border-white/10">
                    <span className="hidden md:inline">Question</span> {currentQIndex + 1} <span className="text-slate-500 text-sm md:text-lg">/ {questions.length}</span>
                </div>

                <div className="relative">
                    <div className="absolute -inset-4 bg-purple-500/30 blur-xl rounded-full animate-pulse"></div>
                    <div className="relative w-16 h-16 md:w-24 md:h-24 bg-white text-black rounded-full flex items-center justify-center text-3xl md:text-5xl font-black shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        {timer}
                    </div>
                </div>

                <div className="bg-white/10 px-4 py-2 md:px-6 md:py-3 rounded-full font-bold text-sm md:text-xl border border-white/10 flex items-center gap-2 md:gap-3">
                    <span className="text-indigo-400 font-black text-lg md:text-2xl">{Object.keys(answers).length}</span> <span className="hidden md:inline">Answers</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">

                {phase === 'preview' && (
                    <div className="text-center animate-in zoom-in duration-500">
                        <h2 className="text-2xl md:text-4xl text-indigo-400 mb-4 md:mb-6 font-bold tracking-widest uppercase">Get Ready</h2>
                        <h1 className="text-4xl md:text-8xl font-black max-w-5xl leading-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                            {currentQ.question}
                        </h1>
                    </div>
                )}

                {(phase === 'question' || phase === 'results') && (
                    <div className="w-full max-w-7xl flex flex-col items-center gap-6 md:gap-12">
                        <div className="bg-white text-black px-6 py-6 md:px-12 md:py-12 rounded-2xl md:rounded-3xl shadow-2xl text-center w-full transform hover:scale-[1.01] transition-transform">
                            <h1 className="text-2xl md:text-6xl font-bold leading-tight break-words">
                                {currentQ.question}
                            </h1>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full h-auto md:h-[500px]">
                            {currentQ.options.map((opt, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "relative group cursor-default flex items-center p-4 md:p-8 rounded-xl md:rounded-2xl text-xl md:text-4xl font-bold shadow-2xl transition-all duration-500 border-b-4 md:border-b-8 border-black/20 min-h-[80px] md:min-h-0",
                                        COLORS[i],
                                        phase === 'results' && !opt.isCorrect && "opacity-20 scale-95 blur-sm grayscale",
                                        phase === 'results' && opt.isCorrect && "ring-4 md:ring-8 ring-white scale-105 z-10 shadow-[0_0_50px_rgba(255,255,255,0.5)]"
                                    )}
                                >
                                    {/* Pattern overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>

                                    <span className="mr-4 md:mr-8 text-2xl md:text-5xl bg-black/20 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center rounded-lg md:rounded-xl shadow-inner text-white flex-shrink-0">
                                        {SHAPES[i]}
                                    </span>
                                    <span className="text-white drop-shadow-md relative z-10 break-words">{opt.text}</span>

                                    {phase === 'results' && opt.isCorrect && (
                                        <div className="absolute right-8 bg-white text-green-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                            <span className="text-4xl">✓</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {phase === 'leaderboard' && (
                    <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-700">
                        <h1 className="text-7xl font-black text-center mb-16 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 drop-shadow-sm">Top Players</h1>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {players.sort((a, b) => b.score - a.score).map((p, i) => (
                                <div key={p.id} className="bg-black/40 backdrop-blur-md border border-white/10 p-4 md:p-6 rounded-2xl flex justify-between items-center text-xl md:text-3xl font-bold shadow-xl transform transition hover:scale-[1.01] hover:bg-white/10">
                                    <div className="flex items-center gap-4 md:gap-8">
                                        <div className={cn(
                                            "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full font-black text-lg md:text-2xl",
                                            i === 0 ? "bg-yellow-400 text-black shadow-[0_0_20px_#FACC15]" :
                                                i === 1 ? "bg-slate-300 text-black" :
                                                    i === 2 ? "bg-orange-600 text-white" : "text-slate-500 bg-white/5"
                                        )}>
                                            {i + 1}
                                        </div>
                                        <span className="truncate max-w-[200px] md:max-w-md">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 md:gap-8">
                                        <div className="flex items-center gap-2 md:gap-4 text-base md:text-xl opacity-80">
                                            <div className="flex items-center gap-1 text-green-400">
                                                <span>✓</span>
                                                <span>{p.correct_count || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-red-400">
                                                <span>✗</span>
                                                <span>{p.wrong_count || 0}</span>
                                            </div>
                                        </div>
                                        <div className="font-mono text-indigo-400 min-w-[80px] text-right">{p.score} pts</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            <div className="p-6 flex justify-end bg-black/30 backdrop-blur-md border-t border-white/5">
                {(phase === 'results' || phase === 'leaderboard') && (
                    <Button size="lg" className="text-2xl px-12 py-8 bg-white text-black hover:bg-slate-200 rounded-full font-bold shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all hover:scale-105" onClick={nextQuestion}>
                        Next Question
                    </Button>
                )}
            </div>
        </div>
    )
}
