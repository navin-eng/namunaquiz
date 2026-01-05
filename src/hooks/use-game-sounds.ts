'use client'

import { useEffect, useRef } from 'react'
import { isFeatureEnabled } from '@/lib/features'

type SoundType = 'CORRECT' | 'WRONG' | 'TICK' | 'TRANSITION' | 'GAME_OVER' | 'JOIN'

const SOUND_URLS: Record<SoundType, string> = {
    CORRECT: '/sounds/correct.mp3',
    WRONG: '/sounds/wrong.mp3',
    TICK: '/sounds/tick.mp3',
    TRANSITION: '/sounds/whoosh.mp3',
    GAME_OVER: '/sounds/game-over.mp3',
    JOIN: '/sounds/join.mp3'
}

export function useGameSounds() {
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
    const enabled = isFeatureEnabled('ENABLE_SOUNDS')

    useEffect(() => {
        if (!enabled) return

        // Preload sounds
        Object.entries(SOUND_URLS).forEach(([key, url]) => {
            const audio = new Audio(url)
            audio.volume = 0.5
            audioRefs.current[key] = audio
        })

        return () => {
            // Cleanup
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause()
                audio.src = ''
            })
            audioRefs.current = {}
        }
    }, [enabled])

    const play = (type: SoundType) => {
        if (!enabled) return

        const audio = audioRefs.current[type]
        if (audio) {
            audio.currentTime = 0
            audio.play().catch(err => {
                // Ignore auto-play errors or missing file errors to prevent console spam
                console.warn(`Failed to play sound ${type}:`, err)
            })
        }
    }

    return { play }
}
