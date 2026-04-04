export interface SwipeStatement {
  id: string
  statement: string
  isTrue: boolean
  explanation: string
  imageUrl: string
}

export interface SwipeQuiz {
  id: string
  title: string
  description: string
  emoji: string
  statements: SwipeStatement[]
  labels?: { right: string; left: string }
}

export const SWIPE_QUIZZES: SwipeQuiz[] = []
