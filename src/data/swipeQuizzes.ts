export interface SwipeStatement {
  id: string
  statement: string
  isTrue: boolean
  explanation: string
  accentColor: string
}

export interface SwipeQuiz {
  id: string
  title: string
  description: string
  emoji: string
  statements: SwipeStatement[]
}

export const SWIPE_QUIZZES: SwipeQuiz[] = [
  {
    id: 'swipe-world-cup-facts',
    title: 'World Cup True or False',
    description: 'Swipe right for true, left for false!',
    emoji: '🏆',
    statements: [
      {
        id: 'sw1',
        statement: 'FIFA World Cup 2026 will be hosted by 3 countries',
        isTrue: true,
        explanation: 'USA, Canada, and Mexico will co-host the 2026 World Cup.',
        accentColor: '#1a2a3a',
      },
      {
        id: 'sw2',
        statement: 'Brazil has won the World Cup 6 times',
        isTrue: false,
        explanation: 'Brazil has won 5 World Cup titles — the most by any nation.',
        accentColor: '#1a3a1a',
      },
      {
        id: 'sw3',
        statement: 'The 2022 World Cup Final went to a penalty shootout',
        isTrue: true,
        explanation: 'Argentina beat France 4-2 on penalties after a 3-3 draw.',
        accentColor: '#2a1a2a',
      },
      {
        id: 'sw4',
        statement: 'FIFA World Cup 2026 will feature 64 teams',
        isTrue: false,
        explanation: '48 teams will compete in 2026, expanded from 32.',
        accentColor: '#2a2a1a',
      },
      {
        id: 'sw5',
        statement: 'Miroslav Klose is the all-time top scorer in World Cup history',
        isTrue: true,
        explanation: 'Klose scored 16 goals across four World Cups for Germany.',
        accentColor: '#1a1a2a',
      },
      {
        id: 'sw6',
        statement: 'The first FIFA World Cup was held in Brazil in 1930',
        isTrue: false,
        explanation: 'The first World Cup was held in Uruguay in 1930.',
        accentColor: '#2a1a1a',
      },
      {
        id: 'sw7',
        statement: 'The MetLife Stadium will host the 2026 World Cup Final',
        isTrue: true,
        explanation: 'The Final will be held at MetLife Stadium in New Jersey.',
        accentColor: '#1a2a2a',
      },
      {
        id: 'sw8',
        statement: 'Pelé won the World Cup 4 times as a player',
        isTrue: false,
        explanation: 'Pelé won the World Cup 3 times — in 1958, 1962, and 1970.',
        accentColor: '#1a2a1a',
      },
      {
        id: 'sw9',
        statement: 'Morocco was the first African team to reach a World Cup semi-final',
        isTrue: true,
        explanation: 'Morocco reached the semi-finals at the 2022 World Cup in Qatar.',
        accentColor: '#2a1a3a',
      },
      {
        id: 'sw10',
        statement: 'The FIFA World Cup trophy is made of solid gold',
        isTrue: false,
        explanation: 'It is made of 18-carat gold with a malachite base, but it is not solid gold throughout.',
        accentColor: '#3a2a1a',
      },
    ],
  },
]
