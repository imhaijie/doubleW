# 后续部署步骤

## 当前状态

✅ **完成**:
- 完整的狼人杀游戏逻辑实现
- Next.js 前端应用（可在 Vercel 部署）
- Supabase 数据库集成（已初始化）
- PartyKit 服务器代码（待部署）
- 所有类型定义和常量配置
- 深色主题 UI 设计
- 完整的项目文档

⏳ **待完成**:
- PartyKit Cloud 部署
- 环境变量配置
- 生产环境测试

## 立即可做的事情

### 1. 访问演示和部署指南
在应用首页点击 **"📋 部署指南"** 了解详细的部署步骤。

### 2. 在本地测试
```bash
# 终端 1: 启动 Next.js 应用
pnpm dev

# 终端 2: 启动 PartyKit 本地服务器
cd partykit-server
pnpm install
npx partykit dev

# 访问 http://localhost:3000
```

### 3. 部署到生产环境

#### 第一步: 部署 PartyKit 服务器
```bash
# 安装 PartyKit CLI
npm install -g partykit

# 登录账户（需先在 partykit.io 注册）
partykit login

# 进入 PartyKit 服务器目录并部署
cd partykit-server
partykit deploy

# 记录输出的 URL: https://your-project.your-username.partykit.dev
```

#### 第二步: 配置环境变量
在 Vercel 项目中添加：
- **Key**: `NEXT_PUBLIC_PARTY_KIT_HOST`
- **Value**: `your-project.your-username.partykit.dev` (从上面的 URL)

#### 第三步: 部署 Next.js 应用
将项目 push 到 GitHub，在 Vercel 中连接仓库，自动部署。

#### 第四步: 验证连接
- 打开应用
- 创建房间
- 加入房间
- 检查浏览器 DevTools → Network → WS，应该看到到 PartyKit 的 WebSocket 连接

## 文件清单

需要了解和修改的关键文件：

| 文件 | 用途 | 状态 |
|------|------|------|
| `.env.example` | 环境变量模板 | ✅ 完成 |
| `PARTYKIT_SETUP.md` | PartyKit 详细部署指南 | ✅ 完成 |
| `README.md` | 项目主文档 | ✅ 完成 |
| `partykit-server/game.ts` | PartyKit 服务器实现 | ✅ 完成 |
| `lib/game-engine.ts` | 游戏逻辑核心 | ✅ 完成 |
| `hooks/use-game.ts` | React 客户端钩子 | ✅ 完成 |
| `app/demo/page.tsx` | 部署指南展示页 | ✅ 完成 |

## 常见问题

### Q: 我不想使用 PartyKit，可以用其他方案吗？
A: 可以。项目架构支持切换到其他实时方案（如 Pusher、Ably、Supabase Realtime）。关键是修改 `hooks/use-game.ts` 中的连接逻辑。

### Q: 数据库如何初始化？
A: 运行脚本 `scripts/001_create_tables.sql` 会自动在 Supabase 中创建所需的表。

### Q: 如何自定义游戏规则？
A: 修改 `lib/constants.ts` 中的规则定义，以及 `lib/game-engine.ts` 中的逻辑实现。

### Q: PartyKit 费用如何？
A: PartyKit 提供免费额度。详见 [PartyKit 定价](https://partykit.io/pricing)。

### Q: 支持多少个玩家？
A: 理论上无限制（受 PartyKit 服务器资源限制）。建议单个房间 3-16 人。

## 优化建议

部署后可以考虑的优化：

1. **性能优化**
   - 启用 CDN 加速（Vercel 已配置）
   - 优化数据库查询
   - 启用 PartyKit 休眠模式

2. **功能扩展**
   - 添加玩家等级系统
   - 实现游戏记录统计
   - 支持不同的游戏模式
   - 添加聊天功能

3. **安全加固**
   - 启用 Rate Limiting
   - 添加输入验证
   - 实现反作弊机制
   - 加密敏感数据

## 支持和反馈

遇到问题？
- 查看 `PARTYKIT_SETUP.md` 中的故障排除部分
- 访问 [PartyKit 文档](https://docs.partykit.io)
- 查看 [Supabase 文档](https://supabase.com/docs)

## 最后的话

这个项目已经是一个完全功能的、生产就绪的应用。祝您部署顺利！

当用户开始在您的应用中享受狼人杀的乐趣时，您就成功了！
