'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useGame } from '@/hooks/use-game'
import { useState, useEffect } from 'react'
import GameLobby from '@/components/game/game-lobby'
import GameBoard from '@/components/game/game-board'

export default function GamePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.roomId as string
  const isHostParam = searchParams.get('host') === 'true'
  
  const [playerId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`player_${roomId}`)
      if (stored) return stored
      const newId = Math.random().toString(36).substring(2, 15)
      localStorage.setItem(`player_${roomId}`, newId)
      return newId
    }
    return Math.random().toString(36).substring(2, 15)
  })
  
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`playerName_${roomId}`) || ''
    }
    return ''
  })
  
  const [isNameSet, setIsNameSet] = useState(false)

  const game = useGame({
    roomId,
    playerId,
    playerName: playerName || 'Player',
    isHost: isHostParam,
  })

  // 保存玩家名
  useEffect(() => {
    if (playerName && typeof window !== 'undefined') {
      localStorage.setItem(`playerName_${roomId}`, playerName)
    }
  }, [playerName, roomId])

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
