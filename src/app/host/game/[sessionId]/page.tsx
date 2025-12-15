
'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Play, ArrowRight, X } from 'lucide-react'

// Sub-components
import HostLobby from '@/components/game/HostLobby'
import HostRunner from '@/components/game/HostRunner'

export default function HostGamePage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = React.use(params)
    const [status, setStatus] = useState<'waiting' | 'active' | 'finished'>('waiting')
    const [pin, setPin] = useState<string>('')
    const [players, setPlayers] = useState<any[]>([])
    const [quizId, setQuizId] = useState<string>('')

    useEffect(() => {
        const fetchSession = async () => {
            const { data, error } = await supabase
                .from('game_sessions')
                .select('*')
                .eq('id', sessionId)
                .single()

            if (error || !data) {
                alert('Session not found')
                return
            }
            setStatus(data.status)
            setPin(data.pin)
            setQuizId(data.quiz_id)
        }

        fetchSession()

        // Realtime Subscription for Players
        // We listen to changes in 'players' table where game_session_id = sessionId
        const channel = supabase
            .channel(`game_${sessionId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'players',
                filter: `game_session_id=eq.${sessionId}`
            }, (payload) => {
                fetchPlayers()
            })
            .subscribe()

        // Also fetch initial players
        fetchPlayers()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [sessionId])

    const fetchPlayers = async () => {
        const { data } = await supabase.from('players').select('*').eq('game_session_id', sessionId).order('score', { ascending: false })
        if (data) setPlayers(data)
    }

    const startGame = async () => {
        await supabase.from('game_sessions').update({ status: 'active' }).eq('id', sessionId)
        setStatus('active')
    }

    if (status === 'waiting') {
        return <HostLobby pin={pin} players={players} onStart={startGame} />
    }

    if (status === 'active' || status === 'finished') {
        return <HostRunner sessionId={sessionId} quizId={quizId} initialPlayers={players} />
    }

    return <div className="text-white p-10">Loading Game State...</div>
}
