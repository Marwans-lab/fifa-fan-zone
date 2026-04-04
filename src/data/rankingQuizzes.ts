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
    id: 'the-historian',
    title: 'The Historian',
    description: 'Rank World Cup moments and milestones in chronological order.',
    emoji: '📜',
    questions: [
      {
        id: 'hist-rk1',
        question: 'Rank these FIFA World Cup host countries chronologically (earliest to most recent)',
        items: [
          { id: 'a', label: 'Uruguay (1930)', flagUrl: 'https://flagcdn.com/w40/uy.png' },
          { id: 'b', label: 'Brazil (1950)', flagUrl: 'https://flagcdn.com/w40/br.png' },
          { id: 'c', label: 'England (1966)', flagUrl: 'https://flagcdn.com/w40/gb-eng.png' },
          { id: 'd', label: 'Argentina (1978)', flagUrl: 'https://flagcdn.com/w40/ar.png' },
          { id: 'e', label: 'South Korea / Japan (2002)', flagUrl: 'https://flagcdn.com/w40/kr.png' },
        ],
      },
      {
        id: 'hist-rk2',
        question: 'Rank these iconic World Cup goals by the year they were scored (earliest to latest)',
        items: [
          { id: 'a', label: 'Pelé vs Sweden — 1958 final', flagUrl: 'https://flagcdn.com/w40/br.png' },
          { id: 'b', label: "Maradona's 'Goal of the Century' — 1986", flagUrl: 'https://flagcdn.com/w40/ar.png' },
          { id: 'c', label: "Bergkamp vs Argentina — 1998 quarter-final", flagUrl: 'https://flagcdn.com/w40/nl.png' },
          { id: 'd', label: "Zidane volley vs Leverkusen — 2002 (UCL, not WC)", flagUrl: 'https://flagcdn.com/w40/fr.png' },
          { id: 'e', label: "Robin van Persie header vs Spain — 2014", flagUrl: 'https://flagcdn.com/w40/nl.png' },
        ],
      },
      {
        id: 'hist-rk3',
        question: 'Rank these famous World Cup upsets by year (earliest to latest)',
        items: [
          { id: 'a', label: 'USA beat England 1-0 (1950)', flagUrl: 'https://flagcdn.com/w40/us.png' },
          { id: 'b', label: 'North Korea beat Italy 1-0 (1966)', flagUrl: 'https://flagcdn.com/w40/kp.png' },
          { id: 'c', label: 'Cameroon beat Argentina 1-0 (1990)', flagUrl: 'https://flagcdn.com/w40/cm.png' },
          { id: 'd', label: 'South Korea beat Germany 2-0 (2018)', flagUrl: 'https://flagcdn.com/w40/kr.png' },
          { id: 'e', label: 'Saudi Arabia beat Argentina 2-1 (2022)', flagUrl: 'https://flagcdn.com/w40/sa.png' },
        ],
      },
      {
        id: 'hist-rk4',
        question: 'Rank these World Cup rule or format changes chronologically (earliest to latest)',
        items: [
          { id: 'a', label: 'Tournament expanded to 16 teams (1934)', flagUrl: 'https://flagcdn.com/w40/it.png' },
          { id: 'b', label: 'Red and yellow cards introduced (1970)', flagUrl: 'https://flagcdn.com/w40/mx.png' },
          { id: 'c', label: 'Tournament expanded to 24 teams (1982)', flagUrl: 'https://flagcdn.com/w40/es.png' },
          { id: 'd', label: 'Tournament expanded to 32 teams (1998)', flagUrl: 'https://flagcdn.com/w40/fr.png' },
          { id: 'e', label: 'VAR introduced at the World Cup (2018)', flagUrl: 'https://flagcdn.com/w40/ru.png' },
        ],
      },
      {
        id: 'hist-rk5',
        question: 'Rank these World Cup winning coaches by number of titles won (most to fewest)',
        items: [
          { id: 'a', label: 'Vittorio Pozzo — Italy (2 titles: 1934, 1938)', flagUrl: 'https://flagcdn.com/w40/it.png' },
          { id: 'b', label: 'Didier Deschamps — France (1 title: 2018)', flagUrl: 'https://flagcdn.com/w40/fr.png' },
          { id: 'c', label: 'Carlos Alberto Parreira — Brazil (1 title: 1994)', flagUrl: 'https://flagcdn.com/w40/br.png' },
          { id: 'd', label: 'Franz Beckenbauer — Germany (1 title: 1990)', flagUrl: 'https://flagcdn.com/w40/de.png' },
          { id: 'e', label: 'César Luis Menotti — Argentina (1 title: 1978)', flagUrl: 'https://flagcdn.com/w40/ar.png' },
        ],
      },
    ],
  },
]
