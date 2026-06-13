import type { Achievement, StudySession } from './types'

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'start', title: '初次见面', desc: '完成第一个番茄钟', icon: '🐣', rarity: 'common', condition: (_, __, currentSessionSec) => currentSessionSec >= 25 * 60 },
  { id: 'focus_2h', title: '心流状态', desc: '累计专注 2 小时', icon: '🌊', rarity: 'common', condition: (totalSec) => totalSec >= 7200 },
  { id: 'master_10h', title: '学识渊博', desc: '累计专注 10 小时', icon: '🎓', rarity: 'rare', condition: (totalSec) => totalSec >= 36000 },
  { id: 'god_100h', title: '登峰造极', desc: '累计专注 100 小时', icon: '👑', rarity: 'legendary', condition: (totalSec) => totalSec >= 360000 },
  { id: 'night', title: '守夜人', desc: '凌晨 2-5 点学习', icon: '🦉', rarity: 'rare', condition: (_, sessions) => sessions.some(session => new Date(session.timestamp).getHours() >= 2 && new Date(session.timestamp).getHours() < 5) },
  {
    id: 'early_bird',
    title: '早起的鸟儿',
    desc: '在清晨 5-8 点完成专注',
    icon: '🌅',
    rarity: 'common',
    condition: (_, sessions) => sessions.some(session => {
      const hour = new Date(session.timestamp).getHours()
      return hour >= 5 && hour < 8
    })
  },
  {
    id: 'weekend_warrior',
    title: '周末战士',
    desc: '周六或周日坚持学习',
    icon: '🏖️',
    rarity: 'common',
    condition: (_, sessions) => sessions.some(session => {
      const day = new Date(session.timestamp).getDay()
      return day === 0 || day === 6
    })
  },
  {
    id: 'lunch_break',
    title: '午休时光',
    desc: '在 12-13 点期间专注',
    icon: '🍱',
    rarity: 'common',
    condition: (_, sessions) => sessions.some(session => new Date(session.timestamp).getHours() === 12)
  },
  {
    id: 'deep_dive',
    title: '深潜者',
    desc: '单次专注超过 45 分钟',
    icon: '🤿',
    rarity: 'rare',
    condition: (_, __, currentSessionSec) => currentSessionSec >= 45 * 60
  },
  {
    id: 'iron_will',
    title: '钢铁意志',
    desc: '单次专注超过 90 分钟',
    icon: '🗿',
    rarity: 'legendary',
    condition: (_, __, currentSessionSec) => currentSessionSec >= 90 * 60
  },
  { id: 'brick_layer', title: '搬砖工', desc: '累计完成 10 个番茄钟', icon: '🧱', rarity: 'common', condition: (_, sessions) => sessions.length >= 10 },
  { id: 'tower_builder', title: '高塔建造者', desc: '累计完成 50 个番茄钟', icon: '🏗️', rarity: 'rare', condition: (_, sessions) => sessions.length >= 50 },
  { id: 'city_architect', title: '城市架构师', desc: '累计完成 500 个番茄钟', icon: '🏙️', rarity: 'legendary', condition: (_, sessions) => sessions.length >= 500 },
  { id: 'midnight_oil', title: '零点钟声', desc: '跨越午夜 0 点的学习', icon: '🕛', rarity: 'rare', condition: (_, sessions) => sessions.some(session => new Date(session.timestamp).getHours() === 0) },
  {
    id: 'friday_night',
    title: '狂欢夜?',
    desc: '周五晚上 20 点后还在学习',
    icon: '🍸',
    rarity: 'legendary',
    condition: (_, sessions) => sessions.some(session => {
      const d = new Date(session.timestamp)
      return d.getDay() === 5 && d.getHours() >= 20
    })
  }
]

export function getUnlockedAchievements(
  totalSec: number,
  sessions: StudySession[],
  currentSessionSec: number,
  unlockedIds: string[]
): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => !unlockedIds.includes(achievement.id) && achievement.condition(totalSec, sessions, currentSessionSec))
}
