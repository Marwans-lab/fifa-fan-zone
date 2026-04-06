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
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s2',
        statement: 'A player can be offside from a throw-in.',
        isTrue: false,
        explanation: 'Offside cannot be called directly from a throw-in, corner kick, or goal kick.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s3',
        statement: 'VAR was first used at a FIFA World Cup in 2018.',
        isTrue: true,
        explanation: 'VAR made its World Cup debut at the 2018 tournament in Russia.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s4',
        statement: 'A red card means the player\'s team plays with 10 players for the rest of the match.',
        isTrue: true,
        explanation: 'A sent-off player cannot be replaced, leaving their team a player short.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s5',
        statement: 'The penalty spot is exactly 11 metres from the goal line.',
        isTrue: false,
        explanation: 'The penalty spot is 12 yards (approximately 10.97 metres) from the goal line.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s6',
        statement: 'A goal can be scored directly from a kick-off.',
        isTrue: true,
        explanation: 'Since 2016, the Laws of the Game allow a goal to be scored directly from a kick-off.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s7',
        statement: 'Two yellow cards in the same match result in a red card and an automatic one-match suspension.',
        isTrue: true,
        explanation: 'A second yellow card equals a red card, and the player is suspended for the next match.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s8',
        statement: 'A player is offside if they are level with the last defender.',
        isTrue: false,
        explanation: 'Being level with the second-last defender (including the goalkeeper) is onside.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s9',
        statement: 'In a penalty shootout, the goalkeeper must stay on the goal line until the ball is kicked.',
        isTrue: true,
        explanation: 'The goalkeeper must remain on the goal line between the posts until the kick is taken.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
      {
        id: 'ref-s10',
        statement: 'A match can have more than 90 minutes of playing time.',
        isTrue: true,
        explanation: 'Stoppage time and extra time mean matches often exceed the standard 90 minutes.',
        imageUrl: 'assets/images/quiz-swipe/the-referee.svg',
      },
    ],
  },
]
