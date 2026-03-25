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
  questions: QuizQuestion[]
}

export const QUIZZES: Quiz[] = [
  {
    id: 'host-city-hunt',
    title: 'The Host City Hunt',
    description: 'How well do you know the FIFA World Cup 2026 host cities?',
    emoji: '🏙',
    questions: [
      {
        id: 'hc1',
        question: 'Which FIFA 2026 host city is home to the Hollywood sign?',
        options: [
          { id: 'a', label: 'Dallas' },
          { id: 'b', label: 'Los Angeles' },
          { id: 'c', label: 'Atlanta' },
        ],
        correctId: 'b',
        accentColor: '#1a2a3a',
      },
      {
        id: 'hc2',
        question: 'How many countries are co-hosting FIFA World Cup 2026?',
        options: [
          { id: 'a', label: '2' },
          { id: 'b', label: '3' },
          { id: 'c', label: '4' },
        ],
        correctId: 'b',
        accentColor: '#1a3a1a',
      },
      {
        id: 'hc3',
        question: 'Which Mexican city hosts FIFA 2026 at the iconic Azteca Stadium?',
        options: [
          { id: 'a', label: 'Guadalajara' },
          { id: 'b', label: 'Monterrey' },
          { id: 'c', label: 'Mexico City' },
        ],
        correctId: 'c',
        accentColor: '#2a1a1a',
      },
      {
        id: 'hc4',
        question: 'Which city\'s MetLife Stadium will host the FIFA 2026 Final?',
        options: [
          { id: 'a', label: 'Dallas' },
          { id: 'b', label: 'New York / New Jersey' },
          { id: 'c', label: 'Chicago' },
        ],
        correctId: 'b',
        accentColor: '#1a1a3a',
      },
      {
        id: 'hc5',
        question: 'How many more teams will compete in FIFA 2026 vs. previous tournaments?',
        options: [
          { id: 'a', label: '8 more' },
          { id: 'b', label: '16 more' },
          { id: 'c', label: '24 more' },
        ],
        correctId: 'b',
        accentColor: '#2a2a1a',
      },
    ],
  },
  {
    id: 'world-cup-specials',
    title: 'World Cup Specials',
    description: 'Test your FIFA World Cup knowledge with these classic questions.',
    emoji: '🏆',
    questions: [
      {
        id: 'wc1',
        question: 'How many teams will play in FIFA World Cup 2026?',
        options: [
          { id: 'a', label: '32' },
          { id: 'b', label: '48' },
          { id: 'c', label: '64' },
        ],
        correctId: 'b',
        accentColor: '#1a2a1a',
      },
      {
        id: 'wc2',
        question: 'Which country has won the most FIFA World Cup titles?',
        options: [
          { id: 'a', label: 'Germany' },
          { id: 'b', label: 'Brazil' },
          { id: 'c', label: 'Argentina' },
        ],
        correctId: 'b',
        accentColor: '#2a1a1a',
      },
      {
        id: 'wc3',
        question: 'Which team won the FIFA World Cup 2022 in Qatar?',
        options: [
          { id: 'a', label: 'France' },
          { id: 'b', label: 'Croatia' },
          { id: 'c', label: 'Argentina' },
        ],
        correctId: 'c',
        accentColor: '#1a1a2a',
      },
      {
        id: 'wc4',
        question: 'Who scored a hat-trick in the 2022 FIFA World Cup Final?',
        options: [
          { id: 'a', label: 'Griezmann' },
          { id: 'b', label: 'Mbappé' },
          { id: 'c', label: 'Messi' },
        ],
        correctId: 'b',
        accentColor: '#2a1a2a',
      },
      {
        id: 'wc5',
        question: 'Which country hosted the very first FIFA World Cup in 1930?',
        options: [
          { id: 'a', label: 'Argentina' },
          { id: 'b', label: 'Uruguay' },
          { id: 'c', label: 'Brazil' },
        ],
        correctId: 'b',
        accentColor: '#1a2a2a',
      },
    ],
  },
  {
    id: 'stadium-showdown',
    title: 'World Cup Stadiums',
    description: 'How much do you know about the world\'s greatest football venues?',
    emoji: '🏟',
    questions: [
      {
        id: 'st1',
        question: 'What is the name of Miami\'s FIFA 2026 venue?',
        options: [
          { id: 'a', label: 'Sun Life Arena' },
          { id: 'b', label: 'Hard Rock Stadium' },
          { id: 'c', label: 'Marlins Park' },
        ],
        correctId: 'b',
        accentColor: '#1a2a3a',
      },
      {
        id: 'st2',
        question: 'The Estádio do Maracanã is the famous stadium of which city?',
        options: [
          { id: 'a', label: 'Buenos Aires' },
          { id: 'b', label: 'São Paulo' },
          { id: 'c', label: 'Rio de Janeiro' },
        ],
        correctId: 'c',
        accentColor: '#2a1a1a',
      },
      {
        id: 'st3',
        question: 'SoFi Stadium is situated in which FIFA 2026 host city?',
        options: [
          { id: 'a', label: 'San Francisco' },
          { id: 'b', label: 'Los Angeles' },
          { id: 'c', label: 'Seattle' },
        ],
        correctId: 'b',
        accentColor: '#1a1a2a',
      },
      {
        id: 'st4',
        question: 'AT&T Stadium — a FIFA 2026 venue with a massive retractable roof — is near which city?',
        options: [
          { id: 'a', label: 'Houston' },
          { id: 'b', label: 'Dallas' },
          { id: 'c', label: 'San Antonio' },
        ],
        correctId: 'b',
        accentColor: '#2a2a1a',
      },
      {
        id: 'st5',
        question: 'Which stadium hosted the famous 1950 "Maracanazo" final between Uruguay and Brazil?',
        options: [
          { id: 'a', label: 'Camp Nou' },
          { id: 'b', label: 'Maracanã' },
          { id: 'c', label: 'Wembley' },
        ],
        correctId: 'b',
        accentColor: '#1a3a2a',
      },
    ],
  },
  {
    id: 'football-legends',
    title: 'Football Legends',
    description: 'How well do you know the greatest players in football history?',
    emoji: '⭐',
    questions: [
      {
        id: 'fl1',
        question: 'How many Ballon d\'Or awards has Lionel Messi won (as of 2024)?',
        options: [
          { id: 'a', label: '6' },
          { id: 'b', label: '8' },
          { id: 'c', label: '10' },
        ],
        correctId: 'b',
        accentColor: '#1a2a1a',
      },
      {
        id: 'fl2',
        question: 'Who holds the record for most goals scored in FIFA World Cup history?',
        options: [
          { id: 'a', label: 'Ronaldo (Brazil)' },
          { id: 'b', label: 'Miroslav Klose' },
          { id: 'c', label: 'Pelé' },
        ],
        correctId: 'b',
        accentColor: '#1a1a2a',
      },
      {
        id: 'fl3',
        question: 'Which legendary Brazilian striker played most of his career at Santos FC?',
        options: [
          { id: 'a', label: 'Ronaldo' },
          { id: 'b', label: 'Pelé' },
          { id: 'c', label: 'Garrincha' },
        ],
        correctId: 'b',
        accentColor: '#2a1a1a',
      },
      {
        id: 'fl4',
        question: 'Who scored the notorious "Hand of God" goal at the 1986 World Cup?',
        options: [
          { id: 'a', label: 'Pelé' },
          { id: 'b', label: 'Diego Maradona' },
          { id: 'c', label: 'Ronaldo' },
        ],
        correctId: 'b',
        accentColor: '#2a2a1a',
      },
      {
        id: 'fl5',
        question: 'Kylian Mbappé joined which club in 2024?',
        options: [
          { id: 'a', label: 'Barcelona' },
          { id: 'b', label: 'Real Madrid' },
          { id: 'c', label: 'Manchester City' },
        ],
        correctId: 'b',
        accentColor: '#1a2a2a',
      },
    ],
  },
  {
    id: 'tournament-history',
    title: 'Tournament History',
    description: 'Dive into the rich history of the FIFA World Cup.',
    emoji: '📖',
    questions: [
      {
        id: 'th1',
        question: 'What was the name of the FIFA World Cup trophy awarded before 1970?',
        options: [
          { id: 'a', label: 'Henri Delaunay' },
          { id: 'b', label: 'Jules Rimet' },
          { id: 'c', label: 'Golden Boot' },
        ],
        correctId: 'b',
        accentColor: '#1a2a3a',
      },
      {
        id: 'th2',
        question: 'Which team has appeared in the most FIFA World Cup Finals?',
        options: [
          { id: 'a', label: 'Italy' },
          { id: 'b', label: 'Germany' },
          { id: 'c', label: 'Brazil' },
        ],
        correctId: 'b',
        accentColor: '#2a1a1a',
      },
      {
        id: 'th3',
        question: 'Who has played in the most FIFA World Cup matches (25 games)?',
        options: [
          { id: 'a', label: 'Diego Maradona' },
          { id: 'b', label: 'Lothar Matthäus' },
          { id: 'c', label: 'Pelé' },
        ],
        correctId: 'b',
        accentColor: '#1a1a2a',
      },
      {
        id: 'th4',
        question: 'How many times has a host nation won the FIFA World Cup?',
        options: [
          { id: 'a', label: '4' },
          { id: 'b', label: '6' },
          { id: 'c', label: '8' },
        ],
        correctId: 'b',
        accentColor: '#1a3a1a',
      },
      {
        id: 'th5',
        question: 'Which nation became the first African team to reach a World Cup semi-final?',
        options: [
          { id: 'a', label: 'Nigeria' },
          { id: 'b', label: 'Morocco' },
          { id: 'c', label: 'Senegal' },
        ],
        correctId: 'b',
        accentColor: '#2a1a2a',
      },
    ],
  },
  {
    id: 'the-referee',
    title: 'The Referee',
    description: 'How well do you know the rules and regulations of the FIFA World Cup?',
    emoji: '🟨',
    questions: [
      {
        id: 'ref1',
        question: 'How many substitutions are allowed per team in a FIFA World Cup match?',
        options: [
          { id: 'a', label: '3' },
          { id: 'b', label: '5' },
          { id: 'c', label: '6' },
        ],
        correctId: 'b',
        accentColor: '#1a2a3a',
      },
      {
        id: 'ref2',
        question: 'What happens if a knockout match is tied after extra time?',
        options: [
          { id: 'a', label: 'Replay the match' },
          { id: 'b', label: 'Golden goal' },
          { id: 'c', label: 'Penalty shootout' },
        ],
        correctId: 'c',
        accentColor: '#2a1a1a',
      },
      {
        id: 'ref3',
        question: 'When was VAR first used at a FIFA World Cup?',
        options: [
          { id: 'a', label: '2014' },
          { id: 'b', label: '2018' },
          { id: 'c', label: '2022' },
        ],
        correctId: 'b',
        accentColor: '#1a1a2a',
      },
      {
        id: 'ref4',
        question: 'What does accumulating two yellow cards in the group stage result in?',
        options: [
          { id: 'a', label: 'A fine' },
          { id: 'b', label: 'One-match suspension' },
          { id: 'c', label: 'Tournament ban' },
        ],
        correctId: 'b',
        accentColor: '#2a2a1a',
      },
      {
        id: 'ref5',
        question: 'What is the offside rule based on?',
        options: [
          { id: 'a', label: 'Position of the ball' },
          { id: 'b', label: 'Position of the second-last defender' },
          { id: 'c', label: 'Position of the goalkeeper' },
        ],
        correctId: 'b',
        accentColor: '#1a3a1a',
      },
    ],
  },
]
