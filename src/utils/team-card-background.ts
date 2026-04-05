import { getTeam } from '../data/teams';

const TEAM_BG_IMAGES: Record<string, string> = {
  dz:     'assets/images/Team-backgrounds/Algeria.png',
  ar:     'assets/images/Team-backgrounds/Argentina.png',
  au:     'assets/images/Team-backgrounds/Australia.png',
  at:     'assets/images/Team-backgrounds/Austria.png',
  be:     'assets/images/Team-backgrounds/Belgium.png',
  ba:     'assets/images/Team-backgrounds/Bosnia_and_Herzegovina.png',
  br:     'assets/images/Team-backgrounds/Brazil.png',
  ca:     'assets/images/Team-backgrounds/Canada.png',
  cv:     'assets/images/Team-backgrounds/Cape_Verde.png',
  co:     'assets/images/Team-backgrounds/Colombia.png',
  hr:     'assets/images/Team-backgrounds/Croatia.png',
  cw:     'assets/images/Team-backgrounds/Curacao.png',
  cz:     'assets/images/Team-backgrounds/Czechia.png',
  cd:     'assets/images/Team-backgrounds/DR_Congo.png',
  ec:     'assets/images/Team-backgrounds/Ecuador.png',
  eg:     'assets/images/Team-backgrounds/Egypt.png',
  'gb-eng': 'assets/images/Team-backgrounds/England.png',
  fr:     'assets/images/Team-backgrounds/France.png',
  de:     'assets/images/Team-backgrounds/Germany.png',
  gh:     'assets/images/Team-backgrounds/Ghana.png',
  ht:     'assets/images/Team-backgrounds/Haiti.png',
  ir:     'assets/images/Team-backgrounds/Iran.png',
  iq:     'assets/images/Team-backgrounds/Iraq.png',
  ci:     'assets/images/Team-backgrounds/Ivory_Coast.png',
  jp:     'assets/images/Team-backgrounds/Japan.png',
  jo:     'assets/images/Team-backgrounds/Jordan.png',
  mx:     'assets/images/Team-backgrounds/Mexico.png',
  ma:     'assets/images/Team-backgrounds/Morocco.png',
  nl:     'assets/images/Team-backgrounds/Netherlands.png',
  nz:     'assets/images/Team-backgrounds/New_Zealand.png',
  no:     'assets/images/Team-backgrounds/Norway.png',
  pa:     'assets/images/Team-backgrounds/Panama.png',
  py:     'assets/images/Team-backgrounds/Paraguay.png',
  pt:     'assets/images/Team-backgrounds/Portugal.png',
  qa:     'assets/images/Team-backgrounds/Qatar.png',
  sa:     'assets/images/Team-backgrounds/Saudi_Arabia.png',
  'gb-sct': 'assets/images/Team-backgrounds/Scotland.png',
  sn:     'assets/images/Team-backgrounds/Senegal.png',
  za:     'assets/images/Team-backgrounds/South_Africa.png',
  kr:     'assets/images/Team-backgrounds/South_Korea.png',
  es:     'assets/images/Team-backgrounds/Spain.png',
  se:     'assets/images/Team-backgrounds/Sweden.png',
  ch:     'assets/images/Team-backgrounds/Switzerland.png',
  tn:     'assets/images/Team-backgrounds/Tunisia.png',
  tr:     'assets/images/Team-backgrounds/Turkiye.png',
  us:     'assets/images/Team-backgrounds/United_States.png',
  uy:     'assets/images/Team-backgrounds/Uruguay.png',
  uz:     'assets/images/Team-backgrounds/Uzbekistan.png',
};

export function getTeamCardBackground(teamId: string | null | undefined): string {
  if (!teamId) {
    return 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)';
  }

  if (TEAM_BG_IMAGES[teamId]) {
    return `url(${TEAM_BG_IMAGES[teamId]})`;
  }

  const team = getTeam(teamId);
  if (team) {
    return `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`;
  }

  return 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)';
}
