# 部署指南

本文档介绍如何将狼人杀面杀助手部署到生产环境。

## 前置要求

1. **Vercel 账户**（用于部署 Next.js）
2. **Supabase 账户**（用于数据库和认证）
3. **PartyKit 账户**（用于实时同步）或自托管 PartyKit

## 步骤 1: 设置 Supabase

### 创建项目
1. 访问 https://supabase.com
2. 创建新项目
3. 记下以下信息：
   - Project URL
   - Anon Key

### 初始化数据库
1. 在 Supabase 仪表板中打开 SQL Editor
2. 执行 `scripts/001_create_tables.sql` 中的 SQL

### 配置 RLS
所有表都已启用 RLS。根据需要调整策略。

## 步骤 2: 配置 PartyKit

### 选项 A：使用 PartyKit 云服务
1. 访问 https://partykit.io
2. 创建账户并创建新项目
3. 部署代码：
```bash
partykit deploy
```

### 选项 B：自托管 PartyKit
1. 安装 PartyKit CLI：
```bash
npm install -g partykit
```

2. 配置自己的服务器并运行 PartyKit

## 步骤 3: 部署到 Vercel

### 使用 GitHub
1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 添加环境变量（见下文）
4. 部署

### 使用 Vercel CLI
```bash
npm install -g vercel
vercel
```

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_PARTY_KIT_HOST=your-partykit-host.partykit.cloud
```

## 步骤 4: 验证部署

1. 访问您的 Vercel 部署 URL
2. 创建测试房间
3. 从多个设备加入测试实时同步
4. 完整进行一局游戏测试所有功能

## 生产环境优化

### 数据库性能
- 启用 Supabase 连接池
- 为 `rooms` 和 `game_records` 表添加索引
- 配置定期清理过期房间的任务

### 缓存策略
- 启用 CDN 缓存静态资源
- 配置 Vercel 的智能缓存

### 监控
- 在 Vercel 中设置错误跟踪
- 使用 Supabase 提供的性能监控
- 监控 PartyKit 的连接和消息量

## 故障排除

### 实时连接问题
- 验证 PartyKit 主机正确配置
- 检查 CORS 设置
- 查看浏览器控制台的 WebSocket 错误

### 数据库权限错误
- 确认 RLS 策略是否正确
- 验证 Supabase 密钥权限

### 部署失败
```bash
# 检查构建日志
vercel logs

# 查看项目配置
vercel env pull
```

## 扩展性考虑

当玩家数增加时：

1. **数据库优化**
   - 添加数据库连接池
   - 分片 `game_records` 表
   - 归档旧记录

2. **PartyKit 优化**
   - 将房间分散到多个 PartyKit 实例
   - 实现房间负载均衡

3. **前端优化**
   - 启用代码分割
   - 优化大房间列表的渲染

## 备份和恢复

### 数据库备份
Supabase 自动每天备份数据。要手动备份：

```bash
# 使用 pg_dump
pg_dump postgres://user:password@db.supabase.co:5432/postgres > backup.sql
```

### 恢复
```bash
psql postgres://user:password@db.supabase.co:5432/postgres < backup.sql
```

## 安全建议

1. **定期更新依赖**
   ```bash
   npm audit fix
   pnpm update
   ```

2. **启用 HTTPS**
   - Vercel 自动提供 HTTPS
   - 确保 PartyKit 也使用 WSS

3. **API 速率限制**
   - 在 Vercel 中配置速率限制
   - 防止滥用房间创建 API

4. **监控登录和权限**
   - 定期审查 Supabase 访问日志
   - 配置二因素认证

## 成本估算（每月）

- **Vercel**：~$20（Pro 计划）
- **Supabase**：~$25（适中使用）
- **PartyKit**：取决于并发连接数

总计：约 $45-60（中等规模）

## 获取帮助

- Vercel 文档：https://vercel.com/docs
- Supabase 文档：https://supabase.com/docs
- PartyKit 文档：https://docs.partykit.io
- GitHub Issues：报告项目相关问题
