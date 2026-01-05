export const FEATURES = {
    ENABLE_SOUNDS: true,   // Master switch for all game audio
    ENABLE_STREAKS: true,  // Master switch for streak bonuses and visuals
    ENABLE_POWERUPS: true, // Master switch for power-ups (e.g. 50/50)
} as const

export type FeatureKey = keyof typeof FEATURES

export const isFeatureEnabled = (key: FeatureKey): boolean => {
    return FEATURES[key]
}
