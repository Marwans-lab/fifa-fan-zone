export interface WorldCupTeam {
  id: string
  name: string
  flag: string
  flagClass: string
  colors: [string, string]
  motto: string
}

export const WORLD_CUP_TEAMS: WorldCupTeam[] = [
  { id: 'dz',     name: 'Algeria',                  flag: 'dz',     flagClass: 'ic-nav-flag-dz', colors: ['#006233', '#FFFFFF'], motto: 'Les Fennecs!' },
  { id: 'ar',     name: 'Argentina',                flag: 'ar',     flagClass: 'ic-nav-flag-ar', colors: ['#1D4E8E', '#54A0D3'], motto: '¡Vamos Argentina!' },
  { id: 'au',     name: 'Australia',                flag: 'au',     flagClass: 'ic-nav-flag-au', colors: ['#012169', '#C8102E'], motto: "C'mon Aussies!" },
  { id: 'at',     name: 'Austria',                  flag: 'at',     flagClass: 'ic-nav-flag-at', colors: ['#ED2939', '#1a1a1a'], motto: "Auf geht's Österreich!" },
  { id: 'be',     name: 'Belgium',                  flag: 'be',     flagClass: 'ic-nav-flag-be', colors: ['#1a1400', '#EF3340'], motto: 'Allez les Diables!' },
  { id: 'ba',     name: 'Bosnia and Herzegovina',   flag: 'ba',     flagClass: 'ic-nav-flag-ba', colors: ['#1D428A', '#FFCD00'], motto: 'Hajmo Zmajevi!' },
  { id: 'br',     name: 'Brazil',                   flag: 'br',     flagClass: 'ic-nav-flag-br', colors: ['#009C3B', '#002776'], motto: 'Canarinho!' },
  { id: 'ca',     name: 'Canada',                   flag: 'ca',     flagClass: 'ic-nav-flag-ca', colors: ['#C8102E', '#8b0000'], motto: 'On est Canada!' },
  { id: 'cv',     name: 'Cape Verde',               flag: 'cv',     flagClass: 'ic-nav-flag-cv', colors: ['#003893', '#CE1126'], motto: 'Os Tubarões Azuis!' },
  { id: 'co',     name: 'Colombia',                 flag: 'co',     flagClass: 'ic-nav-flag-co', colors: ['#003087', '#FCD116'], motto: '¡Vamos Cafeteros!' },
  { id: 'hr',     name: 'Croatia',                  flag: 'hr',     flagClass: 'ic-nav-flag-hr', colors: ['#FF0000', '#003DA5'], motto: 'Hajde, Vatreni!' },
  { id: 'cw',     name: 'Curaçao',                  flag: 'cw',     flagClass: 'ic-nav-flag-cw', colors: ['#003893', '#F9DC00'], motto: 'Bou Kuraso!' },
  { id: 'cz',     name: 'Czechia',                  flag: 'cz',     flagClass: 'ic-nav-flag-cz', colors: ['#11457E', '#D7141A'], motto: 'Hej Češi!' },
  { id: 'cd',     name: 'DR Congo',                 flag: 'cd',     flagClass: 'ic-nav-flag-cd', colors: ['#007FFF', '#F7D618'], motto: 'Les Léopards!' },
  { id: 'ec',     name: 'Ecuador',                  flag: 'ec',     flagClass: 'ic-nav-flag-ec', colors: ['#003893', '#FFD100'], motto: '¡La Tri va!' },
  { id: 'eg',     name: 'Egypt',                    flag: 'eg',     flagClass: 'ic-nav-flag-eg', colors: ['#CE1126', '#1a1a1a'], motto: 'Yalla El-Pharaohs!' },
  { id: 'gb-eng', name: 'England',                  flag: 'gb',     flagClass: 'ic-nav-flag-gb', colors: ['#CF142B', '#1C3557'], motto: "It's Coming Home!" },
  { id: 'fr',     name: 'France',                   flag: 'fr',     flagClass: 'ic-nav-flag-fr', colors: ['#0055A4', '#EF4135'], motto: 'Allez les Bleus!' },
  { id: 'de',     name: 'Germany',                  flag: 'de',     flagClass: 'ic-nav-flag-de', colors: ['#1a1a1a', '#DD0000'], motto: "Auf geht's Deutschland!" },
  { id: 'gh',     name: 'Ghana',                    flag: 'gh',     flagClass: 'ic-nav-flag-gh', colors: ['#006B3F', '#FCD116'], motto: 'Black Stars Rise!' },
  { id: 'ht',     name: 'Haiti',                    flag: 'ht',     flagClass: 'ic-nav-flag-ht', colors: ['#00209F', '#D21034'], motto: 'Les Grenadiers!' },
  { id: 'ir',     name: 'Iran',                     flag: 'ir',     flagClass: 'ic-nav-flag-ir', colors: ['#239F40', '#C8373D'], motto: 'Team Melli!' },
  { id: 'iq',     name: 'Iraq',                     flag: 'iq',     flagClass: 'ic-nav-flag-iq', colors: ['#CE1126', '#000000'], motto: 'Yalla Al-Usood!' },
  { id: 'ci',     name: 'Ivory Coast',              flag: 'ci',     flagClass: 'ic-nav-flag-ci', colors: ['#F77F00', '#009A44'], motto: 'Les Éléphants!' },
  { id: 'jp',     name: 'Japan',                    flag: 'jp',     flagClass: 'ic-nav-flag-jp', colors: ['#1a0003', '#BC002D'], motto: 'Ganbare Nippon!' },
  { id: 'jo',     name: 'Jordan',                   flag: 'jo',     flagClass: 'ic-nav-flag-jo', colors: ['#000000', '#007A3D'], motto: 'Yalla Al-Nash!' },
  { id: 'mx',     name: 'Mexico',                   flag: 'mx',     flagClass: 'ic-nav-flag-mx', colors: ['#006847', '#CE1126'], motto: '¡Arriba México!' },
  { id: 'ma',     name: 'Morocco',                  flag: 'ma',     flagClass: 'ic-nav-flag-ma', colors: ['#C1272D', '#006233'], motto: 'Atlas Lions Roar!' },
  { id: 'nl',     name: 'Netherlands',              flag: 'nl',     flagClass: 'ic-nav-flag-nl', colors: ['#AE1C28', '#21468B'], motto: 'Hup Holland Hup!' },
  { id: 'nz',     name: 'New Zealand',              flag: 'nz',     flagClass: 'ic-nav-flag-nz', colors: ['#00247D', '#CC142B'], motto: 'All Whites!' },
  { id: 'no',     name: 'Norway',                   flag: 'no',     flagClass: 'ic-nav-flag-no', colors: ['#EF2B2D', '#002868'], motto: 'Heia Norge!' },
  { id: 'pa',     name: 'Panama',                   flag: 'pa',     flagClass: 'ic-nav-flag-pa', colors: ['#DA121A', '#003087'], motto: '¡Arriba El Equipo!' },
  { id: 'py',     name: 'Paraguay',                 flag: 'py',     flagClass: 'ic-nav-flag-py', colors: ['#D52B1E', '#003DA5'], motto: '¡Pura vida Guaraní!' },
  { id: 'pt',     name: 'Portugal',                 flag: 'pt',     flagClass: 'ic-nav-flag-pt', colors: ['#046A38', '#DA291C'], motto: 'Força Portugal!' },
  { id: 'qa',     name: 'Qatar',                    flag: 'qa',     flagClass: 'ic-nav-flag-qa', colors: ['#8D1B3D', '#1a0d17'], motto: 'Yalla Qatar!' },
  { id: 'sa',     name: 'Saudi Arabia',             flag: 'sa',     flagClass: 'ic-nav-flag-sa', colors: ['#006C35', '#1a2a1a'], motto: 'Yalla Al-Akhdar!' },
  { id: 'gb-sct', name: 'Scotland',                 flag: 'gb',     flagClass: 'ic-nav-flag-gb', colors: ['#003DA5', '#005EB8'], motto: "C'mon Scotland!" },
  { id: 'sn',     name: 'Senegal',                  flag: 'sn',     flagClass: 'ic-nav-flag-sn', colors: ['#00853F', '#E31B23'], motto: 'Allez les Lions!' },
  { id: 'za',     name: 'South Africa',             flag: 'za',     flagClass: 'ic-nav-flag-za', colors: ['#007A4D', '#001489'], motto: 'Bafana Bafana!' },
  { id: 'kr',     name: 'South Korea',              flag: 'kr',     flagClass: 'ic-nav-flag-kr', colors: ['#CD2E3A', '#003478'], motto: '대한민국 파이팅!' },
  { id: 'es',     name: 'Spain',                    flag: 'es',     flagClass: 'ic-nav-flag-es', colors: ['#AA151B', '#c99600'], motto: '¡A por ellos!' },
  { id: 'se',     name: 'Sweden',                   flag: 'se',     flagClass: 'ic-nav-flag-se', colors: ['#006AA7', '#FECC02'], motto: 'Heja Sverige!' },
  { id: 'ch',     name: 'Switzerland',              flag: 'ch',     flagClass: 'ic-nav-flag-ch', colors: ['#D52B1E', '#8b0000'], motto: 'Hopp Schwiiz!' },
  { id: 'tn',     name: 'Tunisia',                  flag: 'tn',     flagClass: 'ic-nav-flag-tn', colors: ['#E70013', '#8b0000'], motto: 'Yalla Les Aigles!' },
  { id: 'tr',     name: 'Türkiye',                  flag: 'tr',     flagClass: 'ic-nav-flag-tr', colors: ['#E30A17', '#FFFFFF'], motto: 'Hadi Türkiye!' },
  { id: 'us',     name: 'United States',            flag: 'us',     flagClass: 'ic-nav-flag-us', colors: ['#0A3161', '#B31942'], motto: 'United We Play' },
  { id: 'uy',     name: 'Uruguay',                  flag: 'uy',     flagClass: 'ic-nav-flag-uy', colors: ['#0038A8', '#001f6b'], motto: '¡Garra Charrúa!' },
  { id: 'uz',     name: 'Uzbekistan',               flag: 'uz',     flagClass: 'ic-nav-flag-uz', colors: ['#00AAAD', '#1EB53A'], motto: 'Hujum!' },
]

export function getTeam(id: string): WorldCupTeam | undefined {
  return WORLD_CUP_TEAMS.find(t => t.id === id)
}
