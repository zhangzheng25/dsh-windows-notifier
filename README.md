# dsh-windows-notifier

<p align="center">
  <strong>简体中文</strong> | <a href="README.en.md">English</a>
</p>

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 插件：在 Windows 任务完成、失败、需要授权或需要回答时，于右下角弹出原生 Toast 提醒。它直接监听 DSH 的 `session/event` 与 `turn/end`，不需要轮询页面状态。

> ⚠️ **AI 生成项目，仅用于个人学习与本地实验。**
> 代码由 AI 辅助生成，可能不包含生产级错误处理、安全加固或完整测试，请勿直接用于关键生产环境。

## 功能特性

- 🔔 **Windows Toast** — 使用 `node-notifier` 发送 Windows 原生右下角通知，无需额外安装运行时。
- ✅ **状态提醒** — 回答完成 / 回答失败 / 回答中断 / 需要授权 / 需要回答，都会弹出对应状态。
- 💬 **状态即标题，提问即正文** — 通知标题显示状态文字（如 `回答完成` / `需要授权`），正文显示你最新一条提问内容；调用 skill 时正文折叠为 `调用 xxx skill`。
- 🚫 **子代理隔离** — 只监听顶层会话，子代理完成不会打扰你。
- 🎛️ **极简设置页** — 设置 → 通知：启用开关、提示音开关、点击通知打开的地址。
- 🎨 **DSH 原生风格** — 亮色/暗色主题自适应，使用 `--dsw-alias-*` 主题变量；扁平卡片、细边框、圆角。

## 安装

从 GitHub 安装：

```bash
dsh plugin --profile web add github:zhangzheng25/dsh-windows-notifier
```

或从本地目录安装：

```bash
dsh plugin --profile web add D:\path\to\dsh-windows-notifier
```

`dsh plugin` 会在 profile 目录中转发给 pnpm 安装，并自动调和 `dsh.profile.bundles`；包内 `dsh.bundle.patch`（`cordis.patch.yml`）把插件行插入宿主组合，`dsh.client.platform: "web"` 让 web 外壳加载 `client/bundle.js`。

**安装后重启 DSH**，打开 设置 → 通知 即可看到配置页。

## 架构

```
┌────────────────────────── Host（Node.js）──────────────────────────┐
│ src/index.js                                                       │
│  • ctx.on('session/event')        ← 监听 DSH 会话事件流             │
│  • turn/end → 回答完成 / 失败 / 中断                               │
│  • approval/asked → 需要授权                                       │
│  • tool/call(ask_user_question) → 需要回答                         │
│  • latestUserPrompt()            ← 取最近一条用户提问作为正文        │
│  • promptBody()                  ← skill 调用折叠为“调用 xxx skill” │
│  • node-notifier                 ← 发送 Windows Toast              │
│  • webServer.register('/dsh-notifier/config')                     │
└─────────────────────────────────────────────────────────────────────┘
                          │ fetch('/dsh-notifier/config')
                          ▼
┌────────────────────────── Client（浏览器）─────────────────────────┐
│ client/bundle.js — 手工构建的 web bundle，符合 client-modules 协议  │
│  （window.__ModuleLoader__.load）                                  │
│  • slots.inject('settings.section') → 设置页「通知」                │
│  • 启用开关 / 提示音开关 / 点击地址输入框                           │
└─────────────────────────────────────────────────────────────────────┘
```

## 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `enabled` | boolean | `true` | 总开关，关闭后不弹任何通知 |
| `sound` | boolean | `true` | Windows Toast 是否播放提示音 |
| `clickUrl` | string | `http://127.0.0.1:3080` | 点击通知时打开的地址 |

配置保存在：

```text
$DSH_HOME/plugins/dsh-notifier/config.json
```

## 触发事件

| 状态 | 触发事件 | Toast 标题 |
|---|---|---|
| 回答完成 | `turn/end` reason `completed` / `max-tokens` | `回答完成` |
| 回答失败 | `turn/end` reason `error` | `回答失败` |
| 回答中断 | `turn/end` reason `aborted` / `blocked` | `回答已中断` / `回答被阻塞` |
| 需要授权 | `session/event` `approval/asked` | `需要授权` |
| 需要回答 | `session/event` `tool/call` `ask_user_question` | `需要回答` |

Toast 正文固定为用户最新提问；当用户消息以 `<skill_content name="...">` 开头时，正文显示为 `调用 某skill skill`。

## 已知限制

- **正文截断**：通知正文取用户提问前 120 字，超长会被截断并追加 `…`。
- **Windows only**：当前只针对 Windows Toast 优化，macOS / Linux 未做适配。
- **通知图标**：使用项目内 `deepseek.png` 作为 Toast 图标。
- **无测试**：仅提供 `node --check` 语法检查，暂无自动化测试。

## 开发

```bash
npm run check      # node --check src/index.js && node --check client/bundle.js
```

Client bundle 为手工编写以匹配 `client-modules` bundle 协议，无需构建步骤。

## 免责声明

本项目为 **AI 生成**，主要用于**个人学习** DSH 插件开发与 Windows Toast 通知实现。使用前请自行审查代码，风险自负。

## 许可

[MIT](./LICENSE)
