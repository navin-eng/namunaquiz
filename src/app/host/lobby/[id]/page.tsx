
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generatePIN } from '@/lib/game-logic'

export default function LobbyLauncher({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id: quizId } = React.use(params)

    useEffect(() => {
        const createSession = async () => {
            // 1. Check auth
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')

            // 2. Create Session
            const pin = generatePIN()
            const { data, error } = await supabase
                .from('game_sessions')
                .insert({
                    quiz_id: quizId,
                    host_id: user.id,
                    pin: pin,
                    status: 'waiting',
                    current_question_index: 0
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating session:', error)
                alert('Error creating game session')
                return router.push('/admin')
            }

            // 3. Redirect to Host Game View
            router.push(`/host/game/${data.id}`)
        }

        createSession()
    }, [quizId, router])

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl">Initializing Game Session...</p>
            </div>
        </div>
    )
}

import React from 'react'
