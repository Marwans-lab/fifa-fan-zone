import type { FlowId } from '../models/flow-id.model'

export interface CardMatchPair {
  id: string
  clue: string
  answer: string
  imageUrl?: string
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

// Unsplash stadium photo IDs for variety
const STADIUM_PHOTOS = [
  'photo-1522778119026-d647f0596c20',
  'photo-1459865264687-595d652de67e',
  'photo-1551958219-acbc608c6377',
  'photo-1574629810360-7efbbe195018',
  'photo-1431324155629-1a6deb1dec8d',
  'photo-1529900748604-07564a03e7a6',
  'photo-1508098682722-e99c43a406b2',
  'photo-1487466365202-1afdb86c764e',
  'photo-1577223625816-7546f13df25d',
  'photo-1560272564-c83b66b1ad12',
  'photo-1589829085413-56de8ae18c73',
  'photo-1574632874276-651332ca5c56',
  'photo-1540747913346-19e32778e8e5',
  'photo-1519766304817-4f37bba89638',
  'photo-1461896836934-ffe607ba8211',
  'photo-1431324155629-1a6deb1dec8d',
]

function getStadiumUrl(index: number): string {
  const photoId = STADIUM_PHOTOS[index % STADIUM_PHOTOS.length]
  return `https://images.unsplash.com/${photoId}?w=400&h=300&fit=crop&q=80`
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
    description: 'Match FIFA 2026 stadium photos to their names.',
    emoji: '🏟',
    rounds: [
      {
        id: 'ta-r1',
        title: 'Round 1 — American Icons',
        pairs: [
          { id: 'ta-r1p1', clue: 'MetLife Stadium', answer: 'MetLife Stadium', imageUrl: getStadiumUrl(0) },
          { id: 'ta-r1p2', clue: 'SoFi Stadium', answer: 'SoFi Stadium', imageUrl: getStadiumUrl(1) },
          { id: 'ta-r1p3', clue: 'AT&T Stadium', answer: 'AT&T Stadium', imageUrl: getStadiumUrl(2) },
          { id: 'ta-r1p4', clue: "Levi's Stadium", answer: "Levi's Stadium", imageUrl: getStadiumUrl(3) },
        ],
      },
      {
        id: 'ta-r2',
        title: 'Round 2 — Southern & Eastern Hosts',
        pairs: [
          { id: 'ta-r2p1', clue: 'Mercedes-Benz Stadium', answer: 'Mercedes-Benz Stadium', imageUrl: getStadiumUrl(4) },
          { id: 'ta-r2p2', clue: 'NRG Stadium', answer: 'NRG Stadium', imageUrl: getStadiumUrl(5) },
          { id: 'ta-r2p3', clue: 'Hard Rock Stadium', answer: 'Hard Rock Stadium', imageUrl: getStadiumUrl(6) },
          { id: 'ta-r2p4', clue: 'Lincoln Financial Field', answer: 'Lincoln Financial Field', imageUrl: getStadiumUrl(7) },
        ],
      },
      {
        id: 'ta-r3',
        title: 'Round 3 — North & West',
        pairs: [
          { id: 'ta-r3p1', clue: 'Lumen Field', answer: 'Lumen Field', imageUrl: getStadiumUrl(8) },
          { id: 'ta-r3p2', clue: 'GEHA Field at Arrowhead', answer: 'GEHA Field at Arrowhead', imageUrl: getStadiumUrl(9) },
          { id: 'ta-r3p3', clue: 'Gillette Stadium', answer: 'Gillette Stadium', imageUrl: getStadiumUrl(10) },
          { id: 'ta-r3p4', clue: 'BC Place', answer: 'BC Place', imageUrl: getStadiumUrl(11) },
        ],
      },
      {
        id: 'ta-r4',
        title: 'Round 4 — Mexico & Canada',
        pairs: [
          { id: 'ta-r4p1', clue: 'Estadio Azteca', answer: 'Estadio Azteca', imageUrl: getStadiumUrl(12) },
          { id: 'ta-r4p2', clue: 'Estadio BBVA', answer: 'Estadio BBVA', imageUrl: getStadiumUrl(13) },
          { id: 'ta-r4p3', clue: 'Estadio Akron', answer: 'Estadio Akron', imageUrl: getStadiumUrl(14) },
          { id: 'ta-r4p4', clue: 'BMO Field', answer: 'BMO Field', imageUrl: getStadiumUrl(15) },
        ],
      },
      {
        id: 'ta-r5',
        title: 'Round 5 — Mixed Challenge',
        pairs: [
          { id: 'ta-r5p1', clue: 'MetLife Stadium', answer: 'MetLife Stadium', imageUrl: getStadiumUrl(0) },
          { id: 'ta-r5p2', clue: 'Estadio Azteca', answer: 'Estadio Azteca', imageUrl: getStadiumUrl(12) },
          { id: 'ta-r5p3', clue: 'SoFi Stadium', answer: 'SoFi Stadium', imageUrl: getStadiumUrl(1) },
          { id: 'ta-r5p4', clue: 'Hard Rock Stadium', answer: 'Hard Rock Stadium', imageUrl: getStadiumUrl(6) },
        ],
      },
    ],
  },
]
