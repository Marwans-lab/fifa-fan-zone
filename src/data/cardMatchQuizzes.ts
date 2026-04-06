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
          { id: 'ta-r1p1', clue: 'MetLife Stadium', answer: 'MetLife Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Metlife_stadium_%28Aerial_view%29.jpg/400px-Metlife_stadium_%28Aerial_view%29.jpg' },
          { id: 'ta-r1p2', clue: 'SoFi Stadium', answer: 'SoFi Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/SoFi_Stadium_2023.jpg/400px-SoFi_Stadium_2023.jpg' },
          { id: 'ta-r1p3', clue: 'AT&T Stadium', answer: 'AT&T Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg/400px-Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg' },
          { id: 'ta-r1p4', clue: "Levi's Stadium", answer: "Levi's Stadium", imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Levi%27s_Stadium_in_February_2016_prior_to_Super_Bowl_50_%2824398261729%29.jpg/400px-Levi%27s_Stadium_in_February_2016_prior_to_Super_Bowl_50_%2824398261729%29.jpg' },
        ],
      },
      {
        id: 'ta-r2',
        title: 'Round 2 — Southern & Eastern Hosts',
        pairs: [
          { id: 'ta-r2p1', clue: 'Mercedes-Benz Stadium', answer: 'Mercedes-Benz Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Mercedes_Benz_Stadium_time_lapse_capture_2017-08-13.jpg/400px-Mercedes_Benz_Stadium_time_lapse_capture_2017-08-13.jpg' },
          { id: 'ta-r2p2', clue: 'NRG Stadium', answer: 'NRG Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Nrg_stadium.jpg/400px-Nrg_stadium.jpg' },
          { id: 'ta-r2p3', clue: 'Hard Rock Stadium', answer: 'Hard Rock Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hard_Rock_Stadium_for_Super_Bowl_LIV_%2849606710103%29.jpg/400px-Hard_Rock_Stadium_for_Super_Bowl_LIV_%2849606710103%29.jpg' },
          { id: 'ta-r2p4', clue: 'Lincoln Financial Field', answer: 'Lincoln Financial Field', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Lincoln_Financial_Field_%28Aerial_view%29.jpg/400px-Lincoln_Financial_Field_%28Aerial_view%29.jpg' },
        ],
      },
      {
        id: 'ta-r3',
        title: 'Round 3 — North & West',
        pairs: [
          { id: 'ta-r3p1', clue: 'Lumen Field', answer: 'Lumen Field', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Qwest_Field_North.jpg/400px-Qwest_Field_North.jpg' },
          { id: 'ta-r3p2', clue: 'GEHA Field at Arrowhead', answer: 'GEHA Field at Arrowhead', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Aerial_view_of_Arrowhead_Stadium_08-31-2013.jpg/400px-Aerial_view_of_Arrowhead_Stadium_08-31-2013.jpg' },
          { id: 'ta-r3p3', clue: 'Gillette Stadium', answer: 'Gillette Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Gillette_Stadium_%28Top_View%29.jpg/400px-Gillette_Stadium_%28Top_View%29.jpg' },
          { id: 'ta-r3p4', clue: 'BC Place', answer: 'BC Place', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/BC_Place_2015_Women%27s_FIFA_World_Cup.jpg/400px-BC_Place_2015_Women%27s_FIFA_World_Cup.jpg' },
        ],
      },
      {
        id: 'ta-r4',
        title: 'Round 4 — Mexico & Canada',
        pairs: [
          { id: 'ta-r4p1', clue: 'Estadio Azteca', answer: 'Estadio Azteca', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Mexico_city_Estadio_Azteca_estadio_banorte_fifa_world_cup_2026_4.JPG/400px-Mexico_city_Estadio_Azteca_estadio_banorte_fifa_world_cup_2026_4.JPG' },
          { id: 'ta-r4p2', clue: 'Estadio BBVA', answer: 'Estadio BBVA', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Mexico_Guadalupe_Monterrey_Estadio_BBVA_Bancomer_fifa_world_cup_2026_6.JPG/400px-Mexico_Guadalupe_Monterrey_Estadio_BBVA_Bancomer_fifa_world_cup_2026_6.JPG' },
          { id: 'ta-r4p3', clue: 'Estadio Akron', answer: 'Estadio Akron', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho_%283%29.jpg/400px-Estadio_Akron_02-07-2022_cabecera_sur_lado_derecho_%283%29.jpg' },
          { id: 'ta-r4p4', clue: 'BMO Field', answer: 'BMO Field', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/BMO_Field_in_2016.png/400px-BMO_Field_in_2016.png' },
        ],
      },
      {
        id: 'ta-r5',
        title: 'Round 5 — Mixed Challenge',
        pairs: [
          { id: 'ta-r5p1', clue: 'MetLife Stadium', answer: 'MetLife Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Metlife_stadium_%28Aerial_view%29.jpg/400px-Metlife_stadium_%28Aerial_view%29.jpg' },
          { id: 'ta-r5p2', clue: 'Estadio Azteca', answer: 'Estadio Azteca', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Mexico_city_Estadio_Azteca_estadio_banorte_fifa_world_cup_2026_4.JPG/400px-Mexico_city_Estadio_Azteca_estadio_banorte_fifa_world_cup_2026_4.JPG' },
          { id: 'ta-r5p3', clue: 'SoFi Stadium', answer: 'SoFi Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/SoFi_Stadium_2023.jpg/400px-SoFi_Stadium_2023.jpg' },
          { id: 'ta-r5p4', clue: 'Hard Rock Stadium', answer: 'Hard Rock Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hard_Rock_Stadium_for_Super_Bowl_LIV_%2849606710103%29.jpg/400px-Hard_Rock_Stadium_for_Super_Bowl_LIV_%2849606710103%29.jpg' },
        ],
      },
    ],
  },
]
