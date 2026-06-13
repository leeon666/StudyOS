import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import type { NoteDataPayload, NotePage, NoteWindow } from '../renderer/src/lib/studyOS'

const noteWindows = new Map<number, BrowserWindow>()

function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function openExternalSafe(url: string): void {
  if (isSafeExternalUrl(url)) {
    shell.openExternal(url)
  }
}

function getMainWindow(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find(win => !Array.from(noteWindows.values()).includes(win))
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1b2838',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalSafe(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function createNoteWindow(
  id: number,
  x: number,
  y: number,
  width: number,
  height: number,
  opacity: number,
  alwaysOnTop: boolean
): void {
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
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  noteWindow.setOpacity(opacity)
  noteWindows.set(id, noteWindow)

  const noteUrl = is.dev && process.env['ELECTRON_RENDERER_URL']
    ? `${process.env['ELECTRON_RENDERER_URL']}/note.html?id=${id}`
    : `file://${join(__dirname, '../renderer/note.html')}?id=${id}`

  noteWindow.loadURL(noteUrl)
  noteWindow.once('ready-to-show', () => noteWindow.show())

  noteWindow.on('closed', () => {
    noteWindows.delete(id)
    getMainWindow()?.webContents.send('note-window-closed', id)
  })
}

ipcMain.on('create-note-window', (_, data: NoteWindow) => {
  createNoteWindow(data.id, data.x, data.y, data.width, data.height, data.opacity, data.alwaysOnTop)
})

ipcMain.on('update-note-window', (_, data: Partial<NoteWindow> & { id: number }) => {
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

ipcMain.on('close-note-window', (_, id: number) => {
  noteWindows.get(id)?.close()
})

ipcMain.on('update-note-data', (_, data: NoteDataPayload) => {
  noteWindows.get(data.windowId)?.webContents.send('note-data-updated', data)
})

ipcMain.on('request-note-data', (event, windowId: number) => {
  getMainWindow()?.webContents.send('request-note-data', windowId)
})

ipcMain.on('update-note-page', (event, page: NotePage) => {
  getMainWindow()?.webContents.send('update-note-page-from-window', page)
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.studymaster')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  app.on('web-contents-created', (_, contents) => {
    if (contents.getType() === 'webview') {
      contents.setWindowOpenHandler(({ url }) => {
        openExternalSafe(url)
        return { action: 'deny' }
      })
    } else {
      contents.setWindowOpenHandler(({ url }) => {
        openExternalSafe(url)
        return { action: 'deny' }
      })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
