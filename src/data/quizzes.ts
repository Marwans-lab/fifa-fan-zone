export interface QuizOption {
  id: string
  label: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
  correctId: string
  accentColor: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  emoji: string
  bannerImage?: string
  questions: QuizQuestion[]
}

export const QUIZZES: Quiz[] = [
  {
    id: 'the-connector',
    title: 'The Connector',
    description: 'How well do you know Qatar Airways routes to FIFA 2026 host cities?',
    emoji: '✈️',
    bannerImage: 'assets/images/quiz-banners/the-connector.svg',
    questions: [
      {
        id: 'con1',
        question: 'Which U.S. city does Qatar Airways serve daily with its iconic A380?',
        options: [
          { id: 'a', label: 'Miami, Florida' },
          { id: 'b', label: 'New York, New York' },
          { id: 'c', label: 'Chicago, Illinois' },
        ],
        correctId: 'b',
        accentColor: '#0a1628',
      },
      {
        id: 'con2',
        question: "Qatar Airways' newest direct route from Doha connects to which city?",
        options: [
          { id: 'a', label: 'Houston, Texas' },
          { id: 'b', label: 'Los Angeles, California' },
          { id: 'c', label: 'Mexico City, Mexico' },
        ],
        correctId: 'c',
        accentColor: '#0d1f1a',
      },
      {
        id: 'con3',
        question: 'Qatar Airways operates daily nonstop flights to which California city?',
        options: [
          { id: 'a', label: 'San Francisco' },
          { id: 'b', label: 'San Diego' },
          { id: 'c', label: 'Los Angeles' },
        ],
        correctId: 'c',
        accentColor: '#0f1c2e',
      },
      {
        id: 'con4',
        question: "Which Canadian city is Qatar Airways' largest hub for North American connections?",
        options: [
          { id: 'a', label: 'Vancouver' },
          { id: 'b', label: 'Montreal' },
          { id: 'c', label: 'Toronto' },
        ],
        correctId: 'c',
        accentColor: '#1a0a28',
      },
      {
        id: 'con5',
        question: "Qatar Airways home base is located in which FIFA 2026 host city?",
        options: [
          { id: 'a', label: 'Dubai' },
          { id: 'b', label: 'Doha' },
          { id: 'c', label: 'Abu Dhabi' },
        ],
        correctId: 'b',
        accentColor: '#1a1a0a',
      },
    ],
  },
  {
    id: 'world-cup-history',
    title: 'World Cup History',
    description: 'Test your knowledge of FIFA World Cup moments, records, and champions.',
    emoji: '🏆',
    bannerImage: 'assets/images/quiz-banners/world-cup-history.svg',
    questions: [
      {
        id: 'wch1',
        question: 'Which country hosted the very first FIFA World Cup in 1930?',
        options: [
          { id: 'a', label: 'Brazil' },
          { id: 'b', label: 'Argentina' },
          { id: 'c', label: 'Uruguay' },
        ],
        correctId: 'c',
        accentColor: '#1a1000',
      },
      {
        id: 'wch2',
        question: 'Which nation has won the most FIFA World Cup titles?',
        options: [
          { id: 'a', label: 'Germany' },
          { id: 'b', label: 'Brazil' },
          { id: 'c', label: 'Italy' },
        ],
        correctId: 'b',
        accentColor: '#1a1200',
      },
      {
        id: 'wch3',
        question: 'Who scored the famous "Hand of God" goal in 1986?',
        options: [
          { id: 'a', label: 'Pelé' },
          { id: 'b', label: 'Diego Maradona' },
          { id: 'c', label: 'Ronaldo' },
        ],
        correctId: 'b',
        accentColor: '#0f1000',
      },
      {
        id: 'wch4',
        question: 'In which year did France win their first FIFA World Cup?',
        options: [
          { id: 'a', label: '1994' },
          { id: 'b', label: '2002' },
          { id: 'c', label: '1998' },
        ],
        correctId: 'c',
        accentColor: '#1a1500',
      },
      {
        id: 'wch5',
        question: 'Which player holds the record for most World Cup goals scored?',
        options: [
          { id: 'a', label: 'Miroslav Klose' },
          { id: 'b', label: 'Ronaldo (Brazil)' },
          { id: 'c', label: 'Just Fontaine' },
        ],
        correctId: 'a',
        accentColor: '#1a1800',
      },
    ],
  },
  {
    id: 'stadium-knowledge',
    title: 'Stadium Knowledge',
    description: 'How much do you know about the iconic venues hosting FIFA World Cup 2026?',
    emoji: '🏟️',
    bannerImage: 'assets/images/quiz-banners/stadium-knowledge.svg',
    questions: [
      {
        id: 'stk1',
        question: 'Which city in the USA will host the FIFA 2026 final?',
        options: [
          { id: 'a', label: 'Los Angeles' },
          { id: 'b', label: 'New York / New Jersey' },
          { id: 'c', label: 'Dallas' },
        ],
        correctId: 'b',
        accentColor: '#001a0d',
      },
      {
        id: 'stk2',
        question: 'How many stadiums across three nations will host FIFA 2026 matches?',
        options: [
          { id: 'a', label: '14' },
          { id: 'b', label: '16' },
          { id: 'c', label: '12' },
        ],
        correctId: 'b',
        accentColor: '#001500',
      },
      {
        id: 'stk3',
        question: 'Which Canadian city is the host venue for FIFA World Cup 2026?',
        options: [
          { id: 'a', label: 'Vancouver' },
          { id: 'b', label: 'Toronto' },
          { id: 'c', label: 'Montreal' },
        ],
        correctId: 'b',
        accentColor: '#001a05',
      },
      {
        id: 'stk4',
        question: "What is the seating capacity of AT&T Stadium in Arlington, Texas?",
        options: [
          { id: 'a', label: 'Around 80,000' },
          { id: 'b', label: 'Around 100,000' },
          { id: 'c', label: 'Around 60,000' },
        ],
        correctId: 'a',
        accentColor: '#001208',
      },
      {
        id: 'stk5',
        question: 'Which Mexican stadium will host FIFA 2026 group stage matches?',
        options: [
          { id: 'a', label: 'Estadio BBVA' },
          { id: 'b', label: 'Estadio Jalisco' },
          { id: 'c', label: 'Estadio Azteca' },
        ],
        correctId: 'c',
        accentColor: '#001a0a',
      },
    ],
  },
  {
    id: 'star-players',
    title: 'Star Players',
    description: 'Test your knowledge of the greatest FIFA World Cup players ever.',
    emoji: '⭐',
    bannerImage: 'assets/images/quiz-banners/star-players.svg',
    questions: [
      {
        id: 'sp1',
        question: 'Which player won the Golden Boot at the 2022 FIFA World Cup in Qatar?',
        options: [
          { id: 'a', label: 'Kylian Mbappé' },
          { id: 'b', label: 'Lionel Messi' },
          { id: 'c', label: 'Olivier Giroud' },
        ],
        correctId: 'a',
        accentColor: '#0d0020',
      },
      {
        id: 'sp2',
        question: 'Pelé scored how many goals in total across FIFA World Cup tournaments?',
        options: [
          { id: 'a', label: '9' },
          { id: 'b', label: '12' },
          { id: 'c', label: '15' },
        ],
        correctId: 'b',
        accentColor: '#0a001a',
      },
      {
        id: 'sp3',
        question: 'Which player received the Golden Ball at the 2022 FIFA World Cup?',
        options: [
          { id: 'a', label: 'Kylian Mbappé' },
          { id: 'b', label: 'Luka Modrić' },
          { id: 'c', label: 'Lionel Messi' },
        ],
        correctId: 'c',
        accentColor: '#0f0028',
      },
      {
        id: 'sp4',
        question: 'Who scored a hat-trick in the 2022 World Cup final for France?',
        options: [
          { id: 'a', label: 'Antoine Griezmann' },
          { id: 'b', label: 'Kylian Mbappé' },
          { id: 'c', label: 'Marcus Thuram' },
        ],
        correctId: 'b',
        accentColor: '#0d001e',
      },
      {
        id: 'sp5',
        question: "Which player is the all-time top scorer in FIFA World Cup history?",
        options: [
          { id: 'a', label: 'Ronaldo (Brazil)' },
          { id: 'b', label: 'Miroslav Klose' },
          { id: 'c', label: 'Gerd Müller' },
        ],
        correctId: 'b',
        accentColor: '#0a0018',
      },
    ],
  },
  {
    id: 'host-nations',
    title: 'Host Nations',
    description: 'How well do you know USA, Canada, and Mexico — the co-hosts of FIFA 2026?',
    emoji: '🌎',
    bannerImage: 'assets/images/quiz-banners/host-nations.svg',
    questions: [
      {
        id: 'hn1',
        question: 'How many cities across the USA, Canada, and Mexico will host FIFA 2026 matches?',
        options: [
          { id: 'a', label: '11' },
          { id: 'b', label: '16' },
          { id: 'c', label: '14' },
        ],
        correctId: 'b',
        accentColor: '#00062a',
      },
      {
        id: 'hn2',
        question: 'FIFA 2026 marks the first World Cup co-hosted by how many nations?',
        options: [
          { id: 'a', label: 'Two' },
          { id: 'b', label: 'Three' },
          { id: 'c', label: 'Four' },
        ],
        correctId: 'b',
        accentColor: '#050020',
      },
      {
        id: 'hn3',
        question: 'Mexico previously hosted the FIFA World Cup in 1970 and which other year?',
        options: [
          { id: 'a', label: '1978' },
          { id: 'b', label: '1982' },
          { id: 'c', label: '1986' },
        ],
        correctId: 'c',
        accentColor: '#00082e',
      },
      {
        id: 'hn4',
        question: 'The USA previously hosted the FIFA World Cup in which year?',
        options: [
          { id: 'a', label: '1990' },
          { id: 'b', label: '1994' },
          { id: 'c', label: '1998' },
        ],
        correctId: 'b',
        accentColor: '#040018',
      },
      {
        id: 'hn5',
        question: 'For Canada, FIFA 2026 will be their first time hosting the men\'s World Cup. True or false?',
        options: [
          { id: 'a', label: 'True' },
          { id: 'b', label: 'False — they hosted in 2010' },
          { id: 'c', label: 'False — they hosted in 2002' },
        ],
        correctId: 'a',
        accentColor: '#00062a',
      },
    ],
  },
]
