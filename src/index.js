'use strict'

/**
 * dsh-notifier — Host half
 *
 * Minimal DeepSeek Harness plugin:
 *   - Listens to `session/event`.
 *   - Sends a Windows toast when a root conversation changes status:
 *       回答完成 / 回答失败 / 回答中断 / 需要授权 / 需要回答
 *   - Toast title is the status; body is the user's latest question.
 *   - Skill invocations are collapsed to "调用 xxx skill" in the body.
 *   - Serves /dsh-notifier/config so the small settings section in the web UI
 *     can read and update the supported options.
 *
 * Kept intentionally small: no tool details, no steps, no duration, no
 * webhooks, no Feishu, no browser notifications.
 */

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')
const notifier = require('node-notifier')

const DEFAULT_CONFIG = {
  enabled: true,
  sound: true,
  clickUrl: 'http://127.0.0.1:3080',
}

// Windows toast image. The user-provided deepseek.png lives beside the plugin
// sources; node-notifier/snoretoast expects a local raster image.
const ICON_PATH = path.join(__dirname, '..', 'deepseek.png')

function configFile() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, 'plugins', 'dsh-notifier', 'config.json')
}

function loadConfig() {
  try {
    const saved = JSON.parse(fs.readFileSync(configFile(), 'utf8'))
    if (saved && typeof saved === 'object') {
      return {
        enabled: typeof saved.enabled === 'boolean' ? saved.enabled : DEFAULT_CONFIG.enabled,
        sound: typeof saved.sound === 'boolean' ? saved.sound : DEFAULT_CONFIG.sound,
        clickUrl: typeof saved.clickUrl === 'string' ? saved.clickUrl : DEFAULT_CONFIG.clickUrl,
      }
    }
  } catch {
    /* first run — use defaults */
  }
  return { ...DEFAULT_CONFIG }
}

function saveConfig(config) {
  try {
    const file = configFile()
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(config, null, 2))
  } catch (e) {
    // best-effort persistence; the plugin still works for this process
  }
}

function truncate(text, max) {
  const s = String(text || '').replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max) + '…' : s
}

function extractText(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((block) => block && (block.type === 'text' || block.type === 'reasoning'))
    .map((block) => block.text || '')
    .join(' ')
    .trim()
}

/**
 * Find the user's latest real question before a given event seq.
 * System reminders are ignored.
 */
function latestUserPrompt(session, beforeSeq, max = 120) {
  const events = Array.isArray(session && session.events) ? session.events : []
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i]
    if (!e) continue
    if (typeof beforeSeq === 'number' && e.seq >= beforeSeq) continue
    if (e.type !== 'user/message') continue
    const text = extractText(e.data && e.data.content)
    if (text && !text.startsWith('<system-reminder>')) return truncate(text, max)
  }
  return ''
}

/**
 * Build the toast body from the user's latest question.
 * Skill invocations are collapsed to a short "调用 xxx skill" line instead of
 * showing the whole <skill_content> payload.
 */
function promptBody(session, beforeSeq) {
  const text = latestUserPrompt(session, beforeSeq)
  const match = /<skill_content\s+name=["']([^"']+)["']/i.exec(text)
  if (match) return '调用 ' + match[1] + ' skill'
  return text
}

function isRootSession(session) {
  const header = session && session.header
  if (!header) return true
  // Subagents are noisy; forks of a top-level session are still root-like.
  if (header.origin === 'subagent') return false
  if (typeof header.delegationDepth === 'number' && header.delegationDepth > 0) return false
  return true
}

function openUrl(url) {
  if (!url) return
  try {
    const child = spawn('cmd', ['/c', 'start', '', url], {
      windowsHide: true,
      detached: true,
      stdio: 'ignore',
    })
    child.on('error', () => {})
    child.unref()
  } catch {
    /* clicking is best-effort */
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1024 * 1024) {
        reject(new Error('request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

module.exports = {
  name: 'dsh-notifier',
  inject: ['webServer'],

  apply(ctx) {
    let config = loadConfig()

    function updateConfig(next) {
      const incoming = next && typeof next === 'object' ? next : {}
      const merged = {
        enabled: typeof incoming.enabled === 'boolean' ? incoming.enabled : config.enabled,
        sound: typeof incoming.sound === 'boolean' ? incoming.sound : config.sound,
        clickUrl: typeof incoming.clickUrl === 'string' ? incoming.clickUrl : config.clickUrl,
      }
      config = merged
      saveConfig(config)
      return config
    }

    function sendToast(title, message) {
      if (!config.enabled) return
      const options = {
        title,
        message,
        icon: ICON_PATH,
        sound: config.sound === true,
      }
      notifier.notify(options, (error, response) => {
        if (error) {
          if (ctx.logger) ctx.logger.warn('[dsh-notifier] toast failed: ' + String((error && error.message) || error))
          return
        }
        const action = response && response.activationType
        if (action === 'click' || action === 'activate') {
          openUrl(config.clickUrl)
        }
      })
    }

    ctx.on('session/event', (session, event) => {
      if (!event || !config.enabled || !isRootSession(session)) return

      // 需要授权
      if (event.type === 'approval/asked') {
        sendToast('需要授权', promptBody(session, event.seq) || 'DSH 通知')
        return
      }

      // 需要回答（ask_user_question 工具触发）
      if (event.type === 'tool/call' && event.data && event.data.name === 'ask_user_question') {
        sendToast('需要回答', promptBody(session, event.seq) || 'DSH 通知')
        return
      }

      // 一轮对话结束
      if (event.type !== 'turn/end') return
      const reason = event.data && event.data.reason && event.data.reason.kind
      let message
      switch (reason) {
        case 'completed':
        case 'max-tokens':
          message = '回答完成'
          break
        case 'error':
          message = '回答失败'
          break
        case 'aborted':
          message = '回答已中断'
          break
        case 'blocked':
          message = '回答被阻塞'
          break
        default:
          return
      }
      sendToast(message, promptBody(session, event.seq) || 'DSH 通知')
    })

    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: '/dsh-notifier/config',
      handler: async (req, res) => {
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, { ok: true, config })
            return
          }
          if (req.method === 'POST') {
            const raw = await readBody(req)
            let payload = {}
            try {
              payload = JSON.parse(raw || '{}')
            } catch {
              sendJson(res, 400, { ok: false, error: 'invalid JSON' })
              return
            }
            const next = payload.config || payload
            sendJson(res, 200, { ok: true, config: updateConfig(next) })
            return
          }
          sendJson(res, 405, { ok: false, error: 'method not allowed' })
        } catch (e) {
          sendJson(res, 500, { ok: false, error: String((e && e.message) || e) })
        }
      },
    }))

    ctx.logger.info('[dsh-notifier] plugin loaded')
  },
}
