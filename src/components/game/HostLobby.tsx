
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { User, Music, Volume2, Sparkles, Smartphone } from 'lucide-react'

interface HostLobbyProps {
    pin: string
    players: any[]
    onStart: () => void
}

export default function HostLobby({ pin, players, onStart }: HostLobbyProps) {
    return (
        <div className="flex flex-col min-h-screen bg-[#030014] text-white relative overflow-hidden">
            {/* Background Visuals */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center pt-20 pb-10 flex-1">

                <div className="text-center mb-16 animate-float">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-6 backdrop-blur-md">
                        <Smartphone size={16} className="text-white" />
                        <span className="font-mono tracking-wider">Join at school.com/play</span>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 px-16 py-8 rounded-2xl shadow-2xl">
                            <span className="block text-slate-400 text-sm tracking-[0.2em] mb-2 uppercase">Game PIN</span>
                            <h1 className="text-9xl font-black tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ fontFamily: '"Space Grotesk", monospace' }}>
                                {pin}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-7xl px-8">
                    <div className="flex items-center justify-between mb-8 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/5 mx-auto max-w-5xl">
                        <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-full border border-white/5">
                            <User className="text-indigo-400" />
                            <span className="text-3xl font-bold">{players.length}</span>
                            <span className="text-slate-500 text-sm font-medium uppercase tracking-wider ml-1">Players</span>
                        </div>

                        <Button
                            size="lg"
                            className="text-2xl px-16 py-10 rounded-full bg-white text-black hover:bg-slate-200 hover:scale-[1.02] shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] transition-all font-bold tracking-tight"
                            onClick={onStart}
                            disabled={players.length === 0}
                        >
                            Start Game
                            <Sparkles className="ml-3 text-yellow-500" fill="currentColor" />
                        </Button>

                        <div className="flex gap-2">
                            <Button variant="ghost" className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/5"><Volume2 className="text-slate-300" /></Button>
                        </div>
                    </div>

                    <div className="min-h-[200px] mt-12 bg-white/5 backdrop-blur-sm rounded-[2rem] border border-white/5 p-8">
                        {players.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-2xl font-light">Waiting for players to join...</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-4 justify-center">
                                {players.map((p, i) => (
                                    <div key={p.id} className="bg-black/40 border border-white/10 px-8 py-4 rounded-2xl shadow-lg text-2xl font-bold animate-in zoom-in duration-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-colors flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-sm">
                                            {['👾', '🚀', '⭐', '🎸', '🍕', '🦄'][i % 6]}
                                        </div>
                                        {p.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
