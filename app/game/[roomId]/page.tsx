'use client'

import { useParams } from 'next/navigation'
import { useGame } from '@/hooks/use-game'
import { useState } from 'react'
import GameLobby from '@/components/game/game-lobby'
import GameBoard from '@/components/game/game-board'

export default function GamePage() {
  const params = useParams()
  const roomId = params.roomId as string
  
  const [playerId] = useState(() => {
    if (typeof window !== 'undefined') {
      // 先检查全局的 playerId
      const globalPlayerId = localStorage.getItem('playerId')
      if (globalPlayerId) return globalPlayerId
      // 再检查房间特定的
      const stored = localStorage.getItem(`player_${roomId}`)
      if (stored) return stored
      const newId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      localStorage.setItem(`player_${roomId}`, newId)
      return newId
    }
    return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  })
  
  const [playerName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('playerName') || localStorage.getItem(`playerName_${roomId}`) || 'Player'
    }
    return 'Player'
  })
  
  const [isHost] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isHost') === 'true'
    }
    return false
  })

  const game = useGame({
    roomId,
    playerId,
    playerName,
    isHost,
  })

  if (game.isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">连接中...</p>
        </div>
      </main>
    )
  }

  if (game.error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{game.error}</p>
          <a href="/" className="text-accent hover:underline">
            返回首页
          </a>
        </div>
      </main>
    )
  }

  // 房间未初始化 or 等待中 -> 显示大厅
  if (!game.room || game.room.currentPhase === 'waiting' || game.room.currentPhase === 'ready') {
    return (
      <GameLobby
        room={game.room}
        players={game.room?.players || []}
        onStartGame={game.startGame}
        currentPlayer={game.currentPlayer}
        isHost={game.isHost}
        timeLeft={game.timeLeft}
      />
    )
  }

  // 游戏进行中 -> 显示游戏板
  return (
    <GameBoard
      room={game.room}
      players={game.room.players}
      currentPlayer={game.currentPlayer}
      onAction={game.sendAction}
      onSkipPhase={game.skipPhase}
      onForceEnd={game.forceEndGame}
      isHost={game.isHost}
      timeLeft={game.timeLeft}
      canPerformAction={game.canPerformAction}
      getCurrentRole={game.getCurrentRole}
    />
  )
}
