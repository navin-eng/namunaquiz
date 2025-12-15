
'use client'

import React, { useState } from 'react'
// import { v4 as uuidv4 } from 'uuid' // We can just use crypto.randomUUID for client side or trust simplified IDs
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { QuestionForm } from '@/components/game/QuestionForm'
import { Question, Option } from '@/lib/types'
import { Save, Plus, FileJson, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateQuizPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [questions, setQuestions] = useState<Question[]>([])
    const [saving, setSaving] = useState(false)
    const [jsonMode, setJsonMode] = useState(false)
    const [jsonInput, setJsonInput] = useState('')

    const addQuestion = () => {
        const newQuestion: Question = {
            id: crypto.randomUUID(),
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

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            // Validate and map to our structure
            const mappedQuestions: Question[] = parsed.map((q: any) => ({
                id: crypto.randomUUID(),
                question: q.question,
                timeLimit: q.timeLimit || 20,
                options: q.options.map((o: any) => ({
                    id: crypto.randomUUID(),
                    text: o.text,
                    isCorrect: o.isCorrect
                }))
            }));
            setQuestions([...questions, ...mappedQuestions]);
            setJsonMode(false);
            setJsonInput('');
        } catch (e) {
            alert('Invalid JSON format');
        }
    }

    const handleSave = async () => {
        if (!title) return alert('Please enter a quiz title')
        if (questions.length === 0) return alert('Add at least one question')

        setSaving(true)
        try {
            // 1. Create Quiz
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .insert({ title, user_id: (await supabase.auth.getUser()).data.user?.id })
                .select()
                .single()

            if (quizError) throw quizError

            // 2. Create Questions
            const questionsPayload = questions.map((q, index) => ({
                quiz_id: quizData.id,
                question_text: q.question,
                time_limit: q.timeLimit,
                options: q.options, // Stored as JSONB
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

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin">
                    <Button variant="ghost" className="text-slate-400 hover:text-white"><ArrowLeft size={20} /></Button>
                </Link>
                <h1 className="text-2xl font-bold text-white">Create New Quiz</h1>
            </div>

            <Card className="glass-card mb-8">
                <CardContent className="pt-6">
                    <Input
                        placeholder="Quiz Title (e.g. World Geography)"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="text-lg font-medium bg-slate-900/50 border-slate-700"
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 mb-4">
                <Button variant="outline" onClick={() => setJsonMode(!jsonMode)} className="gap-2">
                    <FileJson size={16} /> {jsonMode ? 'Cancel Import' : 'Import JSON'}
                </Button>
            </div>

            {jsonMode && (
                <Card className="glass-card mb-8 border-indigo-500/50">
                    <CardHeader>
                        <CardTitle>Import Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            className="w-full h-64 bg-slate-900/50 border border-slate-700 rounded-md p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                            placeholder='[{"question": "...", "timeLimit": 20, "options": [{"text": "...", "isCorrect": true}, ...]}]'
                        />
                        <Button className="mt-4" onClick={handleJsonImport}>Parse & Add</Button>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {questions.map((q, i) => (
                    <QuestionForm
                        key={q.id}
                        index={i}
                        question={q}
                        onChange={(updated) => updateQuestion(i, updated)}
                        onRemove={() => removeQuestion(i)}
                    />
                ))}
            </div>

            <div className="flex justify-center mt-8">
                <Button onClick={addQuestion} className="gap-2 bg-slate-700 hover:bg-slate-600">
                    <Plus size={20} /> Add Question
                </Button>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur border-t border-white/10 flex justify-end md:pr-12">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 gap-2 shadow-lg shadow-green-900/20" onClick={handleSave} disabled={saving}>
                    <Save size={20} /> {saving ? 'Saving...' : 'Save Quiz'}
                </Button>
            </div>
        </div>
    )
}
