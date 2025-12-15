
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Clock, Check } from 'lucide-react'
import { Question } from '@/lib/types'

interface QuestionFormProps {
    index: number
    question: Question
    onChange: (q: Question) => void
    onRemove: () => void
}

export const QuestionForm: React.FC<QuestionFormProps> = ({ index, question, onChange, onRemove }) => {

    const handleOptionChange = (optIndex: number, text: string) => {
        const newOptions = [...question.options]
        newOptions[optIndex].text = text
        onChange({ ...question, options: newOptions })
    }

    const handleCorrectChange = (optIndex: number) => {
        const newOptions = question.options.map((o, i) => ({
            ...o,
            isCorrect: i === optIndex // Single choice for now
        }))
        onChange({ ...question, options: newOptions })
    }

    return (
        <Card className="glass-card border-slate-700 bg-slate-800/40">
            <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg text-white">Question {index + 1}</CardTitle>
                <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={onRemove}>
                    <Trash2 size={18} />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input
                    placeholder="Enter question text..."
                    value={question.question}
                    onChange={(e) => onChange({ ...question, question: e.target.value })}
                    className="text-lg bg-slate-900/50 border-slate-600"
                />

                <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-slate-400" />
                    <select
                        className="bg-slate-900 border border-slate-700 text-white rounded p-1 text-sm"
                        value={question.timeLimit}
                        onChange={(e) => onChange({ ...question, timeLimit: Number(e.target.value) })}
                    >
                        <option value={10}>10 Seconds</option>
                        <option value={20}>20 Seconds</option>
                        <option value={30}>30 Seconds</option>
                        <option value={60}>60 Seconds</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.options.map((opt, i) => (
                        <div key={opt.id} className="flex gap-2 items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-2 transition-colors ${opt.isCorrect ? 'bg-green-500 border-green-500 text-white' : 'border-slate-600 text-slate-600 hover:border-slate-500'
                                    }`}
                                onClick={() => handleCorrectChange(i)}
                            >
                                {i === 0 ? '▲' : i === 1 ? '◆' : i === 2 ? '●' : '■'}
                            </div>
                            <Input
                                placeholder={`Option ${i + 1}`}
                                value={opt.text}
                                onChange={(e) => handleOptionChange(i, e.target.value)}
                                className={`${opt.isCorrect ? 'border-green-500 ring-1 ring-green-500' : ''}`}
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
