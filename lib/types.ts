// 身份类型
export type Role = 'villager' | 'werewolf' | 'seer' | 'witch' | 'hunter' | 'guard' | 'white_wolf_king'

// 阵营类型
export type Team = 'good' | 'werewolf'

// 阶段类型
export type GamePhase = 
  | 'waiting' // 等待玩家加入
  | 'ready' // 准备开始
  | 'assign_roles' // 分配身份
  | 'night_werewolf' // 夜晚 - 狼人行动
  | 'night_seer' // 夜晚 - 预言家查验
  | 'night_witch' // 夜晚 - 女巫行动
  | 'night_guard' // 夜晚 - 守卫保护
  | 'hunter_trigger' // 猎人触发（死亡后开枪）
  | 'day_announce' // 白天 - 死亡公告
  | 'day_speech' // 白天 - 发言
  | 'day_vote' // 白天 - 投票
  | 'day_revote' // 白天 - 重投
  | 'game_end' // 游戏结束

// 玩家状态
export interface Player {
  id: string
  playerId: number // 1-based 号码
  roomId: string
  name: string
  firstRole: Role
  secondRole: Role
  firstRoleAlive: boolean
  secondRoleAlive: boolean
  isAlive: boolean // 任一身份存活
  currentRole: Role // 当前生效身份
  isHost: boolean
  lastGuardedBy?: number // 最后被谁守卫的
  lastGuardedAt?: number // 最后被守卫的晚上轮次
}

// 双身份逻辑：
// - team = firstRole 和 secondRole 的阵营判定
// - currentRole = firstRoleAlive ? firstRole : secondRole
// - 狼人身份死亡 → 禁用狼人技能（即使另一身份存活）

export interface GameRoom {
  id: string
  roomId: string // 自定义房间号，如 "WOLF888"
  hostId: string // 房主 userId
  players: Player[]
  currentPhase: GamePhase
  nightRound: number // 当前是第几个夜晚 (从1开始)
  dayRound: number // 当前是第几个白天 (从1开始)
  gameLog: GameLogEntry[] // 游戏历史日志
  
  // 配置
  skillDuration: number // 技能发动时间（秒）: 15 | 20 | 30
  speechDuration: number // 发言总时长（秒）: 300 | 600 | 900
  voteDuration: number // 投票时长（秒）: 60 | 120 | null(无限)
  roleConfig: RoleConfig
  
  // 当前夜晚数据
  currentNightData: {
    werewolfTargets: Map<number, number[]> // playerId -> [targetId, ...] (狼人可刀两个)
    seerTarget?: number
    seerResult?: 'good' | 'werewolf'
    witchSaved?: number
    witchPoisoned?: number
    guardTarget?: number
    deathList: number[] // 该夜间死亡的玩家列表
  }
  
  // 当前白天数据
  currentDayData: {
    deadByNight: number[] // 夜晚死亡的玩家
    speakingOrder: number[] // 发言顺序
    currentSpeaker: number
    voteList: Map<number, number> // voterId -> targetId
    revoteList?: Map<number, number> // 重投名单
    revoteCandidates?: number[] // 平票玩家列表
  }
  
  // 结束状态
  winner?: Team
  endAt?: string
  createdAt: string
  updatedAt: string
}

// 游戏日志条目 - 仅记录主持人会说的话
export interface GameLogEntry {
  round: number
  type: 'night' | 'day'
  message: string // e.g. "【3号】第一身份阵亡", "【2号】出局", "平票 → 重投 → 【6号】出局"
  timestamp: string
}

// 房间配置
export interface RoleConfig {
  werewolves: number
  villagers: number
  seers: number
  witches: number
  hunters: number
  guards: number
  whiteWolfKings: number
}

// API 请求/响应类型
export interface CreateRoomRequest {
  hostId: string
  hostName: string
  roomId: string // 自定义房间号
  skillDuration: 15 | 20 | 30
  speechDuration: 300 | 600 | 900
  voteDuration: 60 | 120 | null
  roleConfig: RoleConfig
}

export interface JoinRoomRequest {
  playerId: string
  playerName: string
  roomId: string
}

export interface GameAction {
  type: 'werewolf_kill' | 'seer_check' | 'witch_save' | 'witch_poison' | 'guard_protect' | 'hunter_shoot' | 'vote' | 'white_wolf_explode' | 'skip_phase'
  playerId: number
  targets?: number[]
  target?: number
}

// PartyKit 消息类型
export interface GameMessage {
  type: 'action' | 'phase_update' | 'timer_update' | 'death_announce' | 'log_append' | 'game_end' | 'state_sync'
  data: unknown
  timestamp: number
}
