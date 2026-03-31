import { getTeam } from '../../data/teams'
import teamBgAlgeria from '../../assets/images/Team-backgrounds/Algeria.png'
import teamBgFrance from '../../assets/images/Team-backgrounds/France.png'

const TEAM_BG_IMAGES: Record<string, string> = {
  alg: teamBgAlgeria,
  fra: teamBgFrance,
}

export function getTeamCardBackground(teamId: string | null | undefined): string {
  if (!teamId) {
    return 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)'
  }

  if (TEAM_BG_IMAGES[teamId]) {
    return `url(${TEAM_BG_IMAGES[teamId]})`
  }

  const team = getTeam(teamId)
  if (team) {
    return `linear-gradient(160deg, ${team.colors[0]} 0%, ${team.colors[1]} 100%)`
  }

  return 'linear-gradient(160deg, var(--c-card-gradient-1) 0%, var(--c-card-gradient-2) 50%, var(--c-card-gradient-3) 100%)'
}
