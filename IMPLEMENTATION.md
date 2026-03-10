# 实现细节

本文档详细说明狼人杀面杀助手的核心实现。

## 双身份系统核心逻辑

### 身份管理
```typescript
interface Player {
  firstRole: Role           // 初始身份
  secondRole: Role          // 备用身份
  firstRoleAlive: boolean   // 第一身份是否存活
  secondRoleAlive: boolean  // 第二身份是否存活
  currentRole: Role         // 当前生效身份
  isAlive: boolean          // 至少一个身份存活
}

// 当前生效身份计算
currentRole = firstRoleAlive ? firstRole : secondRole
isAlive = firstRoleAlive || secondRoleAlive
```

### 死亡处理
1. **夜晚死亡**（狼人杀害）：
   - 优先杀害第一身份
   - 如果第一身份已死，杀害第二身份
   - 日志：`【X号】第一身份阵亡` 或 `【X号】出局`

2. **白天出局**（投票）：
   - 杀害当前生效身份
   - 日志：`【X号】出局`

3. **毒杀**（女巫）：
   - 杀害当前生效身份
   - 无法被守卫保护

## 胜利条件逻辑

### 好人胜利
```
所有狼人身份全部阵亡 (firstRoleAlive=false 且 secondRoleAlive=false)
```

### 狼人胜利（满足其一）
1. **所有金水宝宝死亡**
   - 定义：双身份都是 `villager`
   - 实现：检查所有玩家，若存活玩家中没有金水宝宝

2. **所有神职身份死亡**
   - 神职：`seer`, `witch`, `hunter`, `guard`, `white_wolf_king`
   - 规则：某身份若在任何玩家中都已死亡（包括已出局的玩家），则计为灭亡
   - 实现：遍历所有神职，检查是否存在存活的该身份

## 实时同步架构（PartyKit）

### 消息流向

```
Client ─→ PartyKit Server ─→ GameEngine ─→ 广播更新 ─→ All Clients
```

### 关键消息类型

1. **join_room**：玩家加入
2. **player_action**：技能执行（狼人杀、查验等）
3. **skip_phase**：房主跳过阶段
4. **phase_update**：阶段推进（广播）
5. **game_end**：游戏结束（广播）

### 阶段状态机

```
waiting ─→ ready ─→ assign_roles ─→ night_werewolf
                                        ↓
                                  night_seer
                                        ↓
                                  night_witch
                                        ↓
                                  night_guard
                                        ↓
                            day_announce ←─┐
                                ↓           │
                            day_speech      │
                                ↓           │
                            day_vote        │
                                ↓           │
                        [平票?] ─→ day_revote
                                ↓
                        [游戏结束?] ─→ game_end
                                ↓
                        [否] ─→ night_werewolf (下一轮)
```

## 数据库设计

### rooms 表
```sql
id UUID PRIMARY KEY
room_id VARCHAR(20) UNIQUE           -- 房间号
host_id UUID NOT NULL                -- 房主
state JSONB NOT NULL                 -- 完整房间状态
status VARCHAR(20)                   -- waiting/ready/playing/ended
created_at TIMESTAMP                 -- 创建时间
updated_at TIMESTAMP                 -- 更新时间
```

### game_records 表
```sql
id UUID PRIMARY KEY
room_id VARCHAR(20)                  -- 房间号
host_id UUID                         -- 房主
winner VARCHAR(20)                   -- 胜者（good/werewolf）
game_log JSONB                       -- 游戏日志
created_at TIMESTAMP                 -- 游戏完成时间
```

## 投票重投机制

### 算法
```
1. 计算每个目标的票数
2. 找出最高票数和拥有最高票的所有玩家
3. 如果只有一个最高票玩家 → 该玩家出局
4. 如果多个玩家并列最高票 → 进入重投
   - 只有这些并列玩家可被投票
   - 其他玩家置灰不可选
   - 重复投票直到产生唯一最高票
```

### 实现
```typescript
// 在 GameEngine.calculateVoteResult()
const voteCount = new Map<number, number>()
for (const [_, target] of votes) {
  voteCount.set(target, (voteCount.get(target) || 0) + 1)
}

const maxVotes = Math.max(...voteCount.values())
const topTargets = Array.from(voteCount.entries())
  .filter(([_, count]) => count === maxVotes)
  .map(([target, _]) => target)

if (topTargets.length === 1) {
  return { eliminated: topTargets[0], needRevote: false }
} else {
  return { eliminated: -1, needRevote: true }
}
```

