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
]
