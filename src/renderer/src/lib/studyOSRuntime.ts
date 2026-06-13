import type { StudyOSBridge } from './studyOS'

export function getStudyOSBridge(): StudyOSBridge {
  if (!window.studyOS) {
    throw new Error('StudyOS bridge is unavailable')
  }

  return window.studyOS
}
