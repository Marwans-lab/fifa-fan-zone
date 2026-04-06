export interface ImageOption {
  id: string
  label: string
  imageUrl: string
}

export interface ImageQuestion {
  id: string
  question: string
  options: ImageOption[]
  correctId: string
}

export interface ImageQuiz {
  id: string
  title: string
  description: string
  emoji: string
  questions: ImageQuestion[]
}

export const IMAGE_QUIZZES: ImageQuiz[] = [
  {
    id: 'stadium-spotter',
    title: 'Stadium spotter',
    description: 'Can you identify these iconic football stadiums?',
    emoji: '🏟',
    questions: [
      {
        id: 'is1',
        question: 'Which stadium is the Maracana?',
        options: [
          {
            id: 'a',
            label: 'Maracana',
            imageUrl: 'assets/images/quiz-stadiums/maracana-stadium.jpg',
          },
          {
            id: 'b',
            label: 'Camp Nou',
            imageUrl: 'assets/images/quiz-stadiums/camp-nou.jpg',
          },
          {
            id: 'c',
            label: 'Wembley',
            imageUrl: 'assets/images/quiz-stadiums/wembley-stadium.jpg',
          },
          {
            id: 'd',
            label: 'San Siro',
            imageUrl: 'assets/images/quiz-stadiums/san-siro.jpg',
          },
        ],
        correctId: 'a',
      },
      {
        id: 'is2',
        question: 'Which is the Lusail Stadium from FIFA 2022?',
        options: [
          {
            id: 'a',
            label: 'Al Bayt',
            imageUrl: 'assets/images/quiz-stadiums/al-bayt-stadium.jpg',
          },
          {
            id: 'b',
            label: 'Lusail',
            imageUrl: 'assets/images/quiz-stadiums/lusail-stadium.jpg',
          },
          {
            id: 'c',
            label: 'Stadium 974',
            imageUrl: 'assets/images/quiz-stadiums/stadium-974.jpg',
          },
          {
            id: 'd',
            label: 'Education City',
            imageUrl: 'assets/images/quiz-stadiums/education-city-stadium.jpg',
          },
        ],
        correctId: 'b',
      },
      {
        id: 'is3',
        question: 'Which stadium is the Allianz Arena?',
        options: [
          {
            id: 'a',
            label: 'Signal Iduna Park',
            imageUrl: 'assets/images/quiz-stadiums/signal-iduna-park.jpg',
          },
          {
            id: 'b',
            label: 'Olympiastadion',
            imageUrl: 'assets/images/quiz-stadiums/olympiastadion-berlin.jpg',
          },
          {
            id: 'c',
            label: 'Allianz Arena',
            imageUrl: 'assets/images/quiz-stadiums/allianz-arena.jpg',
          },
          {
            id: 'd',
            label: 'Volksparkstadion',
            imageUrl: 'assets/images/quiz-stadiums/volksparkstadion-hamburg.jpg',
          },
        ],
        correctId: 'c',
      },
      {
        id: 'is4',
        question: 'Which stadium hosted the 2010 FIFA World Cup final?',
        options: [
          {
            id: 'a',
            label: 'Moses Mabhida',
            imageUrl: 'assets/images/quiz-stadiums/moses-mabhida-stadium.jpg',
          },
          {
            id: 'b',
            label: 'Ellis Park',
            imageUrl: 'assets/images/quiz-stadiums/ellis-park-stadium.jpg',
          },
          {
            id: 'c',
            label: 'Cape Town Stadium',
            imageUrl: 'assets/images/quiz-stadiums/cape-town-stadium.jpg',
          },
          {
            id: 'd',
            label: 'Soccer City',
            imageUrl: 'assets/images/quiz-stadiums/soccer-city-stadium.jpg',
          },
        ],
        correctId: 'd',
      },
      {
        id: 'is5',
        question: 'Which is the MetLife Stadium for FIFA 2026?',
        options: [
          {
            id: 'a',
            label: 'SoFi Stadium',
            imageUrl: 'assets/images/quiz-stadiums/sofi-stadium.jpg',
          },
          {
            id: 'b',
            label: 'Hard Rock Stadium',
            imageUrl: 'assets/images/quiz-stadiums/hard-rock-stadium.jpg',
          },
          {
            id: 'c',
            label: 'MetLife Stadium',
            imageUrl: 'assets/images/quiz-stadiums/metlife-stadium.jpg',
          },
          {
            id: 'd',
            label: 'AT&T Stadium',
            imageUrl: 'assets/images/quiz-stadiums/att-stadium.jpg',
          },
        ],
        correctId: 'c',
      },
    ],
  },
]
