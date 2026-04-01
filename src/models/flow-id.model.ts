export const FLOW_IDS = [
  'the-connector',
  'the-architect',
  'the-historian',
  'the-referee',
  'the-retrospective',
] as const;

export type FlowId = (typeof FLOW_IDS)[number];
