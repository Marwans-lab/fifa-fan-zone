export interface WorldCupTeam {
  id: string
  name: string
  flag: string
  colors: [string, string]
  motto: string
}

export const WORLD_CUP_TEAMS: WorldCupTeam[] = [
  // Hosts
  { id: 'usa', name: 'United States',  flag: '🇺🇸', colors: ['#0A3161', '#B31942'], motto: 'United We Play' },
  { id: 'can', name: 'Canada',          flag: '🇨🇦', colors: ['#C8102E', '#8b0000'], motto: 'On est Canada!' },
  { id: 'mex', name: 'Mexico',          flag: '🇲🇽', colors: ['#006847', '#CE1126'], motto: '¡Arriba México!' },
  // South America
  { id: 'arg', name: 'Argentina',       flag: '🇦🇷', colors: ['#1D4E8E', '#54A0D3'], motto: '¡Vamos Argentina!' },
  { id: 'bra', name: 'Brazil',          flag: '🇧🇷', colors: ['#009C3B', '#002776'], motto: 'Canarinho!' },
  { id: 'uru', name: 'Uruguay',         flag: '🇺🇾', colors: ['#0038A8', '#001f6b'], motto: '¡Garra Charrúa!' },
  { id: 'col', name: 'Colombia',        flag: '🇨🇴', colors: ['#003087', '#FCD116'], motto: '¡Vamos Cafeteros!' },
  { id: 'ecu', name: 'Ecuador',         flag: '🇪🇨', colors: ['#003893', '#FFD100'], motto: '¡La Tri va!' },
  { id: 'par', name: 'Paraguay',        flag: '🇵🇾', colors: ['#D52B1E', '#003DA5'], motto: '¡Pura vida Guaraní!' },
  { id: 'chi', name: 'Chile',           flag: '🇨🇱', colors: ['#D52B1E', '#003DA5'], motto: '¡Vamos la Roja!' },
  { id: 'ven', name: 'Venezuela',       flag: '🇻🇪', colors: ['#CF142B', '#003893'], motto: '¡La Vinotinto!' },
  { id: 'per', name: 'Peru',            flag: '🇵🇪', colors: ['#D91023', '#890012'], motto: '¡Arriba Perú!' },
  { id: 'bol', name: 'Bolivia',         flag: '🇧🇴', colors: ['#D52B1E', '#007A33'], motto: '¡La Verde!' },
  // Europe
  { id: 'fra', name: 'France',          flag: '🇫🇷', colors: ['#0055A4', '#EF4135'], motto: 'Allez les Bleus!' },
  { id: 'eng', name: 'England',         flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', colors: ['#CF142B', '#1C3557'], motto: 'It\'s Coming Home!' },
  { id: 'ger', name: 'Germany',         flag: '🇩🇪', colors: ['#1a1a1a', '#DD0000'], motto: 'Auf geht\'s Deutschland!' },
  { id: 'esp', name: 'Spain',           flag: '🇪🇸', colors: ['#AA151B', '#c99600'], motto: '¡A por ellos!' },
  { id: 'por', name: 'Portugal',        flag: '🇵🇹', colors: ['#046A38', '#DA291C'], motto: 'Força Portugal!' },
  { id: 'ned', name: 'Netherlands',     flag: '🇳🇱', colors: ['#AE1C28', '#21468B'], motto: 'Hup Holland Hup!' },
  { id: 'bel', name: 'Belgium',         flag: '🇧🇪', colors: ['#1a1400', '#EF3340'], motto: 'Allez les Diables!' },
  { id: 'ita', name: 'Italy',           flag: '🇮🇹', colors: ['#009246', '#003DA5'], motto: 'Forza Azzurri!' },
  { id: 'den', name: 'Denmark',         flag: '🇩🇰', colors: ['#C60C30', '#1a0010'], motto: 'De Rød-Hvide!' },
  { id: 'sui', name: 'Switzerland',     flag: '🇨🇭', colors: ['#D52B1E', '#8b0000'], motto: 'Hopp Schwiiz!' },
  { id: 'aut', name: 'Austria',         flag: '🇦🇹', colors: ['#ED2939', '#1a1a1a'], motto: 'Auf geht\'s Österreich!' },
  { id: 'cro', name: 'Croatia',         flag: '🇭🇷', colors: ['#FF0000', '#003DA5'], motto: 'Hajde, Vatreni!' },
  { id: 'ser', name: 'Serbia',          flag: '🇷🇸', colors: ['#C6363C', '#0C4076'], motto: 'Napred Srbija!' },
  { id: 'pol', name: 'Poland',          flag: '🇵🇱', colors: ['#DC143C', '#1a1a1a'], motto: 'Biało-Czerwoni!' },
  { id: 'tur', name: 'Turkey',          flag: '🇹🇷', colors: ['#E30A17', '#1a0a0a'], motto: 'Haydi Türkiye!' },
  { id: 'sco', name: 'Scotland',        flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', colors: ['#003DA5', '#005EB8'], motto: 'C\'mon Scotland!' },
  { id: 'nor', name: 'Norway',          flag: '🇳🇴', colors: ['#EF2B2D', '#003680'], motto: 'Heia Norge!' },
  { id: 'swe', name: 'Sweden',          flag: '🇸🇪', colors: ['#006AA7', '#FECC02'], motto: 'Allez Sverige!' },
  { id: 'ukr', name: 'Ukraine',         flag: '🇺🇦', colors: ['#005BBB', '#FFD500'], motto: 'Slava Ukraini!' },
  { id: 'rom', name: 'Romania',         flag: '🇷🇴', colors: ['#002B7F', '#CE1126'], motto: 'Hai România!' },
  { id: 'hun', name: 'Hungary',         flag: '🇭🇺', colors: ['#CE2939', '#436F4D'], motto: 'Hajrá Magyar!' },
  // Asia
  { id: 'jpn', name: 'Japan',           flag: '🇯🇵', colors: ['#1a0003', '#BC002D'], motto: 'Ganbare Nippon!' },
  { id: 'kor', name: 'South Korea',     flag: '🇰🇷', colors: ['#CD2E3A', '#003478'], motto: '대한민국 파이팅!' },
  { id: 'irn', name: 'Iran',            flag: '🇮🇷', colors: ['#239F40', '#C8373D'], motto: 'Team Melli!' },
  { id: 'aus', name: 'Australia',       flag: '🇦🇺', colors: ['#012169', '#C8102E'], motto: 'C\'mon Aussies!' },
  { id: 'sau', name: 'Saudi Arabia',    flag: '🇸🇦', colors: ['#006C35', '#1a2a1a'], motto: 'Yalla Al-Akhdar!' },
  { id: 'qat', name: 'Qatar',           flag: '🇶🇦', colors: ['#8D1B3D', '#1a0d17'], motto: 'Yalla Qatar!' },
  { id: 'irq', name: 'Iraq',            flag: '🇮🇶', colors: ['#CE1126', '#007A3D'], motto: 'Yalla Al-Usood!' },
  { id: 'jor', name: 'Jordan',          flag: '🇯🇴', colors: ['#007A3D', '#CE1126'], motto: 'Yalla Al-Nashama!' },
  // Africa
  { id: 'mar', name: 'Morocco',         flag: '🇲🇦', colors: ['#C1272D', '#006233'], motto: 'Atlas Lions Roar!' },
  { id: 'sen', name: 'Senegal',         flag: '🇸🇳', colors: ['#00853F', '#E31B23'], motto: 'Allez les Lions!' },
  { id: 'nga', name: 'Nigeria',         flag: '🇳🇬', colors: ['#008751', '#1a3020'], motto: 'Super Eagles Fly!' },
  { id: 'egy', name: 'Egypt',           flag: '🇪🇬', colors: ['#CE1126', '#1a1a1a'], motto: 'Yalla El-Pharaohs!' },
  { id: 'cmr', name: 'Cameroon',        flag: '🇨🇲', colors: ['#007A5E', '#CE1126'], motto: 'Lions Indomptables!' },
  { id: 'gha', name: 'Ghana',           flag: '🇬🇭', colors: ['#006B3F', '#FCD116'], motto: 'Black Stars Rise!' },
  { id: 'civ', name: 'Ivory Coast',     flag: '🇨🇮', colors: ['#F77F00', '#009A44'], motto: 'Allez les Éléphants!' },
  { id: 'zaf', name: 'South Africa',    flag: '🇿🇦', colors: ['#007A4D', '#FFB81C'], motto: 'Bafana Bafana!' },
  { id: 'tun', name: 'Tunisia',         flag: '🇹🇳', colors: ['#E70013', '#8b0000'], motto: 'Yalla Les Aigles!' },
  { id: 'alg', name: 'Algeria',         flag: '🇩🇿', colors: ['#006233', '#D21034'], motto: '1, 2, 3 Viva l\'Algérie!' },
  // CONCACAF
  { id: 'crc', name: 'Costa Rica',      flag: '🇨🇷', colors: ['#002B7F', '#CE1126'], motto: '¡Vamos La Sele!' },
  { id: 'pan', name: 'Panama',          flag: '🇵🇦', colors: ['#DA121A', '#003087'], motto: '¡Arriba El Equipo!' },
  { id: 'jam', name: 'Jamaica',         flag: '🇯🇲', colors: ['#000000', '#FED100'], motto: 'Reggae Boyz!' },
  { id: 'hnd', name: 'Honduras',        flag: '🇭🇳', colors: ['#0073CF', '#003087'], motto: '¡Vamos Catrachos!' },
]

export function getTeam(id: string): WorldCupTeam | undefined {
  return WORLD_CUP_TEAMS.find(t => t.id === id)
}
