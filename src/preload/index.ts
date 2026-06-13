import { contextBridge, ipcRenderer } from 'electron'
import type { NoteDataPayload, NotePage, NoteWindow, StudyOSBridge } from '../renderer/src/lib/studyOS'

const bridge: StudyOSBridge = {
  requestNoteData: (windowId) => ipcRenderer.send('request-note-data', windowId),
  createNoteWindow: (payload) => ipcRenderer.send('create-note-window', payload),
  updateNoteWindow: (payload) => ipcRenderer.send('update-note-window', payload),
  closeNoteWindow: (id) => ipcRenderer.send('close-note-window', id),
  updateNoteData: (payload) => ipcRenderer.send('update-note-data', payload),
  updateNotePage: (page) => ipcRenderer.send('update-note-page', page),
  onNoteWindowClosed: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, windowId: number) => handler(windowId)
    ipcRenderer.on('note-window-closed', listener)
    return () => ipcRenderer.removeListener('note-window-closed', listener)
  },
  onRequestNoteData: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, windowId: number) => handler(windowId)
    ipcRenderer.on('request-note-data', listener)
    return () => ipcRenderer.removeListener('request-note-data', listener)
  },
  onUpdateNotePageFromWindow: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, page: NotePage) => handler(page)
    ipcRenderer.on('update-note-page-from-window', listener)
    return () => ipcRenderer.removeListener('update-note-page-from-window', listener)
  },
  onNoteDataUpdated: (handler) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: NoteDataPayload) => handler(payload)
    ipcRenderer.on('note-data-updated', listener)
    return () => ipcRenderer.removeListener('note-data-updated', listener)
  }
}

contextBridge.exposeInMainWorld('studyOS', bridge)
