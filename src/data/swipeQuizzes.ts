export interface SwipeStatement {
  id: string
  statement: string
  isTrue: boolean
  explanation: string
  imageUrl: string
}

export interface SwipeQuiz {
  id: string
  title: string
  description: string
  emoji: string
  statements: SwipeStatement[]
  labels?: { right: string; left: string }
}

// Unsplash football/referee photo IDs
const FOOTBALL_PHOTOS = [
  'photo-1579952363873-27f3bade9f55', // Goalkeeper
  'photo-1575361204480-aadea25e6e68', // Referee
  'photo-1431324155629-1a6deb1dec8d', // Match action
  'photo-1589487391730-58f20eb2c308', // Yellow card
  'photo-1560272564-c83b66b1ad12', // Penalty kick
  'photo-1551958219-acbc608c6377', // Kickoff
  'photo-1574632874276-651332ca5c56', // Football match
  'photo-1508098682722-e99c43a406b2', // Stadium action
  'photo-1487466365202-1afdb86c764e', // Football game
  'photo-1461896836934-ffe607ba8211', // Soccer field
]

function getFootballPhotoUrl(index: number): string {
  const photoId = FOOTBALL_PHOTOS[index % FOOTBALL_PHOTOS.length]
  return `https://images.unsplash.com/${photoId}?w=400&h=300&fit=crop&q=80`
}

export const SWIPE_QUIZZES: SwipeQuiz[] = [
  {
    id: 'the-referee',
    title: 'The Referee',
    description: 'True or false — test your knowledge of football rules and refereeing.',
    emoji: '🟨',
    labels: { right: 'True', left: 'False' },
    statements: [
      {
        id: 'ref-s1',
        statement: 'A goalkeeper can hold the ball for up to 6 seconds before releasing it.',
        isTrue: true,
        explanation: 'Law 12 allows goalkeepers to hold the ball for up to 6 seconds.',
        imageUrl: getFootballPhotoUrl(0),
      },
      {
        id: 'ref-s2',
        statement: 'A player can be offside from a throw-in.',
        isTrue: false,
        explanation: 'Offside cannot be called directly from a throw-in, corner kick, or goal kick.',
        imageUrl: getFootballPhotoUrl(1),
      },
      {
        id: 'ref-s3',
        statement: 'VAR was first used at a FIFA World Cup in 2018.',
        isTrue: true,
        explanation: 'VAR made its World Cup debut at the 2018 tournament in Russia.',
        imageUrl: getFootballPhotoUrl(2),
      },
      {
        id: 'ref-s4',
        statement: 'A red card means the player\'s team plays with 10 players for the rest of the match.',
        isTrue: true,
        explanation: 'A sent-off player cannot be replaced, leaving their team a player short.',
        imageUrl: getFootballPhotoUrl(3),
      },
      {
        id: 'ref-s5',
        statement: 'The penalty spot is exactly 11 metres from the goal line.',
        isTrue: false,
        explanation: 'The penalty spot is 12 yards (approximately 10.97 metres) from the goal line.',
        imageUrl: getFootballPhotoUrl(4),
      },
      {
        id: 'ref-s6',
        statement: 'A goal can be scored directly from a kick-off.',
        isTrue: true,
        explanation: 'Since 2016, the Laws of the Game allow a goal to be scored directly from a kick-off.',
        imageUrl: getFootballPhotoUrl(5),
      },
      {
        id: 'ref-s7',
        statement: 'Two yellow cards in the same match result in a red card and an automatic one-match suspension.',
        isTrue: true,
        explanation: 'A second yellow card equals a red card, and the player is suspended for the next match.',
        imageUrl: getFootballPhotoUrl(3),
      },
      {
        id: 'ref-s8',
        statement: 'A player is offside if they are level with the last defender.',
        isTrue: false,
        explanation: 'Being level with the second-last defender (including the goalkeeper) is onside.',
        imageUrl: getFootballPhotoUrl(1),
      },
      {
        id: 'ref-s9',
        statement: 'In a penalty shootout, the goalkeeper must stay on the goal line until the ball is kicked.',
        isTrue: true,
        explanation: 'The goalkeeper must remain on the goal line between the posts until the kick is taken.',
        imageUrl: getFootballPhotoUrl(0),
      },
      {
        id: 'ref-s10',
        statement: 'A match can have more than 90 minutes of playing time.',
        isTrue: true,
        explanation: 'Stoppage time and extra time mean matches often exceed the standard 90 minutes.',
        imageUrl: getFootballPhotoUrl(5),
      },
    ],
  },
]
