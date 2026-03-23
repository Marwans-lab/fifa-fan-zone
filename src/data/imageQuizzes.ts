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
    title: 'Stadium Spotter',
    description: 'Can you identify these iconic football stadiums?',
    emoji: '🏟',
    questions: [
      {
        id: 'is1',
        question: 'Which stadium is the Maracanã?',
        options: [
          { id: 'a', label: 'Maracanã', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Maracana_Stadium_June_2013.jpg/640px-Maracana_Stadium_June_2013.jpg' },
          { id: 'b', label: 'Camp Nou', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/2014._Camp_Nou._M%C3%A9s_que_un_club._Barcelona_B40.jpg/640px-2014._Camp_Nou._M%C3%A9s_que_un_club._Barcelona_B40.jpg' },
          { id: 'c', label: 'Wembley', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Wembley_Stadium_interior.jpg/640px-Wembley_Stadium_interior.jpg' },
          { id: 'd', label: 'San Siro', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/San_Siro_Stadium_%28cropped%29.jpg/640px-San_Siro_Stadium_%28cropped%29.jpg' },
        ],
        correctId: 'a',
      },
      {
        id: 'is2',
        question: 'Which is the Lusail Stadium from FIFA 2022?',
        options: [
          { id: 'a', label: 'Al Bayt', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Al_Bayt_Stadium_01.jpg/640px-Al_Bayt_Stadium_01.jpg' },
          { id: 'b', label: 'Lusail', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Lusail_Iconic_Stadium.jpg/640px-Lusail_Iconic_Stadium.jpg' },
          { id: 'c', label: 'Stadium 974', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Ras_Abu_Aboud_Stadium.jpg/640px-Ras_Abu_Aboud_Stadium.jpg' },
          { id: 'd', label: 'Education City', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Education_City_Stadium.jpg/640px-Education_City_Stadium.jpg' },
        ],
        correctId: 'b',
      },
      {
        id: 'is3',
        question: 'Which stadium is the Allianz Arena?',
        options: [
          { id: 'a', label: 'Signal Iduna Park', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Signal-Iduna-Park-Dortmund.jpg/640px-Signal-Iduna-Park-Dortmund.jpg' },
          { id: 'b', label: 'Olympiastadion', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Berlin_Olympiastadion_nach_Umbau.jpg/640px-Berlin_Olympiastadion_nach_Umbau.jpg' },
          { id: 'c', label: 'Allianz Arena', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Allianz_Arena_%28AT%29.jpg/640px-Allianz_Arena_%28AT%29.jpg' },
          { id: 'd', label: 'Volksparkstadion', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Volksparkstadion_Hamburg.jpg/640px-Volksparkstadion_Hamburg.jpg' },
        ],
        correctId: 'c',
      },
      {
        id: 'is4',
        question: 'Which stadium hosted the 2010 FIFA World Cup Final?',
        options: [
          { id: 'a', label: 'Moses Mabhida', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Moses_Mabhida_Stadium_Durban.jpg/640px-Moses_Mabhida_Stadium_Durban.jpg' },
          { id: 'b', label: 'Ellis Park', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Ellis_Park_Stadium.jpg/640px-Ellis_Park_Stadium.jpg' },
          { id: 'c', label: 'Cape Town Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Cape_Town_Stadium_Feb09.jpg/640px-Cape_Town_Stadium_Feb09.jpg' },
          { id: 'd', label: 'Soccer City', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Soccer_City_2010.jpg/640px-Soccer_City_2010.jpg' },
        ],
        correctId: 'd',
      },
      {
        id: 'is5',
        question: 'Which is the MetLife Stadium for FIFA 2026?',
        options: [
          { id: 'a', label: 'SoFi Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/SoFi_Stadium_2021.jpg/640px-SoFi_Stadium_2021.jpg' },
          { id: 'b', label: 'Hard Rock Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Hard_Rock_Stadium_aerial.jpg/640px-Hard_Rock_Stadium_aerial.jpg' },
          { id: 'c', label: 'MetLife Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/MetLife_Stadium_%28Aerial_View%29.jpg/640px-MetLife_Stadium_%28Aerial_View%29.jpg' },
          { id: 'd', label: 'AT&T Stadium', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/AT%26T_Stadium_Arlington_Texas.jpg/640px-AT%26T_Stadium_Arlington_Texas.jpg' },
        ],
        correctId: 'c',
      },
    ],
  },
]
