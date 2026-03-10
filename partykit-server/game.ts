import type * as Party from "partykit/server"
import { GameRoom, Player, GameAction, GamePhase } from "./types"
import { GameEngine } from "./game-engine"

export default class GameServer implements Party.Server {
  readonly options = {
    hibernate: true,
  }

  gameRoom!: GameRoom
  players: Map<string, Player> = new Map()
  phaseTimers: Map<string, NodeJS.Timeout> = new Map()

  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[${this.room.id}] Player connected: ${conn.id}`)
    
    // Initialize game room on first connection
    if (!this.gameRoom) {
      this.gameRoom = {
        id: this.room.id,
        roomId: this.room.id,
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

    // Broadcast state to all players
    this.broadcast({
      type: "state_sync",
      data: {
        room: this.gameRoom,
        players: Array.from(this.players.values()),
      },
      timestamp: Date.now(),
    })
  }

  async onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message)

    console.log(`[${this.room.id}] Message from ${sender.id}:`, msg.type)

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
    console.log(`[${this.room.id}] Player disconnected: ${conn.id}`)
    this.handleLeaveRoom(conn)
  }

  private handleJoinRoom(data: any, sender: Party.Connection) {
    const { playerId, playerName } = data
    
    const player: Player = {
      id: sender.id,
      playerId,
      roomId: this.room.id,
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
    this.gameRoom.players.push(player)

    this.broadcast({
      type: "player_joined",
      data: { player, totalPlayers: this.gameRoom.players.length },
      timestamp: Date.now(),
    })
  }

  private handleLeaveRoom(conn: Party.Connection) {
    const player = this.players.get(conn.id)
    if (!player) return

    this.players.delete(conn.id)
    this.gameRoom.players = this.gameRoom.players.filter(p => p.id !== conn.id)

    if (player.isHost && this.gameRoom.players.length > 0) {
      this.gameRoom.players[0].isHost = true
    }

    this.broadcast({
      type: "player_left",
      data: { playerId: player.id, totalPlayers: this.gameRoom.players.length },
      timestamp: Date.now(),
    })
  }

  private handleStartGame(data: any, sender: Party.Connection) {
    const player = this.players.get(sender.id)
    if (!player?.isHost) return

    const minPlayers = Math.ceil(
      Object.values(this.gameRoom.roleConfig).reduce((a, b) => a + b) / 2
    )
    if (this.gameRoom.players.length < minPlayers) {
      return
    }

    GameEngine.initializeGame(this.gameRoom)
    GameEngine.assignRoles(this.gameRoom)
    this.gameRoom.currentPhase = "day_announce"
    this.gameRoom.dayRound = 1

    this.broadcast({
      type: "game_started",
      data: { room: this.gameRoom },
      timestamp: Date.now(),
    })

    this.startPhaseTimer("day_announce")
  }

  private handlePlayerAction(data: any, sender: Party.Connection) {
    const player = this.players.get(sender.id)
    if (!player) return

    const action = data as GameAction

    switch (this.gameRoom.currentPhase) {
      case "night_werewolf":
        if (player.currentRole === "werewolf") {
          GameEngine.processNightWerewolf(this.gameRoom, [action])
        }
        break
      case "night_seer":
        if (player.currentRole === "seer") {
          GameEngine.processNightSeer(this.gameRoom, action)
        }
        break
      case "night_witch":
        if (player.currentRole === "witch") {
          GameEngine.processNightWitch(this.gameRoom, [action])
        }
        break
      case "night_guard":
        if (player.currentRole === "guard") {
          GameEngine.processNightGuard(this.gameRoom, action)
        }
        break
      case "day_vote":
        if (player.isAlive) {
          this.gameRoom.currentDayData.voteList.set(player.playerId, action.target!)
        }
        break
      case "white_wolf_explode":
        if (player.currentRole === "white_wolf_king") {
          GameEngine.executeWhiteWolfExplode(this.gameRoom, player.playerId, action.target!)
        }
        break
    }

    this.broadcast({
      type: "action_executed",
      data: { playerId: player.playerId, action },
      timestamp: Date.now(),
    })

    this.checkPhaseCompletion()
  }

  private handleSkipPhase(sender: Party.Connection) {
    const player = this.players.get(sender.id)
    if (!player?.isHost) return

    const timerId = this.phaseTimers.get(this.gameRoom.currentPhase)
    if (timerId) {
      clearTimeout(timerId)
      this.phaseTimers.delete(this.gameRoom.currentPhase)
    }

    this.advancePhase()
  }

  private handleForceEndGame(data: any, sender: Party.Connection) {
    const player = this.players.get(sender.id)
    
    if (!player?.isHost) return
    
    const { winner } = data
    this.gameRoom.currentPhase = "game_end"
    this.gameRoom.winner = winner
    this.gameRoom.endAt = new Date().toISOString()

    this.broadcast({
      type: "game_end",
      data: { room: this.gameRoom, winner },
      timestamp: Date.now(),
    })
  }

  private broadcast(message: any) {
    console.log(`[${this.room.id}] Broadcasting:`, message.type)
    this.room.broadcast(JSON.stringify(message))
  }

  private startPhaseTimer(phase: GamePhase) {
    let duration = 0
    
    switch (phase) {
      case "night_werewolf":
      case "night_seer":
      case "night_witch":
      case "night_guard":
        duration = this.gameRoom.skillDuration * 1000
        break
      case "day_speech":
        duration = this.gameRoom.speechDuration * 1000
        break
      case "day_vote":
        duration = this.gameRoom.voteDuration ? this.gameRoom.voteDuration * 1000 : Infinity
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
    // Check if all relevant players have completed their actions
  }

  private advancePhase() {
    const currentPhase = this.gameRoom.currentPhase

    switch (currentPhase) {
      case "night_werewolf":
        this.gameRoom.currentPhase = "night_seer"
        this.startPhaseTimer("night_seer")
        break

      case "night_seer":
        this.gameRoom.currentPhase = "night_witch"
        this.startPhaseTimer("night_witch")
        break

      case "night_witch":
        this.gameRoom.currentPhase = "night_guard"
        this.startPhaseTimer("night_guard")
        break

      case "night_guard":
        const deathList = GameEngine.calculateNightDeaths(this.gameRoom)
        GameEngine.executeNightDeaths(this.gameRoom, deathList)
        
        for (const playerId of deathList) {
          const player = this.gameRoom.players.find(p => p.playerId === playerId)
          if (player && GameEngine.canHunterShoot(player, this.gameRoom)) {
            // Hunter can shoot - skip for now
          }
        }

        this.gameRoom.currentPhase = "day_announce"
        GameEngine.advanceToNextDay(this.gameRoom)
        break

      case "day_announce":
        this.gameRoom.currentPhase = "day_speech"
        this.startPhaseTimer("day_speech")
        break

      case "day_speech":
        this.gameRoom.currentPhase = "day_vote"
        this.startPhaseTimer("day_vote")
        break

      case "day_vote":
      case "day_revote":
        const voteResult = GameEngine.calculateVoteResult(this.gameRoom)
        
        if (voteResult.needRevote) {
          this.gameRoom.currentPhase = "day_revote"
          this.startPhaseTimer("day_vote")
          break
        } else {
          GameEngine.executeDayElimination(this.gameRoom, voteResult.eliminated)
          GameEngine.checkGameEnd(this.gameRoom)
          
          if (this.gameRoom.currentPhase === "game_end") {
            this.broadcast({
              type: "game_end",
              data: { room: this.gameRoom, winner: this.gameRoom.winner },
              timestamp: Date.now(),
            })
            return
          } else {
            GameEngine.advanceToNextNight(this.gameRoom)
            this.startPhaseTimer("night_werewolf")
          }
        }
        break
    }

    this.broadcast({
      type: "phase_update",
      data: { phase: this.gameRoom.currentPhase, room: this.gameRoom },
      timestamp: Date.now(),
    })
  }
}
