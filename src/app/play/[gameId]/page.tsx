
'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Check, X, Smartphone, Zap } from 'lucide-react'

// Shapes map
const SHAPES = ['▲', '◆', '●', '■']
const COLORS = ['bg-[#E21B3C]', 'bg-[#1368CE]', 'bg-[#D89E00]', 'bg-[#26890C]']

export default function PlayerGameController({ params }: { params: Promise<{ gameId: string }> }) {
    const { gameId } = React.use(params)
    const [playerId, setPlayerId] = useState<string | null>(null)
    const [playerData, setPlayerData] = useState<any>(null)
    const [status, setStatus] = useState<string>('waiting')
    const [hasAnswered, setHasAnswered] = useState(false)
    const [currentQIndex, setCurrentQIndex] = useState(0)

    useEffect(() => {
        const pid = localStorage.getItem('playerId')
        if (!pid) return
        setPlayerId(pid)

        const fetchStatus = async () => {
            const { data } = await supabase.from('game_sessions').select('*').eq('id', gameId).single()
            if (data) {
                setStatus(data.status)
                setCurrentQIndex(data.current_question_index)
            }
        }
        fetchStatus()

        const fetchPlayer = async () => {
            const { data } = await supabase.from('players').select('*').eq('id', pid).single()
            setPlayerData(data)
        }
        fetchPlayer()

        const sessionChannel = supabase.channel(`session_${gameId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${gameId}` }, (payload: any) => {
                const newStatus = payload.new.status
                const newIndex = payload.new.current_question_index

                if (newIndex !== currentQIndex) {
                    setHasAnswered(false)
                    setCurrentQIndex(newIndex)
                }
                setStatus(newStatus)
            })
            .subscribe()

        const playerChannel = supabase.channel(`player_${pid}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${pid}` }, (payload: any) => {
                setPlayerData(payload.new)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(sessionChannel)
            supabase.removeChannel(playerChannel)
        }
    }, [gameId, currentQIndex])

    const handleAnswer = async (index: number) => {
        if (hasAnswered || status !== 'active') return

        setHasAnswered(true)

        await supabase.channel(`game_${gameId}`).send({
            type: 'broadcast',
            event: 'answer',
            payload: {
                playerId: playerId,
                answerIndex: index
            }
        })
    }

    if (!playerId) return <div className="text-white min-h-screen bg-[#030014] flex items-center justify-center">Connecting...</div>

    if (status === 'waiting') {
        return (
            <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-indigo-600/20 rounded-full blur-[80px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-bounce">
                        <Smartphone size={40} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black mb-2 tracking-tight">You're in!</h1>
                        <p className="text-slate-400 text-lg">See your name on screen?</p>
                    </div>
                    <div className="text-2xl font-bold bg-white/10 backdrop-blur-md border border-white/10 px-8 py-4 rounded-xl animate-pulse">
                        {playerData?.name}
                    </div>
                </div>
            </div>
        )
    }

    if (status === 'finished') {
        return (
            <div className="min-h-screen bg-[#030014] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/20"></div>
                <div className="relative z-10 flex flex-col items-center gap-8">
                    <h1 className="text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-red-500">Game Over</h1>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-slate-400 text-xl uppercase tracking-widest">Final Score</p>
                        <div className="text-7xl font-black bg-white text-black px-10 py-6 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] transform hover:scale-105 transition-transform">
                            {playerData?.score || 0}
                        </div>
                    </div>
                    <p className="text-slate-500">Thanks for playing!</p>
                </div>
            </div>
        )
    }

    // Active Game
    return (
        <div className="min-h-screen bg-[#030014] p-4 flex flex-col touch-none">
            {/* Header */}
            <div className="flex justify-between items-center text-white mb-8 bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/5">
                <div className="font-bold text-lg">{playerData?.name}</div>
                <div className="bg-indigo-600 px-4 py-1 rounded-full font-mono font-bold shadow-lg shadow-indigo-600/30">{playerData?.score || 0} pts</div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                {hasAnswered && !playerData?.last_answer_status ? (
                    <div className="text-center text-white animate-pulse flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6">
                            <Zap size={40} className="text-yellow-400 fill-current" />
                        </div>
                        <div className="text-4xl font-bold mb-2">Answer Sent</div>
                        <p className="text-slate-400">Wait for results...</p>
                    </div>
                ) : playerData?.last_answer_status === 'correct' ? (
                    <div className="flex flex-col items-center justify-center h-full animate-in zoom-in duration-300">
                        <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_#22c55e]">
                            <Check size={64} className="text-white" />
                        </div>
                        <h1 className="text-5xl font-black text-green-500 mb-2">Correct!</h1>
                        <div className="text-white text-xl">+1000 pts</div>
                    </div>
                ) : playerData?.last_answer_status === 'incorrect' ? (
                    <div className="flex flex-col items-center justify-center h-full animate-in zoom-in duration-300">
                        <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_#ef4444]">
                            <X size={64} className="text-white" />
                        </div>
                        <h1 className="text-5xl font-black text-red-500 mb-2">Incorrect</h1>
                        <div className="text-slate-400 text-xl">Better luck next time!</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 h-[60vh]">
                        {COLORS.map((color, i) => (
                            <button
                                key={i}
                                className={cn(
                                    "rounded-2xl shadow-lg flex items-center justify-center transition-all active:scale-95 active:brightness-90 relative overflow-hidden group border-b-4 border-black/20",
                                    color
                                )}
                                onClick={() => handleAnswer(i)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                                <span className="text-white text-7xl shadow-black drop-shadow-md transform group-active:scale-90 transition-transform">{SHAPES[i]}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
