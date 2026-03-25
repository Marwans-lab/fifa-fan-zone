export interface CardMatchPair {
  id: string
  clue: string
  answer: string
}

export interface CardMatchRound {
  id: string
  title: string
  pairs: CardMatchPair[]
}

export interface CardMatchQuiz {
  id: string
  title: string
  description: string
  emoji: string
  rounds: CardMatchRound[]
}

export const CARD_MATCH_QUIZZES: CardMatchQuiz[] = [
  {
    id: 'the-connector',
    title: 'The Connector',
    description: 'Match Qatar Airways routes to FIFA 2026 host cities.',
    emoji: '✈️',
    rounds: [
      {
        id: 'cm-r1',
        title: 'Round 1 — East Coast connections',
        pairs: [
          { id: 'r1p1', clue: 'QR\'s daily A380 service from Doha', answer: 'New York' },
          { id: 'r1p2', clue: 'QR codeshare with American Airlines to…', answer: 'Miami' },
          { id: 'r1p3', clue: 'QR\'s nonstop route to the US capital', answer: 'Washington, D.C.' },
          { id: 'r1p4', clue: 'QR flies to this city\'s Hartsfield-Jackson airport', answer: 'Atlanta' },
        ],
      },
      {
        id: 'cm-r2',
        title: 'Round 2 — Southern & Central routes',
        pairs: [
          { id: 'r2p1', clue: 'QR flies here via Dallas-Fort Worth', answer: 'Houston' },
          { id: 'r2p2', clue: 'QR\'s newest direct route from Doha', answer: 'Mexico City' },
          { id: 'r2p3', clue: 'QR\'s gateway to the Lone Star State', answer: 'Dallas' },
          { id: 'r2p4', clue: 'QR partner JetBlue connects Doha to…', answer: 'Boston' },
        ],
      },
      {
        id: 'cm-r3',
        title: 'Round 3 — West Coast & Pacific',
        pairs: [
          { id: 'r3p1', clue: 'QR\'s gateway to the Pacific Northwest', answer: 'Seattle' },
          { id: 'r3p2', clue: 'QR operates daily nonstop to LAX', answer: 'Los Angeles' },
          { id: 'r3p3', clue: 'QR flies to this Bay Area tech hub', answer: 'San Francisco' },
          { id: 'r3p4', clue: 'QR connects Doha to this Canadian city on the Pacific', answer: 'Vancouver' },
        ],
      },
      {
        id: 'cm-r4',
        title: 'Round 4 — North American gateways',
        pairs: [
          { id: 'r4p1', clue: 'QR\'s Canadian hub with daily Doha service', answer: 'Toronto' },
          { id: 'r4p2', clue: 'QR connects to this city via Pearson International', answer: 'Montreal' },
          { id: 'r4p3', clue: 'QR\'s route to the Windy City on Lake Michigan', answer: 'Chicago' },
          { id: 'r4p4', clue: 'QR\'s link to the City of Brotherly Love', answer: 'Philadelphia' },
        ],
      },
      {
        id: 'cm-r5',
        title: 'Round 5 — Global connections',
        pairs: [
          { id: 'r5p1', clue: 'QR\'s Doha hub — the airline\'s home base', answer: 'Doha' },
          { id: 'r5p2', clue: 'QR\'s newest Qsuite destination in Mexico', answer: 'Guadalajara' },
          { id: 'r5p3', clue: 'QR flies to this Monterrey metropolis in northeast Mexico', answer: 'Monterrey' },
          { id: 'r5p4', clue: 'QR oneworld partner connects to Canada\'s capital', answer: 'Ottawa' },
        ],
      },
    ],
  },
]
