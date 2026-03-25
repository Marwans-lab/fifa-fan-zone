export type FlowMechanic = 'card-match' | 'swipe' | 'standard' | 'ranking'

export interface Flow {
  id: string
  order: number
  name: string
  subtitle: string
  mechanic: FlowMechanic
  emoji: string
  comingSoon: boolean
  /** Route path to navigate to for this flow's quiz */
  route: string
}

export const FLOWS: Flow[] = [
  {
    id: 'the-connector',
    order: 1,
    name: 'The Connector',
    subtitle: 'Qatar Airways routes to host cities',
    mechanic: 'card-match',
    emoji: '✈️',
    comingSoon: false,
    route: '/card-match',
  },
  {
    id: 'the-architect',
    order: 2,
    name: 'The Architect',
    subtitle: 'FIFA 2026 stadiums',
    mechanic: 'card-match',
    emoji: '🏟',
    comingSoon: false,
    route: '/card-match',
  },
  {
    id: 'the-historian',
    order: 3,
    name: 'The Historian',
    subtitle: 'World Cup history & heritage',
    mechanic: 'swipe',
    emoji: '📖',
    comingSoon: false,
    route: '/swipe-quiz',
  },
  {
    id: 'the-referee',
    order: 4,
    name: 'The Referee',
    subtitle: 'World Cup rules & regulations',
    mechanic: 'standard',
    emoji: '⚖️',
    comingSoon: false,
    route: '/quiz',
  },
  {
    id: 'the-retrospective',
    order: 5,
    name: 'The Retrospective',
    subtitle: 'Post-stage stats & highlights',
    mechanic: 'ranking',
    emoji: '🏆',
    comingSoon: true,
    route: '/ranking',
  },
]

/** Mechanic display labels */
export const MECHANIC_LABELS: Record<FlowMechanic, string> = {
  'card-match': 'Card Match',
  'swipe': 'Fact or Myth',
  'standard': 'Standard Quiz',
  'ranking': 'Ranking',
}
