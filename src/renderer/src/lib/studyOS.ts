import type { NotePage, NoteWindow } from './types'

export type { NotePage, NoteWindow } from './types'

export interface CreateNoteWindowPayload extends NoteWindow {}

export interface UpdateNoteWindowPayload {
  id: number
  x?: number
  y?: number
  width?: number
  height?: number
  opacity?: number
  alwaysOnTop?: boolean
  viewMode?: NoteWindow['viewMode']
}

export interface NoteDataPayload {
  windowId: number
  page: NotePage
  window: NoteWindow
}

export interface StudyOSBridge {
  requestNoteData(windowId: number): void
  createNoteWindow(payload: CreateNoteWindowPayload): void
  updateNoteWindow(payload: UpdateNoteWindowPayload): void
  closeNoteWindow(id: number): void
  updateNoteData(payload: NoteDataPayload): void
  updateNotePage(page: NotePage): void
  onNoteWindowClosed(handler: (windowId: number) => void): () => void
  onRequestNoteData(handler: (windowId: number) => void): () => void
  onUpdateNotePageFromWindow(handler: (page: NotePage) => void): () => void
  onNoteDataUpdated(handler: (payload: NoteDataPayload) => void): () => void
}
