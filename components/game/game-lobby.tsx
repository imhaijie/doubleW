'use client'

import { GameRoom, Player } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ROLE_NAMES, getMinPlayers } from '@/lib/constants'
import { Users, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface GameLobbyProps {
  room: GameRoom | null
  players: Player[]
  onStartGame: () => void
  currentPlayer: Player | null
  isHost: boolean
  timeLeft: number
}

export default function GameLobby({
  room,
  players,
  onStartGame,
  currentPlayer,
  isHost,
}: GameLobbyProps) {
  const [copied, setCopied] = useState(false)

  if (!room) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground">房间未初始化</p>
        </div>
      </main>
    )
  }

  const roleConfig = room.settings?.roleConfig || {}
  const minPlayers = getMinPlayers(roleConfig)
  const totalRoles = Object.values(roleConfig).reduce((a: number, b: number) => a + b, 0)
  const canStart = players.length >= minPlayers

  const copyRoomLink = async () => {
    const url = window.location.href.replace('?host=true', '')
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* 顶部状态栏 */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">房间: {room.roomCode}</h1>
            <p className="text-sm text-muted-foreground">
              玩家数: {players.length} | 最少需要: {minPlayers}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyRoomLink}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制链接'}
            </Button>
            {isHost && (
              <Button
                onClick={onStartGame}
                disabled={!canStart}
                className="bg-primary hover:bg-primary/90"
              >
                开始游戏
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* 玩家列表 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">已加入玩家</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {players.map((player, idx) => (
                <div
                  key={player.oderId}
                  className={`bg-card border rounded-lg p-4 ${
                    player.oderId === currentPlayer?.oderId
                      ? 'border-primary'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {player.nickname || `玩家 ${idx + 1}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        #{player.odeerNumber}
                      </p>
                    </div>
                    {player.isHost && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        房主
                      </span>
                    )}
                  </div>
                  {player.oderId === currentPlayer?.oderId && (
                    <p className="text-xs text-primary">这是你</p>
                  )}
                </div>
              ))}

              {/* 占位符 */}
              {Array.from({ length: Math.max(0, minPlayers - players.length) }).map(
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
                <p className="text-foreground font-medium">{room.settings?.skillDuration || 20} 秒</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">发言时长</p>
                <p className="text-foreground font-medium">{Math.floor((room.settings?.speechDuration || 300) / 60)} 分钟</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">投票时长</p>
                <p className="text-foreground font-medium">
                  {room.settings?.voteDuration ? `${room.settings.voteDuration} 秒` : '无限'}
                </p>
              </div>

              <hr className="border-border my-3" />

              <div>
                <p className="text-sm text-muted-foreground mb-2">角色配置</p>
                <div className="space-y-1 text-sm text-foreground">
                  {Object.entries(roleConfig).map(([key, value]) => (
                    value > 0 && (
                      <div key={key} className="flex justify-between">
                        <span>{ROLE_NAMES[key as keyof typeof ROLE_NAMES] || key}</span>
                        <span className="font-medium">{value as number}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <hr className="border-border my-3" />

              <div className="text-sm text-muted-foreground">
                <p className="mb-1">总角色数: {totalRoles}</p>
                <p>最少玩家: {minPlayers}</p>
              </div>
            </div>

            {!canStart && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  还需要 {minPlayers - players.length} 名玩家才能开始游戏
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
