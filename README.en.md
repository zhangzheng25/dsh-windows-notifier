# dsh-windows-notifier

<p align="center">
  <a href="README.md">简体中文</a> | <strong>English</strong>
</p>

A minimal [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that shows native Windows toast notifications when a task completes, fails, needs authorization, or needs an answer. It listens to DSH `session/event` / `turn/end` directly, no page polling required.

> ⚠️ **AI-generated project for personal learning only.**
> This code was generated with AI assistance and may not include production-grade error handling, security hardening, or complete tests. Do not use it in critical production environments.

## Features

- 🔔 **Windows Toast** — Uses `node-notifier` to send native Windows notifications, no extra runtime required.
- ✅ **Status notifications** — Answer completed / failed / interrupted / authorization required / answer required.
- 💬 **Question as title** — The toast title is your latest question (truncated to 60 chars); the body only shows the status, without tool calls, duration, or steps.
- 🚫 **Subagent isolation** — Only root sessions are monitored; subagent completions do not disturb you.
- 🎛️ **Minimal settings page** — Settings → Notifications: enable toggle, sound toggle, and click URL.
- 🎨 **DSH native style** — Light/dark theme aware using `--dsw-alias-*` variables.

## Install

From GitHub:

```bash
dsh plugin --profile web add github:zhangzheng25/dsh-windows-notifier
```

Or from a local directory:

```bash
dsh plugin --profile web add D:\path\to\dsh-windows-notifier
```

Restart DSH after installation, then open **Settings → Notifications**.

## Configuration

| Key | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `true` | Master switch. |
| `sound` | boolean | `true` | Whether the Windows toast plays a sound. |
| `clickUrl` | string | `http://127.0.0.1:3080` | URL opened when clicking "View" on the toast. |

## Triggers

| Status | Trigger | Toast body |
|---|---|---|
| Completed | `turn/end` reason `completed` / `max-tokens` | `Answer completed` |
| Failed | `turn/end` reason `error` | `Answer failed` |
| Interrupted | `turn/end` reason `aborted` / `blocked` | `Answer interrupted` / `Answer blocked` |
| Authorization required | `session/event` `approval/asked` | `Authorization required` |
| Answer required | `session/event` `tool/call` `ask_user_question` | `Answer required` |

## Development

```bash
npm run check
```

## Disclaimer

This project is **AI-generated** and intended for **personal learning**. Review the code before use; use at your own risk.

## License

[MIT](./LICENSE)
