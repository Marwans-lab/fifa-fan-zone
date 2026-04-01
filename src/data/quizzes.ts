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
  bannerImage?: string
  questions: QuizQuestion[]
}

export const QUIZZES: Quiz[] = [
  {
    id: 'the-connector',
    title: 'The Connector',
    description: 'How well do you know Qatar Airways routes to FIFA 2026 host cities?',
    emoji: '✈️',
    bannerImage: 'assets/images/quiz-connector-banner.png',
    questions: [
      {
        id: 'con1',
        question: 'Which U.S. city does Qatar Airways serve daily with its iconic A380?',
        options: [
          { id: 'a', label: 'Miami, Florida' },
          { id: 'b', label: 'New York, New York' },
          { id: 'c', label: 'Chicago, Illinois' },
        ],
        correctId: 'b',
        accentColor: '#0a1628',
      },
      {
        id: 'con2',
        question: "Qatar Airways' newest direct route from Doha connects to which city?",
        options: [
          { id: 'a', label: 'Houston, Texas' },
          { id: 'b', label: 'Los Angeles, California' },
          { id: 'c', label: 'Mexico City, Mexico' },
        ],
        correctId: 'c',
        accentColor: '#0d1f1a',
      },
      {
        id: 'con3',
        question: 'Qatar Airways operates daily nonstop flights to which California city?',
        options: [
          { id: 'a', label: 'San Francisco' },
          { id: 'b', label: 'San Diego' },
          { id: 'c', label: 'Los Angeles' },
        ],
        correctId: 'c',
        accentColor: '#0f1c2e',
      },
      {
        id: 'con4',
        question: "Which Canadian city is Qatar Airways' largest hub for North American connections?",
        options: [
          { id: 'a', label: 'Vancouver' },
          { id: 'b', label: 'Montreal' },
          { id: 'c', label: 'Toronto' },
        ],
        correctId: 'c',
        accentColor: '#1a0a28',
      },
      {
        id: 'con5',
        question: "Qatar Airways home base is located in which FIFA 2026 host city?",
        options: [
          { id: 'a', label: 'Dubai' },
          { id: 'b', label: 'Doha' },
          { id: 'c', label: 'Abu Dhabi' },
        ],
        correctId: 'b',
        accentColor: '#1a1a0a',
      },
    ],
  },
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
