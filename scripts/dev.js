import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { startServer } from '../server/index.js'

// 一个命令启动 API 和 Vite，退出时一并关闭。
try {
  const api = await startServer()
  const vite = spawn(
    process.execPath,
    [
      fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)),
      ...process.argv.slice(2),
    ],
    { stdio: 'inherit' },
  )

  let stopping = false
  function stop(code = 0) {
    if (stopping) return
    stopping = true
    vite.kill('SIGTERM')
    api.close()
    api.closeAllConnections()
    process.exitCode = code
  }
  process.on('SIGINT', () => stop())
  process.on('SIGTERM', () => stop())
  vite.on('error', (error) => {
    console.error(error.message)
    stop(1)
  })
  vite.on('exit', (code) => stop(code ?? 0))
} catch (error) {
  console.error(`开发服务启动失败：${error.message}`)
  process.exitCode = 1
}
