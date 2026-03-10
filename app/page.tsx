'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles, Users, Zap } from 'lucide-react'

export default function HomePage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      {/* 导航栏 */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">狼人杀面杀助手</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/demo">
              <Button variant="outline" className="border-border hover:border-accent hover:text-accent">
                📋 部署指南
              </Button>
            </Link>
            <Link href="/rooms">
              <Button variant="outline" className="border-border hover:border-accent hover:text-accent">
                加入房间
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 英雄部分 */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            线下狼人杀的数字影子
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            不干扰面对面交流，只提供精准、无声的规则执行。抬头看人，低头点按钮，让欢声笑语回归游戏。
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/room/create">
              <Button className="px-8 py-6 text-lg bg-primary hover:bg-primary/90">
                创建房间
              </Button>
            </Link>
            <Link href="/rooms">
              <Button variant="outline" className="px-8 py-6 text-lg border-border hover:border-accent">
                浏览房间
              </Button>
            </Link>
          </div>
        </div>

        {/* 功能介绍 */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {/* 功能卡片1 */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors">
            <Users className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">完整双身份系统</h3>
            <p className="text-muted-foreground">
              每个玩家拥有两个身份，身份死亡后自动切换，真假难辨，增加游戏深度。
            </p>
          </div>

          {/* 功能卡片2 */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors">
            <Zap className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">自动化规则执行</h3>
            <p className="text-muted-foreground">
              所有技能、投票、死亡判定由系统静默处理，玩家只需点按钮，节奏完全掌控。
            </p>
          </div>

          {/* 功能卡片3 */}
          <div className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors">
            <Sparkles className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">身份隐私保护</h3>
            <p className="text-muted-foreground">
              身份信息全程隐藏，仅在游戏结束或房主失败后才能查看，真相由你推理。
            </p>
          </div>
        </div>

        {/* 角色展示 */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">游戏角色</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: '狼人', desc: '夜晚杀人，赢得全面胜利' },
              { name: '预言家', desc: '夜晚查验，识别狼人阵营' },
              { name: '女巫', desc: '夜晚救人/毒人，两大技能' },
              { name: '猎人', desc: '死亡后开枪，带走一人' },
              { name: '守卫', desc: '夜晚保护，抵挡杀害' },
              { name: '白狼王', desc: '白天自爆，带走一人出局' },
              { name: '平民', desc: '无技能，依靠推理存活' },
              { name: '金水宝宝', desc: '双身份平民，胜利条件独特' },
            ].map((role, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-1">{role.name}</h4>
                <p className="text-sm text-muted-foreground">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
