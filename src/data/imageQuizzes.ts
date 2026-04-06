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
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Maracana_2022.jpg/400px-Maracana_2022.jpg',
          },
          {
            id: 'b',
            label: 'Camp Nou',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Camp_Nou_aerial.jpg/400px-Camp_Nou_aerial.jpg',
          },
          {
            id: 'c',
            label: 'Wembley',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/London_Wembley.jpg/400px-London_Wembley.jpg',
          },
          {
            id: 'd',
            label: 'San Siro',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Stadio_Meazza_2021_3.jpg/400px-Stadio_Meazza_2021_3.jpg',
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
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/71/Al_Bayt_Stadium_architecture.jpg/400px-Al_Bayt_Stadium_architecture.jpg',
          },
          {
            id: 'b',
            label: 'Lusail',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Br%C3%A9sil_vs_Serbie.jpg/400px-Br%C3%A9sil_vs_Serbie.jpg',
          },
          {
            id: 'c',
            label: 'Stadium 974',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a8/Stadium_974_exterior.jpg/400px-Stadium_974_exterior.jpg',
          },
          {
            id: 'd',
            label: 'Education City',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/Education_City_Stadium.jpg/400px-Education_City_Stadium.jpg',
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
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Signal_iduna_park_stadium_dortmund_4.jpg/400px-Signal_iduna_park_stadium_dortmund_4.jpg',
          },
          {
            id: 'b',
            label: 'Olympiastadion',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Olympiastadion_Berlin-Marathontor-msu-2020-3139.jpg/400px-Olympiastadion_Berlin-Marathontor-msu-2020-3139.jpg',
          },
          {
            id: 'c',
            label: 'Allianz Arena',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Allianz_Arena_2008-02-09.jpg/400px-Allianz_Arena_2008-02-09.jpg',
          },
          {
            id: 'd',
            label: 'Volksparkstadion',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/RK_1009_9831_Volksparkstadion.jpg/400px-RK_1009_9831_Volksparkstadion.jpg',
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
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Moses_Mabhida_stadium_in_Durban.jpg/400px-Moses_Mabhida_stadium_in_Durban.jpg',
          },
          {
            id: 'b',
            label: 'Ellis Park',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Ellis_Park_Stadium.jpg/400px-Ellis_Park_Stadium.jpg',
          },
          {
            id: 'c',
            label: 'Cape Town Stadium',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d5/South_Africa_-_Cape_Town_Drieankerbaai_from_Lion%27s_head.jpg/400px-South_Africa_-_Cape_Town_Drieankerbaai_from_Lion%27s_head.jpg',
          },
          {
            id: 'd',
            label: 'Soccer City',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/FNB_Stadium%2C_Johannesburg.jpg/400px-FNB_Stadium%2C_Johannesburg.jpg',
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
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/SoFi_Stadium_2023.jpg/400px-SoFi_Stadium_2023.jpg',
          },
          {
            id: 'b',
            label: 'Hard Rock Stadium',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hard_Rock_Stadium_for_Super_Bowl_LIV_%2849606710103%29.jpg/400px-Hard_Rock_Stadium_for_Super_Bowl_LIV_%2849606710103%29.jpg',
          },
          {
            id: 'c',
            label: 'MetLife Stadium',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Metlife_stadium_%28Aerial_view%29.jpg/400px-Metlife_stadium_%28Aerial_view%29.jpg',
          },
          {
            id: 'd',
            label: 'AT&T Stadium',
            imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg/400px-Arlington_June_2020_4_%28AT%26T_Stadium%29.jpg',
          },
        ],
        correctId: 'c',
      },
    ],
  },
]
