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
          { id: 'a', label: 'Uruguay (1930)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Flag_of_Uruguay.svg/80px-Flag_of_Uruguay.svg.png' },
          { id: 'b', label: 'Brazil (1950)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Flag_of_Brazil.svg/80px-Flag_of_Brazil.svg.png' },
          { id: 'c', label: 'England (1966)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/be/Flag_of_England.svg/80px-Flag_of_England.svg.png' },
          { id: 'd', label: 'Argentina (1978)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Argentina.svg/80px-Flag_of_Argentina.svg.png' },
          { id: 'e', label: 'South Korea / Japan (2002)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/80px-Flag_of_South_Korea.svg.png' },
        ],
      },
      {
        id: 'hist-rk2',
        question: 'Rank these iconic World Cup goals by the year they were scored (earliest to latest)',
        items: [
          { id: 'a', label: 'Pelé vs Sweden — 1958 final', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Flag_of_Brazil.svg/80px-Flag_of_Brazil.svg.png' },
          { id: 'b', label: "Maradona's 'Goal of the Century' — 1986", flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Argentina.svg/80px-Flag_of_Argentina.svg.png' },
          { id: 'c', label: "Bergkamp vs Argentina — 1998 quarter-final", flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/80px-Flag_of_the_Netherlands.svg.png' },
          { id: 'd', label: "Zidane volley vs Leverkusen — 2002 (UCL, not WC)", flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Flag_of_France.svg/80px-Flag_of_France.svg.png' },
          { id: 'e', label: "Robin van Persie header vs Spain — 2014", flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Flag_of_the_Netherlands.svg/80px-Flag_of_the_Netherlands.svg.png' },
        ],
      },
      {
        id: 'hist-rk3',
        question: 'Rank these famous World Cup upsets by year (earliest to latest)',
        items: [
          { id: 'a', label: 'USA beat England 1-0 (1950)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Flag_of_the_United_States_%28DDD-F-416E_specifications%29.svg/80px-Flag_of_the_United_States_%28DDD-F-416E_specifications%29.svg.png' },
          { id: 'b', label: 'North Korea beat Italy 1-0 (1966)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flag_of_North_Korea.svg/80px-Flag_of_North_Korea.svg.png' },
          { id: 'c', label: 'Cameroon beat Argentina 1-0 (1990)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Flag_of_Cameroon.svg/80px-Flag_of_Cameroon.svg.png' },
          { id: 'd', label: 'South Korea beat Germany 2-0 (2018)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Flag_of_South_Korea.svg/80px-Flag_of_South_Korea.svg.png' },
          { id: 'e', label: 'Saudi Arabia beat Argentina 2-1 (2022)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Flag_of_Saudi_Arabia.svg/80px-Flag_of_Saudi_Arabia.svg.png' },
        ],
      },
      {
        id: 'hist-rk4',
        question: 'Rank these World Cup rule or format changes chronologically (earliest to latest)',
        items: [
          { id: 'a', label: 'Tournament expanded to 16 teams (1934)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Flag_of_Italy.svg/80px-Flag_of_Italy.svg.png' },
          { id: 'b', label: 'Red and yellow cards introduced (1970)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Flag_of_Mexico.svg/80px-Flag_of_Mexico.svg.png' },
          { id: 'c', label: 'Tournament expanded to 24 teams (1982)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Bandera_de_Espa%C3%B1a.svg/80px-Bandera_de_Espa%C3%B1a.svg.png' },
          { id: 'd', label: 'Tournament expanded to 32 teams (1998)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Flag_of_France.svg/80px-Flag_of_France.svg.png' },
          { id: 'e', label: 'VAR introduced at the World Cup (2018)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Flag_of_Russia.svg/80px-Flag_of_Russia.svg.png' },
        ],
      },
      {
        id: 'hist-rk5',
        question: 'Rank these World Cup winning coaches by number of titles won (most to fewest)',
        items: [
          { id: 'a', label: 'Vittorio Pozzo — Italy (2 titles: 1934, 1938)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/Flag_of_Italy.svg/80px-Flag_of_Italy.svg.png' },
          { id: 'b', label: 'Didier Deschamps — France (1 title: 2018)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Flag_of_France.svg/80px-Flag_of_France.svg.png' },
          { id: 'c', label: 'Carlos Alberto Parreira — Brazil (1 title: 1994)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Flag_of_Brazil.svg/80px-Flag_of_Brazil.svg.png' },
          { id: 'd', label: 'Franz Beckenbauer — Germany (1 title: 1990)', flagUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/ba/Flag_of_Germany.svg/80px-Flag_of_Germany.svg.png' },
          { id: 'e', label: 'César Luis Menotti — Argentina (1 title: 1978)', flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_Argentina.svg/80px-Flag_of_Argentina.svg.png' },
        ],
      },
    ],
  },
]
