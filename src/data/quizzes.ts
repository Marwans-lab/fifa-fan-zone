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
    description: 'How well do you know the rules and regulations of the FIFA World Cup?',
    emoji: '🟨',
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
        accentColor: '#2a1a1a',
      },
      {
        id: 'ref3',
        question: 'When was VAR first used at a FIFA World Cup?',
        options: [
          { id: 'a', label: '2014' },
          { id: 'b', label: '2018' },
          { id: 'c', label: '2022' },
        ],
        correctId: 'b',
        accentColor: '#1a1a2a',
      },
      {
        id: 'ref4',
        question: 'What does accumulating two yellow cards in the group stage result in?',
        options: [
          { id: 'a', label: 'A fine' },
          { id: 'b', label: 'One-match suspension' },
          { id: 'c', label: 'Tournament ban' },
        ],
        correctId: 'b',
        accentColor: '#2a2a1a',
      },
      {
        id: 'ref5',
        question: 'What is the offside rule based on?',
        options: [
          { id: 'a', label: 'Position of the ball' },
          { id: 'b', label: 'Position of the second-last defender' },
          { id: 'c', label: 'Position of the goalkeeper' },
        ],
        correctId: 'b',
        accentColor: '#1a3a1a',
      },
    ],
  },
]
