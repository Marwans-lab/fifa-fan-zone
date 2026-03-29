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
    id: 'the-connector',
    title: 'The Connector',
    description: 'Match Qatar Airways routes to FIFA 2026 host cities.',
    emoji: '✈️',
    questions: [
      {
        id: 'conn-q1',
        title: 'East Coast connections',
        accentColor: '#0a1628',
        pairs: [
          { id: 'conn-q1p1', prompt: "QR's daily A380 service from Doha", answer: 'New York' },
          { id: 'conn-q1p2', prompt: 'QR codeshare with American Airlines to…', answer: 'Miami' },
          { id: 'conn-q1p3', prompt: "QR's nonstop route to the US capital", answer: 'Washington D.C.' },
          { id: 'conn-q1p4', prompt: "QR flies to this city's Hartsfield-Jackson airport", answer: 'Atlanta' },
        ],
      },
      {
        id: 'conn-q2',
        title: 'Southern & Central routes',
        accentColor: '#0d1f1a',
        pairs: [
          { id: 'conn-q2p1', prompt: 'QR flies here via Dallas-Fort Worth', answer: 'Houston' },
          { id: 'conn-q2p2', prompt: "QR's newest direct route from Doha", answer: 'Mexico City' },
          { id: 'conn-q2p3', prompt: "QR's gateway to the Lone Star State", answer: 'Dallas' },
          { id: 'conn-q2p4', prompt: 'QR partner JetBlue connects Doha to…', answer: 'Boston' },
        ],
      },
      {
        id: 'conn-q3',
        title: 'West Coast & Pacific',
        accentColor: '#0f1c2e',
        pairs: [
          { id: 'conn-q3p1', prompt: "QR's gateway to the Pacific Northwest", answer: 'Seattle' },
          { id: 'conn-q3p2', prompt: 'QR operates daily nonstop to LAX', answer: 'Los Angeles' },
          { id: 'conn-q3p3', prompt: 'QR flies to this Bay Area tech hub', answer: 'San Francisco' },
          { id: 'conn-q3p4', prompt: 'QR connects Doha to this Canadian city on the Pacific', answer: 'Vancouver' },
        ],
      },
      {
        id: 'conn-q4',
        title: 'North American gateways',
        accentColor: '#1a0a28',
        pairs: [
          { id: 'conn-q4p1', prompt: "QR's Canadian hub with daily Doha service", answer: 'Toronto' },
          { id: 'conn-q4p2', prompt: 'QR connects to this city via Pearson International', answer: 'Montreal' },
          { id: 'conn-q4p3', prompt: "QR's route to the Windy City on Lake Michigan", answer: 'Chicago' },
          { id: 'conn-q4p4', prompt: "QR's link to the City of Brotherly Love", answer: 'Philadelphia' },
        ],
      },
      {
        id: 'conn-q5',
        title: 'Global connections',
        accentColor: '#1a1a0a',
        pairs: [
          { id: 'conn-q5p1', prompt: "QR's Doha hub — the airline's home base", answer: 'Doha' },
          { id: 'conn-q5p2', prompt: "QR's newest Qsuite destination in Mexico", answer: 'Guadalajara' },
          { id: 'conn-q5p3', prompt: 'QR flies to this Monterrey metropolis in northeast Mexico', answer: 'Monterrey' },
          { id: 'conn-q5p4', prompt: "QR oneworld partner connects to Canada's capital", answer: 'Ottawa' },
        ],
      },
    ],
  },
]
