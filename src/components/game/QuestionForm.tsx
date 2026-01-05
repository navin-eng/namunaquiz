
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Clock, Check, GripVertical } from 'lucide-react'
import { Question } from '@/lib/types'
import { cn } from '@/lib/utils'
import { SHAPES, COLORS } from '@/lib/constants'

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
        <Card className="bg-card border-border shadow-sm group hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-bold text-sm">
                        {index + 1}
                    </span>
                    <CardTitle className="text-lg text-foreground font-medium">Question Details</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md shadow-sm">
                        <Clock size={14} className="text-muted-foreground" />
                        <select
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer text-foreground"
                            value={question.timeLimit}
                            onChange={(e) => onChange({ ...question, timeLimit: Number(e.target.value) })}
                        >
                            <option value={10}>10s</option>
                            <option value={20}>20s</option>
                            <option value={30}>30s</option>
                            <option value={60}>60s</option>
                            <option value={120}>120s</option>
                        </select>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={onRemove}
                    >
                        <Trash2 size={18} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Your Question</label>
                    <Input
                        placeholder="e.g. What is the powerhouse of the cell?"
                        value={question.question}
                        onChange={(e) => onChange({ ...question, question: e.target.value })}
                        className="text-lg py-6 font-medium bg-background border-border focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground block">Answer Options</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {question.options.map((opt, i) => (
                            <div key={opt.id} className="relative flex items-center group/option">
                                <div
                                    className={cn(
                                        "absolute left-0 z-10 w-12 h-full rounded-l-md flex items-center justify-center cursor-pointer transition-all border-y border-l",
                                        opt.isCorrect
                                            ? "bg-green-500 border-green-500 text-white"
                                            : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                                    )}
                                    onClick={() => handleCorrectChange(i)}
                                    title="Mark as correct answer"
                                >
                                    {opt.isCorrect ? <Check size={20} strokeWidth={3} /> : <span className="text-lg font-black opacity-50">{SHAPES[i] || i + 1}</span>}
                                </div>
                                <Input
                                    placeholder={`Option ${i + 1}`}
                                    value={opt.text}
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    className={cn(
                                        "pl-14 py-6 transition-all bg-background border-border",
                                        opt.isCorrect && "border-green-500 ring-1 ring-green-500 bg-green-50 dark:bg-green-900/10"
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
