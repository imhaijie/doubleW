'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import usePartySocket from 'partysocket/react'
import { GameRoom, Player, GameAction, GamePhase } from '@/lib/types'

interface UseGameOptions {
  roomId: string
  playerId: string
  playerName: string
  isHost?: boolean
}

interface GameState {
  room: GameRoom | null
  players: Player[]
  currentPlayer: Player | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
}

export function useGame({ roomId, playerId, playerName, isHost }: UseGameOptions) {
  const [gameState, setGameState] = useState<GameState>({
    room: null,
    players: [],
    currentPlayer: null,
    isConnected: false,
    isLoading: true,
    error: null,
  })

  const socketRef = useRef<any>(null)

  // 连接到 PartyKit
  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTY_KIT_HOST || 'localhost:1999',
    room: `game:${roomId}`,
    party: 'game',
    onOpen() {
      console.log('[v0] WebSocket 已连接')
      socket.send(
        JSON.stringify({
          type: 'join_room',
          data: { playerId: parseInt(playerId), playerName },
        })
      )
    },
    onMessage(event: MessageEvent) {
      try {
        const message = JSON.parse(event.data)
        console.log('[v0] 接收消息:', message.type)
        handleMessage(message)
      } catch (e) {
        console.error('[v0] 消息解析失败:', e)
      }
    },
    onError(e: Event) {
      console.error('[v0] WebSocket 错误:', e)
      setGameState(prev => ({ ...prev, error: '连接错误' }))
    },
    onClose() {
      console.log('[v0] WebSocket 已关闭')
      setGameState(prev => ({ ...prev, isConnected: false }))
    },
  })

  socketRef.current = socket

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'state_sync':
        setGameState(prev => ({
          ...prev,
          room: message.data.room,
          players: message.data.players,
          isLoading: false,
          isConnected: true,
        }))
        break

      case 'player_joined':
        setGameState(prev => ({
          ...prev,
          players: [...prev.players, message.data.player],
        }))
        break

      case 'phase_update':
        setGameState(prev => ({
          ...prev,
          room: message.data.room,
        }))
        break

      case 'game_end':
        setGameState(prev => ({
          ...prev,
          room: message.data.room,
        }))
        break

      case 'action_executed':
        // 更新玩家状态
        break

      case 'death_announce':
        // 显示死亡通知
        break
    }
  }, [])

  // 发送玩家操作
  const sendAction = useCallback((action: GameAction) => {
    if (!socketRef.current) return

    socketRef.current.send(
      JSON.stringify({
        type: 'player_action',
        data: action,
      })
    )
  }, [])

  // 跳过当前阶段（房主）
  const skipPhase = useCallback(() => {
    if (!isHost || !socketRef.current) return

    socketRef.current.send(
      JSON.stringify({
        type: 'skip_phase',
      })
    )
  }, [isHost])

  // 强制终局（房主双死后）
  const forceEndGame = useCallback((winner: 'good' | 'werewolf') => {
    if (!isHost || !socketRef.current) return

    socketRef.current.send(
      JSON.stringify({
        type: 'force_end_game',
        data: { winner },
      })
    )
  }, [isHost])

  // 启动游戏（房主）
  const startGame = useCallback(() => {
    if (!isHost || !socketRef.current) return

    socketRef.current.send(
      JSON.stringify({
        type: 'start_game',
        data: {},
      })
    )
  }, [isHost])

  return {
    ...gameState,
    sendAction,
    skipPhase,
    forceEndGame,
    startGame,
  }
}
