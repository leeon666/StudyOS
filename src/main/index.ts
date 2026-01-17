
import { app, shell, BrowserWindow, webContents, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

// 存储笔记窗口
const noteWindows = new Map<number, BrowserWindow>()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400, height: 900, show: false, autoHideMenuBar: true, backgroundColor: '#1b2838',
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false, webviewTag: true, nodeIntegration: true, contextIsolation: false }
  })
  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler((details) => { shell.openExternal(details.url); return { action: 'deny' } })
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) { mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']) } else { mainWindow.loadFile(join(__dirname, '../renderer/index.html')) }
}

// 创建笔记窗口
function createNoteWindow(id: number, x: number, y: number, width: number, height: number, opacity: number, alwaysOnTop: boolean): void {
  console.log('Creating note window:', { id, x, y, width, height, opacity, alwaysOnTop })
  
  const noteWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop,
    skipTaskbar: true,
    resizable: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  
  noteWindow.setOpacity(opacity)
  
  // 加载笔记窗口页面
  const noteUrl = is.dev && process.env['ELECTRON_RENDERER_URL']
    ? `${process.env['ELECTRON_RENDERER_URL']}/note.html?id=${id}`
    : `file://${join(__dirname, '../renderer/note.html')}?id=${id}`
  
  console.log('Loading note window URL:', noteUrl)
  noteWindow.loadURL(noteUrl)
  
  noteWindow.once('ready-to-show', () => {
    console.log('Note window ready to show:', id)
    noteWindow.show()
  })
  
  noteWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Note window failed to load:', errorCode, errorDescription)
  })
  
  noteWindows.set(id, noteWindow)
  
  noteWindow.on('closed', () => {
    console.log('Note window closed:', id)
    noteWindows.delete(id)
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      mainWindow.webContents.send('note-window-closed', id)
    }
  })
}

// IPC 处理
ipcMain.on('create-note-window', (_, data) => {
  console.log('Main process: received create-note-window', data)
  createNoteWindow(data.id, data.x, data.y, data.width, data.height, data.opacity, data.alwaysOnTop)
  console.log('Main process: createNoteWindow called')
})

ipcMain.on('update-note-window', (_, data) => {
  const win = noteWindows.get(data.id)
  if (!win) return
  
  if (data.x !== undefined && data.y !== undefined) {
    win.setPosition(data.x, data.y)
  }
  if (data.width !== undefined && data.height !== undefined) {
    win.setSize(data.width, data.height)
  }
  if (data.opacity !== undefined) {
    win.setOpacity(data.opacity)
  }
  if (data.alwaysOnTop !== undefined) {
    win.setAlwaysOnTop(data.alwaysOnTop)
  }
})

ipcMain.on('close-note-window', (_, id) => {
  const win = noteWindows.get(id)
  if (win) {
    win.close()
  }
})

ipcMain.on('update-note-data', (_, data) => {
  // 转发给对应的笔记窗口
  const win = noteWindows.get(data.windowId)
  if (win) {
    win.webContents.send('note-data-updated', data)
  }
})

ipcMain.on('request-note-data', (event, windowId) => {
  console.log('Main process received request-note-data for window:', windowId)
  // 转发给主窗口
  const allWindows = BrowserWindow.getAllWindows()
  console.log('Total windows:', allWindows.length)
  
  // 找到主窗口（不是笔记窗口的那个）
  const mainWindow = allWindows.find(w => {
    const isNoteWindow = Array.from(noteWindows.values()).includes(w)
    return !isNoteWindow
  })
  
  if (mainWindow) {
    console.log('Forwarding request to main window')
    mainWindow.webContents.send('request-note-data', windowId)
  } else {
    console.error('Main window not found!')
  }
})

ipcMain.on('update-note-page', (event, page) => {
  // 转发给主窗口
  const mainWindow = BrowserWindow.getAllWindows().find(w => w.webContents === event.sender || !Array.from(noteWindows.values()).includes(w))
  if (mainWindow) {
    mainWindow.webContents.send('update-note-page-from-window', page)
  }
})

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

