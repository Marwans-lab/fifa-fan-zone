export interface RankingItem {
  id: string
  label: string
  flagUrl: string
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
          { id: 'a', label: 'Brazil (5)', flagUrl: 'https://flagcdn.com/w40/br.png' },
          { id: 'b', label: 'Germany (4)', flagUrl: 'https://flagcdn.com/w40/de.png' },
          { id: 'c', label: 'Italy (4)', flagUrl: 'https://flagcdn.com/w40/it.png' },
          { id: 'd', label: 'Argentina (3)', flagUrl: 'https://flagcdn.com/w40/ar.png' },
          { id: 'e', label: 'France (2)', flagUrl: 'https://flagcdn.com/w40/fr.png' },
        ],
      },
      {
        id: 'rk2',
        question: 'Rank these players by FIFA World Cup goals scored (most to fewest)',
        items: [
          { id: 'a', label: 'Miroslav Klose (16)', flagUrl: 'https://flagcdn.com/w40/de.png' },
          { id: 'b', label: 'Ronaldo (15)', flagUrl: 'https://flagcdn.com/w40/br.png' },
          { id: 'c', label: 'Gerd Müller (14)', flagUrl: 'https://flagcdn.com/w40/de.png' },
          { id: 'd', label: 'Just Fontaine (13)', flagUrl: 'https://flagcdn.com/w40/fr.png' },
          { id: 'e', label: 'Pelé (12)', flagUrl: 'https://flagcdn.com/w40/br.png' },
        ],
      },
      {
        id: 'rk3',
        question: 'Rank these FIFA World Cups by total goals scored (most to fewest)',
        items: [
          { id: 'a', label: '2022 Qatar (172)', flagUrl: 'https://flagcdn.com/w40/qa.png' },
          { id: 'b', label: '2014 Brazil (171)', flagUrl: 'https://flagcdn.com/w40/br.png' },
          { id: 'c', label: '1998 France (171)', flagUrl: 'https://flagcdn.com/w40/fr.png' },
          { id: 'd', label: '2018 Russia (169)', flagUrl: 'https://flagcdn.com/w40/ru.png' },
          { id: 'e', label: '2006 Germany (147)', flagUrl: 'https://flagcdn.com/w40/de.png' },
        ],
      },
      {
        id: 'rk4',
        question: 'Rank these teams by total FIFA World Cup appearances (most to fewest)',
        items: [
          { id: 'a', label: 'Brazil (22)', flagUrl: 'https://flagcdn.com/w40/br.png' },
          { id: 'b', label: 'Germany (20)', flagUrl: 'https://flagcdn.com/w40/de.png' },
          { id: 'c', label: 'Argentina (18)', flagUrl: 'https://flagcdn.com/w40/ar.png' },
          { id: 'd', label: 'Mexico (17)', flagUrl: 'https://flagcdn.com/w40/mx.png' },
          { id: 'e', label: 'Spain (16)', flagUrl: 'https://flagcdn.com/w40/es.png' },
        ],
      },
      {
        id: 'rk5',
        question: 'Rank these FIFA World Cup finals by attendance (highest to lowest)',
        items: [
          { id: 'a', label: '1950 Maracanã (173,850)', flagUrl: 'https://flagcdn.com/w40/br.png' },
          { id: 'b', label: '1986 Azteca (114,600)', flagUrl: 'https://flagcdn.com/w40/mx.png' },
          { id: 'c', label: '1966 Wembley (96,924)', flagUrl: 'https://flagcdn.com/w40/gb-eng.png' },
          { id: 'd', label: '2022 Lusail (88,966)', flagUrl: 'https://flagcdn.com/w40/qa.png' },
          { id: 'e', label: '2014 Maracanã (74,738)', flagUrl: 'https://flagcdn.com/w40/br.png' },
        ],
      },
    ],
  },
]
