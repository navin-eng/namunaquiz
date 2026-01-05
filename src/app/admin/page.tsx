
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Plus, Play, Edit, Trash2, LayoutDashboard, BarChart3, Activity, Users, PlusCircle } from 'lucide-react'

interface Quiz {
    id: string
    title: string
    created_at: string
    questions: { count: number }[]
}

export default function AdminDashboard() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchQuizzes()
    }, [])

    const fetchQuizzes = async () => {
        try {
            setLoading(true)
            // Note: This relies on the table relationship or we fetch questions separately count
            // For MVP, we can just fetch quizzes and then maybe count questions if needed
            // Or just list them.
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('quizzes')
                .select(`
          *,
          questions (count)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            console.log(data)
            setQuizzes(data || [])
        } catch (error) {
            console.error('Error fetching quizzes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quiz?')) return
        const { error } = await supabase.from('quizzes').delete().eq('id', id)
        if (!error) fetchQuizzes()
    }

    const startQuiz = (id: string) => {
        router.push(`/host/lobby/${id}`)
    }

    // Aggregate Stats
    const totalQuizzes = quizzes.length
    const totalQuestions = quizzes.reduce((acc, q) => acc + (q.questions?.[0]?.count || 0), 0)
    // Mock player count (since we don't have global history easily accessible without complex queries)
    // In real app, fetch from 'players' count 
    // For now, let's just mock reasonable numbers based on quiz count or fetch real if easy.
    // Fetching unique players count might be heavy. Let's just use a placeholder or lightweight count.
    const totalPlayers = 0 // Placeholder or async fetch

    // We can fetch player count in useEffect
    const [playerCount, setPlayerCount] = useState(0)
    const [sessionCount, setSessionCount] = useState(0)

    useEffect(() => {
        const fetchStats = async () => {
            const { count: pTags } = await supabase.from('players').select('id', { count: 'exact', head: true })
            const { count: sTags } = await supabase.from('game_sessions').select('id', { count: 'exact', head: true })
            if (pTags) setPlayerCount(pTags)
            if (sTags) setSessionCount(sTags)
        }
        fetchStats()
    }, [])


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1 text-lg">Detailed overview of your quiz activity.</p>
                </div>
                <Link href="/admin/create">
                    <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5" size="lg">
                        <Plus size={20} />
                        New Quiz
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Quizzes</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{totalQuizzes}</div>
                        <p className="text-xs text-muted-foreground mt-1">+0% from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Questions</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{totalQuestions}</div>
                        <p className="text-xs text-muted-foreground mt-1">across all quizzes</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Sessions Hosted</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{sessionCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">lifetime games</p>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{playerCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">all-time participants</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold tracking-tight text-foreground">Recent Quizzes</h3>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p>Loading data...</p>
                    </div>
                ) : quizzes.length === 0 ? (
                    <div className="text-center py-24 border-2 border-dashed border-border rounded-[2rem] bg-card/50">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                            <PlusCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No quizzes yet</h3>
                        <p className="text-muted-foreground mb-8 text-lg max-w-sm mx-auto">Get started by creating your first interactive quiz.</p>
                        <Link href="/admin/create">
                            <Button variant="outline" size="lg" className="border-border">Create New Quiz</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground border-b border-border bg-muted/40">
                            <div className="col-span-6 md:col-span-5">Quiz Title</div>
                            <div className="col-span-2 hidden md:block">Questions</div>
                            <div className="col-span-3 hidden md:block">Created</div>
                            <div className="col-span-6 md:col-span-2 text-right">Actions</div>
                        </div>
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-border last:border-0 hover:bg-muted/20 transition-colors group">
                                <div className="col-span-6 md:col-span-5 font-bold flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                        {String(quiz.title).charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate">{quiz.title}</span>
                                </div>
                                <div className="col-span-2 hidden md:block text-muted-foreground">
                                    {quiz.questions?.[0]?.count || 0} Qs
                                </div>
                                <div className="col-span-3 hidden md:block text-muted-foreground text-sm">
                                    {new Date(quiz.created_at).toLocaleDateString()}
                                </div>
                                <div className="col-span-6 md:col-span-2 flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startQuiz(quiz.id)} title="Host">
                                        <Play size={16} />
                                    </Button>
                                    <Link href={`/admin/edit/${quiz.id}`}>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Edit">
                                            <Edit size={16} />
                                        </Button>
                                    </Link>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(quiz.id)} title="Delete">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
