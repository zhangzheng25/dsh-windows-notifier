# AGENTS.md

## What this is

`dsh-windows-notifier` is a DeepSeek Harness (DSH) Cordis plugin: it listens for conversation status events and sends native Windows Toast notifications via `node-notifier`. It has a host half (`src/index.js`) and a hand-written web client half (`client/bundle.js`).

## Commands

```bash
npm run check   # node --check src/index.js && node --check client/bundle.js
```

- There is **no test suite**, no build step, and no typecheck.
- `node_modules` is gitignored; install with `pnpm install`.
- Node `>=20` is required.

## Architecture

- `src/index.js` — host plugin.
  - Exports `{ name: 'dsh-notifier', inject: ['webServer'], apply(ctx) }`.
  - Listens to `ctx.on('session/event')` for `turn/end`, `approval/asked`, and `tool/call` (`ask_user_question`).
  - Sends toasts through `node-notifier` (snoretoast on Windows).
  - Each toast gets an `id` and a `知道了` action; clicking it calls `notifier.notify({ remove: id })` to clear it from Windows Action Center.
  - Serves `GET/POST /dsh-notifier/config`.
- `client/bundle.js` — web client.
  - Hand-written bundle matching the DSH `client-modules` protocol: `window.__ModuleLoader__.load({ id, factory })`.
  - Must export `inject` and `apply`.
  - Registers `settings.section` with id `dsh-windows-notifier`.
- `cordis.patch.yml` — inserts the plugin row into the host composition (`id: notifier`, `name: dsh-windows-notifier`).

## Gotchas

- The **package name is `dsh-windows-notifier`**, but the local directory is still `dsh-notifier`.
  - The DSH web profile depends on it via `link:D:/deepseek-harness/plugin/dsh-notifier`.
  - Do not rename the directory without updating the profile `package.json`, `pnpm-lock.yaml`, and the `node_modules` junction.
- Config persists to `$DSH_HOME/plugins/dsh-notifier/config.json` (path intentionally still uses `dsh-notifier`).
- Toast icon is `deepseek.png`; `deepseek.svg` is the source asset.
- Host code changes require a DSH restart; client UI changes may only need a browser refresh after the server serves the new bundle.
- `README.md` and `README.en.md` explicitly state this is an AI-generated personal-learning project; keep that disclaimer if updating docs.
