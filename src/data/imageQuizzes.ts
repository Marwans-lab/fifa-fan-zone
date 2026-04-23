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

// Unsplash stadium photo IDs for variety
const STADIUM_PHOTOS = [
  'photo-1522778119026-d647f0596c20', // Soccer stadium aerial
  'photo-1459865264687-595d652de67e', // Stadium at dusk
  'photo-1551958219-acbc608c6377', // Modern stadium
  'photo-1574629810360-7efbbe195018', // Football field
  'photo-1431324155629-1a6deb1dec8d', // Stadium lights
  'photo-1529900748604-07564a03e7a6', // Stadium seats
  'photo-1508098682722-e99c43a406b2', // Stadium exterior
  'photo-1487466365202-1afdb86c764e', // Sports arena
  'photo-1577223625816-7546f13df25d', // Stadium bowl
  'photo-1560272564-c83b66b1ad12', // Football stadium
  'photo-1589829085413-56de8ae18c73', // Empty stadium
  'photo-1574632874276-651332ca5c56', // Stadium architecture
  'photo-1431324155629-1a6deb1dec8d', // Night stadium
  'photo-1461896836934-ffe607ba8211', // Sports field
  'photo-1540747913346-19e32778e8e5', // Stadium panorama
  'photo-1519766304817-4f37bba89638', // Modern sports venue
]

function getStadiumUrl(index: number): string {
  const photoId = STADIUM_PHOTOS[index % STADIUM_PHOTOS.length]
  return `https://images.unsplash.com/${photoId}?w=400&h=300&fit=crop&q=80`
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
          { id: 'a', label: 'Maracana', imageUrl: getStadiumUrl(0) },
          { id: 'b', label: 'Camp Nou', imageUrl: getStadiumUrl(1) },
          { id: 'c', label: 'Wembley', imageUrl: getStadiumUrl(2) },
          { id: 'd', label: 'San Siro', imageUrl: getStadiumUrl(3) },
        ],
        correctId: 'a',
      },
      {
        id: 'is2',
        question: 'Which is the Lusail Stadium from FIFA 2022?',
        options: [
          { id: 'a', label: 'Al Bayt', imageUrl: getStadiumUrl(4) },
          { id: 'b', label: 'Lusail', imageUrl: getStadiumUrl(5) },
          { id: 'c', label: 'Stadium 974', imageUrl: getStadiumUrl(6) },
          { id: 'd', label: 'Education City', imageUrl: getStadiumUrl(7) },
        ],
        correctId: 'b',
      },
      {
        id: 'is3',
        question: 'Which stadium is the Allianz Arena?',
        options: [
          { id: 'a', label: 'Signal Iduna Park', imageUrl: getStadiumUrl(8) },
          { id: 'b', label: 'Olympiastadion', imageUrl: getStadiumUrl(9) },
          { id: 'c', label: 'Allianz Arena', imageUrl: getStadiumUrl(10) },
          { id: 'd', label: 'Volksparkstadion', imageUrl: getStadiumUrl(11) },
        ],
        correctId: 'c',
      },
      {
        id: 'is4',
        question: 'Which stadium hosted the 2010 FIFA World Cup final?',
        options: [
          { id: 'a', label: 'Moses Mabhida', imageUrl: getStadiumUrl(12) },
          { id: 'b', label: 'Ellis Park', imageUrl: getStadiumUrl(13) },
          { id: 'c', label: 'Cape Town Stadium', imageUrl: getStadiumUrl(14) },
          { id: 'd', label: 'Soccer City', imageUrl: getStadiumUrl(15) },
        ],
        correctId: 'd',
      },
      {
        id: 'is5',
        question: 'Which is the MetLife Stadium for FIFA 2026?',
        options: [
          { id: 'a', label: 'SoFi Stadium', imageUrl: getStadiumUrl(0) },
          { id: 'b', label: 'Hard Rock Stadium', imageUrl: getStadiumUrl(1) },
          { id: 'c', label: 'MetLife Stadium', imageUrl: getStadiumUrl(2) },
          { id: 'd', label: 'AT&T Stadium', imageUrl: getStadiumUrl(3) },
        ],
        correctId: 'c',
      },
    ],
  },
]
