
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

        if (!pin) {
            alert('Please enter a Game PIN')
            setLoading(false)
            return
        }

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

            // Check for duplicate name
            let finalName = name
            const { data: existingPlayer } = await supabase
                .from('players')
                .select('id')
                .eq('game_session_id', session.id)
                .eq('name', name)
                .maybeSingle()

            if (existingPlayer) {
                const uniqueSuffix = Math.floor(1000 + Math.random() * 9000)
                const suggestedName = `${name}#${uniqueSuffix}`
                // Simple Alert for now, could be better UI
                if (!confirm(`Name "${name}" is already taken. Join as "${suggestedName}" instead?`)) {
                    setLoading(false)
                    return
                }
                finalName = suggestedName
                setName(finalName)
            }

            const { data: player, error: playerError } = await supabase
                .from('players')
                .insert({
                    game_session_id: session.id,
                    name: finalName,
                    score: 0
                })
                .select()
                .single()

            if (playerError) throw playerError

            // Use sessionStorage for tab encapsulation
            sessionStorage.setItem('playerId', player.id)

            router.push(`/play/${session.id}`)
        } catch (error) {
            console.error(error)
            alert('Error joining game')
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background text-foreground transition-colors duration-500">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 transform hover:scale-110 transition-transform">
                        <span className="text-3xl">🎮</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">Join Game</h1>
                    <p className="text-muted-foreground font-medium">Enter the PIN to get started</p>
                </div>

                {/* Form Card */}
                <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl">
                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Game PIN</label>
                            <Input
                                placeholder="000 000"
                                className="text-center text-3xl font-black h-16 bg-muted/50 border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/30 tracking-[0.2em] rounded-xl transition-all"
                                value={pin}
                                onChange={e => setPin(e.target.value.toUpperCase())}
                                required
                                maxLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">Your Name</label>
                            <Input
                                placeholder="Enter your nickname"
                                className="text-lg h-14 bg-muted/50 border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/50 rounded-xl font-medium transition-all"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5"
                            disabled={loading}
                        >
                            {loading ? 'Joining...' : 'Enter Game'}
                            {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
