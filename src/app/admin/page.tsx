
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Plus, Play, Edit, Trash2 } from 'lucide-react'

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
            const { data, error } = await supabase
                .from('quizzes')
                .select(`
          *,
          questions (count)
        `)
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white">Dashboard</h2>
                    <p className="text-slate-400">Manage your quizzes and host games.</p>
                </div>
                <Link href="/admin/create">
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Plus size={18} />
                        Create Quiz
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl">
                    <h3 className="text-xl font-medium text-slate-300 mb-2">No quizzes found</h3>
                    <p className="text-slate-500 mb-6">Get started by creating your first interactive quiz.</p>
                    <Link href="/admin/create">
                        <Button variant="outline">Create New Quiz</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <Card key={quiz.id} className="glass-card hover:bg-slate-800/80 transition-colors">
                            <CardHeader>
                                <CardTitle className="text-xl text-white truncate">{quiz.title}</CardTitle>
                                <CardDescription>
                                    {quiz.questions?.[0]?.count || 0} Questions • {new Date(quiz.created_at).toLocaleDateString()}
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="flex justify-between gap-2">
                                <Button
                                    size="default"
                                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => startQuiz(quiz.id)}
                                >
                                    <Play size={16} /> Host
                                </Button>
                                <Link href={`/admin/edit/${quiz.id}`}>
                                    <Button variant="outline" size="default" className="w-10 px-0">
                                        <Edit size={16} />
                                    </Button>
                                </Link>
                                <Button
                                    variant="destructive"
                                    size="default"
                                    className="w-10 px-0"
                                    onClick={() => handleDelete(quiz.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
