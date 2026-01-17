
import { app, shell, BrowserWindow, webContents } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400, height: 900, show: false, autoHideMenuBar: true, backgroundColor: '#1b2838',
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false, webviewTag: true, nodeIntegration: true, contextIsolation: false }
  })
  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler((details) => { shell.openExternal(details.url); return { action: 'deny' } })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) { mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']) } else { mainWindow.loadFile(join(__dirname, '../renderer/index.html')) }
}
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.studymaster')
  app.on('browser-window-created', (_, window) => { optimizer.watchWindowShortcuts(window) })
  
  // 拦截所有 webContents 的新窗口请求
  app.on('web-contents-created', (_, contents) => {
    // 对于 webview，允许内部导航
    if (contents.getType() === 'webview') {
      contents.setWindowOpenHandler(({ url }) => {
        // 新窗口请求：在当前 webview 中打开
        contents.loadURL(url)
        return { action: 'deny' }
      })
      // 不拦截 will-navigate，允许正常的页面内导航
    } else {
      // 对于主窗口，外部链接用浏览器打开
      contents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url)
        return { action: 'deny' }
      })
    }
  })
  
  createWindow()
  app.on('activate', function () { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
