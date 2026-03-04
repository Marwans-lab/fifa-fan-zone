export interface Team {
  id: string
  name: string
  flag: string
  accent: string
  gradient: string
}

// Placeholder team list — replace with agreed set + real assets before integration testing
export const TEAMS: Team[] = [
  { id: 'bra', name: 'Brazil',      flag: '🇧🇷', accent: '#009c3b', gradient: 'linear-gradient(135deg, #009c3b 0%, #ffdf00 100%)' },
  { id: 'fra', name: 'France',      flag: '🇫🇷', accent: '#002395', gradient: 'linear-gradient(135deg, #002395 0%, #ED2939 100%)' },
  { id: 'arg', name: 'Argentina',   flag: '🇦🇷', accent: '#74acdf', gradient: 'linear-gradient(135deg, #74acdf 0%, #ffffff 100%)' },
  { id: 'eng', name: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', accent: '#cf081f', gradient: 'linear-gradient(135deg, #cf081f 0%, #ffffff 100%)' },
  { id: 'esp', name: 'Spain',       flag: '🇪🇸', accent: '#c60b1e', gradient: 'linear-gradient(135deg, #c60b1e 0%, #f1bf00 100%)' },
  { id: 'ger', name: 'Germany',     flag: '🇩🇪', accent: '#000000', gradient: 'linear-gradient(135deg, #000000 0%, #dd0000 100%)' },
  { id: 'por', name: 'Portugal',    flag: '🇵🇹', accent: '#006600', gradient: 'linear-gradient(135deg, #006600 0%, #ff0000 100%)' },
  { id: 'mor', name: 'Morocco',     flag: '🇲🇦', accent: '#c1272d', gradient: 'linear-gradient(135deg, #c1272d 0%, #006233 100%)' },
]
