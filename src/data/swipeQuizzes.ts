export interface SwipeQuestion {
  id: string
  statement: string
  isTrue: boolean
  explanation: string
  accentColor: string
  emoji: string
}

export interface SwipeQuiz {
  id: string
  title: string
  description: string
  emoji: string
  questions: SwipeQuestion[]
}

export const SWIPE_QUIZZES: SwipeQuiz[] = [
  {
    id: 'true-false-legends',
    title: 'True or False: Legends',
    description: 'Swipe right for TRUE, left for FALSE!',
    emoji: '⭐',
    questions: [
      {
        id: 'sl1',
        statement: 'Pelé scored over 1,000 career goals',
        isTrue: true,
        explanation: 'Pelé scored 1,283 goals in 1,363 games throughout his career.',
        accentColor: '#1a2a1a',
        emoji: '⚽',
      },
      {
        id: 'sl2',
        statement: 'Cristiano Ronaldo has won 3 FIFA World Cups',
        isTrue: false,
        explanation: 'Ronaldo has never won a FIFA World Cup. He won the 2016 European Championship.',
        accentColor: '#2a1a1a',
        emoji: '🏆',
      },
      {
        id: 'sl3',
        statement: 'The FIFA World Cup 2026 will feature 48 teams',
        isTrue: true,
        explanation: 'FIFA expanded the tournament from 32 to 48 teams starting in 2026.',
        accentColor: '#1a1a2a',
        emoji: '🌍',
      },
      {
        id: 'sl4',
        statement: 'Brazil has won the most FIFA World Cup titles with 5 wins',
        isTrue: true,
        explanation: 'Brazil won in 1958, 1962, 1970, 1994, and 2002.',
        accentColor: '#2a2a1a',
        emoji: '🇧🇷',
      },
      {
        id: 'sl5',
        statement: 'The FIFA World Cup Final 2022 ended 2-0 in regular time',
        isTrue: false,
        explanation: 'The 2022 Final between Argentina and France ended 3-3 after extra time.',
        accentColor: '#1a2a2a',
        emoji: '🏟',
      },
      {
        id: 'sl6',
        statement: 'Lionel Messi has won 8 Ballon d\'Or awards',
        isTrue: true,
        explanation: 'Messi won his record 8th Ballon d\'Or in 2023.',
        accentColor: '#2a1a2a',
        emoji: '🐐',
      },
      {
        id: 'sl7',
        statement: 'The first FIFA World Cup was held in France in 1930',
        isTrue: false,
        explanation: 'The first World Cup was held in Uruguay, not France.',
        accentColor: '#1a3a1a',
        emoji: '📖',
      },
      {
        id: 'sl8',
        statement: 'Miroslav Klose is the all-time top scorer in FIFA World Cup history',
        isTrue: true,
        explanation: 'Klose scored 16 goals across four World Cups (2002–2014).',
        accentColor: '#3a1a1a',
        emoji: '🎯',
      },
      {
        id: 'sl9',
        statement: 'The 2026 FIFA World Cup will be hosted across 3 countries',
        isTrue: true,
        explanation: 'USA, Mexico, and Canada are co-hosting the 2026 World Cup.',
        accentColor: '#1a1a3a',
        emoji: '🗺',
      },
      {
        id: 'sl10',
        statement: 'Diego Maradona\'s "Hand of God" goal was scored against Brazil',
        isTrue: false,
        explanation: 'The infamous goal was scored against England in the 1986 quarter-final.',
        accentColor: '#2a1a1a',
        emoji: '✋',
      },
    ],
  },
]
