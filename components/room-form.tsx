'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RoleConfig } from '@/lib/types'
import { SKILL_DURATIONS, SPEECH_DURATIONS, getMinPlayers } from '@/lib/constants'

interface RoomFormProps {
  onSubmit: (roomId: string, config: any) => void
  isLoading?: boolean
}

export default function RoomForm({ onSubmit, isLoading }: RoomFormProps) {
  const [roomId, setRoomId] = useState('')
  const [skillDuration, setSkillDuration] = useState(15)
  const [speechDuration, setSpeechDuration] = useState(300)
  const [voteDuration, setVoteDuration] = useState(60)
  
  const [roleConfig, setRoleConfig] = useState<RoleConfig>({
    werewolves: 2,
    villagers: 3,
    seers: 1,
    witches: 1,
    hunters: 1,
    guards: 1,
    whiteWolfKings: 0,
  })

  const totalRoles = Object.values(roleConfig).reduce((a, b) => a + b, 0)
  const minPlayers = getMinPlayers(roleConfig)

  const handleRoleChange = (role: keyof RoleConfig, value: number) => {
    setRoleConfig(prev => ({
      ...prev,
      [role]: Math.max(0, value),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!roomId.trim()) {
      alert('请输入房间号')
      return
    }

    if (totalRoles < 2) {
      alert('至少需要2个角色')
      return
    }

    onSubmit(roomId, {
      skillDuration,
      speechDuration,
      voteDuration,
      roleConfig,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 房间号 */}
      <div className="space-y-2">
        <Label htmlFor="roomId" className="text-foreground">房间号（自定义）</Label>
        <Input
          id="roomId"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
          placeholder="如: WOLF888"
          className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          maxLength={20}
        />
        <p className="text-sm text-muted-foreground">
          仅允许字母和数字，长度1-20字符
        </p>
      </div>

      {/* 技能配置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">技能配置</h3>
        
        {/* 技能发动时间 */}
        <div className="space-y-2">
          <Label htmlFor="skillDuration" className="text-foreground">技能发动时间</Label>
          <select
            id="skillDuration"
            value={skillDuration}
            onChange={(e) => setSkillDuration(Number(e.target.value))}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
          >
            {SKILL_DURATIONS.map(d => (
              <option key={d} value={d} className="bg-card">{d}秒</option>
            ))}
          </select>
        </div>

        {/* 发言总时长 */}
        <div className="space-y-2">
          <Label htmlFor="speechDuration" className="text-foreground">发言总时长</Label>
          <select
            id="speechDuration"
            value={speechDuration}
            onChange={(e) => setSpeechDuration(Number(e.target.value))}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
          >
            {SPEECH_DURATIONS.map(d => (
              <option key={d} value={d} className="bg-card">{Math.floor(d / 60)}分钟</option>
            ))}
          </select>
        </div>

        {/* 投票时长 */}
        <div className="space-y-2">
          <Label htmlFor="voteDuration" className="text-foreground">投票时长</Label>
          <select
            id="voteDuration"
            value={voteDuration}
            onChange={(e) => setVoteDuration(Number(e.target.value))}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
          >
            <option value={60} className="bg-card">60秒</option>
            <option value={120} className="bg-card">120秒</option>
            <option value={-1} className="bg-card">无限</option>
          </select>
        </div>
      </div>

      {/* 角色配置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">角色配置</h3>
        <p className="text-sm text-muted-foreground">
          总角色数: {totalRoles} | 最少玩家数: {minPlayers}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'werewolves', label: '狼人' },
            { key: 'villagers', label: '平民' },
            { key: 'seers', label: '预言家' },
            { key: 'witches', label: '女巫' },
            { key: 'hunters', label: '猎人' },
            { key: 'guards', label: '守卫' },
            { key: 'whiteWolfKings', label: '白狼王' },
          ].map(role => (
            <div key={role.key} className="space-y-1">
              <Label htmlFor={role.key} className="text-foreground text-sm">{role.label}</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange(role.key as keyof RoleConfig, roleConfig[role.key as keyof RoleConfig] - 1)}
                  className="w-8 h-8 rounded bg-border hover:bg-accent/20 text-foreground flex items-center justify-center"
                >
                  -
                </button>
                <input
                  id={role.key}
                  type="number"
                  value={roleConfig[role.key as keyof RoleConfig]}
                  onChange={(e) => handleRoleChange(role.key as keyof RoleConfig, Number(e.target.value))}
                  className="w-12 h-8 bg-input border border-border rounded text-center text-foreground"
                />
                <button
                  type="button"
                  onClick={() => handleRoleChange(role.key as keyof RoleConfig, roleConfig[role.key as keyof RoleConfig] + 1)}
                  className="w-8 h-8 rounded bg-border hover:bg-accent/20 text-foreground flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 提交按钮 */}
      <Button 
        type="submit" 
        disabled={isLoading || totalRoles < 2}
        className="w-full"
      >
        {isLoading ? '创建中...' : '创建房间'}
      </Button>
    </form>
  )
}
