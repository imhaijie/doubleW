'use client'

import { GameRoom, Player } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ROLE_NAMES } from '@/lib/constants'
import { Users } from 'lucide-react'

interface GameLobbyProps {
  room: GameRoom | null
  players: Player[]
  onStartGame: () => void
  currentPlayer: Player | null
}

export default function GameLobby({
  room,
  players,
  onStartGame,
  currentPlayer,
}: GameLobbyProps) {
  if (!room) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground">房间未初始化</p>
        </div>
      </main>
    )
  }

  const minPlayers = Math.ceil(
    Object.values(room.roleConfig).reduce((a, b) => a + b) / 2
  )
  const totalRoles = Object.values(room.roleConfig).reduce((a, b) => a + b)
  const canStart = players.length >= minPlayers

  return (
    <main className="min-h-screen bg-background">
      {/* 顶部状态栏 */}
      <div className="border-b border-border bg-card/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">房间: {room.roomId}</h1>
            <p className="text-sm text-muted-foreground">
              玩家数: {players.length} | 最少需要: {minPlayers}
            </p>
          </div>
          {currentPlayer?.isHost && (
            <Button
              onClick={onStartGame}
              disabled={!canStart}
              className="bg-accent hover:bg-accent/90"
            >
              开始游戏
            </Button>
          )}
        </div>
      </div>

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* 玩家列表 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-semibold text-foreground">已加入玩家</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {player.name || `玩家 ${idx + 1}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ID: {player.id.slice(0, 8)}...
                      </p>
                    </div>
                    {player.isHost && (
                      <span className="text-xs bg-accent text-white px-2 py-1 rounded">
                        房主
                      </span>
                    )}
                  </div>
                  {player === currentPlayer && (
                    <p className="text-xs text-accent">正在编辑</p>
                  )}
                </div>
              ))}

              {/* 占位符 */}
              {Array.from({ length: Math.min(4, minPlayers - players.length) }).map(
                (_, idx) => (
                  <div
                    key={`placeholder-${idx}`}
                    className="bg-card/50 border border-dashed border-border rounded-lg p-4 flex items-center justify-center"
                  >
                    <p className="text-sm text-muted-foreground">等待加入...</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* 房间配置信息 */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">房间配置</h2>
            
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">技能时间</p>
                <p className="text-foreground font-medium">{room.skillDuration} 秒</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">发言时长</p>
                <p className="text-foreground font-medium">{Math.floor(room.speechDuration / 60)} 分钟</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">投票时长</p>
                <p className="text-foreground font-medium">
                  {room.voteDuration ? `${room.voteDuration} 秒` : '无限'}
                </p>
              </div>

              <hr className="border-border my-3" />

              <div>
                <p className="text-sm text-muted-foreground mb-2">角色配置</p>
                <div className="space-y-1 text-sm text-foreground">
                  {Object.entries(room.roleConfig).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span>{ROLE_NAMES[key as keyof typeof ROLE_NAMES]}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-border my-3" />

              <div className="text-sm text-muted-foreground">
                <p className="mb-1">总角色数: {totalRoles}</p>
                <p>最少玩家: {minPlayers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
