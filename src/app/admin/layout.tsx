
'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LogOut, LayoutDashboard, PlusCircle } from 'lucide-react'

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
        <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-slate-800/50 border-r border-white/10 p-6 flex flex-col gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white font-bold">Q</div>
                    <h1 className="text-xl font-bold text-white tracking-tight">QuizMaster</h1>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                    <Link href="/admin">
                        <Button variant="ghost" fullWidth className="justify-start gap-2 text-slate-300 hover:text-white">
                            <LayoutDashboard size={18} />
                            My Quizzes
                        </Button>
                    </Link>
                    <Link href="/admin/create">
                        <Button variant="ghost" fullWidth className="justify-start gap-2 text-slate-300 hover:text-white">
                            <PlusCircle size={18} />
                            Create New
                        </Button>
                    </Link>
                </nav>

                <Button variant="outline" className="justify-start gap-2 border-slate-700 text-slate-400 hover:text-white" onClick={handleLogout}>
                    <LogOut size={18} />
                    Sign Out
                </Button>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
