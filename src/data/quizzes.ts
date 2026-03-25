export interface QuizOption {
  id: string
  label: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
  correctId: string
  accentColor: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  emoji: string
  questions: QuizQuestion[]
}

export const QUIZZES: Quiz[] = [
  {
    id: 'the-referee',
    title: 'The Referee',
    description: 'World Cup rules & regulations',
    emoji: '⚖️',
    questions: [
      {
        id: 'ref1',
        question: 'How many substitutions are allowed per team in a FIFA World Cup match?',
        options: [
          { id: 'a', label: '3' },
          { id: 'b', label: '5' },
          { id: 'c', label: '6' },
        ],
        correctId: 'b',
        accentColor: '#1a2a3a',
      },
      {
        id: 'ref2',
        question: 'What happens if a knockout match is tied after extra time?',
        options: [
          { id: 'a', label: 'Replay the match' },
          { id: 'b', label: 'Golden goal' },
          { id: 'c', label: 'Penalty shootout' },
        ],
        correctId: 'c',
        accentColor: '#2a1a2a',
      },
      {
        id: 'ref3',
        question: 'How long is each half of extra time in a World Cup match?',
        options: [
          { id: 'a', label: '10 minutes' },
          { id: 'b', label: '15 minutes' },
          { id: 'c', label: '20 minutes' },
        ],
        correctId: 'b',
        accentColor: '#1a3a1a',
      },
      {
        id: 'ref4',
        question: 'What does a red card mean for the player?',
        options: [
          { id: 'a', label: 'Warning only' },
          { id: 'b', label: 'Sent off for 10 minutes' },
          { id: 'c', label: 'Sent off for the rest of the match' },
        ],
        correctId: 'c',
        accentColor: '#2a1a1a',
      },
      {
        id: 'ref5',
        question: 'What technology is used to check goals and offsides at the World Cup?',
        options: [
          { id: 'a', label: 'Hawk-Eye only' },
          { id: 'b', label: 'VAR (Video Assistant Referee)' },
          { id: 'c', label: 'TV replay' },
        ],
        correctId: 'b',
        accentColor: '#1a1a2a',
      },
    ],
  },
]
