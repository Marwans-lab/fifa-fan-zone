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
    id: 'the-historian',
    title: 'The Historian',
    description: 'World Cup history & heritage — fact or myth?',
    emoji: '📖',
    statements: [
      {
        id: 'hist1',
        statement: 'The first FIFA World Cup was held in Uruguay in 1930',
        isTrue: true,
        explanation: 'Uruguay hosted and won the inaugural World Cup in 1930.',
        accentColor: '#1a2a3a',
      },
      {
        id: 'hist2',
        statement: 'Brazil has won the World Cup 6 times',
        isTrue: false,
        explanation: 'Brazil has won 5 World Cup titles — the most by any nation.',
        accentColor: '#1a3a1a',
      },
      {
        id: 'hist3',
        statement: 'The 2022 World Cup Final went to a penalty shootout',
        isTrue: true,
        explanation: 'Argentina beat France 4-2 on penalties after a dramatic 3-3 draw.',
        accentColor: '#2a1a2a',
      },
      {
        id: 'hist4',
        statement: 'Pelé won the World Cup 4 times as a player',
        isTrue: false,
        explanation: 'Pelé won the World Cup 3 times — in 1958, 1962, and 1970.',
        accentColor: '#2a2a1a',
      },
      {
        id: 'hist5',
        statement: 'Miroslav Klose is the all-time top scorer in World Cup history',
        isTrue: true,
        explanation: 'Klose scored 16 goals across four World Cups for Germany.',
        accentColor: '#1a1a2a',
      },
      {
        id: 'hist6',
        statement: 'Morocco was the first African team to reach a World Cup semi-final',
        isTrue: true,
        explanation: 'Morocco reached the semi-finals at the 2022 World Cup in Qatar.',
        accentColor: '#2a1a1a',
      },
      {
        id: 'hist7',
        statement: 'Italy has never failed to qualify for a World Cup',
        isTrue: false,
        explanation: 'Italy failed to qualify for the 2018 and 2022 World Cups.',
        accentColor: '#1a2a2a',
      },
      {
        id: 'hist8',
        statement: 'The FIFA World Cup trophy is made of solid 18-carat gold',
        isTrue: false,
        explanation: 'It is 18-carat gold with a malachite base, but not solid gold throughout.',
        accentColor: '#3a2a1a',
      },
    ],
  },
]
