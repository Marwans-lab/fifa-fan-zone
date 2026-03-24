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

export const DRAG_DROP_QUIZZES: DragDropQuiz[] = [
  {
    id: 'match-host-cities',
    title: 'Match the Host Cities',
    description: 'Drag each FIFA World Cup year to its host country.',
    emoji: '🌍',
    questions: [
      {
        id: 'dd1',
        title: 'Match the World Cup year to its host country',
        pairs: [
          { id: 'p1', prompt: '2022', answer: 'Qatar' },
          { id: 'p2', prompt: '2018', answer: 'Russia' },
          { id: 'p3', prompt: '2014', answer: 'Brazil' },
          { id: 'p4', prompt: '2010', answer: 'South Africa' },
        ],
        accentColor: '#1a2a3a',
      },
      {
        id: 'dd2',
        title: 'Match the legend to their national team',
        pairs: [
          { id: 'p1', prompt: 'Pelé', answer: 'Brazil' },
          { id: 'p2', prompt: 'Maradona', answer: 'Argentina' },
          { id: 'p3', prompt: 'Zidane', answer: 'France' },
          { id: 'p4', prompt: 'Beckenbauer', answer: 'Germany' },
        ],
        accentColor: '#2a1a2a',
      },
      {
        id: 'dd3',
        title: 'Match the stadium to its city',
        pairs: [
          { id: 'p1', prompt: 'Maracanã', answer: 'Rio de Janeiro' },
          { id: 'p2', prompt: 'Azteca', answer: 'Mexico City' },
          { id: 'p3', prompt: 'Wembley', answer: 'London' },
          { id: 'p4', prompt: 'San Siro', answer: 'Milan' },
        ],
        accentColor: '#1a3a1a',
      },
      {
        id: 'dd4',
        title: 'Match the FIFA 2026 venue to its host city',
        pairs: [
          { id: 'p1', prompt: 'MetLife Stadium', answer: 'New Jersey' },
          { id: 'p2', prompt: 'SoFi Stadium', answer: 'Los Angeles' },
          { id: 'p3', prompt: 'Hard Rock Stadium', answer: 'Miami' },
          { id: 'p4', prompt: 'AT&T Stadium', answer: 'Dallas' },
        ],
        accentColor: '#1a1a3a',
      },
      {
        id: 'dd5',
        title: 'Match the Golden Boot winner to the tournament',
        pairs: [
          { id: 'p1', prompt: 'Mbappé', answer: '2022 (8 goals)' },
          { id: 'p2', prompt: 'Harry Kane', answer: '2018 (6 goals)' },
          { id: 'p3', prompt: 'James Rodríguez', answer: '2014 (6 goals)' },
          { id: 'p4', prompt: 'Thomas Müller', answer: '2010 (5 goals)' },
        ],
        accentColor: '#2a2a1a',
      },
    ],
  },
]
