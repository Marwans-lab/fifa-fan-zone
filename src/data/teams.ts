export interface WorldCupTeam {
  id: string
  name: string
  flag: string
  flagClass: string
  colors: [string, string]
  motto: string
}

export const WORLD_CUP_TEAMS: WorldCupTeam[] = [
  { id: 'ar',     name: 'Argentina',          flag: 'ar',     flagClass: 'ic_nav_flag_Argentina',            colors: ['#1D4E8E', '#54A0D3'], motto: '¡Vamos Argentina!' },
  { id: 'au',     name: 'Australia',           flag: 'au',     flagClass: 'ic_nav_flag_Australia',            colors: ['#012169', '#C8102E'], motto: "C'mon Aussies!" },
  { id: 'at',     name: 'Austria',             flag: 'at',     flagClass: 'ic_nav_flag_Austria',              colors: ['#ED2939', '#1a1a1a'], motto: "Auf geht's Österreich!" },
  { id: 'be',     name: 'Belgium',             flag: 'be',     flagClass: 'ic_nav_flag_Belgium',              colors: ['#1a1400', '#EF3340'], motto: 'Allez les Diables!' },
  { id: 'bo',     name: 'Bolivia',             flag: 'bo',     flagClass: 'ic_nav_flag_Bolivia',              colors: ['#D52B1E', '#007A33'], motto: '¡La Verde!' },
  { id: 'br',     name: 'Brazil',              flag: 'br',     flagClass: 'ic_nav_flag_Brazil',               colors: ['#009C3B', '#002776'], motto: 'Canarinho!' },
  { id: 'cm',     name: 'Cameroon',            flag: 'cm',     flagClass: 'ic_nav_flag_Cameroon',             colors: ['#007A5E', '#CE1126'], motto: 'Lions Indomptables!' },
  { id: 'ca',     name: 'Canada',              flag: 'ca',     flagClass: 'ic_nav_flag_Canada',               colors: ['#C8102E', '#8b0000'], motto: 'On est Canada!' },
  { id: 'co',     name: 'Colombia',            flag: 'co',     flagClass: 'ic_nav_flag_Colombia',             colors: ['#003087', '#FCD116'], motto: '¡Vamos Cafeteros!' },
  { id: 'cr',     name: 'Costa Rica',          flag: 'cr',     flagClass: 'ic_nav_flag_Costa_Rica',           colors: ['#002B7F', '#CE1126'], motto: '¡Vamos La Sele!' },
  { id: 'hr',     name: 'Croatia',             flag: 'hr',     flagClass: 'ic_nav_flag_Croatia',              colors: ['#FF0000', '#003DA5'], motto: 'Hajde, Vatreni!' },
  { id: 'dk',     name: 'Denmark',             flag: 'dk',     flagClass: 'ic_nav_flag_Denmark',              colors: ['#C60C30', '#1a0010'], motto: 'De Rød-Hvide!' },
  { id: 'ec',     name: 'Ecuador',             flag: 'ec',     flagClass: 'ic_nav_flag_Ecuador',              colors: ['#003893', '#FFD100'], motto: '¡La Tri va!' },
  { id: 'eg',     name: 'Egypt',               flag: 'eg',     flagClass: 'ic_nav_flag_Egypt',                colors: ['#CE1126', '#1a1a1a'], motto: 'Yalla El-Pharaohs!' },
  { id: 'gb-eng', name: 'England',             flag: 'gb-eng', flagClass: 'ic_nav_flag_England',              colors: ['#CF142B', '#1C3557'], motto: "It's Coming Home!" },
  { id: 'fr',     name: 'France',              flag: 'fr',     flagClass: 'ic_nav_flag_France',               colors: ['#0055A4', '#EF4135'], motto: 'Allez les Bleus!' },
  { id: 'de',     name: 'Germany',             flag: 'de',     flagClass: 'ic_nav_flag_Germany',              colors: ['#1a1a1a', '#DD0000'], motto: "Auf geht's Deutschland!" },
  { id: 'gh',     name: 'Ghana',               flag: 'gh',     flagClass: 'ic_nav_flag_Ghana',                colors: ['#006B3F', '#FCD116'], motto: 'Black Stars Rise!' },
  { id: 'id',     name: 'Indonesia',           flag: 'id',     flagClass: 'ic_nav_flag_Indonesia',            colors: ['#CE1126', '#F5F5F5'], motto: 'Garuda Muda!' },
  { id: 'ir',     name: 'Iran',                flag: 'ir',     flagClass: 'ic_nav_flag_Iran',                 colors: ['#239F40', '#C8373D'], motto: 'Team Melli!' },
  { id: 'it',     name: 'Italy',               flag: 'it',     flagClass: 'ic_nav_flag_Italy',                colors: ['#009246', '#003DA5'], motto: 'Forza Azzurri!' },
  { id: 'jp',     name: 'Japan',               flag: 'jp',     flagClass: 'ic_nav_flag_Japan',                colors: ['#1a0003', '#BC002D'], motto: 'Ganbare Nippon!' },
  { id: 'mx',     name: 'Mexico',              flag: 'mx',     flagClass: 'ic_nav_flag_Mexico',               colors: ['#006847', '#CE1126'], motto: '¡Arriba México!' },
  { id: 'me',     name: 'Montenegro',          flag: 'me',     flagClass: 'ic_nav_flag_Montenegro',           colors: ['#C2002B', '#D4AF37'], motto: 'Naprijed Crna Gora!' },
  { id: 'ma',     name: 'Morocco',             flag: 'ma',     flagClass: 'ic_nav_flag_Morocco',              colors: ['#C1272D', '#006233'], motto: 'Atlas Lions Roar!' },
  { id: 'nl',     name: 'Netherlands',         flag: 'nl',     flagClass: 'ic_nav_flag_Netherlands',          colors: ['#AE1C28', '#21468B'], motto: 'Hup Holland Hup!' },
  { id: 'nz',     name: 'New Zealand',         flag: 'nz',     flagClass: 'ic_nav_flag_New_Zealand',          colors: ['#00247D', '#CC142B'], motto: 'All Whites!' },
  { id: 'ng',     name: 'Nigeria',             flag: 'ng',     flagClass: 'ic_nav_flag_Nigeria',              colors: ['#008751', '#1a3020'], motto: 'Super Eagles Fly!' },
  { id: 'pa',     name: 'Panama',              flag: 'pa',     flagClass: 'ic_nav_flag_Panama',               colors: ['#DA121A', '#003087'], motto: '¡Arriba El Equipo!' },
  { id: 'py',     name: 'Paraguay',            flag: 'py',     flagClass: 'ic_nav_flag_Paraguay',             colors: ['#D52B1E', '#003DA5'], motto: '¡Pura vida Guaraní!' },
  { id: 'pe',     name: 'Peru',                flag: 'pe',     flagClass: 'ic_nav_flag_Peru',                 colors: ['#D91023', '#890012'], motto: '¡Arriba Perú!' },
  { id: 'pl',     name: 'Poland',              flag: 'pl',     flagClass: 'ic_nav_flag_Poland',               colors: ['#DC143C', '#1a1a1a'], motto: 'Biało-Czerwoni!' },
  { id: 'pt',     name: 'Portugal',            flag: 'pt',     flagClass: 'ic_nav_flag_Portugal',             colors: ['#046A38', '#DA291C'], motto: 'Força Portugal!' },
  { id: 'qa',     name: 'Qatar',               flag: 'qa',     flagClass: 'ic_nav_flag_Qatar',                colors: ['#8D1B3D', '#1a0d17'], motto: 'Yalla Qatar!' },
  { id: 'sa',     name: 'Saudi Arabia',        flag: 'sa',     flagClass: 'ic_nav_flag_Saudi_Arabia',         colors: ['#006C35', '#1a2a1a'], motto: 'Yalla Al-Akhdar!' },
  { id: 'gb-sct', name: 'Scotland',            flag: 'gb-sct', flagClass: 'ic_nav_flag_Scotland',             colors: ['#003DA5', '#005EB8'], motto: "C'mon Scotland!" },
  { id: 'sn',     name: 'Senegal',             flag: 'sn',     flagClass: 'ic_nav_flag_Senegal',              colors: ['#00853F', '#E31B23'], motto: 'Allez les Lions!' },
  { id: 'rs',     name: 'Serbia',              flag: 'rs',     flagClass: 'ic_nav_flag_Serbia',               colors: ['#C6363C', '#0C4076'], motto: 'Napred Srbija!' },
  { id: 'si',     name: 'Slovenia',            flag: 'si',     flagClass: 'ic_nav_flag_Slovenia',             colors: ['#003DA5', '#E8D44D'], motto: 'Naprej Slovenija!' },
  { id: 'kr',     name: 'South Korea',         flag: 'kr',     flagClass: 'ic_nav_flag_South_Korea',          colors: ['#CD2E3A', '#003478'], motto: '대한민국 파이팅!' },
  { id: 'es',     name: 'Spain',               flag: 'es',     flagClass: 'ic_nav_flag_Spain',                colors: ['#AA151B', '#c99600'], motto: '¡A por ellos!' },
  { id: 'ch',     name: 'Switzerland',         flag: 'ch',     flagClass: 'ic_nav_flag_Switzerland',          colors: ['#D52B1E', '#8b0000'], motto: 'Hopp Schwiiz!' },
  { id: 'tt',     name: 'Trinidad and Tobago', flag: 'tt',     flagClass: 'ic_nav_flag_Trinidad_and_Tobago',  colors: ['#CE1126', '#1a1a1a'], motto: 'Soca Warriors!' },
  { id: 'tn',     name: 'Tunisia',             flag: 'tn',     flagClass: 'ic_nav_flag_Tunisia',              colors: ['#E70013', '#8b0000'], motto: 'Yalla Les Aigles!' },
  { id: 'ua',     name: 'Ukraine',             flag: 'ua',     flagClass: 'ic_nav_flag_Ukraine',              colors: ['#005BBB', '#FFD500'], motto: 'Slava Ukraini!' },
  { id: 'us',     name: 'United States',       flag: 'us',     flagClass: 'ic_nav_flag_United_States',        colors: ['#0A3161', '#B31942'], motto: 'United We Play' },
  { id: 'uy',     name: 'Uruguay',             flag: 'uy',     flagClass: 'ic_nav_flag_Uruguay',              colors: ['#0038A8', '#001f6b'], motto: '¡Garra Charrúa!' },
  { id: 'gb-wls', name: 'Wales',               flag: 'gb-wls', flagClass: 'ic_nav_flag_Wales',                colors: ['#C8102E', '#00B140'], motto: 'Oes y Byd!' },
]

export function getTeam(id: string): WorldCupTeam | undefined {
  return WORLD_CUP_TEAMS.find(t => t.id === id)
}
