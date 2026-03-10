# 狼人杀面杀助手

线下狼人杀的数字影子 —— 不干扰面对面交流，只提供精准、无声的规则执行。

## 核心特性

### 双身份系统
- 每个玩家拥有两个身份
- 第一身份死亡后自动切换到第二身份
- 身份信息全程隐藏，仅在游戏结束后可见

### 自动化规则执行
- **夜晚阶段**：狼人杀人 → 预言家查验 → 女巫操作 → 守卫保护
- **白天阶段**：死亡公告 → 发言 → 投票 → 结果处理
- 平票自动重投，直至唯一最高票
- 猎人死亡后触发开枪机制

### 完整的角色系统
- **狼人**：夜晚杀人，目标是消灭所有好人
- **白狼王**：可自爆带走一人出局
- **预言家**：夜晚查验玩家身份（好人/狼人）
- **女巫**：夜晚可救人或毒杀（二选一）
- **猎人**：死亡后可开枪带走一人
- **守卫**：夜晚保护一人，抵挡狼人杀害
- **平民**：无技能，依靠推理生存

### 房主控制
- 创建房间时自定义配置：技能时间、发言时长、投票时长
- 游戏进行中可跳过阶段加快节奏
- 房主双身份死亡后可强制终局

### 日志和回放
- 所有游戏过程记录为"主持人播报"格式
- 游戏结束后可查看完整的双身份和操作时间轴
- 支持游戏历史统计

## 技术栈

- **前端**：Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **实时同步**：PartyKit (WebSocket)
- **数据库**：Supabase PostgreSQL
- **身份验证**：Supabase Auth
- **组件库**：shadcn/ui

## 快速开始

### 1. 安装依赖
```bash
pnpm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env.local`，填入：
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PARTY_KIT_HOST=localhost:1999
```

### 3. 初始化数据库
```bash
# 运行迁移脚本
pnpm exec ts-node scripts/001_create_tables.sql
```

### 4. 启动开发服务器
```bash
# 在一个终端启动 Next.js
pnpm dev

# 在另一个终端启动 PartyKit
npx partykit dev party/game.ts
```

访问 http://localhost:3000

## 项目结构

```
.
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 首页
│   ├── game/[roomId]/page.tsx   # 游戏界面
│   ├── room/create/page.tsx     # 创建房间
│   ├── rooms/page.tsx           # 房间列表
│   ├── api/rooms/               # 房间 API
│   └── globals.css              # 全局样式
├── components/
│   ├── ui/                      # shadcn/ui 组件
│   ├── room-form.tsx            # 房间创建表单
│   └── game/
│       ├── game-lobby.tsx       # 游戏大厅
│       └── game-board.tsx       # 游戏主界面
├── lib/
│   ├── types.ts                 # 类型定义
│   ├── constants.ts             # 常量
│   ├── game-engine.ts           # 游戏逻辑引擎
│   ├── room-service.ts          # 房间服务
│   └── supabase/                # Supabase 客户端
├── hooks/
│   └── use-game.ts              # PartyKit 游戏钩子
├── party/
│   └── game.ts                  # PartyKit 服务器
└── scripts/
    └── 001_create_tables.sql    # 数据库迁移
```

## 游戏流程

### 房间创建阶段
1. 房主创建房间，设置配置
2. 玩家加入房间
3. 房主点击"开始游戏"启动

### 身份分配
- 系统随机分配两个身份给每个玩家
- 初始时激活第一身份

### 夜晚阶段（按顺序）
1. **狼人阶段**：狼人选择目标杀害
2. **预言家阶段**：预言家选择目标查验，系统立即返回结果
3. **女巫阶段**：女巫选择救人或毒人
4. **守卫阶段**：守卫选择保护的玩家
5. **结算**：计算实际死亡，执行猎人开枪

### 白天阶段
1. **公告**：宣布夜晚死亡名单
2. **发言**：存活玩家按顺序发言
3. **投票**：所有存活玩家投票
4. **结果**：
   - 平票 → 重投（仅平票玩家参与）
   - 唯一最高票 → 玩家出局

### 胜利条件
- **好人胜利**：所有狼人身份都被消灭
- **狼人胜利**：
  - 所有"金水宝宝"（双平民）死亡，或
  - 所有神职身份（预言家/女巫/猎人/守卫/白狼王）都已死亡

## API 文档

### 创建房间
```
POST /api/rooms
{
  "hostId": "user_id",
  "roomId": "WOLF001",
  "skillDuration": 15,
  "speechDuration": 300,
  "voteDuration": 60,
  "roleConfig": {
    "werewolves": 2,
    "villagers": 3,
    "seers": 1,
    "witches": 1,
    "hunters": 1,
    "guards": 1,
    "whiteWolfKings": 0
  }
}
```

### 获取房间列表
```
GET /api/rooms?status=waiting
```

## PartyKit 消息格式

### 连接消息
```json
{
  "type": "join_room",
  "data": { "playerId": 1, "playerName": "玩家1" }
}
```

### 操作消息
```json
{
  "type": "player_action",
  "data": {
    "type": "werewolf_kill",
    "playerId": 1,
    "targets": [3]
  }
}
```

### 广播消息
```json
{
  "type": "phase_update",
  "data": { "phase": "night_werewolf", "room": {...} },
  "timestamp": 1234567890
}
```

## 开发指南

### 添加新的技能
1. 在 `lib/types.ts` 中扩展 `Role` 类型
2. 在 `lib/constants.ts` 中添加角色名称和规则
3. 在 `GameEngine` 中实现技能逻辑
4. 在 `game-board.tsx` 中添加 UI

### 修改游戏阶段
1. 更新 `GamePhase` 类型
2. 在 `PartyKit` 服务器中添加阶段处理
3. 更新游戏板的 UI

### 自定义主题
编辑 `app/globals.css` 中的设计令牌来改变颜色方案。

## 故障排除

### 连接问题
- 确保 PartyKit 服务器在 `localhost:1999` 运行
- 检查 `.env.local` 中的 `NEXT_PUBLIC_PARTY_KIT_HOST`

### 数据库错误
- 确认 Supabase 连接正确
- 运行迁移脚本初始化数据库表
- 检查 RLS 策略是否正确配置

### 身份隐藏不工作
- 验证当前玩家是否为房主或游戏结束
- 检查 `GameBoard` 组件中的身份显示逻辑

## 许可证

MIT
