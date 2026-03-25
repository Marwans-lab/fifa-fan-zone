export interface CardMatchPair {
  id: string
  prompt: string
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
    id: 'the-architect',
    title: 'The Architect',
    description: 'Match FIFA 2026 stadiums to their names and cities.',
    emoji: '🏟',
    rounds: [
      {
        id: 'r1',
        title: 'Round 1 — American Icons',
        pairs: [
          { id: 'r1p1', prompt: '82,500 seats in East Rutherford, hosts the 2026 Final', answer: 'MetLife Stadium' },
          { id: 'r1p2', prompt: '$5.5 billion venue in Inglewood, opened in 2020', answer: 'SoFi Stadium' },
          { id: 'r1p3', prompt: 'Retractable roof in Arlington, home of the Cowboys', answer: 'AT&T Stadium' },
          { id: 'r1p4', prompt: 'Open-air venue in Santa Clara, home of the 49ers', answer: "Levi's Stadium" },
        ],
      },
      {
        id: 'r2',
        title: 'Round 2 — Southern & Eastern Hosts',
        pairs: [
          { id: 'r2p1', prompt: 'Eight-panel retractable roof in Atlanta, seats 71,000', answer: 'Mercedes-Benz Stadium' },
          { id: 'r2p2', prompt: 'First retractable-roof NFL stadium, located in Houston', answer: 'NRG Stadium' },
          { id: 'r2p3', prompt: 'Hosted six Super Bowls, located in Miami Gardens', answer: 'Hard Rock Stadium' },
          { id: 'r2p4', prompt: 'Home of the Eagles in Philadelphia, opened in 2003', answer: 'Lincoln Financial Field' },
        ],
      },
      {
        id: 'r3',
        title: 'Round 3 — North & West',
        pairs: [
          { id: 'r3p1', prompt: 'Seattle waterfront venue, known for deafening crowd noise', answer: 'Lumen Field' },
          { id: 'r3p2', prompt: 'Legendary Kansas City venue, home of the Chiefs', answer: 'GEHA Field at Arrowhead' },
          { id: 'r3p3', prompt: 'Foxborough venue near Boston, home of the Patriots', answer: 'Gillette Stadium' },
          { id: 'r3p4', prompt: 'Retractable roof dome in Vancouver, hosted 2015 Women\'s WC Final', answer: 'BC Place' },
        ],
      },
      {
        id: 'r4',
        title: 'Round 4 — Mexico & Canada',
        pairs: [
          { id: 'r4p1', prompt: 'Mexico City landmark, hosted 1970 and 1986 World Cup finals', answer: 'Estadio Azteca' },
          { id: 'r4p2', prompt: 'Known as the Steel Giant, home of CF Monterrey', answer: 'Estadio BBVA' },
          { id: 'r4p3', prompt: 'Guadalajara venue, home of CD Guadalajara (Chivas)', answer: 'Estadio Akron' },
          { id: 'r4p4', prompt: 'Toronto venue expanded for 2026, home of the Argonauts', answer: 'BMO Field' },
        ],
      },
      {
        id: 'r5',
        title: 'Round 5 — Stadium Challenge',
        pairs: [
          { id: 'r5p1', prompt: 'Highest altitude 2026 venue at 2,200m above sea level', answer: 'Estadio Azteca' },
          { id: 'r5p2', prompt: 'Features a 70,000 sq ft video board called the Infinity Screen', answer: 'SoFi Stadium' },
          { id: 'r5p3', prompt: 'Oldest NFL stadium still in use, opened in 1972', answer: 'GEHA Field at Arrowhead' },
          { id: 'r5p4', prompt: 'North America\'s largest stadium by capacity for 2026', answer: 'MetLife Stadium' },
        ],
      },
    ],
  },
]
