import { describe, expect, it } from 'vitest'
import { calculateStats } from '../stats'
import type { StudySession, Task } from '../types'

const tasks: Task[] = [
  { id: 1, title: 'Task 1', links: [] },
  { id: 2, title: 'Task 2', links: [] }
]

const history: StudySession[] = [
  { date: '2026-06-10', timestamp: new Date('2026-06-10T08:00:00Z').getTime(), duration: 1800, taskId: 1 },
  { date: '2026-06-11', timestamp: new Date('2026-06-11T09:00:00Z').getTime(), duration: 3600, taskId: 2 }
]

describe('calculateStats', () => {
  it('aggregates history into stable totals', () => {
    const stats = calculateStats(history, tasks, new Date('2026-06-11T12:00:00Z'))

    expect(stats.totalSec).toBe(5400)
    expect(stats.todaySec).toBe(3600)
    expect(stats.weekSec).toBe(5400)
    expect(stats.totalDays).toBe(2)
    expect(stats.last7DaysData).toHaveLength(7)
    expect(stats.taskMap.get('Task 1')).toBe(1800)
    expect(stats.taskMap.get('Task 2')).toBe(3600)
  })

  it('uses the injected current date for streaks and keeps deleted task history', () => {
    const stats = calculateStats(
      [
        ...history,
        { date: '2026-06-11', timestamp: new Date('2026-06-11T10:00:00Z').getTime(), duration: 600, taskId: 999 }
      ],
      tasks,
      new Date('2026-06-11T12:00:00Z')
    )

    expect(stats.streak).toBe(2)
    expect(stats.taskMap.get('已删除')).toBe(600)
  })
})
