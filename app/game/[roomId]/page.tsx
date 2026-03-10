'use client'

import { useParams } from 'next/navigation'
import { useGame } from '@/hooks/use-game'
import { useState } from 'react'
import GameLobby from '@/components/game/game-lobby'
import GameBoard from '@/components/game/game-board'

export default function GamePage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [playerId] = useState(() => Math.floor(Math.random() * 1000000).toString())
  const [playerName] = useState('Player')

  const game = useGame({
    roomId,
    playerId,
    playerName,
    isHost: false,
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

  // 房间未初始化 → 显示大厅
  if (!game.room || game.room.currentPhase === 'waiting' || game.room.currentPhase === 'ready') {
    return (
      <GameLobby
        room={game.room}
        players={game.players}
        onStartGame={game.startGame}
        currentPlayer={game.currentPlayer}
      />
    )
  }

  // 游戏进行中 → 显示游戏板
  return (
    <GameBoard
      room={game.room}
      players={game.players}
      currentPlayer={game.currentPlayer}
      onAction={game.sendAction}
      onSkipPhase={game.skipPhase}
      onForceEnd={game.forceEndGame}
    />
  )
}
