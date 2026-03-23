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
    title: 'World Cup Facts',
    description: 'Swipe right for TRUE, left for FALSE!',
    emoji: '🏆',
    statements: [
      {
        id: 'sf1',
        statement: 'Brazil has won the FIFA World Cup 5 times',
        isTrue: true,
        explanation: 'Brazil holds the record with 5 titles (1958, 1962, 1970, 1994, 2002)',
        accentColor: '#1a2a3a',
      },
      {
        id: 'sf2',
        statement: 'The 2026 World Cup will feature 32 teams',
        isTrue: false,
        explanation: 'The 2026 World Cup expands to 48 teams for the first time',
        accentColor: '#2a1a1a',
      },
      {
        id: 'sf3',
        statement: 'Germany has hosted the World Cup twice',
        isTrue: true,
        explanation: 'Germany hosted in 1974 (West Germany) and 2006',
        accentColor: '#1a1a2a',
      },
      {
        id: 'sf4',
        statement: 'The first World Cup was held in Brazil in 1930',
        isTrue: false,
        explanation: 'The first World Cup was held in Uruguay in 1930',
        accentColor: '#2a2a1a',
      },
      {
        id: 'sf5',
        statement: 'Miroslav Klose is the all-time World Cup top scorer',
        isTrue: true,
        explanation: 'Klose scored 16 goals across four World Cups (2002–2014)',
        accentColor: '#1a3a1a',
      },
      {
        id: 'sf6',
        statement: 'The 2022 World Cup in Qatar was held in summer',
        isTrue: false,
        explanation: 'It was the first World Cup held in November–December due to Qatar\'s climate',
        accentColor: '#2a1a2a',
      },
      {
        id: 'sf7',
        statement: 'Italy has won the World Cup 4 times',
        isTrue: true,
        explanation: 'Italy won in 1934, 1938, 1982, and 2006',
        accentColor: '#1a2a2a',
      },
      {
        id: 'sf8',
        statement: 'The FIFA World Cup trophy is made of solid gold',
        isTrue: false,
        explanation: 'It is made of 18-carat gold-plated sterling silver, weighing 6.1 kg',
        accentColor: '#2a2a2a',
      },
    ],
  },
  {
    id: 'swipe-football-legends',
    title: 'Legend or Myth?',
    description: 'True or false about football\'s greatest players!',
    emoji: '⭐',
    statements: [
      {
        id: 'sl1',
        statement: 'Pelé scored over 1,000 career goals',
        isTrue: true,
        explanation: 'Pelé scored 1,281 goals in 1,363 games across his career',
        accentColor: '#1a2a1a',
      },
      {
        id: 'sl2',
        statement: 'Cristiano Ronaldo has never won the World Cup',
        isTrue: true,
        explanation: 'Despite his incredible career, Ronaldo has never lifted the World Cup trophy',
        accentColor: '#2a1a1a',
      },
      {
        id: 'sl3',
        statement: 'Lionel Messi won his first Ballon d\'Or at age 20',
        isTrue: false,
        explanation: 'Messi won his first Ballon d\'Or in 2009 at age 22',
        accentColor: '#1a1a2a',
      },
      {
        id: 'sl4',
        statement: 'Diego Maradona played for both Barcelona and Napoli',
        isTrue: true,
        explanation: 'Maradona played for Barcelona (1982–84) and Napoli (1984–91)',
        accentColor: '#2a2a1a',
      },
      {
        id: 'sl5',
        statement: 'Zinedine Zidane scored a header in the 2006 World Cup Final',
        isTrue: true,
        explanation: 'Zidane scored a Panenka penalty, not a header, but he did headbutt Materazzi — trick question! He actually scored via penalty.',
        accentColor: '#1a3a1a',
      },
      {
        id: 'sl6',
        statement: 'Ronaldo Nazário won three World Cups with Brazil',
        isTrue: false,
        explanation: 'Ronaldo won two World Cups: 1994 (as a squad member) and 2002 (as top scorer)',
        accentColor: '#2a1a2a',
      },
      {
        id: 'sl7',
        statement: 'Kylian Mbappé scored a hat-trick in the 2022 World Cup Final',
        isTrue: true,
        explanation: 'Mbappé scored three goals against Argentina in the 2022 final',
        accentColor: '#1a2a2a',
      },
      {
        id: 'sl8',
        statement: 'Luka Modrić won the Ballon d\'Or in 2018',
        isTrue: true,
        explanation: 'Modrić won the 2018 Ballon d\'Or after leading Croatia to the World Cup final',
        accentColor: '#2a2a2a',
      },
    ],
  },
]
