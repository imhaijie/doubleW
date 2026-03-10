'use client'

import { GameRoom, Player, GameAction, GamePhase } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ROLE_NAMES } from '@/lib/constants'
import { AlertCircle, Clock } from 'lucide-react'

interface GameBoardProps {
  room: GameRoom
  players: Player[]
  currentPlayer: Player | null
  onAction: (action: GameAction) => void
  onSkipPhase: () => void
  onForceEnd: (winner: 'good' | 'werewolf') => void
}

export default function GameBoard({
  room,
  players,
  currentPlayer,
  onAction,
  onSkipPhase,
  onForceEnd,
}: GameBoardProps) {
  const phaseNames: Record<GamePhase, string> = {
    waiting: '等待中',
    ready: '准备中',
    assign_roles: '分配身份',
    night_werewolf: '狼人杀人',
    night_seer: '预言家查验',
    night_witch: '女巫操作',
    night_guard: '守卫保护',
    hunter_trigger: '猎人触发',
    day_announce: '死亡公告',
    day_speech: '白天发言',
    day_vote: '白天投票',
    day_revote: '白天重投',
    game_end: '游戏结束',
  }

  const isNightPhase = room.currentPhase.includes('night')
  const isDayPhase = room.currentPhase.includes('day')

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
                {isNightPhase && `第${room.nightRound}夜`}
                {isDayPhase && `第${room.dayRound}天`}
                {room.currentPhase === 'game_end' && '游戏结束'}
              </h1>
            </div>
            <div className="text-sm text-muted-foreground">
              {phaseNames[room.currentPhase]}
            </div>
          </div>

          {/* 日志区域 */}
          <div className="bg-background/50 rounded border border-border p-3 max-h-24 overflow-y-auto text-sm text-muted-foreground">
            {room.gameLog.slice(-3).map((log, idx) => (
              <div key={idx}>{log.message}</div>
            ))}
          </div>
        </div>
      </div>

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* 玩家列表 */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-4">玩家状态</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {players.map((player, idx) => (
                <div
                  key={player.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    player.isAlive
                      ? 'bg-card border-border hover:border-accent'
                      : 'bg-card/30 border-border/30 opacity-60'
                  } ${player === currentPlayer ? 'ring-2 ring-accent' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {player.name || `玩家 ${idx + 1}`}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        #{player.playerId}
                      </p>
                    </div>
                    {!player.isAlive && (
                      <span className="text-xs bg-destructive text-white px-2 py-1 rounded">
                        已出局
                      </span>
                    )}
                  </div>

                  {/* 当前玩家显示身份信息 */}
                  {player === currentPlayer && player.isAlive && (
                    <div className="mt-3 p-2 bg-accent/10 rounded text-sm">
                      <p className="text-foreground font-medium">
                        当前身份: {ROLE_NAMES[player.currentRole]}
                      </p>
                      {player.firstRole !== player.secondRole && (
                        <p className="text-xs text-muted-foreground">
                          {!player.firstRoleAlive && `第二身份: ${ROLE_NAMES[player.secondRole]}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 操作区域 */}
            {currentPlayer?.isAlive && room.currentPhase !== 'game_end' && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">你的操作</h3>
                <ActionPanel
                  currentPhase={room.currentPhase}
                  currentPlayer={currentPlayer}
                  players={players}
                  onAction={onAction}
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
                <p>当前轮次: 第{Math.max(room.nightRound, room.dayRound)}轮</p>
                <p>存活玩家: {players.filter(p => p.isAlive).length}/{players.length}</p>
                <p>阶段: {phaseNames[room.currentPhase]}</p>
              </div>
            </div>

            {/* 房主控制 */}
            {currentPlayer?.isHost && (
              <div className="bg-card border border-accent rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">房主控制</h3>
                <Button
                  onClick={onSkipPhase}
                  variant="outline"
                  size="sm"
                  className="w-full mb-2"
                >
                  ⏩ 跳过本阶段
                </Button>
                
                {/* 强制终局按钮（房主双死后）*/}
                {currentPlayer.firstRoleAlive === false && currentPlayer.secondRoleAlive === false && (
                  <>
                    <hr className="border-border my-3" />
                    <p className="text-xs text-muted-foreground mb-2">强制终局</p>
                    <Button
                      onClick={() => onForceEnd('good')}
                      size="sm"
                      className="w-full mb-2 bg-accent-secondary"
                    >
                      好人胜利
                    </Button>
                    <Button
                      onClick={() => onForceEnd('werewolf')}
                      size="sm"
                      className="w-full bg-destructive"
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
                    <div key={idx} className="border-l-2 border-accent/30 pl-2">
                      {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function ActionPanel({
  currentPhase,
  currentPlayer,
  players,
  onAction,
}: {
  currentPhase: GamePhase
  currentPlayer: Player
  players: Player[]
  onAction: (action: GameAction) => void
}) {
  const otherPlayers = players.filter(p => p.isAlive && p.id !== currentPlayer.id)

  switch (currentPhase) {
    case 'night_werewolf':
      if (currentPlayer.currentRole === 'werewolf') {
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">选择要杀害的目标</p>
            <div className="grid grid-cols-2 gap-2">
              {otherPlayers.map(p => (
                <Button
                  key={p.id}
                  onClick={() => onAction({
                    type: 'werewolf_kill',
                    playerId: currentPlayer.playerId,
                    targets: [p.playerId],
                  })}
                  variant="outline"
                  className="text-sm"
                >
                  {p.name || `玩家${p.playerId}`}
                </Button>
              ))}
            </div>
          </div>
        )
      }
      return <p className="text-muted-foreground">这个阶段与你无关，请等待</p>

    case 'night_seer':
      if (currentPlayer.currentRole === 'seer') {
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">选择要查验的玩家</p>
            <div className="grid grid-cols-2 gap-2">
              {otherPlayers.map(p => (
                <Button
                  key={p.id}
                  onClick={() => onAction({
                    type: 'seer_check',
                    playerId: currentPlayer.playerId,
                    target: p.playerId,
                  })}
                  variant="outline"
                  className="text-sm"
                >
                  {p.name || `玩家${p.playerId}`}
                </Button>
              ))}
            </div>
          </div>
        )
      }
      return <p className="text-muted-foreground">这个阶段与你无关，请等待</p>

    case 'day_vote':
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">投票出局一名玩家</p>
          <div className="grid grid-cols-2 gap-2">
            {otherPlayers.map(p => (
              <Button
                key={p.id}
                onClick={() => onAction({
                  type: 'vote',
                  playerId: currentPlayer.playerId,
                  target: p.playerId,
                })}
                variant="outline"
                className="text-sm"
              >
                投 {p.name || `玩家${p.playerId}`}
              </Button>
            ))}
          </div>
        </div>
      )

    default:
      return <p className="text-muted-foreground">这个阶段与你无关，请等待</p>
  }
}
