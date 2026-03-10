'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, Plus } from 'lucide-react'

// 示例房间数据（实际应从数据库获取）
const MOCK_ROOMS = [
  {
    id: 'WOLF001',
    name: '狼人杀room 001',
    host: '房主1',
    players: 4,
    maxPlayers: 8,
    status: 'waiting' as const,
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: 'WOLF002',
    name: '排位赛房间',
    host: '房主2',
    players: 8,
    maxPlayers: 8,
    status: 'playing' as const,
    createdAt: new Date(Date.now() - 15 * 60000),
  },
]

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'waiting' | 'playing'>('all')

  const filteredRooms = MOCK_ROOMS.filter(room => {
    const matchesSearch = room.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.host.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || room.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <main className="min-h-screen bg-background">
      {/* 导航栏 */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-foreground hover:text-accent">
              <ChevronLeft className="w-4 h-4" />
              返回首页
            </Button>
          </Link>
          <Link href="/room/create">
            <Button className="gap-2 bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4" />
              创建房间
            </Button>
          </Link>
        </div>
      </nav>

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">浏览房间</h1>

          {/* 搜索和筛选 */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索房间号或房主..."
              className="md:flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
            />

            <div className="flex gap-2">
              {['all', 'waiting', 'playing'].map(status => (
                <Button
                  key={status}
                  onClick={() => setFilter(status as typeof filter)}
                  variant={filter === status ? 'default' : 'outline'}
                  className={filter === status ? '' : 'border-border hover:border-accent'}
                >
                  {status === 'all' && '全部'}
                  {status === 'waiting' && '等待中'}
                  {status === 'playing' && '进行中'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 房间列表 */}
        {filteredRooms.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">未找到匹配的房间</p>
            <Link href="/room/create">
              <Button className="bg-accent hover:bg-accent/90">创建新房间</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRooms.map(room => (
              <div
                key={room.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {room.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      房间号: {room.id} | 房主: {room.host}
                    </p>
                  </div>

                  <span className={`text-xs px-3 py-1 rounded font-medium ${
                    room.status === 'waiting'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-warning/20 text-warning'
                  }`}>
                    {room.status === 'waiting' ? '等待中' : '进行中'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>玩家: {room.players}/{room.maxPlayers}</span>
                    <span>创建于: {formatTime(room.createdAt)}</span>
                  </div>

                  {room.status === 'waiting' && (
                    <Link href={`/game/${room.id}`}>
                      <Button size="sm" className="bg-accent hover:bg-accent/90">
                        加入房间
                      </Button>
                    </Link>
                  )}

                  {room.status === 'playing' && (
                    <Button size="sm" variant="outline" disabled>
                      观看中
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  return date.toLocaleDateString('zh-CN')
}
