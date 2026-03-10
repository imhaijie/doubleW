import { Role, Team } from './types'

// 身份对应的阵营
export const ROLE_TO_TEAM: Record<Role, Team> = {
  werewolf: 'werewolf',
  white_wolf_king: 'werewolf',
  villager: 'good',
  seer: 'good',
  witch: 'good',
  hunter: 'good',
  guard: 'good',
}

// 身份的中文名称
export const ROLE_NAMES: Record<Role, string> = {
  werewolf: '狼人',
  white_wolf_king: '白狼王',
  villager: '平民',
  seer: '预言家',
  witch: '女巫',
  hunter: '猎人',
  guard: '守卫',
}

// 神职身份列表（用于判定"所有神职均已死亡"的胜利条件）
export const SPECIAL_ROLES: Role[] = ['seer', 'witch', 'hunter', 'guard', 'white_wolf_king']

// 技能持续时间选项（秒）
export const SKILL_DURATIONS = [15, 20, 30] as const

// 发言时长选项（秒）
export const SPEECH_DURATIONS = [300, 600, 900] as const // 5min, 10min, 15min

// 投票时长选项（秒）
export const VOTE_DURATIONS = [60, 120, null] as const // 1min, 2min, 无限

// 最小玩家数（根据角色池计算）
export function getMinPlayers(totalRoles: number): number {
  return Math.ceil(totalRoles / 2)
}

// 金水宝宝判定：两个身份都是平民
export function isGoldWater(firstRole: Role, secondRole: Role): boolean {
  return firstRole === 'villager' && secondRole === 'villager'
}

// 检查是否所有神职身份都已死亡
// 遍历所有玩家，如果某个神职身份在任何玩家中都已死亡，则为 true
export function areAllSpecialRolesDead(
  players: Array<{ firstRole: Role; firstRoleAlive: boolean; secondRole: Role; secondRoleAlive: boolean }>
): boolean {
  for (const role of SPECIAL_ROLES) {
    const roleDead = !players.some(p => 
      (p.firstRole === role && p.firstRoleAlive) || 
      (p.secondRole === role && p.secondRoleAlive)
    )
    if (roleDead) return true
  }
  return false
}

// 检查是否所有金水宝宝都死了
export function areAllGoldWaterDead(
  players: Array<{ firstRole: Role; secondRole: Role; isAlive: boolean }>
): boolean {
  return !players.some(p => isGoldWater(p.firstRole, p.secondRole) && p.isAlive)
}

// 判断游戏是否结束及胜者
export function checkGameEnd(
  players: Array<{ firstRole: Role; firstRoleAlive: boolean; secondRole: Role; secondRoleAlive: boolean; isAlive: boolean }>
): { isEnd: boolean; winner?: Team } {
  const aliveWolves = players.filter(p => 
    ((p.firstRole === 'werewolf' || p.firstRole === 'white_wolf_king') && p.firstRoleAlive) ||
    ((p.secondRole === 'werewolf' || p.secondRole === 'white_wolf_king') && p.secondRoleAlive)
  )

  // 所有狼人身份都死了 → 好人赢
  if (aliveWolves.length === 0) {
    return { isEnd: true, winner: 'good' }
  }

  // 所有金水宝宝死了 → 狼人赢
  if (areAllGoldWaterDead(players)) {
    return { isEnd: true, winner: 'werewolf' }
  }

  // 所有神职身份都死了 → 狼人赢
  if (areAllSpecialRolesDead(players)) {
    return { isEnd: true, winner: 'werewolf' }
  }

  return { isEnd: false }
}
