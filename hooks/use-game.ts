"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { GameRoom, Player, GameAction, GamePhase } from "@/lib/types"
import { GameEngine } from "@/lib/game-engine"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseGameOptions {
  roomId: string
  playerId: string
  playerName: string
  isHost?: boolean
}

interface GameState {
  room: GameRoom | null
  currentPlayer: Player | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  timeLeft: number
}

export function useGame({ roomId, playerId, playerName, isHost = false }: UseGameOptions) {
  const [gameState, setGameState] = useState<GameState>({
    room: null,
    currentPlayer: null,
    isConnected: false,
    isLoading: true,
    error: null,
    timeLeft: 0,
  })

  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isHostRef = useRef(isHost)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const roomRef = useRef<GameRoom | null>(null)

  // 同步 roomRef
  useEffect(() => {
    roomRef.current = gameState.room
  }, [gameState.room])

  // 广播游戏状态
  const broadcastState = useCallback((room: GameRoom) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game_state",
        payload: { room, timestamp: Date.now() }
      })
    }
  }, [])

  // 广播游戏动作
  const broadcastAction = useCallback((action: GameAction) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "game_action",
        payload: { action, playerId, timestamp: Date.now() }
      })
    }
  }, [playerId])

  // 处理游戏动作（仅房主处理）
  const handleGameAction = useCallback((action: GameAction, fromPlayerId: string, currentRoom: GameRoom): GameRoom => {
    const updatedRoom = JSON.parse(JSON.stringify(currentRoom)) as GameRoom

    switch (action.type) {
      case "werewolf_kill":
        if (action.targetId) {
          updatedRoom.nightActions.werewolfKills.push({
            oderId: fromPlayerId,
            targetId: action.targetId,
            targetIdentity: action.targetIdentity || 1
          })
        }
        break

      case "seer_check":
        if (action.targetId) {
          const result = GameEngine.seerCheck(updatedRoom, action.targetId)
          updatedRoom.nightActions.seerCheck = {
            oderId: fromPlayerId,
            targetId: action.targetId,
            result
          }
        }
        break

      case "witch_save":
        updatedRoom.nightActions.witchSave = action.targetId || null
        break

      case "witch_poison":
        updatedRoom.nightActions.witchPoison = action.targetId || null
        break

      case "guard_protect":
        if (action.targetId) {
          updatedRoom.nightActions.guardProtect = action.targetId
        }
        break

      case "hunter_shoot":
        if (action.targetId) {
          GameEngine.hunterShoot(updatedRoom, fromPlayerId, action.targetId)
        }
        break

      case "vote":
        if (action.targetId) {
          updatedRoom.votes[fromPlayerId] = action.targetId
        }
        break

      case "white_wolf_explode":
        if (action.targetId) {
          GameEngine.whiteWolfExplode(updatedRoom, fromPlayerId, action.targetId)
          updatedRoom.currentPhase = "night_werewolf"
          GameEngine.advanceToNextNight(updatedRoom)
        }
        break
    }

    return updatedRoom
  }, [])

  // 推进游戏阶段
  const advancePhase = useCallback((currentRoom: GameRoom): GameRoom => {
    const updatedRoom = JSON.parse(JSON.stringify(currentRoom)) as GameRoom
    const phase = updatedRoom.currentPhase

    switch (phase) {
      case "night_werewolf":
        updatedRoom.currentPhase = "night_seer"
        break

      case "night_seer":
        updatedRoom.currentPhase = "night_witch"
        break

      case "night_witch":
        updatedRoom.currentPhase = "night_guard"
        break

      case "night_guard":
        const deathList = GameEngine.calculateNightDeaths(updatedRoom)
        GameEngine.executeNightDeaths(updatedRoom, deathList)
        updatedRoom.currentPhase = "day_announce"
        GameEngine.advanceToNextDay(updatedRoom)
        break

      case "day_announce":
        updatedRoom.currentPhase = "day_speech"
        break

      case "day_speech":
        updatedRoom.currentPhase = "day_vote"
        updatedRoom.votes = {}
        break

      case "day_vote":
      case "day_revote":
        const voteResult = GameEngine.calculateVoteResult(updatedRoom)
        if (voteResult.needRevote) {
          updatedRoom.currentPhase = "day_revote"
        } else {
          GameEngine.executeDayElimination(updatedRoom, voteResult.eliminated)
          GameEngine.checkGameEnd(updatedRoom)
          if (updatedRoom.currentPhase !== "game_end") {
            GameEngine.advanceToNextNight(updatedRoom)
            updatedRoom.currentPhase = "night_werewolf"
          }
        }
        break
    }

    return updatedRoom
  }, [])

  // 获取阶段时长
  const getPhaseDuration = useCallback((phase: GamePhase, room: GameRoom): number => {
    const durations: Record<string, number> = {
      night_werewolf: room.settings.skillDuration,
      night_seer: room.settings.skillDuration,
      night_witch: room.settings.skillDuration,
      night_guard: room.settings.skillDuration,
      day_announce: 5,
      day_speech: room.settings.speechDuration,
      day_vote: room.settings.voteDuration,
      day_revote: room.settings.voteDuration,
    }
    return durations[phase] || 30
  }, [])

  // 启动阶段计时器
  const startPhaseTimer = useCallback((phase: GamePhase, room: GameRoom) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const duration = getPhaseDuration(phase, room)
    setGameState(prev => ({ ...prev, timeLeft: duration }))

    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          // 时间到，房主推进阶段
          if (isHostRef.current && roomRef.current) {
            const newRoom = advancePhase(roomRef.current)
            broadcastState(newRoom)
            startPhaseTimer(newRoom.currentPhase, newRoom)
            return { ...prev, room: newRoom, timeLeft: 0 }
          }
          return { ...prev, timeLeft: 0 }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
  }, [getPhaseDuration, advancePhase, broadcastState])

  // 发送游戏动作
  const sendAction = useCallback((action: GameAction) => {
    broadcastAction(action)
    
    // 如果是房主，直接处理
    if (isHostRef.current && roomRef.current) {
      const updatedRoom = handleGameAction(action, playerId, roomRef.current)
      setGameState(prev => ({ ...prev, room: updatedRoom }))
      broadcastState(updatedRoom)
    }
  }, [broadcastAction, handleGameAction, playerId, broadcastState])

  // 房主跳过当前阶段
  const skipPhase = useCallback(() => {
    if (!isHostRef.current || !roomRef.current) return
    
    const newRoom = advancePhase(roomRef.current)
    setGameState(prev => ({ ...prev, room: newRoom }))
    broadcastState(newRoom)
    startPhaseTimer(newRoom.currentPhase, newRoom)
  }, [advancePhase, broadcastState, startPhaseTimer])

  // 房主强制结束游戏
  const forceEndGame = useCallback((winner: "villagers" | "werewolves") => {
    if (!roomRef.current) return
    
    const newRoom: GameRoom = { 
      ...roomRef.current, 
      currentPhase: "game_end" as GamePhase, 
      winner 
    }
    setGameState(prev => ({ ...prev, room: newRoom }))
    broadcastState(newRoom)
  }, [broadcastState])

  // 开始游戏
  const startGame = useCallback(() => {
    if (!isHostRef.current || !roomRef.current) return
    
    const room = JSON.parse(JSON.stringify(roomRef.current)) as GameRoom
    GameEngine.assignRoles(room)
    room.currentPhase = "night_werewolf"
    room.currentDay = 1
    
    setGameState(prev => ({ ...prev, room }))
    broadcastState(room)
    startPhaseTimer("night_werewolf", room)
  }, [broadcastState, startPhaseTimer])

  // 初始化连接
  useEffect(() => {
    isHostRef.current = isHost

    const channel = supabase.channel(`game:${roomId}`, {
      config: { broadcast: { self: true } }
    })

    channel
      .on("broadcast", { event: "game_state" }, ({ payload }) => {
        if (payload.room) {
          const room = payload.room as GameRoom
          const me = room.players.find(p => p.oderId === playerId)
          setGameState(prev => ({
            ...prev,
            room,
            currentPlayer: me || null,
            isLoading: false,
          }))
        }
      })
      .on("broadcast", { event: "game_action" }, ({ payload }) => {
        if (isHostRef.current && roomRef.current && payload.playerId !== playerId) {
          const updatedRoom = handleGameAction(payload.action, payload.playerId, roomRef.current)
          setGameState(prev => ({ ...prev, room: updatedRoom }))
          broadcastState(updatedRoom)
        }
      })
      .on("broadcast", { event: "player_join" }, ({ payload }) => {
        if (isHostRef.current && roomRef.current) {
          const newPlayer: Player = {
            oderId: payload.playerId,
            odeerNumber: roomRef.current.players.length + 1,
            nickname: payload.playerName,
            role1: "villager",
            role2: "villager",
            identity1Alive: true,
            identity2Alive: true,
            isHost: false,
            isConnected: true
          }
          const updatedRoom = {
            ...roomRef.current,
            players: [...roomRef.current.players, newPlayer]
          }
          setGameState(prev => ({ ...prev, room: updatedRoom }))
          broadcastState(updatedRoom)
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setGameState(prev => ({ ...prev, isConnected: true, error: null }))
          
          // 加载房间数据
          const { data: roomData } = await supabase
            .from("rooms")
            .select("*")
            .eq("id", roomId)
            .single()

          if (roomData) {
            const initialRoom: GameRoom = {
              id: roomId,
              roomCode: roomData.room_code,
              hostPlayerId: roomData.host_player_id,
              players: [],
              currentPhase: "waiting",
              currentDay: 0,
              nightActions: {
                werewolfKills: [],
                seerCheck: null,
                witchSave: null,
                witchPoison: null,
                guardProtect: null,
                lastGuardTarget: null
              },
              votes: {},
              gameLog: [],
              settings: roomData.settings || {
                roleConfig: {},
                skillDuration: 20,
                speechDuration: 300,
                voteDuration: 60
              },
              witchPotions: { save: true, poison: true },
              winner: null
            }

            if (isHost) {
              initialRoom.players.push({
                oderId: playerId,
                odeerNumber: 1,
                nickname: playerName,
                role1: "villager",
                role2: "villager",
                identity1Alive: true,
                identity2Alive: true,
                isHost: true,
                isConnected: true
              })
              broadcastState(initialRoom)
            } else {
              // 非房主请求加入
              channel.send({
                type: "broadcast",
                event: "player_join",
                payload: { playerId, playerName }
              })
            }

            setGameState(prev => ({
              ...prev,
              room: initialRoom,
              currentPlayer: initialRoom.players.find(p => p.oderId === playerId) || null,
              isLoading: false
            }))
          } else {
            setGameState(prev => ({ ...prev, error: "房间不存在", isLoading: false }))
          }
        } else if (status === "CHANNEL_ERROR") {
          setGameState(prev => ({ ...prev, error: "连接失败", isConnected: false }))
        }
      })

    channelRef.current = channel

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      channel.unsubscribe()
    }
  }, [roomId, playerId, playerName, isHost, supabase, broadcastState, handleGameAction])

  // 获取当前生效身份
  const getCurrentRole = useCallback(() => {
    const player = gameState.currentPlayer
    if (!player) return null
    return player.identity1Alive ? player.role1 : player.role2
  }, [gameState.currentPlayer])

  // 检查是否可以执行动作
  const canPerformAction = useCallback((actionType: string): boolean => {
    const { room, currentPlayer } = gameState
    if (!room || !currentPlayer) return false
    
    const currentRole = getCurrentRole()
    const phase = room.currentPhase

    switch (actionType) {
      case "werewolf_kill":
        return phase === "night_werewolf" && (currentRole === "werewolf" || currentRole === "white_wolf_king")
      case "seer_check":
        return phase === "night_seer" && currentRole === "seer"
      case "witch_save":
      case "witch_poison":
        return phase === "night_witch" && currentRole === "witch"
      case "guard_protect":
        return phase === "night_guard" && currentRole === "guard"
      case "vote":
        return (phase === "day_vote" || phase === "day_revote") && 
               (currentPlayer.identity1Alive || currentPlayer.identity2Alive)
      case "white_wolf_explode":
        return phase === "day_speech" && currentRole === "white_wolf_king"
      default:
        return false
    }
  }, [gameState, getCurrentRole])

  return {
    ...gameState,
    isHost: isHostRef.current,
    sendAction,
    skipPhase,
    forceEndGame,
    startGame,
    getCurrentRole,
    canPerformAction,
  }
}
