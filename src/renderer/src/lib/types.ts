export interface TaskLink {
  name: string
  url: string
}

export interface Task {
  id: number
  title: string
  links: TaskLink[]
}

export interface StudySession {
  date: string
  timestamp: number
  duration: number
  taskId: number
}

export interface Achievement {
  id: string
  title: string
  desc: string
  icon: string
  rarity: 'common' | 'rare' | 'legendary'
  condition: (totalSec: number, sessions: StudySession[], currentSessionSec: number) => boolean
}

export interface AppSettings {
  pomoWork: number
  pomoShort: number
  pomoLong: number
  waterReminder: boolean
  forceLock: boolean
  theme: 'dark' | 'light'
}

export interface Notebook {
  id: number
  name: string
  createdAt: number
}

export interface NotePage {
  id: number
  notebookId: number
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface NoteWindow {
  id: number
  pageId: number
  x: number
  y: number
  width: number
  height: number
  opacity: number
  alwaysOnTop: boolean
  viewMode: 'edit' | 'preview' | 'split'
}
