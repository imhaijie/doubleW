'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function DemoPage() {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* 导航 */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">🌙 狼人杀面杀助手</h1>
            <Link href="/" className="text-primary hover:underline">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 说明卡片 */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <h2 className="text-xl font-bold mb-4">📋 v0 预览版演示</h2>
          <p className="text-muted-foreground mb-4">
            这是一个完全功能的狼人杀游戏助手应用，但在 v0 预览中无法运行实时 WebSocket 服务器。
          </p>
          <p className="text-muted-foreground mb-6">
            要体验完整功能，请按照下方步骤部署到生产环境。
          </p>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-secondary transition-colors"
          >
            {showInfo ? '隐藏' : '显示'}部署步骤
          </button>

          {showInfo && (
            <div className="mt-6 space-y-4 text-sm">
              <h3 className="font-bold text-lg">快速部署指南</h3>

              <div className="bg-background p-4 rounded border border-border">
                <h4 className="font-semibold mb-2">步骤 1: 注册 PartyKit 账户</h4>
                <p className="text-muted-foreground">
                  访问 <a href="https://partykit.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PartyKit 官网</a> 创建账户
                </p>
              </div>

              <div className="bg-background p-4 rounded border border-border">
                <h4 className="font-semibold mb-2">步骤 2: 安装 PartyKit CLI</h4>
                <code className="block bg-card p-2 rounded text-xs overflow-x-auto">
                  npm install -g partykit
                </code>
              </div>

              <div className="bg-background p-4 rounded border border-border">
                <h4 className="font-semibold mb-2">步骤 3: 登录并部署</h4>
                <code className="block bg-card p-2 rounded text-xs overflow-x-auto mb-2">
                  partykit login
                </code>
                <code className="block bg-card p-2 rounded text-xs overflow-x-auto">
                  cd partykit-server && partykit deploy
                </code>
              </div>

              <div className="bg-background p-4 rounded border border-border">
                <h4 className="font-semibold mb-2">步骤 4: 配置环境变量</h4>
                <p className="text-muted-foreground mb-2">
                  在 Vercel 中添加 <code className="bg-card px-2 py-1 rounded">NEXT_PUBLIC_PARTY_KIT_HOST</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  值为: your-project.your-username.partykit.dev
                </p>
              </div>

              <p className="text-muted-foreground pt-4">
                详细指南: 查看项目中的 <code className="bg-card px-2 py-1 rounded">PARTYKIT_SETUP.md</code>
              </p>
            </div>
          )}
        </div>

        {/* 已实现的功能 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">✅ 已实现的功能</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 双身份系统（每个玩家两个独立身份）</li>
              <li>• 完整的角色池（狼人、预言家、女巫、守卫、猎人、白狼王）</li>
              <li>• 自动化游戏流程和规则执行</li>
              <li>• 房主控制面板和配置系统</li>
              <li>• 身份隐藏和安全机制</li>
              <li>• Supabase 数据库集成</li>
              <li>• 完整的 TypeScript 类型系统</li>
              <li>• 深色主题 UI（Tailwind CSS）</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">🚀 生产部署包含</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• PartyKit Cloud WebSocket 实时同步</li>
              <li>• 多玩家即时通信</li>
              <li>• 完整的游戏状态管理</li>
              <li>• 自动阶段推进</li>
              <li>• 玩家操作验证</li>
              <li>• 游戏结束检测</li>
              <li>• 断线重连支持</li>
              <li>• 完整的游戏日志记录</li>
            </ul>
          </div>
        </div>

        {/* 技术栈信息 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">🛠️ 技术栈</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">前端</h4>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>Next.js 16</li>
                <li>React 19</li>
                <li>TypeScript</li>
                <li>Tailwind CSS v4</li>
                <li>shadcn/ui</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">后端</h4>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>PartyKit (WebSocket)</li>
                <li>Supabase PostgreSQL</li>
                <li>Node.js</li>
                <li>REST API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">部署</h4>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>Next.js → Vercel</li>
                <li>PartyKit → PartyKit Cloud</li>
                <li>Database → Supabase</li>
                <li>Git → GitHub</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 文件导航 */}
        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">📁 重要文件</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline mb-2"
              >
                📘 PARTYKIT_SETUP.md - PartyKit 部署指南
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline mb-2"
              >
                📗 README.md - 项目文档
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline mb-2"
              >
                📙 IMPLEMENTATION.md - 实现细节
              </a>
            </div>
            <div>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline mb-2"
              >
                ⚙️ lib/game-engine.ts - 游戏逻辑核心
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline mb-2"
              >
                🎮 partykit-server/game.ts - WebSocket 服务器
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline mb-2"
              >
                🎨 app/globals.css - 主题配置
              </a>
            </div>
          </div>
        </div>

        {/* 后续步骤 */}
        <div className="mt-12 bg-background border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">📝 后续步骤</h3>
          <ol className="space-y-3 text-sm">
            <li>
              <span className="font-semibold">1. 本地测试</span>
              <p className="text-muted-foreground">
                按照 README.md 启动本地开发服务器进行测试
              </p>
            </li>
            <li>
              <span className="font-semibold">2. 部署数据库</span>
              <p className="text-muted-foreground">
                确认 Supabase 连接并运行迁移脚本初始化表
              </p>
            </li>
            <li>
              <span className="font-semibold">3. 部署 PartyKit</span>
              <p className="text-muted-foreground">
                按照 PARTYKIT_SETUP.md 部署到 PartyKit Cloud
              </p>
            </li>
            <li>
              <span className="font-semibold">4. 部署 Next.js</span>
              <p className="text-muted-foreground">
                连接 GitHub 仓库到 Vercel，配置环境变量后自动部署
              </p>
            </li>
            <li>
              <span className="font-semibold">5. 开始游戏</span>
              <p className="text-muted-foreground">
                邀请朋友加入房间，享受完整的在线狼人杀体验
              </p>
            </li>
          </ol>
        </div>
      </div>
    </main>
  )
}
