export interface WorldCupTeam {
  id: string
  name: string
  flag: string
  colors: [string, string]
}

export const WORLD_CUP_TEAMS: WorldCupTeam[] = [
  // Hosts
  { id: 'usa', name: 'United States',  flag: '🇺🇸', colors: ['#0A3161', '#B31942'] },
  { id: 'can', name: 'Canada',          flag: '🇨🇦', colors: ['#C8102E', '#8b0000'] },
  { id: 'mex', name: 'Mexico',          flag: '🇲🇽', colors: ['#006847', '#CE1126'] },
  // South America
  { id: 'arg', name: 'Argentina',       flag: '🇦🇷', colors: ['#1D4E8E', '#54A0D3'] },
  { id: 'bra', name: 'Brazil',          flag: '🇧🇷', colors: ['#009C3B', '#002776'] },
  { id: 'uru', name: 'Uruguay',         flag: '🇺🇾', colors: ['#0038A8', '#001f6b'] },
  { id: 'col', name: 'Colombia',        flag: '🇨🇴', colors: ['#003087', '#FCD116'] },
  { id: 'ecu', name: 'Ecuador',         flag: '🇪🇨', colors: ['#003893', '#FFD100'] },
  { id: 'par', name: 'Paraguay',        flag: '🇵🇾', colors: ['#D52B1E', '#003DA5'] },
  { id: 'chi', name: 'Chile',           flag: '🇨🇱', colors: ['#D52B1E', '#003DA5'] },
  { id: 'ven', name: 'Venezuela',       flag: '🇻🇪', colors: ['#CF142B', '#003893'] },
  { id: 'per', name: 'Peru',            flag: '🇵🇪', colors: ['#D91023', '#890012'] },
  { id: 'bol', name: 'Bolivia',         flag: '🇧🇴', colors: ['#D52B1E', '#007A33'] },
  // Europe
  { id: 'fra', name: 'France',          flag: '🇫🇷', colors: ['#0055A4', '#EF4135'] },
  { id: 'eng', name: 'England',         flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', colors: ['#CF142B', '#1C3557'] },
  { id: 'ger', name: 'Germany',         flag: '🇩🇪', colors: ['#1a1a1a', '#DD0000'] },
  { id: 'esp', name: 'Spain',           flag: '🇪🇸', colors: ['#AA151B', '#c99600'] },
  { id: 'por', name: 'Portugal',        flag: '🇵🇹', colors: ['#046A38', '#DA291C'] },
  { id: 'ned', name: 'Netherlands',     flag: '🇳🇱', colors: ['#AE1C28', '#21468B'] },
  { id: 'bel', name: 'Belgium',         flag: '🇧🇪', colors: ['#1a1400', '#EF3340'] },
  { id: 'ita', name: 'Italy',           flag: '🇮🇹', colors: ['#009246', '#003DA5'] },
  { id: 'den', name: 'Denmark',         flag: '🇩🇰', colors: ['#C60C30', '#1a0010'] },
  { id: 'sui', name: 'Switzerland',     flag: '🇨🇭', colors: ['#D52B1E', '#8b0000'] },
  { id: 'aut', name: 'Austria',         flag: '🇦🇹', colors: ['#ED2939', '#1a1a1a'] },
  { id: 'cro', name: 'Croatia',         flag: '🇭🇷', colors: ['#FF0000', '#003DA5'] },
  { id: 'ser', name: 'Serbia',          flag: '🇷🇸', colors: ['#C6363C', '#0C4076'] },
  { id: 'pol', name: 'Poland',          flag: '🇵🇱', colors: ['#DC143C', '#1a1a1a'] },
  { id: 'tur', name: 'Turkey',          flag: '🇹🇷', colors: ['#E30A17', '#1a0a0a'] },
  { id: 'sco', name: 'Scotland',        flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', colors: ['#003DA5', '#005EB8'] },
  { id: 'nor', name: 'Norway',          flag: '🇳🇴', colors: ['#EF2B2D', '#003680'] },
  { id: 'swe', name: 'Sweden',          flag: '🇸🇪', colors: ['#006AA7', '#FECC02'] },
  { id: 'ukr', name: 'Ukraine',         flag: '🇺🇦', colors: ['#005BBB', '#FFD500'] },
  { id: 'rom', name: 'Romania',         flag: '🇷🇴', colors: ['#002B7F', '#CE1126'] },
  { id: 'hun', name: 'Hungary',         flag: '🇭🇺', colors: ['#CE2939', '#436F4D'] },
  // Asia
  { id: 'jpn', name: 'Japan',           flag: '🇯🇵', colors: ['#1a0003', '#BC002D'] },
  { id: 'kor', name: 'South Korea',     flag: '🇰🇷', colors: ['#CD2E3A', '#003478'] },
  { id: 'irn', name: 'Iran',            flag: '🇮🇷', colors: ['#239F40', '#C8373D'] },
  { id: 'aus', name: 'Australia',       flag: '🇦🇺', colors: ['#012169', '#C8102E'] },
  { id: 'sau', name: 'Saudi Arabia',    flag: '🇸🇦', colors: ['#006C35', '#1a2a1a'] },
  { id: 'qat', name: 'Qatar',           flag: '🇶🇦', colors: ['#8D1B3D', '#1a0d17'] },
  { id: 'irq', name: 'Iraq',            flag: '🇮🇶', colors: ['#CE1126', '#007A3D'] },
  { id: 'jor', name: 'Jordan',          flag: '🇯🇴', colors: ['#007A3D', '#CE1126'] },
  // Africa
  { id: 'mar', name: 'Morocco',         flag: '🇲🇦', colors: ['#C1272D', '#006233'] },
  { id: 'sen', name: 'Senegal',         flag: '🇸🇳', colors: ['#00853F', '#E31B23'] },
  { id: 'nga', name: 'Nigeria',         flag: '🇳🇬', colors: ['#008751', '#1a3020'] },
  { id: 'egy', name: 'Egypt',           flag: '🇪🇬', colors: ['#CE1126', '#1a1a1a'] },
  { id: 'cmr', name: 'Cameroon',        flag: '🇨🇲', colors: ['#007A5E', '#CE1126'] },
  { id: 'gha', name: 'Ghana',           flag: '🇬🇭', colors: ['#006B3F', '#FCD116'] },
  { id: 'civ', name: 'Ivory Coast',     flag: '🇨🇮', colors: ['#F77F00', '#009A44'] },
  { id: 'zaf', name: 'South Africa',    flag: '🇿🇦', colors: ['#007A4D', '#FFB81C'] },
  { id: 'tun', name: 'Tunisia',         flag: '🇹🇳', colors: ['#E70013', '#8b0000'] },
  { id: 'alg', name: 'Algeria',         flag: '🇩🇿', colors: ['#006233', '#D21034'] },
  // CONCACAF
  { id: 'crc', name: 'Costa Rica',      flag: '🇨🇷', colors: ['#002B7F', '#CE1126'] },
  { id: 'pan', name: 'Panama',          flag: '🇵🇦', colors: ['#DA121A', '#003087'] },
  { id: 'jam', name: 'Jamaica',         flag: '🇯🇲', colors: ['#000000', '#FED100'] },
  { id: 'hnd', name: 'Honduras',        flag: '🇭🇳', colors: ['#0073CF', '#003087'] },
]

export function getTeam(id: string): WorldCupTeam | undefined {
  return WORLD_CUP_TEAMS.find(t => t.id === id)
}
