
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Simple sign in
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/admin')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-8 bg-muted/20">
            <Card className="w-full max-w-md bg-card border-border shadow-xl">
                <CardHeader className="space-y-2 text-center pb-8 border-b border-border/50 bg-muted/30">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-2 text-primary-foreground font-black text-xl shadow-lg shadow-primary/20">
                        Q
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Welcome Back</CardTitle>
                    <p className="text-muted-foreground text-sm">Sign in to QuizMaster Dashboard</p>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 pt-8 px-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <Input
                                type="email"
                                placeholder="admin@school.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-background border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background border-border"
                            />
                        </div>
                        {error && (
                            <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg border border-destructive/20 font-medium">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="px-8 pb-8 pt-4">
                        <Button
                            type="submit"
                            className="w-full shadow-lg font-bold"
                            size="lg"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                                    Logging in...
                                </div>
                            ) : 'Enter Dashboard'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
