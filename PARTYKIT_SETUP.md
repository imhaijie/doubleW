# PartyKit 部署指南

## 快速开始

### 步骤 1: 创建 PartyKit 账户

1. 访问 [PartyKit 官网](https://partykit.io)
2. 点击 "Sign Up" 注册账户
3. 验证邮箱地址

### 步骤 2: 安装 PartyKit CLI

```bash
npm install -g partykit
# 或使用 pnpm
pnpm add -g partykit
```

### 步骤 3: 初始化部署配置

在项目根目录运行：

```bash
partykit login
```

按照提示输入您的 PartyKit 账户凭证。

### 步骤 4: 部署 PartyKit 服务器

进入 `partykit-server` 目录：

```bash
cd partykit-server
pnpm install
```

然后部署到 PartyKit Cloud：

```bash
partykit deploy
```

这会输出类似的信息：

```
✓ Deployed to https://your-project.your-username.partykit.dev
```

复制这个 URL，去掉 `https://` 前缀和任何路径，得到：
```
your-project.your-username.partykit.dev
```

### 步骤 5: 配置环境变量

1. 在 Vercel 项目设置中，进入 "Vars" 或 "Environment Variables"
2. 添加新变量：
   - **Key**: `NEXT_PUBLIC_PARTY_KIT_HOST`
   - **Value**: `your-project.your-username.partykit.dev` (从步骤 4 获取)

3. 保存并重新部署 Next.js 应用

### 步骤 6: 验证连接

1. 打开应用
2. 创建房间
3. 在浏览器开发者工具 → Network 中查看 WebSocket 连接
4. 应该看到连接到 `wss://your-project.your-username.partykit.dev/parties/game/...`

## 故障排除

### WebSocket 连接失败

**问题**: 显示 `WebSocket connection failed`

**解决方案**:
1. 确保 `NEXT_PUBLIC_PARTY_KIT_HOST` 设置正确
2. 检查 PartyKit 服务器是否成功部署：访问 `https://your-project.your-username.partykit.dev/parties/game/test` 应该返回 404（这是正常的）
3. 清除浏览器缓存和重新加载

### PartyKit 服务器更新

如果修改了 `partykit-server/game.ts` 中的代码：

```bash
cd partykit-server
partykit deploy
```

然后刷新浏览器重新连接。

## 开发环境（本地测试）

如果想在本地测试 PartyKit 服务器（不使用 Cloud）：

```bash
cd partykit-server
pnpm install
npx partykit dev
```

然后在另一个终端：

```bash
# 设置本地环境变量
export NEXT_PUBLIC_PARTY_KIT_HOST=localhost:1999
pnpm dev
```

访问 `http://localhost:3000` 进行本地测试。

## PartyKit 工作原理

- **房间 ID**: 格式为 `game:roomId`，例如 `game:room123`
- **WebSocket 路径**: `/parties/game/{roomId}`
- **消息格式**: JSON，通过 `onMessage` 处理
- **自动重连**: 客户端会自动尝试重新连接断开的连接

## 更多资源

- [PartyKit 官方文档](https://docs.partykit.io)
- [PartyKit API 参考](https://docs.partykit.io/reference/partyserver-api/)
- [示例项目](https://github.com/partykit/partykit/tree/main/examples)
