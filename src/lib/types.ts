
export interface Option {
    id: string
    text: string
    isCorrect: boolean
}

export interface Question {
    id: string
    question: string
    timeLimit: number
    options: Option[]
}

export interface Quiz {
    id: string
    title: string
    created_at?: string
    questions: Question[]
}
