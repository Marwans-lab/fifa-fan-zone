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
          { id: 'a', label: 'Uruguay (1930)', flagUrl: 'assets/images/flags/uy.png' },
          { id: 'b', label: 'Brazil (1950)', flagUrl: 'assets/images/flags/br.png' },
          { id: 'c', label: 'England (1966)', flagUrl: 'assets/images/flags/gb-eng.png' },
          { id: 'd', label: 'Argentina (1978)', flagUrl: 'assets/images/flags/ar.png' },
          { id: 'e', label: 'South Korea / Japan (2002)', flagUrl: 'assets/images/flags/kr.png' },
        ],
      },
      {
        id: 'hist-rk2',
        question: 'Rank these iconic World Cup goals by the year they were scored (earliest to latest)',
        items: [
          { id: 'a', label: 'Pelé vs Sweden — 1958 final', flagUrl: 'assets/images/flags/br.png' },
          { id: 'b', label: "Maradona's 'Goal of the Century' — 1986", flagUrl: 'assets/images/flags/ar.png' },
          { id: 'c', label: "Bergkamp vs Argentina — 1998 quarter-final", flagUrl: 'assets/images/flags/nl.png' },
          { id: 'd', label: "Zidane volley vs Leverkusen — 2002 (UCL, not WC)", flagUrl: 'assets/images/flags/fr.png' },
          { id: 'e', label: "Robin van Persie header vs Spain — 2014", flagUrl: 'assets/images/flags/nl.png' },
        ],
      },
      {
        id: 'hist-rk3',
        question: 'Rank these famous World Cup upsets by year (earliest to latest)',
        items: [
          { id: 'a', label: 'USA beat England 1-0 (1950)', flagUrl: 'assets/images/flags/us.png' },
          { id: 'b', label: 'North Korea beat Italy 1-0 (1966)', flagUrl: 'assets/images/flags/kp.png' },
          { id: 'c', label: 'Cameroon beat Argentina 1-0 (1990)', flagUrl: 'assets/images/flags/cm.png' },
          { id: 'd', label: 'South Korea beat Germany 2-0 (2018)', flagUrl: 'assets/images/flags/kr.png' },
          { id: 'e', label: 'Saudi Arabia beat Argentina 2-1 (2022)', flagUrl: 'assets/images/flags/sa.png' },
        ],
      },
      {
        id: 'hist-rk4',
        question: 'Rank these World Cup rule or format changes chronologically (earliest to latest)',
        items: [
          { id: 'a', label: 'Tournament expanded to 16 teams (1934)', flagUrl: 'assets/images/flags/it.png' },
          { id: 'b', label: 'Red and yellow cards introduced (1970)', flagUrl: 'assets/images/flags/mx.png' },
          { id: 'c', label: 'Tournament expanded to 24 teams (1982)', flagUrl: 'assets/images/flags/es.png' },
          { id: 'd', label: 'Tournament expanded to 32 teams (1998)', flagUrl: 'assets/images/flags/fr.png' },
          { id: 'e', label: 'VAR introduced at the World Cup (2018)', flagUrl: 'assets/images/flags/ru.png' },
        ],
      },
      {
        id: 'hist-rk5',
        question: 'Rank these World Cup winning coaches by number of titles won (most to fewest)',
        items: [
          { id: 'a', label: 'Vittorio Pozzo — Italy (2 titles: 1934, 1938)', flagUrl: 'assets/images/flags/it.png' },
          { id: 'b', label: 'Didier Deschamps — France (1 title: 2018)', flagUrl: 'assets/images/flags/fr.png' },
          { id: 'c', label: 'Carlos Alberto Parreira — Brazil (1 title: 1994)', flagUrl: 'assets/images/flags/br.png' },
          { id: 'd', label: 'Franz Beckenbauer — Germany (1 title: 1990)', flagUrl: 'assets/images/flags/de.png' },
          { id: 'e', label: 'César Luis Menotti — Argentina (1 title: 1978)', flagUrl: 'assets/images/flags/ar.png' },
        ],
      },
    ],
  },
]
