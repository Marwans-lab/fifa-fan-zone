export interface PictureRouteState {
  teamId?: string
}

export interface QuizRouteState {
  quizId?: string
}

export interface ResultsRouteState {
  quizId?: string
  score?: number
  totalQuestions?: number
  [key: string]: unknown
}
