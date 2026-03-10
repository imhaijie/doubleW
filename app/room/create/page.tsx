'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RoomForm from '@/components/room-form'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function CreateRoomPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (roomId: string, config: any) => {
    setIsLoading(true)
    try {
      // TODO: 发送到服务器创建房间
      // 暂时导航到房间页面
      router.push(`/game/${roomId}`)
    } catch (error) {
      console.error('创建房间失败:', error)
      alert('创建房间失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* 导航栏 */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-foreground hover:text-accent">
              <ChevronLeft className="w-4 h-4" />
              返回首页
            </Button>
          </Link>
        </div>
      </nav>

      {/* 主容器 */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">创建新房间</h1>
          <p className="text-muted-foreground">配置房间参数，自定义游戏规则</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <RoomForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </main>
  )
}
