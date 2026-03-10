import { GameRoom, Player, GameAction, GamePhase, GameLogEntry, Role } from "./types"
import { ROLE_TO_TEAM, SPECIAL_ROLES, checkGameEnd, areAllGoldWaterDead, areAllSpecialRolesDead } from "./constants"

export class GameEngine {
  /**
   * 初始化游戏房间
   */
  static initializeGame(room: GameRoom): void {
    room.nightRound = 0
    room.dayRound = 0
    room.currentPhase = 'assign_roles'
    room.gameLog = []
    room.currentNightData = {
      werewolfTargets: new Map(),
      deathList: [],
    }
    room.currentDayData = {
      deadByNight: [],
      speakingOrder: [],
      currentSpeaker: 0,
      voteList: new Map(),
    }
  }

  /**
   * 分配身份给玩家
   */
  static assignRoles(room: GameRoom): void {
    const players = room.players
    const { werewolves, villagers, seers, witches, hunters, guards, whiteWolfKings } = room.roleConfig

    const roles: Role[] = [
      ...Array(werewolves).fill('werewolf'),
      ...Array(villagers).fill('villager'),
      ...Array(seers).fill('seer'),
      ...Array(witches).fill('witch'),
      ...Array(hunters).fill('hunter'),
      ...Array(guards).fill('guard'),
      ...Array(whiteWolfKings).fill('white_wolf_king'),
    ]

    // 打乱顺序
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]]
    }

    // 分配第一身份
    for (let i = 0; i < players.length; i++) {
      players[i].firstRole = roles[i]
      players[i].firstRoleAlive = true
    }

    // 分配第二身份（从剩余的第二半开始）
    for (let i = 0; i < players.length; i++) {
      const secondIdx = players.length + i
      if (secondIdx < roles.length) {
        players[i].secondRole = roles[secondIdx]
      } else {
        // 不足的话补平民
        players[i].secondRole = 'villager'
      }
      players[i].secondRoleAlive = true
    }

    // 初始化当前生效身份
    for (const player of players) {
      player.currentRole = player.firstRole
      player.isAlive = true
    }
  }

  /**
   * 记录日志 - 仅记录主持人会说的话
   */
  static addLog(room: GameRoom, message: string): void {
    const round = room.currentPhase.includes('night') ? room.nightRound : room.dayRound
    const type = room.currentPhase.includes('night') ? 'night' : 'day'
    
    const entry: GameLogEntry = {
      round,
      type,
      message,
      timestamp: new Date().toISOString(),
    }
    
    room.gameLog.push(entry)
  }

  /**
   * 处理夜晚狼人杀人
   */
  static processNightWerewolf(room: GameRoom, actions: GameAction[]): void {
    room.currentNightData.werewolfTargets.clear()
    
    for (const action of actions) {
      if (action.type === 'werewolf_kill' && action.targets) {
        room.currentNightData.werewolfTargets.set(action.playerId, action.targets)
      }
    }
  }

  /**
   * 处理夜晚预言家查验
   */
  static processNightSeer(room: GameRoom, action: GameAction): void {
    if (action.type === 'seer_check' && action.target !== undefined) {
      room.currentNightData.seerTarget = action.target
      
      const targetPlayer = room.players.find(p => p.playerId === action.target)
      if (targetPlayer) {
        const currentRole = targetPlayer.firstRoleAlive ? targetPlayer.firstRole : targetPlayer.secondRole
        const team = ROLE_TO_TEAM[currentRole]
        room.currentNightData.seerResult = team === 'werewolf' ? 'werewolf' : 'good'
      }
    }
  }

  /**
   * 处理夜晚女巫操作
   */
  static processNightWitch(room: GameRoom, actions: GameAction[]): void {
    for (const action of actions) {
      if (action.type === 'witch_save' && action.target !== undefined) {
        room.currentNightData.witchSaved = action.target
      }
      if (action.type === 'witch_poison' && action.target !== undefined) {
        room.currentNightData.witchPoisoned = action.target
      }
    }
  }

  /**
   * 处理夜晚守卫保护
   */
  static processNightGuard(room: GameRoom, action: GameAction): void {
    if (action.type === 'guard_protect' && action.target !== undefined) {
      room.currentNightData.guardTarget = action.target
    }
  }

  /**
   * 计算夜晚死亡名单
   */
  static calculateNightDeaths(room: GameRoom): number[] {
    const deathSet = new Set<number>()
    
    // 1. 狼人刀掉的
    for (const [_, targets] of room.currentNightData.werewolfTargets) {
      for (const target of targets) {
        if (room.currentNightData.guardTarget !== target) {
          deathSet.add(target)
        }
      }
    }

    // 2. 如果多个狼人刀同一个人，视为一刀
    // （已通过 deathSet 自动去重）

    // 3. 女巫救援 - 移除救援的目标
    if (room.currentNightData.witchSaved !== undefined) {
      deathSet.delete(room.currentNightData.witchSaved)
    }

    // 4. 女巫毒杀 - 添加毒杀的目标
    if (room.currentNightData.witchPoisoned !== undefined) {
      deathSet.add(room.currentNightData.witchPoisoned)
    }

    return Array.from(deathSet)
  }

  /**
   * 执行夜晚死亡
   */
  static executeNightDeaths(room: GameRoom, deathList: number[]): void {
    for (const playerId of deathList) {
      const player = room.players.find(p => p.playerId === playerId)
      if (!player) continue

      // 判断是哪个身份死了
      const killedByWolf = room.currentNightData.werewolfTargets.size > 0 && 
        Array.from(room.currentNightData.werewolfTargets.values()).flat().includes(playerId)
      const killedByWitch = room.currentNightData.witchPoisoned === playerId

      if (killedByWitch) {
        // 女巫毒杀 → 杀当前生效身份
        if (player.firstRoleAlive) {
          player.firstRoleAlive = false
        } else if (player.secondRoleAlive) {
          player.secondRoleAlive = false
        }
      } else if (killedByWolf) {
        // 狼人杀人 → 杀第一身份，如果第一身份已死就杀第二身份
        if (player.firstRoleAlive) {
          player.firstRoleAlive = false
          this.addLog(room, `【${player.playerId}号】第一身份阵亡`)
        } else if (player.secondRoleAlive) {
          player.secondRoleAlive = false
          this.addLog(room, `【${player.playerId}号】出局`)
        }
      }

      // 更新存活状态
      player.isAlive = player.firstRoleAlive || player.secondRoleAlive
      
      // 更新当前生效身份
      if (player.isAlive) {
        player.currentRole = player.firstRoleAlive ? player.firstRole : player.secondRole
      }
    }

    room.currentNightData.deathList = deathList
  }

  /**
   * 猎人触发（只在非毒杀死亡时）
   */
  static canHunterShoot(player: Player, room: GameRoom): boolean {
    // 检查猎人身份是否本次死亡
    const hunterDied = 
      (player.firstRole === 'hunter' && !player.firstRoleAlive) ||
      (player.secondRole === 'hunter' && !player.secondRoleAlive)
    
    if (!hunterDied) return false

    // 检查是否被毒杀
    const isPoisoned = room.currentNightData.witchPoisoned === player.playerId
    
    return !isPoisoned
  }

  /**
   * 处理投票
   */
  static processVote(room: GameRoom, votes: Map<number, number>): void {
    room.currentDayData.voteList = votes
  }

  /**
   * 计算投票结果
   */
  static calculateVoteResult(room: GameRoom): { eliminated: number; needRevote: boolean } {
    const votes = room.currentDayData.voteList
    const voteCount = new Map<number, number>()

    for (const [_, target] of votes) {
      voteCount.set(target, (voteCount.get(target) || 0) + 1)
    }

    const maxVotes = Math.max(...Array.from(voteCount.values()))
    const topTargets = Array.from(voteCount.entries())
      .filter(([_, count]) => count === maxVotes)
      .map(([target, _]) => target)
      .sort()

    if (topTargets.length === 1) {
      return { eliminated: topTargets[0], needRevote: false }
    }

    // 平票 - 需要重投
    room.currentDayData.revoteCandidates = topTargets
    room.currentDayData.revoteList = new Map()
    return { eliminated: -1, needRevote: true }
  }

  /**
   * 执行白天出局
   */
  static executeDayElimination(room: GameRoom, playerId: number): void {
    const player = room.players.find(p => p.playerId === playerId)
    if (!player) return

    // 白天出局 → 杀当前生效身份
    if (player.firstRoleAlive && player.currentRole === player.firstRole) {
      player.firstRoleAlive = false
      this.addLog(room, `【${player.playerId}号】出局`)
    } else if (player.secondRoleAlive) {
      player.secondRoleAlive = false
      this.addLog(room, `【${player.playerId}号】出局`)
    }

    player.isAlive = player.firstRoleAlive || player.secondRoleAlive

    if (player.isAlive) {
      player.currentRole = player.firstRoleAlive ? player.firstRole : player.secondRole
    }
  }

  /**
   * 处理猎人开枪
   */
  static executeHunterShot(room: GameRoom, shotPlayerId: number): void {
    const target = room.players.find(p => p.playerId === shotPlayerId)
    if (!target) return

    // 猎人带走的目标也出局
    if (target.firstRoleAlive && target.currentRole === target.firstRole) {
      target.firstRoleAlive = false
    } else if (target.secondRoleAlive) {
      target.secondRoleAlive = false
    }

    target.isAlive = target.firstRoleAlive || target.secondRoleAlive
  }

  /**
   * 处理白狼王自爆
   */
  static executeWhiteWolfExplode(room: GameRoom, whitewolfId: number, targetId: number): void {
    const whitewolf = room.players.find(p => p.playerId === whitewolfId)
    const target = room.players.find(p => p.playerId === targetId)
    
    if (!whitewolf || !target) return

    // 白狼王自爆出局
    if (whitewolf.firstRole === 'white_wolf_king') {
      whitewolf.firstRoleAlive = false
    } else if (whitewolf.secondRole === 'white_wolf_king') {
      whitewolf.secondRoleAlive = false
    }
    whitewolf.isAlive = whitewolf.firstRoleAlive || whitewolf.secondRoleAlive

    // 带走目标
    if (target.firstRoleAlive && target.currentRole === target.firstRole) {
      target.firstRoleAlive = false
    } else if (target.secondRoleAlive) {
      target.secondRoleAlive = false
    }
    target.isAlive = target.firstRoleAlive || target.secondRoleAlive

    this.addLog(room, `【${whitewolfId}号】自爆，带走【${targetId}号】`)
  }

  /**
   * 检查游戏是否结束
   */
  static checkGameEnd(room: GameRoom): void {
    const result = checkGameEnd(room.players)
    if (result.isEnd) {
      room.currentPhase = 'game_end'
      room.winner = result.winner
      room.endAt = new Date().toISOString()
    }
  }

  /**
   * 推进到下一个夜晚
   */
  static advanceToNextNight(room: GameRoom): void {
    room.nightRound++
    room.currentPhase = 'night_werewolf'
    room.currentNightData = {
      werewolfTargets: new Map(),
      deathList: [],
    }
  }

  /**
   * 推进到下一个白天
   */
  static advanceToNextDay(room: GameRoom): void {
    room.dayRound++
    room.currentPhase = 'day_announce'
    room.currentDayData = {
      deadByNight: room.currentNightData.deathList,
      speakingOrder: room.players.filter(p => p.isAlive).map(p => p.playerId),
      currentSpeaker: 0,
      voteList: new Map(),
    }
  }
}
