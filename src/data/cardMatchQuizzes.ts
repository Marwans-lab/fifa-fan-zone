import type { FlowId } from '../store/store.service'

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
  id: FlowId
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
          { id: 'r1p1', clue: "QR's daily A380 service from Doha", answer: 'New York' },
          { id: 'r1p2', clue: "QR codeshare with American Airlines to…", answer: 'Miami' },
          { id: 'r1p3', clue: "QR's nonstop route to the US capital", answer: 'Washington, D.C.' },
          { id: 'r1p4', clue: "QR flies to this city's Hartsfield-Jackson airport", answer: 'Atlanta' },
        ],
      },
      {
        id: 'cm-r2',
        title: 'Round 2 — Southern & Central routes',
        pairs: [
          { id: 'r2p1', clue: "QR flies here via Dallas-Fort Worth", answer: 'Houston' },
          { id: 'r2p2', clue: "QR's newest direct route from Doha", answer: 'Mexico City' },
          { id: 'r2p3', clue: "QR's gateway to the Lone Star State", answer: 'Dallas' },
          { id: 'r2p4', clue: "QR partner JetBlue connects Doha to…", answer: 'Boston' },
        ],
      },
      {
        id: 'cm-r3',
        title: 'Round 3 — West Coast & Pacific',
        pairs: [
          { id: 'r3p1', clue: "QR's gateway to the Pacific Northwest", answer: 'Seattle' },
          { id: 'r3p2', clue: "QR operates daily nonstop to LAX", answer: 'Los Angeles' },
          { id: 'r3p3', clue: "QR flies to this Bay Area tech hub", answer: 'San Francisco' },
          { id: 'r3p4', clue: "QR connects Doha to this Canadian city on the Pacific", answer: 'Vancouver' },
        ],
      },
      {
        id: 'cm-r4',
        title: 'Round 4 — North American gateways',
        pairs: [
          { id: 'r4p1', clue: "QR's Canadian hub with daily Doha service", answer: 'Toronto' },
          { id: 'r4p2', clue: "QR connects to this city via Pearson International", answer: 'Montreal' },
          { id: 'r4p3', clue: "QR's route to the Windy City on Lake Michigan", answer: 'Chicago' },
          { id: 'r4p4', clue: "QR's link to the City of Brotherly Love", answer: 'Philadelphia' },
        ],
      },
      {
        id: 'cm-r5',
        title: 'Round 5 — Global connections',
        pairs: [
          { id: 'r5p1', clue: "QR's Doha hub — the airline's home base", answer: 'Doha' },
          { id: 'r5p2', clue: "QR's newest Qsuite destination in Mexico", answer: 'Guadalajara' },
          { id: 'r5p3', clue: "QR flies to this Monterrey metropolis in northeast Mexico", answer: 'Monterrey' },
          { id: 'r5p4', clue: "QR oneworld partner connects to Canada's capital", answer: 'Ottawa' },
        ],
      },
    ],
  },
  {
    id: 'the-architect',
    title: 'The Architect',
    description: 'Match FIFA 2026 stadiums to their names and cities.',
    emoji: '🏟',
    rounds: [
      {
        id: 'ta-r1',
        title: 'Round 1 — American Icons',
        pairs: [
          { id: 'ta-r1p1', clue: '82,500 seats in East Rutherford, hosts the 2026 Final', answer: 'MetLife Stadium' },
          { id: 'ta-r1p2', clue: '$5.5 billion venue in Inglewood, opened in 2020', answer: 'SoFi Stadium' },
          { id: 'ta-r1p3', clue: 'Retractable roof in Arlington, home of the Cowboys', answer: 'AT&T Stadium' },
          { id: 'ta-r1p4', clue: 'Open-air venue in Santa Clara, home of the 49ers', answer: "Levi's Stadium" },
        ],
      },
      {
        id: 'ta-r2',
        title: 'Round 2 — Southern & Eastern Hosts',
        pairs: [
          { id: 'ta-r2p1', clue: 'Eight-panel retractable roof in Atlanta, seats 71,000', answer: 'Mercedes-Benz Stadium' },
          { id: 'ta-r2p2', clue: 'First retractable-roof NFL stadium, located in Houston', answer: 'NRG Stadium' },
          { id: 'ta-r2p3', clue: 'Hosted six Super Bowls, located in Miami Gardens', answer: 'Hard Rock Stadium' },
          { id: 'ta-r2p4', clue: 'Home of the Eagles in Philadelphia, opened in 2003', answer: 'Lincoln Financial Field' },
        ],
      },
      {
        id: 'ta-r3',
        title: 'Round 3 — North & West',
        pairs: [
          { id: 'ta-r3p1', clue: 'Seattle waterfront venue, known for deafening crowd noise', answer: 'Lumen Field' },
          { id: 'ta-r3p2', clue: 'Legendary Kansas City venue, home of the Chiefs', answer: 'GEHA Field at Arrowhead' },
          { id: 'ta-r3p3', clue: 'Foxborough venue near Boston, home of the Patriots', answer: 'Gillette Stadium' },
          { id: 'ta-r3p4', clue: "Retractable roof dome in Vancouver, hosted 2015 Women's WC Final", answer: 'BC Place' },
        ],
      },
      {
        id: 'ta-r4',
        title: 'Round 4 — Mexico & Canada',
        pairs: [
          { id: 'ta-r4p1', clue: 'Mexico City landmark, hosted 1970 and 1986 World Cup finals', answer: 'Estadio Azteca' },
          { id: 'ta-r4p2', clue: 'Known as the Steel Giant, home of CF Monterrey', answer: 'Estadio BBVA' },
          { id: 'ta-r4p3', clue: 'Guadalajara venue, home of CD Guadalajara (Chivas)', answer: 'Estadio Akron' },
          { id: 'ta-r4p4', clue: 'Toronto venue expanded for 2026, home of the Argonauts', answer: 'BMO Field' },
        ],
      },
      {
        id: 'ta-r5',
        title: 'Round 5 — Stadium Challenge',
        pairs: [
          { id: 'ta-r5p1', clue: 'Highest altitude 2026 venue at 2,200m above sea level', answer: 'Estadio Azteca' },
          { id: 'ta-r5p2', clue: 'Features a 70,000 sq ft video board called the Infinity Screen', answer: 'SoFi Stadium' },
          { id: 'ta-r5p3', clue: 'Oldest NFL stadium still in use, opened in 1972', answer: 'GEHA Field at Arrowhead' },
          { id: 'ta-r5p4', clue: "North America's largest stadium by capacity for 2026", answer: 'MetLife Stadium' },
        ],
      },
    ],
  },
]
