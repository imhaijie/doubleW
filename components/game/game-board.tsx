'use client'

import { GameRoom, Player, GameAction, GamePhase, Role } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ROLE_NAMES, PHASE_NAMES } from '@/lib/constants'
import { useState } from 'react'

interface GameBoardProps {
  room: GameRoom
  players: Player[]
  currentPlayer: Player | null
  onAction: (action: GameAction) => void
  onSkipPhase: () => void
  onForceEnd: (winner: 'villagers' | 'werewolves') => void
  isHost: boolean
  timeLeft: number
  canPerformAction: (actionType: string) => boolean
  getCurrentRole: () => Role | null
}

export default function GameBoard({
  room,
  players,
  currentPlayer,
  onAction,
  onSkipPhase,
  onForceEnd,
  isHost,
  timeLeft,
  canPerformAction,
  getCurrentRole,
}: GameBoardProps) {
  const isNightPhase = room.currentPhase.includes('night')
  const isDayPhase = room.currentPhase.includes('day')
  const currentRole = getCurrentRole()
  
  // 检查房主是否双死（用于强制终局）
  const isHostDead = currentPlayer && !currentPlayer.identity1Alive && !currentPlayer.identity2Alive

  return (
    <main className="min-h-screen bg-background">
      {/* 顶部阶段指示器 */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isNightPhase ? 'bg-blue-500' : isDayPhase ? 'bg-yellow-500' : 'bg-gray-500'
              }`}></div>
              <h1 className="text-2xl font-bold text-foreground">
                {isNightPhase && `第${room.currentDay}夜`}
                {isDayPhase && `第${room.currentDay}天`}
                {room.currentPhase === 'game_end' && '游戏结束'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {timeLeft > 0 && (
                <div className="text-lg font-mono text-primary">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {PHASE_NAMES[room.currentPhase] || room.currentPhase}
              </div>
            </div>
          </div>

          {/* 计时进度条 */}
          {timeLeft > 0 && (
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 游戏结束画面 */}
        {room.currentPhase === 'game_end' && (
          <div className="text-center py-12">
            <h2 className="text-4xl font-bold mb-4">
              {room.winner === 'villagers' ? '好人阵营获胜' : '狼人阵营获胜'}
            </h2>
            <p className="text-muted-foreground mb-8">游戏结束，以下是所有玩家的身份</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {players.map((player) => (
                <div key={player.oderId} className="bg-card border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-2">{player.nickname}</h3>
                  <p className="text-sm text-primary">
                    {ROLE_NAMES[player.role1]} / {ROLE_NAMES[player.role2]}
                  </p>
                </div>
              ))}
            </div>
            <Button className="mt-8" onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
          </div>
        )}

        {room.currentPhase !== 'game_end' && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* 玩家列表 */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-foreground mb-4">玩家状态</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {players.map((player) => {
                  const isAlive = player.identity1Alive || player.identity2Alive
                  const isMe = player.oderId === currentPlayer?.oderId
                  
                  return (
                    <div
                      key={player.oderId}
                      className={`border rounded-lg p-4 transition-colors ${
                        isAlive
                          ? 'bg-card border-border hover:border-primary'
                          : 'bg-card/30 border-border/30 opacity-60'
                      } ${isMe ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            #{player.odeerNumber} {player.nickname}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {player.identity1Alive && player.identity2Alive && '双身份存活'}
                            {player.identity1Alive && !player.identity2Alive && '第一身份存活'}
                            {!player.identity1Alive && player.identity2Alive && '第二身份存活'}
                            {!player.identity1Alive && !player.identity2Alive && '已出局'}
                          </p>
                        </div>
                        {!isAlive && (
                          <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                            出局
                          </span>
                        )}
                      </div>

                      {/* 当前玩家显示自己的身份 */}
                      {isMe && isAlive && (
                        <div className="mt-3 p-2 bg-primary/10 rounded text-sm">
                          <p className="text-foreground font-medium">
                            当前身份: {ROLE_NAMES[currentRole || 'villager']}
                          </p>
                          {player.role1 !== player.role2 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              第一身份: {ROLE_NAMES[player.role1]} {!player.identity1Alive && '(已死)'}
                              <br />
                              第二身份: {ROLE_NAMES[player.role2]} {!player.identity2Alive && '(已死)'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 操作区域 */}
              {currentPlayer && (currentPlayer.identity1Alive || currentPlayer.identity2Alive) && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">你的操作</h3>
                  <ActionPanel
                    currentPhase={room.currentPhase}
                    currentRole={currentRole}
                    players={players}
                    currentPlayer={currentPlayer}
                    onAction={onAction}
                    canPerformAction={canPerformAction}
                    room={room}
                  />
                </div>
              )}
            </div>

            {/* 右侧信息面板 */}
            <div className="space-y-6">
              {/* 当前阶段信息 */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">阶段信息</h3>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p>当前轮次: 第{room.currentDay}轮</p>
                  <p>存活玩家: {players.filter(p => p.identity1Alive || p.identity2Alive).length}/{players.length}</p>
                  <p>阶段: {PHASE_NAMES[room.currentPhase] || room.currentPhase}</p>
                </div>
              </div>

              {/* 房主控制 */}
              {isHost && (
                <div className="bg-card border border-primary rounded-lg p-4">
                  <h3 className="font-semibold text-foreground mb-3">房主控制</h3>
                  <Button
                    onClick={onSkipPhase}
                    variant="outline"
                    size="sm"
                    className="w-full mb-2"
                  >
                    跳过本阶段
                  </Button>
                  
                  {/* 强制终局按钮（房主双死后）*/}
                  {isHostDead && (
                    <>
                      <hr className="border-border my-3" />
                      <p className="text-xs text-muted-foreground mb-2">强制终局</p>
                      <Button
                        onClick={() => onForceEnd('villagers')}
                        size="sm"
                        className="w-full mb-2 bg-green-600 hover:bg-green-700"
                      >
                        好人胜利
                      </Button>
                      <Button
                        onClick={() => onForceEnd('werewolves')}
                        size="sm"
                        className="w-full bg-destructive hover:bg-destructive/90"
                      >
                        狼人胜利
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* 游戏日志 */}
              <div className="bg-card border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-foreground mb-3">游戏日志</h3>
                <div className="text-xs space-y-1 text-muted-foreground">
                  {room.gameLog.length === 0 ? (
                    <p>暂无记录</p>
                  ) : (
                    room.gameLog.slice().reverse().map((log, idx) => (
                      <div key={idx} className="border-l-2 border-primary/30 pl-2">
                        {log.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function ActionPanel({
  currentPhase,
  currentRole,
  players,
  currentPlayer,
  onAction,
  canPerformAction,
  room,
}: {
  currentPhase: GamePhase
  currentRole: Role | null
  players: Player[]
  currentPlayer: Player
  onAction: (action: GameAction) => void
  canPerformAction: (actionType: string) => boolean
  room: GameRoom
}) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [actionSubmitted, setActionSubmitted] = useState(false)
  
  const alivePlayers = players.filter(p => (p.identity1Alive || p.identity2Alive) && p.oderId !== currentPlayer.oderId)

  const handleAction = (type: string, targetId?: string) => {
    onAction({
      type: type as GameAction['type'],
      targetId,
      playerId: currentPlayer.oderId,
    })
    setActionSubmitted(true)
  }

  if (actionSubmitted) {
    return (
      <div className="text-center py-4">
        <p className="text-primary font-medium">操作已提交，等待其他玩家...</p>
      </div>
    )
  }

  // 狼人阶段
  if (currentPhase === 'night_werewolf') {
    if (canPerformAction('werewolf_kill')) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">选择要杀害的目标</p>
          <div className="grid grid-cols-2 gap-2">
            {alivePlayers.map(p => (
              <Button
                key={p.oderId}
                onClick={() => handleAction('werewolf_kill', p.oderId)}
                variant="outline"
                className="text-sm hover:bg-destructive hover:text-destructive-foreground"
              >
                #{p.odeerNumber} {p.nickname}
              </Button>
            ))}
          </div>
        </div>
      )
    }
    return <p className="text-muted-foreground">狼人正在行动，请等待...</p>
  }

  // 预言家阶段
  if (currentPhase === 'night_seer') {
    if (canPerformAction('seer_check')) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">选择要查验的玩家</p>
          <div className="grid grid-cols-2 gap-2">
            {alivePlayers.map(p => (
              <Button
                key={p.oderId}
                onClick={() => handleAction('seer_check', p.oderId)}
                variant="outline"
                className="text-sm hover:bg-blue-500 hover:text-white"
              >
                #{p.odeerNumber} {p.nickname}
              </Button>
            ))}
          </div>
        </div>
      )
    }
    return <p className="text-muted-foreground">预言家正在查验，请等待...</p>
  }

  // 女巫阶段
  if (currentPhase === 'night_witch') {
    if (canPerformAction('witch_save') || canPerformAction('witch_poison')) {
      return (
        <div className="space-y-4">
          {room.witchPotions.save && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">使用解药？</p>
              <div className="flex gap-2">
                <Button onClick={() => handleAction('witch_save', 'save')} variant="outline" className="flex-1">
                  使用解药
                </Button>
                <Button onClick={() => handleAction('witch_save')} variant="ghost" className="flex-1">
                  不使用
                </Button>
              </div>
            </div>
          )}
          {room.witchPotions.poison && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">使用毒药？</p>
              <div className="grid grid-cols-2 gap-2">
                {alivePlayers.map(p => (
                  <Button
                    key={p.oderId}
                    onClick={() => handleAction('witch_poison', p.oderId)}
                    variant="outline"
                    className="text-sm hover:bg-purple-500 hover:text-white"
                  >
                    毒 #{p.odeerNumber}
                  </Button>
                ))}
                <Button onClick={() => handleAction('witch_poison')} variant="ghost">
                  不使用
                </Button>
              </div>
            </div>
          )}
          {!room.witchPotions.save && !room.witchPotions.poison && (
            <p className="text-muted-foreground">你已经没有药水了</p>
          )}
        </div>
      )
    }
    return <p className="text-muted-foreground">女巫正在行动，请等待...</p>
  }

  // 守卫阶段
  if (currentPhase === 'night_guard') {
    if (canPerformAction('guard_protect')) {
      const lastTarget = room.nightActions.lastGuardTarget
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">选择要保护的玩家（不可连续两夜保护同一人）</p>
          <div className="grid grid-cols-2 gap-2">
            {players.filter(p => p.identity1Alive || p.identity2Alive).map(p => (
              <Button
                key={p.oderId}
                onClick={() => handleAction('guard_protect', p.oderId)}
                variant="outline"
                disabled={p.oderId === lastTarget}
                className={`text-sm ${p.oderId === lastTarget ? 'opacity-50' : 'hover:bg-green-500 hover:text-white'}`}
              >
                {p.oderId === currentPlayer.oderId ? '保护自己' : `#${p.odeerNumber} ${p.nickname}`}
              </Button>
            ))}
          </div>
        </div>
      )
    }
    return <p className="text-muted-foreground">守卫正在行动，请等待...</p>
  }

  // 投票阶段
  if (currentPhase === 'day_vote' || currentPhase === 'day_revote') {
    if (canPerformAction('vote')) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {currentPhase === 'day_revote' ? '重新投票，选择出局玩家' : '投票选择出局玩家'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {alivePlayers.map(p => (
              <Button
                key={p.oderId}
                onClick={() => handleAction('vote', p.oderId)}
                variant="outline"
                className="text-sm hover:bg-orange-500 hover:text-white"
              >
                投 #{p.odeerNumber} {p.nickname}
              </Button>
            ))}
          </div>
        </div>
      )
    }
  }

  // 白狼王自爆
  if (currentPhase === 'day_speech' && canPerformAction('white_wolf_explode')) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive font-medium">你是白狼王，可以选择自爆并带走一人</p>
        <div className="grid grid-cols-2 gap-2">
          {alivePlayers.map(p => (
            <Button
              key={p.oderId}
              onClick={() => handleAction('white_wolf_explode', p.oderId)}
              variant="destructive"
              className="text-sm"
            >
              自爆带走 #{p.odeerNumber}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // 默认等待
  return <p className="text-muted-foreground">当前阶段无需操作，请等待...</p>
}
