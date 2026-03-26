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
}

export const SWIPE_QUIZZES: SwipeQuiz[] = [
  {
    id: 'the-historian',
    title: 'Fact or Myth',
    description: 'Swipe right for Fact, left for Myth!',
    emoji: '📜',
    labels: { right: 'Fact', left: 'Myth' },
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
          "Geoff Hurst's second goal for England in the 1966 final hit the crossbar and bounced down. Whether it crossed the line remains one of football's greatest debates.",
        accentColor: '#2a1a3a',
      },
      {
        id: 'hist10',
        statement: 'Argentina won their first World Cup in 1986',
        isTrue: false,
        explanation:
          "Argentina first won the World Cup in 1978 as hosts, beating the Netherlands 3-1. The 1986 title — Maradona's famous tournament — was their second.",
        accentColor: '#1a3a2a',
      },
    ],
  },
]
