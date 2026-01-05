
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { User, Music, Volume2, Sparkles, Smartphone } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface HostLobbyProps {
    pin: string
    players: any[]
    onStart: () => void
}

export default function HostLobby({ pin, players, onStart }: HostLobbyProps) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center justify-center pt-20 pb-10 flex-1">

                <div className="text-center mb-8 md:mb-16 animate-float px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full bg-muted border border-border text-sm md:text-base text-muted-foreground mb-6 md:mb-8 shadow-sm">
                        <Smartphone size={18} className="text-primary md:w-5 md:h-5" />
                        <span className="font-medium tracking-wide">Join at <span className="font-bold text-foreground">school.com/play</span></span>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                        {/* PIN Area */}
                        <div className="relative group w-full max-w-xs md:max-w-none">
                            <div className="absolute -inset-1 bg-primary/20 rounded-3xl blur-md opacity-50 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative bg-card border border-border px-10 py-6 md:px-20 md:py-10 rounded-3xl shadow-xl flex flex-col items-center">
                                <span className="block text-muted-foreground text-[10px] md:text-sm tracking-[0.3em] mb-2 md:mb-4 uppercase font-bold">Game PIN</span>
                                <h1 className="text-6xl md:text-9xl font-black tracking-widest text-foreground drop-shadow-sm font-mono">
                                    {pin}
                                </h1>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="hidden sm:block bg-white p-4 md:p-6 rounded-3xl shadow-xl border border-border transform rotate-2 hover:rotate-0 transition-transform duration-300">
                            <QRCodeSVG
                                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/play?pin=${pin}`}
                                size={140}
                                level="H"
                                className="md:w-[180px] md:h-[180px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-7xl px-4 md:px-8">
                    {/* Control Bar */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-card/50 backdrop-blur-md p-4 md:p-6 rounded-3xl border border-border mx-auto max-w-5xl shadow-sm">
                        <div className="flex items-center gap-3 md:gap-4 bg-muted px-6 py-2 md:px-8 md:py-4 rounded-full border border-border">
                            <User className="text-primary w-5 h-5 md:w-7 md:h-7" />
                            <span className="text-2xl md:text-4xl font-bold text-foreground">{players.length}</span>
                            <span className="text-muted-foreground text-[10px] md:text-sm font-bold uppercase tracking-wider">Players</span>
                        </div>

                        <Button
                            size="lg"
                            className="w-full md:w-auto text-xl md:text-3xl px-8 md:px-20 py-6 md:py-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] shadow-xl shadow-primary/20 transition-all font-black"
                            onClick={onStart}
                            disabled={players.length === 0}
                        >
                            Start Game
                            <Sparkles className="ml-3 md:ml-4 w-5 h-5 md:w-8 md:h-8 text-yellow-300" fill="currentColor" />
                        </Button>

                        <div className="hidden md:flex gap-2">
                            <Button variant="outline" size="icon" className="w-12 h-12 md:w-16 md:h-16 rounded-full border-border bg-card hover:bg-muted">
                                <Volume2 className="text-muted-foreground w-5 h-5 md:w-7 md:h-7" />
                            </Button>
                        </div>
                    </div>

                    {/* Players Grid */}
                    <div className="min-h-[150px] md:min-h-[250px] mt-6 md:mt-12 bg-muted/30 rounded-3xl md:rounded-[3rem] border-2 border-dashed border-border p-6 md:p-12">
                        {players.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8 md:py-12 opacity-50">
                                <div className="w-12 h-12 md:w-20 md:h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4 md:mb-6"></div>
                                <p className="text-xl md:text-3xl font-light text-center">Waiting for players to join...</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
                                {players.map((p, i) => (
                                    <div key={p.id} className="bg-card border border-border px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-2xl shadow-sm text-sm md:text-2xl font-bold animate-in bounce-in duration-500 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-2 md:gap-4 group cursor-default">
                                        <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">
                                            {['👾', '🚀', '⭐', '🎸', '🍕', '🦄'][i % 6]}
                                        </div>
                                        <span className="text-foreground">{p.name}</span>
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
