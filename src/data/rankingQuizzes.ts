export interface RankingItem {
  id: string
  label: string
}

export interface RankingQuestion {
  id: string
  question: string
  items: RankingItem[] // in correct order (index 0 = highest/most)
}

export interface RankingQuiz {
  id: string
  title: string
  description: string
  emoji: string
  questions: RankingQuestion[]
}

export const RANKING_QUIZZES: RankingQuiz[] = [
  {
    id: 'the-retrospective',
    title: 'The Retrospective',
    description: 'Rank World Cup stats and highlights in the correct order.',
    emoji: '📊',
    questions: [
      {
        id: 'rk1',
        question: 'Rank these countries by total FIFA World Cup titles (most to fewest)',
        items: [
          { id: 'a', label: 'Brazil (5)' },
          { id: 'b', label: 'Germany (4)' },
          { id: 'c', label: 'Italy (4)' },
          { id: 'd', label: 'Argentina (3)' },
        ],
      },
      {
        id: 'rk2',
        question: 'Rank these players by FIFA World Cup goals scored (most to fewest)',
        items: [
          { id: 'a', label: 'Miroslav Klose (16)' },
          { id: 'b', label: 'Ronaldo (15)' },
          { id: 'c', label: 'Gerd Müller (14)' },
          { id: 'd', label: 'Just Fontaine (13)' },
        ],
      },
      {
        id: 'rk3',
        question: 'Rank these FIFA World Cups by total goals scored (most to fewest)',
        items: [
          { id: 'a', label: '2022 Qatar (172)' },
          { id: 'b', label: '2014 Brazil (171)' },
          { id: 'c', label: '1998 France (171)' },
          { id: 'd', label: '2018 Russia (169)' },
        ],
      },
      {
        id: 'rk4',
        question: 'Rank these teams by consecutive FIFA World Cup appearances (most to fewest)',
        items: [
          { id: 'a', label: 'Brazil (22)' },
          { id: 'b', label: 'Germany (20)' },
          { id: 'c', label: 'Argentina (18)' },
          { id: 'd', label: 'Spain (16)' },
        ],
      },
      {
        id: 'rk5',
        question: 'Rank these FIFA World Cup finals by attendance (highest to lowest)',
        items: [
          { id: 'a', label: '1950 Maracanã (173,850)' },
          { id: 'b', label: '1966 Wembley (96,924)' },
          { id: 'c', label: '2022 Lusail (88,966)' },
          { id: 'd', label: '2014 Maracanã (74,738)' },
        ],
      },
    ],
  },
]
