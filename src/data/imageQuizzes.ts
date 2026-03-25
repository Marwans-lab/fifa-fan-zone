export interface ImageOption {
  id: string
  label: string
  imageUrl: string
}

export interface ImageQuestion {
  id: string
  question: string
  options: ImageOption[]
  correctId: string
}

export interface ImageQuiz {
  id: string
  title: string
  description: string
  emoji: string
  questions: ImageQuestion[]
}

export const IMAGE_QUIZZES: ImageQuiz[] = []