## 狼人双刀逻辑

### 支持特性
- 狼人可选择两个不同目标
- 狼人可选择同一目标的两个身份（"刀双身份"）
- 若其中一个狼人身份死亡，剩余狼人仅能选一个目标

### 实现
```typescript
// 在 PartyKit 中
werewolfTargets: Map<number, number[]>  // playerId -> [target1, target2]

// 计算死亡时
for (const targets of werewolfTargets.values()) {
  for (const target of targets) {
    if (guardTarget !== target) {
      deathSet.add(target)  // 自动去重
    }
  }
}
```

## 守卫保护机制

### 规则
1. 可守护任何玩家（含自己）
2. **不可连续两夜守护同一玩家**（含自己）
3. 守卫自己时必须满足不连续规则

### 实现
```typescript
interface Player {
  lastGuardedBy?: number    // 最后被谁守卫
  lastGuardedAt?: number    // 最后被守卫的夜晚轮次
}

// 验证逻辑
function canGuard(guarderId: number, targetId: number, currentNight: number): boolean {
  const target = players.find(p => p.playerId === targetId)
  if (!target) return false
  
  // 如果上一夜被同一守卫保护过，则不能保护
  if (target.lastGuardedBy === guarderId && 
      target.lastGuardedAt === currentNight - 1) {
    return false
  }
  
  return true
}
```

## 房主功能实现

### 跳过按钮
```typescript
// 仅在特定阶段显示
if (isHost && [
  'night_werewolf', 'night_seer', 'night_witch', 'night_guard',
  'day_speech', 'day_vote', 'day_revote'
].includes(currentPhase)) {
  // 显示跳过按钮
}

// 点击时清除计时器并推进阶段
onClick={() => {
  clearTimeout(phaseTimer)
  advancePhase()
}}
```

### 强制终局
```typescript
// 仅在房主双身份死亡后可用
if (isHost && 
    !currentPlayer.firstRoleAlive && 
    !currentPlayer.secondRoleAlive) {
  // 显示"好人胜利"和"狼人胜利"按钮
  // 点击后直接设置 winner 并结束游戏
}
```

## 日志系统

### 日志格式
日志仅包含"主持人会说的话"，不包含具体身份信息。

```
第1夜：
  【4号】第一身份阵亡

第1天：
  发言结束 → 【2号】出局

第2天：
  平票 → 重投 → 【6号】出局

第2夜：
  无人死亡

第3天：
  【1号】自爆，带走【3号】
```

### 实现
```typescript
function addLog(room: GameRoom, message: string): void {
  const round = room.currentPhase.includes('night') 
    ? room.nightRound 
    : room.dayRound
  const type = room.currentPhase.includes('night') ? 'night' : 'day'
  
  room.gameLog.push({
    round,
    type,
    message,
    timestamp: new Date().toISOString(),
  })
}
```

## 性能优化

### 前端
- 使用 React 18 的 Suspense 进行代码分割
- 仅在阶段变化时重新渲染游戏板
- 虚拟列表渲染大房间列表

### 后端
- PartyKit 消息压缩
- 数据库连接池
- 自动清理过期房间

### 网络
- WebSocket 消息确认机制
- 自动重连（PartyKit 内置）
- 离线队列（计划特性）

## 安全考虑

### 身份隐私
- 身份信息仅存储在 PartyKit 内存中
- 客户端仅在特定条件下显示身份
- 游戏结束后从数据库返回完整身份

### 操作验证
- 验证玩家的操作与其当前角色一致
- 验证目标玩家是否存活
- 验证当前阶段是否允许该操作

### 防作弊
- 所有决策由服务器计算
- 客户端无法修改游戏状态
- 操作时间戳用于防止回放攻击

## 扩展点

未来可以轻松添加的功能：

1. **新角色**：在 `types.ts` 添加角色，在 `GameEngine` 实现逻辑
2. **自定义规则**：参数化游戏配置
3. **观众模式**：只读连接到房间
4. **回放系统**：从 `game_log` 重放游戏
5. **AI 玩家**：实现人工智能决策
6. **排位系统**：跟踪玩家等级和统计
7. **语音集成**：与 Agora 或 Twilio 集成
