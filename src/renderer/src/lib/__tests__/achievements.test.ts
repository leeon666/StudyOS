import { describe, expect, it } from 'vitest'
import { getUnlockedAchievements } from '../achievements'
import type { StudySession } from '../types'

describe('getUnlockedAchievements', () => {
  it('returns achievements that satisfy their conditions', () => {
    const sessions: StudySession[] = [
      { date: '2026-06-11', timestamp: new Date('2026-06-11T08:00:00Z').getTime(), duration: 1500, taskId: 1 }
    ]

    const unlocked = getUnlockedAchievements(1500, sessions, 1500, [])

    expect(unlocked.map(a => a.id)).toContain('start')
  })
})
