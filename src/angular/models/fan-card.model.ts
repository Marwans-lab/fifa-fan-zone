export interface FanCardModel {
  teamId: string | null
  photoDataUrl: string | null
  answers: Record<string, string>
  completedAt: string | null
}

export type QuestionId = 'playstyle' | 'devotion' | 'vibes' | 'perks'

export interface ProfileQuestion {
  id: QuestionId
  category: string
  iconSrc: string
  label: string
  options: readonly string[]
}
