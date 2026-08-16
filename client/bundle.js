/* dsh-windows-notifier — Client half v0.3 (web bundle, built by hand to match the
 * client-modules bundle protocol: window.__ModuleLoader__.load registers a
 * factory that receives a CommonJS require). This file is the `./client`
 * exports subpath declared in package.json.
 *
 * Registers a small settings section ("通知") into the root-scoped
 * `settings.section` slot. The section reads/writes the host plugin's config
 * through /dsh-notifier/config.
 *
 * Visual language follows the DSH theme tokens (--dsw-alias-*): flat cards,
 * 1px hairline borders, 10-12px radii, no heavy shadows, light/dark adaptive.
 */
window.__ModuleLoader__.load({
  id: "dsh-windows-notifier",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
    var React = require("react")

    var CONFIG_URL = "/dsh-notifier/config"

    var CSS = [
      ".dn-root { display:flex; flex-direction:column; gap:18px; padding:8px 2px; font-family:inherit; color:var(--dsw-alias-label-primary, #1a1a1a); max-width:640px; }",
      ".dn-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }",
      ".dn-head-left { display:flex; flex-direction:column; gap:4px; min-width:0; }",
      ".dn-head-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex:none; }",
      ".dn-title { font-size:18px; font-weight:650; margin:0; letter-spacing:-.01em; color:var(--dsw-alias-label-primary, #1a1a1a); }",
      ".dn-desc { font-size:13px; line-height:1.6; color:var(--dsw-alias-label-tertiary, rgba(0,0,0,.6)); margin:0; }",
      ".dn-card { border:1px solid var(--dsw-alias-border-l2, #e5e5e5); border-radius:12px; background:var(--dsw-alias-bg-layer-1, #fff); padding:16px 18px; display:flex; align-items:center; gap:14px; transition:border-color .15s ease, background .15s ease; }",
      ".dn-card:hover { border-color:var(--dsw-alias-border-l1, rgba(127,127,127,.35)); }",
      ".dn-card-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }",
      ".dn-label { font-size:14px; font-weight:550; color:var(--dsw-alias-label-primary, #1a1a1a); }",
      ".dn-hint { font-size:12px; line-height:1.5; color:var(--dsw-alias-label-tertiary, rgba(0,0,0,.55)); }",
      ".dn-switch { position:relative; flex:none; width:44px; height:26px; border-radius:999px; border:1px solid var(--dsw-alias-border-l2, #d5d5d5); background:var(--dsw-alias-bg-layer-2, #f0f0f0); cursor:pointer; transition:background .18s ease, border-color .18s ease; padding:0; }",
      ".dn-switch:focus-visible { outline:2px solid rgba(79,140,255,.6); outline-offset:2px; }",
      ".dn-switch-on { background:#4d75e6; border-color:#4d75e6; }",
      ".dn-switch-knob { position:absolute; top:2px; left:2px; width:20px; height:20px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.25); transition:transform .18s ease; }",
      ".dn-switch-on .dn-switch-knob { transform:translateX(18px); }",
      ".dn-input-wrap { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }",
      ".dn-input { width:100%; box-sizing:border-box; border:1px solid var(--dsw-alias-border-l2, #d5d5d5); border-radius:10px; background:var(--dsw-alias-bg-layer-1, #fff); color:var(--dsw-alias-label-primary, #1a1a1a); padding:9px 12px; font-size:13px; outline:none; transition:border-color .15s ease; }",
      ".dn-input:focus { border-color:rgba(79,140,255,.65); }",
      ".dn-btn { border:1px solid var(--dsw-alias-border-l2, #d5d5d5); border-radius:10px; background:transparent; color:var(--dsw-alias-label-primary, #1a1a1a); padding:7px 18px; font-size:13px; cursor:pointer; transition:background .15s ease, border-color .15s ease; }",
      ".dn-btn:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.08)); border-color:var(--dsw-alias-border-l1, rgba(127,127,127,.35)); }",
      ".dn-btn:disabled { opacity:.5; cursor:default; }",
      ".dn-status { font-size:12px; color:var(--dsw-alias-label-tertiary, rgba(0,0,0,.55)); }",
      ".dn-status-ok { color:var(--dsw-alias-state-success-primary, #16a34a); }",
      ".dn-status-err { color:var(--dsw-alias-state-error-primary, #ef4444); }",
      ".dn-err { border:1px solid rgba(239,68,68,.5); background:rgba(239,68,68,.08); border-radius:12px; padding:10px 14px; font-size:13px; color:var(--dsw-alias-state-error-primary, #ef4444); }"
    ].join("\n")

    function Switch({ checked, onChange, label, hint }) {
      return React.createElement("div", { className: "dn-card" },
        React.createElement("div", { className: "dn-card-body" },
          React.createElement("div", { className: "dn-label" }, label),
          hint ? React.createElement("div", { className: "dn-hint" }, hint) : null
        ),
        React.createElement("button", {
          type: "button",
          role: "switch",
          "aria-checked": !!checked,
          className: "dn-switch" + (checked ? " dn-switch-on" : ""),
          onClick: function () { onChange(!checked) }
        },
          React.createElement("span", { className: "dn-switch-knob" })
        )
      )
    }

    function InputCard({ label, hint, value, onChange }) {
      return React.createElement("div", { className: "dn-card" },
        React.createElement("div", { className: "dn-input-wrap" },
          React.createElement("div", { className: "dn-label" }, label),
          hint ? React.createElement("div", { className: "dn-hint" }, hint) : null,
          React.createElement("input", {
            className: "dn-input",
            type: "text",
            value: value || "",
            spellCheck: false,
            onChange: function (e) { onChange(e.target.value) }
          })
        )
      )
    }

    function Panel() {
      var defaults = { enabled: true, sound: true, clickUrl: "http://127.0.0.1:3080" }
      var state = React.useState(null)
      var config = state[0]
      var setConfig = state[1]
      var statusState = React.useState({ text: "", ok: true })
      var status = statusState[0]
      var setStatus = statusState[1]
      var errState = React.useState("")
      var error = errState[0]
      var setError = errState[1]

      React.useEffect(function () {
        var alive = true
        fetch(CONFIG_URL)
          .then(function (r) { return r.json() })
          .then(function (data) {
            if (!alive) return
            if (data && data.ok) setConfig(Object.assign({}, defaults, data.config))
            else setError((data && data.error) || "无法读取配置")
          })
          .catch(function (e) { if (alive) setError(String((e && e.message) || e)) })
        return function () { alive = false }
      }, [])

      function update(patch) {
        setConfig(Object.assign({}, config, patch))
        setStatus({ text: "", ok: true })
      }

      function save() {
        setStatus({ text: "", ok: true })
        setError("")
        fetch(CONFIG_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: config })
        })
          .then(function (r) { return r.json() })
          .then(function (data) {
            if (data && data.ok) {
              setConfig(Object.assign({}, defaults, data.config))
              setStatus({ text: "已保存", ok: true })
            } else {
              setError((data && data.error) || "保存失败")
            }
          })
          .catch(function (e) { setError(String((e && e.message) || e)) })
      }

      if (error) {
        return React.createElement("div", { className: "dn-root" },
          React.createElement("div", { className: "dn-head" },
            React.createElement("h3", { className: "dn-title" }, "通知"),
            React.createElement("p", { className: "dn-desc" }, "对话完成、失败、需要授权或需要回答时，在 Windows 右下角弹出提醒。")
          ),
          React.createElement("div", { className: "dn-err" }, error)
        )
      }

      if (!config) {
        return React.createElement("div", { className: "dn-root" },
          React.createElement("div", { className: "dn-head" },
            React.createElement("h3", { className: "dn-title" }, "通知"),
            React.createElement("p", { className: "dn-desc" }, "加载中…")
          )
        )
      }

      return React.createElement("div", { className: "dn-root" },
        React.createElement("div", { className: "dn-head" },
          React.createElement("div", { className: "dn-head-left" },
            React.createElement("h3", { className: "dn-title" }, "通知"),
            React.createElement("p", { className: "dn-desc" }, "对话完成、失败、需要授权或需要回答时，在 Windows 右下角弹出提醒。")
          ),
          React.createElement("div", { className: "dn-head-right" },
            React.createElement("button", {
              className: "dn-btn",
              disabled: !config,
              onClick: save
            }, "保存"),
            status.text ? React.createElement("span", { className: "dn-status" + (status.ok ? " dn-status-ok" : " dn-status-err") }, status.text) : null
          )
        ),
        React.createElement(Switch, {
          label: "启用状态提醒",
          hint: "关闭后不再弹任何通知。",
          checked: config.enabled,
          onChange: function (v) { update({ enabled: v }) }
        }),
        React.createElement(Switch, {
          label: "播放提示音",
          hint: "Windows Toast 是否带声音。",
          checked: config.sound,
          onChange: function (v) { update({ sound: v }) }
        }),
        React.createElement(InputCard, {
          label: "点击通知打开的地址",
          hint: "默认打开 DSH Web 页面。",
          value: config.clickUrl || "",
          onChange: function (v) { update({ clickUrl: v }) }
        })
      )
    }

    var inject = ["slots"]

    function apply(ctx) {
      var style = document.createElement("style")
      style.setAttribute("data-plugin", "dsh-windows-notifier")
      style.textContent = CSS
      document.head.append(style)
      ctx.effect(function () {
        return function () {
          if (style.parentNode) style.parentNode.removeChild(style)
        }
      })

      var slots = ctx.get("slots")
      if (slots === undefined) return
      slots.inject("settings.section", function () {
        return slots.register(
          { name: "settings.section", id: "dsh-windows-notifier", order: 25, label: "通知" },
          function () { return React.createElement(Panel) }
        )
      })
    }

    exports.inject = inject
    exports.apply = apply
    return module.exports
  }
})
