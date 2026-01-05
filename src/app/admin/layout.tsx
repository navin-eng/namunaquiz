
'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard, PlusCircle, Settings } from 'lucide-react'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
            }
        }
        checkUser()
    }, [router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
            <aside className="w-full md:w-64 bg-card border-r border-border p-6 flex flex-col gap-6 shadow-sm z-30">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">Q</div>
                    <h1 className="text-xl font-bold tracking-tight">QuizMaster</h1>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                    <Link href="/admin">
                        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-muted font-medium text-muted-foreground hover:text-foreground">
                            <LayoutDashboard size={18} />
                            My Quizzes
                        </Button>
                    </Link>
                    <Link href="/admin/create">
                        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-muted font-medium text-muted-foreground hover:text-foreground">
                            <PlusCircle size={18} />
                            Create New
                        </Button>
                    </Link>
                    <Link href="/admin/settings">
                        <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-muted font-medium text-muted-foreground hover:text-foreground">
                            <Settings size={18} />
                            Settings
                        </Button>
                    </Link>
                </nav>

                <div className="pt-6 border-t border-border">
                    <Button variant="outline" className="w-full justify-start gap-3 border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sign Out
                    </Button>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto bg-muted/20">
                <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    )
}
