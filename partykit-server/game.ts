import type * as Party from "partykit/server"
import { GameRoom, Player, GameAction, GamePhase } from "./types"
import { GameEngine } from "./game-engine"

export default class GameServer implements Party.Server {
  room!: GameRoom
  players: Map<string, Player> = new Map()
  phaseTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(readonly party: Party.Party) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[${this.party.id}] 玩家连接: ${conn.id}`)
    
    // 初始化房间（首次连接时）
    if (!this.room) {
      this.room = {
        id: this.party.id,
        roomId: this.party.id,
        hostId: "",
        players: [],
        currentPhase: "waiting",
        nightRound: 0,
        dayRound: 0,
        gameLog: [],
        skillDuration: 15,
        speechDuration: 300,
        voteDuration: 60,
        roleConfig: {
          werewolves: 2,
          villagers: 3,
          seers: 1,
          witches: 1,
          hunters: 1,
          guards: 1,
          whiteWolfKings: 0,
        },
        currentNightData: {
          werewolfTargets: new Map(),
          deathList: [],
        },
        currentDayData: {
          deadByNight: [],
          speakingOrder: [],
          currentSpeaker: 0,
          voteList: new Map(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    // 向所有玩家广播状态
    this.broadcast({
      type: "state_sync",
      data: {
        room: this.room,
        players: Array.from(this.players.values()),
      },
      timestamp: Date.now(),
    })
  }

  async onMessage(message: unknown, sender: Party.Connection) {
    const msg = message as any

    console.log(`[${this.party.id}] 消息来自 ${sender.id}:`, msg.type)

    switch (msg.type) {
      case "join_room":
        this.handleJoinRoom(msg.data, sender)
        break
      case "leave_room":
        this.handleLeaveRoom(sender)
        break
      case "start_game":
        this.handleStartGame(msg.data, sender)
        break
      case "player_action":
        this.handlePlayerAction(msg.data, sender)
        break
      case "skip_phase":
        this.handleSkipPhase(sender)
        break
      case "force_end_game":
        this.handleForceEndGame(msg.data, sender)
        break
    }
  }

  onClose(conn: Party.Connection) {
    console.log(`[${this.party.id}] 玩家断开连接: ${conn.id}`)
    this.handleLeaveRoom(conn)
  }

  private handleJoinRoom(data: any, sender: Party.Connection) {
    const { playerId, playerName } = data
    
    // 创建玩家对象
    const player: Player = {
      id: sender.id,
      playerId,
      roomId: this.party.id,
      name: playerName,
      firstRole: "villager",
      secondRole: "villager",
      firstRoleAlive: true,
      secondRoleAlive: true,
      isAlive: true,
      currentRole: "villager",
      isHost: false,
    }

    this.players.set(sender.id, player)
    this.room.players.push(player)

    // 广播玩家加入
    this.broadcast({
      type: "player_joined",
      data: { player, totalPlayers: this.room.players.length },
      timestamp: Date.now(),
    })
  }

  private handleLeaveRoom(conn: Party.Connection) {
    const player = this.players.get(conn.id)
    if (!player) return

    // 移除玩家
    this.players.delete(conn.id)
    this.room.players = this.room.players.filter(p => p.id !== conn.id)

    // 如果房主离开，转移房主权限或结束房间
    if (player.isHost && this.room.players.length > 0) {
      this.room.players[0].isHost = true
    }

    // 广播玩家离开
    this.broadcast({
      type: "player_left",
      data: { playerId: player.id, totalPlayers: this.room.players.length },
      timestamp: Date.now(),
    })
  }

  private handleStartGame(data: any, sender: Party.Connection) {
    const player = this.players.get(sender.id)
    if (!player?.isHost) return

    // 验证玩家数量
    const minPlayers = Math.ceil(
      Object.values(this.room.roleConfig).reduce((a, b) => a + b) / 2
    )
    if (this.room.players.length < minPlayers) {
      return
    }

    // 初始化游戏
    GameEngine.initializeGame(this.room)
    GameEngine.assignRoles(this.room)
    this.room.currentPhase = "day_announce"
    this.room.dayRound = 1

    // 广播游戏开始
    this.broadcast({
      type: "game_started",
      data: { room: this.room },
      timestamp: Date.now(),
    })

    // 启动第一个白天
    this.startPhaseTimer("day_announce")
  }

  private handlePlayerAction(data: any, sender: Party.Connection) {
    const player = this.players.get(sender.id)
    if (!player) return

    const action = data as GameAction

    // 根据阶段处理技能
    switch (this.room.currentPhase) {
      case "night_werewolf":
        if (player.currentRole === "werewolf") {
          GameEngine.processNightWerewolf(this.room, [action])
        }
        break
      case "night_seer":
        if (player.currentRole === "seer") {
          GameEngine.processNightSeer(this.room, action)
        }
        break
      case "night_witch":
        if (player.currentRole === "witch") {
          GameEngine.processNightWitch(this.room, [action])
        }
        break
      case "night_guard":
        if (player.currentRole === "guard") {
          GameEngine.processNightGuard(this.room, action)
        }
        break
      case "day_vote":
        if (player.isAlive) {
          this.room.currentDayData.voteList.set(player.playerId, action.target!)
        }
        break
      case "white_wolf_explode":
        if (player.currentRole === "white_wolf_king") {
          GameEngine.executeWhiteWolfExplode(this.room, player.playerId, action.target!)
        }
        break
    }

    // 广播技能执行
    this.broadcast({
      type: "action_executed",
      data: { playerId: player.playerId, action },
      timestamp: Date.now(),
    })

    // 检查当前阶段是否可以推进
    this.checkPhaseCompletion()
  }

  private handleSkipPhase(sender: Party.Connection) {
    const player = this.players.get(sender.id)
    if (!player?.isHost) return

    // 清除当前阶段计时器
    const timerId = this.phaseTimers.get(this.room.currentPhase)
    if (timerId) {
      clearTimeout(timerId)
      this.phaseTimers.delete(this.room.currentPhase)
    }

    // 推进阶段
    this.advancePhase()
  }

  private handleForceEndGame(data: any, sender: Party.Connection) {
    const player = this.players.get(sender.id)
    
    // 只有房主且双身份死亡才能强制终局
    if (!player?.isHost) return
    
    // TODO: 检查房主双身份是否都已死亡
    
    const { winner } = data
    this.room.currentPhase = "game_end"
    this.room.winner = winner
    this.room.endAt = new Date().toISOString()

    this.broadcast({
      type: "game_end",
      data: { room: this.room, winner },
      timestamp: Date.now(),
    })
  }

  private broadcast(message: any) {
    console.log(`[${this.party.id}] 广播:`, message.type)
    this.party.broadcast(message)
  }

  private startPhaseTimer(phase: GamePhase) {
    let duration = 0
    
    switch (phase) {
      case "night_werewolf":
      case "night_seer":
      case "night_witch":
      case "night_guard":
        duration = this.room.skillDuration * 1000
        break
      case "day_speech":
        duration = this.room.speechDuration * 1000
        break
      case "day_vote":
        duration = this.room.voteDuration ? this.room.voteDuration * 1000 : Infinity
        break
    }

    if (duration > 0 && duration !== Infinity) {
      const timerId = setTimeout(() => {
        this.advancePhase()
      }, duration)
      this.phaseTimers.set(phase, timerId)
    }
  }

  private checkPhaseCompletion() {
    // 检查当前阶段是否所有相关玩家都已完成操作
    // 如果是，则推进到下一个阶段
  }

  private advancePhase() {
    const currentPhase = this.room.currentPhase

    switch (currentPhase) {
      case "night_werewolf":
        this.room.currentPhase = "night_seer"
        this.startPhaseTimer("night_seer")
        break

      case "night_seer":
        this.room.currentPhase = "night_witch"
        this.startPhaseTimer("night_witch")
        break

      case "night_witch":
        this.room.currentPhase = "night_guard"
        this.startPhaseTimer("night_guard")
        break

      case "night_guard":
        // 计算死亡并推进到白天
        const deathList = GameEngine.calculateNightDeaths(this.room)
        GameEngine.executeNightDeaths(this.room, deathList)
        
        // 检查猎人触发
        for (const playerId of deathList) {
          const player = this.room.players.find(p => p.playerId === playerId)
          if (player && GameEngine.canHunterShoot(player, this.room)) {
            // 猎人可以开枪
            // 暂时跳过猎人逻辑，直接进入白天
          }
        }

        this.room.currentPhase = "day_announce"
        GameEngine.advanceToNextDay(this.room)
        break

      case "day_announce":
        this.room.currentPhase = "day_speech"
        this.startPhaseTimer("day_speech")
        break

      case "day_speech":
        this.room.currentPhase = "day_vote"
        this.startPhaseTimer("day_vote")
        break

      case "day_vote":
      case "day_revote":
        // 计算投票结果
        const voteResult = GameEngine.calculateVoteResult(this.room)
        
        if (voteResult.needRevote) {
          this.room.currentPhase = "day_revote"
          this.startPhaseTimer("day_vote")
          break
        } else {
          // 执行出局
          GameEngine.executeDayElimination(this.room, voteResult.eliminated)
          
          // 检查游戏是否结束
          GameEngine.checkGameEnd(this.room)
          
          if (this.room.currentPhase === "game_end") {
            // 游戏结束
            this.broadcast({
              type: "game_end",
              data: { room: this.room, winner: this.room.winner },
              timestamp: Date.now(),
            })
            return
          } else {
            // 推进到下一个夜晚
            GameEngine.advanceToNextNight(this.room)
            this.startPhaseTimer("night_werewolf")
          }
        }
        break
    }

    // 广播阶段更新
    this.broadcast({
      type: "phase_update",
      data: { phase: this.room.currentPhase, room: this.room },
      timestamp: Date.now(),
    })
  }
}

Party.serve(GameServer)
