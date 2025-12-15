
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function JoinGamePage() {
    const [pin, setPin] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: session, error: sessionError } = await supabase
                .from('game_sessions')
                .select('id, status')
                .eq('pin', pin)
                .single()

            if (sessionError || !session) {
                alert('Game PIN not found')
                setLoading(false)
                return
            }

            if (session.status === 'finished') {
                alert('Game already finished')
                setLoading(false)
                return
            }

            const { data: player, error: playerError } = await supabase
                .from('players')
                .insert({
                    game_session_id: session.id,
                    name: name,
                    score: 0
                })
                .select()
                .single()

            if (playerError) throw playerError

            localStorage.setItem('playerId', player.id)

            router.push(`/play/${session.id}`)
        } catch (error) {
            console.error(error)
            alert('Error joining game')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-[#030014] overflow-hidden relative">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </div>

            <div className="w-full max-w-sm flex flex-col items-center gap-8 relative z-10">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gradient-to-tr from-white to-slate-300 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] transform -rotate-12 mb-4">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Join Game</h1>
                    <p className="text-slate-400 text-center">Enter the PIN on the screen to join the fun.</p>
                </div>

                <Card className="w-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                    <CardContent className="pt-8 space-y-6">
                        <form onSubmit={handleJoin} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Game PIN"
                                    className="text-center text-2xl font-black h-16 uppercase bg-black/40 border-white/10 focus:border-indigo-500 focus:ring-indigo-500 text-white placeholder:text-slate-600 tracking-widest"
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    required
                                    maxLength={6}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Nickname"
                                    className="text-center text-xl font-bold h-14 bg-black/40 border-white/10 focus:border-purple-500 text-white placeholder:text-slate-600"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-14 text-xl font-bold bg-white text-black hover:bg-slate-200 mt-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02]"
                                disabled={loading}
                            >
                                {loading ? 'Joining...' : 'Enter Game'}
                                {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
