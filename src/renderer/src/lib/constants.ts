import type { AppSettings, Task } from './types'

export const STORAGE_KEYS = {
  tasks: 'study_tasks',
  history: 'study_history',
  achievements: 'study_achievements',
  settings: 'study_settings',
  notebooks: 'study_notebooks',
  notePages: 'study_note_pages',
  noteWindows: 'study_note_windows'
} as const

export const HOME_URL = 'https://www.google.com'

export const DEFAULT_TASKS: Task[] = [
  {
    id: 1,
    title: '1. 计算机网络复习',
    links: [
      { name: 'CS-Wiki', url: 'https://wiki.cs.vt.edu/index.php/Main_Page' },
      { name: '计算机网络微课堂', url: 'https://www.bilibili.com/video/BV1c4411d7jb' }
    ]
  },
  {
    id: 2,
    title: '2. 英语阅读训练',
    links: [{ name: 'Economist', url: 'https://www.economist.com/' }]
  },
  {
    id: 3,
    title: '3. 流量语义调研',
    links: [{ name: '谷歌学术', url: 'https://scholar.google.com/scholar?hl=zh-CN&as_sdt=0%2C5&q=Traffic+semantics&btnG=' }]
  }
]

export const DEFAULT_SETTINGS: AppSettings = {
  pomoWork: 25,
  pomoShort: 5,
  pomoLong: 15,
  waterReminder: true,
  forceLock: true,
  theme: 'dark'
}
