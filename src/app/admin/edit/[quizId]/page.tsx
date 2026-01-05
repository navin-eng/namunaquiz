'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { QuestionForm } from '@/components/game/QuestionForm'
import { Question } from '@/lib/types'
import { Save, Plus, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = React.use(params)
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Quiz
                const { data: quiz, error: quizError } = await supabase
                    .from('quizzes')
                    .select('*')
                    .eq('id', quizId)
                    .single()

                if (quizError) throw quizError
                setTitle(quiz.title)

                // 2. Fetch Questions
                const { data: qs, error: qsError } = await supabase
                    .from('questions')
                    .select('*')
                    .eq('quiz_id', quizId)
                    .order('order_index')

                if (qsError) throw qsError

                if (qs) {
                    setQuestions(qs.map(q => ({
                        id: q.id,
                        question: q.question_text,
                        timeLimit: q.time_limit,
                        options: q.options
                    })))
                }
            } catch (error) {
                console.error('Error fetching quiz details:', error)
                alert('Failed to load quiz')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [quizId])

    const addQuestion = () => {
        const newQuestion: Question = {
            id: crypto.randomUUID(), // Needs to be careful with UUIDs if we rely on DB generation, but for edit strictly it's tricky.
            // Ideally we differentiate new vs existing by ID format or separate tracking. 
            // For simplicity, we'll try to use UUIDs. If it's a new UUID not in DB, we'll need to know to insert it.
            // Or we check if ID exists in fetched list.
            // Actually, simpler approach for this MVP: Delete all questions and recreate them? 
            // OR: Upsert. 
            // Let's us upsert.
            question: '',
            timeLimit: 20,
            options: [
                { id: crypto.randomUUID(), text: '', isCorrect: false },
                { id: crypto.randomUUID(), text: '', isCorrect: false },
                { id: crypto.randomUUID(), text: '', isCorrect: false },
                { id: crypto.randomUUID(), text: '', isCorrect: false },
            ]
        }
        setQuestions([...questions, newQuestion])
    }

    const updateQuestion = (index: number, q: Question) => {
        const newQuestions = [...questions]
        newQuestions[index] = q
        setQuestions(newQuestions)
    }

    const removeQuestion = (index: number) => {
        const newQuestions = [...questions]
        newQuestions.splice(index, 1)
        setQuestions(newQuestions)
    }

    const handleSave = async () => {
        if (!title) return alert('Please enter a quiz title')
        if (questions.length === 0) return alert('Add at least one question')

        setSaving(true)
        try {
            // 1. Update Quiz Title
            const { error: quizError } = await supabase
                .from('quizzes')
                .update({ title })
                .eq('id', quizId)

            if (quizError) throw quizError

            // 2. Handle Questions (Upsert Strategy - simplified: Delete all for this quiz and re-insert is risky for history if played games link to questions directly, but questions table ID might be stable?)
            // If we delete key matches, previous games stats might break if they link to question IDs.
            // Review schema: Games link to Quiz. HostRunner fetches questions.
            // HostRunner copies question options? No, it reads questions.
            // If we delete questions, historic data might be confused if referencing specific question IDs (not implemented yet).
            // Current schema doesn't link answers to specific Question IDs in a hard relational way for stats, just count.
            // So "Delete All and Re-Insert" for this Quiz ID is cleanest for MVP to handle ordering/deletions/additions.

            // DELETE existing questions
            await supabase.from('questions').delete().eq('quiz_id', quizId)

            // INSERT all current questions
            // We use the ID from state if valid UUID, or let DB gen new one?
            // Let's generate new ones or keep existing. If we delete, we can re-insert with same IDs if we keep them.
            // But some might be new.
            const questionsPayload = questions.map((q, index) => ({
                // id: q.id, // Try to preserve ID if possible, but if we delete, we can re-insert with explicit ID? Yes if generic. 
                // However if we delete, it might violate constraints?
                // Questions table has NO foreign keys pointing TO it from other tables in current schema (GameSession links Quiz, Players link Session).
                // So safe to delete.
                quiz_id: quizId,
                question_text: q.question,
                time_limit: q.timeLimit,
                options: q.options,
                order_index: index
            }))

            const { error: questionsError } = await supabase
                .from('questions')
                .insert(questionsPayload)

            if (questionsError) throw questionsError

            router.push('/admin')

        } catch (error: any) {
            console.error(error)
            alert('Error saving quiz: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-slate-400 gap-2"><Loader2 className="animate-spin" /> Loading...</div>
    }

    return (
        <div className="space-y-6 pb-24 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={24} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Edit Quiz</h1>
                    <p className="text-muted-foreground">Update your quiz details and questions.</p>
                </div>
            </div>

            <Card className="bg-card border-border shadow-sm">
                <CardContent className="pt-6">
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Quiz Title</label>
                    <Input
                        placeholder="e.g. World Geography 101"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="text-lg py-6 font-medium bg-background border-border focus-visible:ring-primary/20"
                    />
                </CardContent>
            </Card>

            <div className="space-y-6">
                {questions.map((q, i) => (
                    <div key={q.id || i} className="animate-in slide-in-from-bottom-4 duration-500">
                        <QuestionForm
                            index={i}
                            question={q}
                            onChange={(updated) => updateQuestion(i, updated)}
                            onRemove={() => removeQuestion(i)}
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={addQuestion}
                className="w-full py-8 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
                <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Plus size={24} className="group-hover:text-primary" />
                </div>
                <span className="font-medium text-lg">Add New Question</span>
            </button>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex justify-between items-center z-50 md:pl-72 shadow-2xl">
                <div className="text-sm text-muted-foreground hidden md:block">
                    {questions.length} Question{questions.length !== 1 ? 's' : ''} • Estimated duration: {Math.round(questions.reduce((acc, q) => acc + (q.timeLimit || 20), 0) / 60)} mins
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <Link href="/admin" className="flex-1 md:flex-none">
                        <Button variant="outline" size="lg" className="w-full">Cancel</Button>
                    </Link>
                    <Button
                        size="lg"
                        className="flex-1 md:flex-none gap-2 shadow-lg shadow-primary/25 font-bold px-8"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} /> Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
