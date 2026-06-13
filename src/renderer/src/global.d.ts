import type { StudyOSBridge } from './lib/studyOS'

declare global {
  interface Window {
    studyOS: StudyOSBridge
  }
}

export {}
