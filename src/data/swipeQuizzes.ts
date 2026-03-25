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
  labels?: { right: string; left: string }
  unlockedBy?: string
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
  {
    id: 'the-historian',
    title: 'Fact or Myth',
    description: 'Swipe right for Fact, left for Myth!',
    emoji: '📜',
    labels: { right: 'Fact', left: 'Myth' },
    unlockedBy: 'swipe-world-cup-facts',
    statements: [
      {
        id: 'hist1',
        statement: 'Brazil is the only team to have played in every World Cup',
        isTrue: true,
        explanation:
          'Brazil has appeared in all 22 FIFA World Cup tournaments since 1930 — no other nation has a perfect attendance record.',
        accentColor: '#1a3a1a',
      },
      {
        id: 'hist2',
        statement: 'The first World Cup had 32 teams',
        isTrue: false,
        explanation:
          'Only 13 teams competed in the 1930 World Cup in Uruguay. The tournament expanded to 32 teams in 1998 and to 48 for 2026.',
        accentColor: '#2a1a2a',
      },
      {
        id: 'hist3',
        statement:
          'The 1950 World Cup Final was decided by a round-robin, not a single match',
        isTrue: true,
        explanation:
          'The 1950 tournament had no official final — the last round was a four-team group stage. Uruguay clinched the title by beating Brazil in the decisive match.',
        accentColor: '#1a2a3a',
      },
      {
        id: 'hist4',
        statement: 'Germany has won the World Cup 5 times',
        isTrue: false,
        explanation:
          'Germany has won 4 World Cup titles (1954, 1974, 1990, 2014). Only Brazil has won five.',
        accentColor: '#2a2a1a',
      },
      {
        id: 'hist5',
        statement:
          'The original World Cup trophy was stolen and never recovered',
        isTrue: true,
        explanation:
          'The Jules Rimet Trophy was stolen in Brazil in 1983 and is believed to have been melted down. It has never been found.',
        accentColor: '#1a1a2a',
      },
      {
        id: 'hist6',
        statement:
          'No host nation has ever been eliminated in the group stage',
        isTrue: false,
        explanation:
          'South Africa became the first host nation eliminated in the group stage at the 2010 World Cup.',
        accentColor: '#2a1a1a',
      },
      {
        id: 'hist7',
        statement:
          'The fastest goal in World Cup history was scored in under 11 seconds',
        isTrue: true,
        explanation:
          'Hakan Şükür of Turkey scored just 10.8 seconds into the 2002 third-place match against South Korea — a record that still stands.',
        accentColor: '#1a2a2a',
      },
      {
        id: 'hist8',
        statement: 'Italy has never lost a World Cup final',
        isTrue: false,
        explanation:
          'Italy lost the 1970 final to Brazil (1-4) and the 1994 final to Brazil on penalties. They have 4 titles but also 2 final defeats.',
        accentColor: '#3a1a2a',
      },
      {
        id: 'hist9',
        statement:
          'The 1966 World Cup final featured a controversial goal where the ball may not have crossed the line',
        isTrue: true,
        explanation:
          'Geoff Hurst\'s second goal for England in the 1966 final hit the crossbar and bounced down. Whether it crossed the line remains one of football\'s greatest debates.',
        accentColor: '#2a1a3a',
      },
      {
        id: 'hist10',
        statement: 'Argentina won their first World Cup in 1986',
        isTrue: false,
        explanation:
          'Argentina first won the World Cup in 1978 as hosts, beating the Netherlands 3-1. The 1986 title — Maradona\'s famous tournament — was their second.',
        accentColor: '#1a3a2a',
      },
    ],
  },
]
