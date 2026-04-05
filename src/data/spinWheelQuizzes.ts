export interface SpinWheelQuestion {
  id: string;
  question: string;
  /** The correct numeric answer (0–10) */
  correctAnswer: number;
  /** Explanation shown after answering */
  explanation: string;
  /** Tolerance: answer within ±tolerance is considered correct */
  tolerance: number;
}

export interface SpinWheelQuiz {
  id: string;
  title: string;
  description: string;
  emoji: string;
  questions: SpinWheelQuestion[];
}

export const SPIN_WHEEL_QUIZZES: SpinWheelQuiz[] = [
  {
    id: 'the-retrospective',
    title: 'The Retrospective',
    description: 'Test your knowledge of World Cup stats and records by spinning to your answer.',
    emoji: '🏆',
    questions: [
      {
        id: 'retro-1',
        question: 'How many times has Brazil won the FIFA World Cup?',
        correctAnswer: 5,
        tolerance: 0,
        explanation: 'Brazil is the most successful nation in World Cup history with 5 titles: 1958, 1962, 1970, 1994, and 2002.',
      },
      {
        id: 'retro-2',
        question: 'How many goals did Ronaldo (Brazil) score at the 2002 FIFA World Cup?',
        correctAnswer: 8,
        tolerance: 1,
        explanation: 'Ronaldo scored 8 goals at the 2002 World Cup in South Korea/Japan, winning the Golden Boot and helping Brazil claim their 5th title.',
      },
      {
        id: 'retro-3',
        question: 'How many red cards were shown in the 2022 World Cup group stage?',
        correctAnswer: 4,
        tolerance: 1,
        explanation: '4 red cards were issued during the group stage of the 2022 FIFA World Cup in Qatar.',
      },
      {
        id: 'retro-4',
        question: 'How many FIFA World Cup tournaments has the USA hosted?',
        correctAnswer: 1,
        tolerance: 0,
        explanation: 'The USA hosted the FIFA World Cup once, in 1994. They will co-host again in 2026 alongside Canada and Mexico.',
      },
      {
        id: 'retro-5',
        question: 'How many teams from Africa qualified for the 2026 FIFA World Cup?',
        correctAnswer: 9,
        tolerance: 1,
        explanation: 'Africa received 9 spots in the expanded 48-team 2026 FIFA World Cup, up from 5 in previous tournaments.',
      },
    ],
  },
];
