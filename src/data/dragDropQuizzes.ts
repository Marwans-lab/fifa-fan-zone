export interface DragDropPair {
  id: string
  prompt: string
  answer: string
}

export interface DragDropQuestion {
  id: string
  title: string
  pairs: DragDropPair[]
  accentColor: string
}

export interface DragDropQuiz {
  id: string
  title: string
  description: string
  emoji: string
  questions: DragDropQuestion[]
}

export const DRAG_DROP_QUIZZES: DragDropQuiz[] = []
