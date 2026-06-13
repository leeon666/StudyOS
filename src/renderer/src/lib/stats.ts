import type { StudySession, Task } from './types'

export interface HeatmapCell {
  date: string
  count: number
  level: number
}

export interface StatsResult {
  totalSec: number
  todaySec: number
  weekSec: number
  monthSec: number
  weekGrowth: number
  lastWeekSec: number
  streak: number
  maxStreak: number
  totalDays: number
  thisMonthDays: number
  efficiencyScore: number
  efficiencyGrade: 'S' | 'A' | 'B' | 'C' | 'D'
  consistencyScore: number
  intensityScore: number
  avgDailyMin: number
  peakHour: number
  peakPeriod: string
  hourDist: number[]
  last7DaysLabels: string[]
  last7DaysData: number[]
  last30DaysData: number[]
  avg30Days: number
  taskMap: Map<string, number>
  heatmap: HeatmapCell[]
}

export function calculateStats(history: StudySession[], tasks: Task[], now: Date = new Date()): StatsResult {
  const todayStr = now.toISOString().split('T')[0]
  const totalSec = history.reduce((a, b) => a + b.duration, 0)
  const todaySec = history.filter(h => h.date === todayStr).reduce((a, b) => a + b.duration, 0)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekSec = history.filter(h => new Date(h.date) >= weekStart).reduce((a, b) => a + b.duration, 0)

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(weekStart)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
  const lastWeekSec = history.filter(h => {
    const d = new Date(h.date)
    return d >= lastWeekStart && d <= lastWeekEnd
  }).reduce((a, b) => a + b.duration, 0)
  const weekGrowth = lastWeekSec > 0 ? Math.round(((weekSec - lastWeekSec) / lastWeekSec) * 100) : 100

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSec = history.filter(h => new Date(h.date) >= monthStart).reduce((a, b) => a + b.duration, 0)

  const dates = Array.from(new Set(history.map(h => h.date))).sort()
  let streak = 0
  let maxStreak = 0
  if (dates.length > 0) {
    const yesterdayDate = new Date(now)
    yesterdayDate.setDate(now.getDate() - 1)
    const yesterday = yesterdayDate.toISOString().split('T')[0]
    if (dates.includes(todayStr) || dates.includes(yesterday)) {
      let cursor = new Date(dates.includes(todayStr) ? todayStr : yesterday)
      while (dates.includes(cursor.toISOString().split('T')[0])) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }
    }

    let tempStreak = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      if (curr.getTime() - prev.getTime() === 86400000) {
        tempStreak++
      } else {
        maxStreak = Math.max(maxStreak, tempStreak)
        tempStreak = 1
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak)
  }

  const avgDailyMin = dates.length > 0 ? Math.round(totalSec / 60 / dates.length) : 0
  const consistencyScore = Math.min(100, Math.round((streak / 7) * 50 + (dates.length / 30) * 50))
  const intensityScore = Math.min(100, Math.round((avgDailyMin / 120) * 100))
  const efficiencyScore = Math.round((consistencyScore + intensityScore) / 2)
  const efficiencyGrade = efficiencyScore >= 90 ? 'S' : efficiencyScore >= 80 ? 'A' : efficiencyScore >= 60 ? 'B' : efficiencyScore >= 40 ? 'C' : 'D'

  const hourDist = Array.from({ length: 24 }, () => 0)
  const taskMap = new Map<string, number>()
  tasks.forEach(task => taskMap.set(task.title, 0))

  history.forEach(session => {
    const hour = new Date(session.timestamp).getHours()
    hourDist[hour] += session.duration
    const task = tasks.find(t => t.id === session.taskId)
    const taskTitle = task?.title || '已删除'
    taskMap.set(taskTitle, (taskMap.get(taskTitle) || 0) + session.duration)
  })

  const peakHour = hourDist.reduce((bestHour, value, hour) => (value > hourDist[bestHour] ? hour : bestHour), 0)
  const peakPeriod = peakHour < 6 ? '凌晨' : peakHour < 12 ? '上午' : peakHour < 18 ? '下午' : '晚上'

  const last7DaysLabels: string[] = []
  const last7DaysData: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const day = d.toISOString().split('T')[0]
    last7DaysLabels.push(day.slice(5))
    last7DaysData.push(history.filter(h => h.date === day).reduce((a, b) => a + b.duration, 0) / 60)
  }

  const last30DaysData: number[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const day = d.toISOString().split('T')[0]
    last30DaysData.push(history.filter(h => h.date === day).reduce((a, b) => a + b.duration, 0) / 60)
  }
  const avg30Days = Math.round(last30DaysData.reduce((a, b) => a + b, 0) / 30)

  const heatmap = Array.from({ length: 365 }, (_, index) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (364 - index))
    const day = d.toISOString().split('T')[0]
    const count = history.filter(h => h.date === day).reduce((a, b) => a + b.duration, 0)
    return { date: day, count, level: count === 0 ? 0 : count < 1800 ? 1 : count < 3600 ? 2 : count < 7200 ? 3 : 4 }
  })

  const totalDays = dates.length
  const thisMonthDays = dates.filter(d => new Date(d) >= monthStart).length

  return {
    totalSec,
    todaySec,
    weekSec,
    monthSec,
    weekGrowth,
    lastWeekSec,
    streak,
    maxStreak,
    totalDays,
    thisMonthDays,
    efficiencyScore,
    efficiencyGrade,
    consistencyScore,
    intensityScore,
    avgDailyMin,
    peakHour,
    peakPeriod,
    hourDist,
    last7DaysLabels,
    last7DaysData,
    last30DaysData,
    avg30Days,
    taskMap,
    heatmap
  }
}
