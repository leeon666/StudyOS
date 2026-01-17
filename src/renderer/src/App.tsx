import React, { useState, useEffect, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { Trophy, Activity, BrainCircuit, ChevronDown, ChevronRight, Menu, Play, Pause, SkipForward, Settings, X, RotateCcw, Calendar, Clock, Flame, Target, TrendingUp, Plus, Edit2, Trash2, Lock, Coffee, GlassWater, Home, Search, ArrowLeft, ArrowRight, RotateCw, Zap, Award, Sun, BarChart3, Languages, StickyNote, Pin, Minimize2, Maximize2, Book, FileText, Eye, Code } from 'lucide-react'
import confetti from 'canvas-confetti'
import { marked } from 'marked'
import './assets/main.css'
import achievementSound from './assets/sounds/achievement.wav'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

// --- Interfaces ---
interface TaskLink { name: string; url: string }
interface Task { id: number; title: string; links: TaskLink[] }
interface StudySession { date: string; timestamp: number; duration: number; taskId: number }
interface Achievement { id: string; title: string; desc: string; icon: string; rarity: 'common'|'rare'|'legendary'; condition: (t:number, s:StudySession[], c:number)=>boolean }
interface AppSettings { pomoWork: number; pomoShort: number; pomoLong: number; waterReminder: boolean; forceLock: boolean; theme: 'dark' | 'light'; }
interface Notebook { id: number; name: string; createdAt: number; }
interface NotePage { id: number; notebookId: number; title: string; content: string; createdAt: number; updatedAt: number; }
interface NoteWindow { id: number; pageId: number; x: number; y: number; width: number; height: number; opacity: number; alwaysOnTop: boolean; viewMode: 'edit' | 'preview' | 'split'; }

const DEFAULT_TASKS: Task[] = [
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
const DEFAULT_SETTINGS: AppSettings = { pomoWork: 25, pomoShort: 5, pomoLong: 15, waterReminder: true, forceLock: true, theme: 'dark' }

// --- 28 Achievements (Simplified for brevity but logic intact) ---
const ACHIEVEMENTS: Achievement[] = [
  { id: 'start', title: '初次见面', desc: '完成第一个番茄钟', icon: '🐣', rarity: 'common', condition: (_,__,c) => c >= 25*60 },
  { id: 'focus_2h', title: '心流状态', desc: '累计专注 2 小时', icon: '🌊', rarity: 'common', condition: (t) => t >= 7200 },
  { id: 'master_10h', title: '学识渊博', desc: '累计专注 10 小时', icon: '🎓', rarity: 'rare', condition: (t) => t >= 36000 },
  { id: 'god_100h', title: '登峰造极', desc: '累计专注 100 小时', icon: '👑', rarity: 'legendary', condition: (t) => t >= 360000 },
  { id: 'night', title: '守夜人', desc: '凌晨 2-5 点学习', icon: '🦉', rarity: 'rare', condition: (_,s) => s.some(x=>new Date(x.timestamp).getHours()>=2 && new Date(x.timestamp).getHours()<5) },

  // --- 🆕 新增：时间习惯类 ---
  {
    id: 'early_bird', 
    title: '早起的鸟儿', 
    desc: '在清晨 5-8 点完成专注', 
    icon: '🌅', 
    rarity: 'common', 
    condition: (_, s) => s.some(x => {
      const h = new Date(x.timestamp).getHours();
      return h >= 5 && h < 8;
    }) 
  },
  { 
    id: 'weekend_warrior', 
    title: '周末战士', 
    desc: '周六或周日坚持学习', 
    icon: '🏖️', 
    rarity: 'common', 
    condition: (_, s) => s.some(x => {
      const day = new Date(x.timestamp).getDay();
      return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    }) 
  },
  { 
    id: 'lunch_break', 
    title: '午休时光', 
    desc: '在 12-13 点期间专注', 
    icon: '🍱', 
    rarity: 'common', 
    condition: (_, s) => s.some(x => new Date(x.timestamp).getHours() === 12) 
  },

  // --- 🆕 新增：专注强度类 (挑战单次时长) ---
  { 
    id: 'deep_dive', 
    title: '深潜者', 
    desc: '单次专注超过 45 分钟', 
    icon: '🤿', 
    rarity: 'rare', 
    condition: (_, __, c) => c >= 45 * 60 
  },
  { 
    id: 'iron_will', 
    title: '钢铁意志', 
    desc: '单次专注超过 90 分钟', 
    icon: '🗿', 
    rarity: 'legendary', 
    condition: (_, __, c) => c >= 90 * 60 
  },

  // --- 🆕 新增：数量积累类 (搬砖) ---
  { 
    id: 'brick_layer', 
    title: '搬砖工', 
    desc: '累计完成 10 个番茄钟', 
    icon: '🧱', 
    rarity: 'common', 
    condition: (_, s) => s.length >= 10 
  },
  { 
    id: 'tower_builder', 
    title: '高塔建造者', 
    desc: '累计完成 50 个番茄钟', 
    icon: '🏗️', 
    rarity: 'rare', 
    condition: (_, s) => s.length >= 50 
  },
  { 
    id: 'city_architect', 
    title: '城市架构师', 
    desc: '累计完成 500 个番茄钟', 
    icon: '🏙️', 
    rarity: 'legendary', 
    condition: (_, s) => s.length >= 500 
  },

  // --- 🆕 新增：趣味/隐藏类 ---
  { 
    id: 'midnight_oil', 
    title: '零点钟声', 
    desc: '跨越午夜 0 点的学习', 
    icon: '🕛', 
    rarity: 'rare', 
    condition: (_, s) => s.some(x => new Date(x.timestamp).getHours() === 0) 
  },
  { 
    id: 'friday_night', 
    title: '狂欢夜?', 
    desc: '周五晚上 20 点后还在学习', 
    icon: '🍸', 
    rarity: 'legendary', 
    condition: (_, s) => s.some(x => {
      const d = new Date(x.timestamp);
      return d.getDay() === 5 && d.getHours() >= 20;
    }) 
  }
]

// --- Stats Logic ---
const calculateStats = (history: StudySession[], tasks: Task[]) => {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const totalSec = history.reduce((a, b) => a + b.duration, 0)
  const todaySec = history.filter(h => h.date === todayStr).reduce((a, b) => a + b.duration, 0)

  // 本周数据
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())
  const weekSec = history.filter(h => new Date(h.date) >= weekStart).reduce((a, b) => a + b.duration, 0)
  
  // 上周数据（用于对比）
  const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(weekStart); lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
  const lastWeekSec = history.filter(h => { const d = new Date(h.date); return d >= lastWeekStart && d <= lastWeekEnd }).reduce((a, b) => a + b.duration, 0)
  const weekGrowth = lastWeekSec > 0 ? Math.round(((weekSec - lastWeekSec) / lastWeekSec) * 100) : 100

  // 本月数据
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthSec = history.filter(h => new Date(h.date) >= monthStart).reduce((a, b) => a + b.duration, 0)

  // Streak
  const dates = Array.from(new Set(history.map(h => h.date))).sort()
  let streak = 0, maxStreak = 0
  if (dates.length > 0) {
    const today = todayStr
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dates.includes(today) || dates.includes(yesterday)) {
      let d = new Date(dates.includes(today)?today:yesterday);
      while(dates.includes(d.toISOString().split('T')[0])) { streak++; d.setDate(d.getDate()-1); }
    }
    // 计算历史最长连续
    let tempStreak = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i-1]), curr = new Date(dates[i])
      if ((curr.getTime() - prev.getTime()) === 86400000) { tempStreak++ } 
      else { maxStreak = Math.max(maxStreak, tempStreak); tempStreak = 1 }
    }
    maxStreak = Math.max(maxStreak, tempStreak)
  }

  // 学习效率评分 (基于多维度)
  const avgDailyMin = dates.length > 0 ? Math.round(totalSec / 60 / dates.length) : 0
  const consistencyScore = Math.min(100, Math.round((streak / 7) * 50 + (dates.length / 30) * 50))
  const intensityScore = Math.min(100, Math.round((avgDailyMin / 120) * 100))
  const efficiencyScore = Math.round((consistencyScore + intensityScore) / 2)
  const efficiencyGrade = efficiencyScore >= 90 ? 'S' : efficiencyScore >= 80 ? 'A' : efficiencyScore >= 60 ? 'B' : efficiencyScore >= 40 ? 'C' : 'D'

  // 最佳学习时段
  const hourDist = new Array(24).fill(0); history.forEach(h => hourDist[new Date(h.timestamp).getHours()] += h.duration)
  const peakHour = hourDist.indexOf(Math.max(...hourDist))
  const peakPeriod = peakHour < 6 ? '深夜' : peakHour < 12 ? '上午' : peakHour < 18 ? '下午' : '晚上'

  // Trend (7 days)
  const last7DaysLabels: string[] = [], last7DaysData: number[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); const s = d.toISOString().split('T')[0]
    last7DaysLabels.push(s.slice(5))
    last7DaysData.push(Math.floor(history.filter(h => h.date === s).reduce((a, b) => a + b.duration, 0) / 60))
  }

  // 30天趋势
  const last30DaysData: number[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); const s = d.toISOString().split('T')[0]
    last30DaysData.push(Math.floor(history.filter(h => h.date === s).reduce((a, b) => a + b.duration, 0) / 60))
  }
  const avg30Days = last30DaysData.length > 0 ? Math.round(last30DaysData.reduce((a,b)=>a+b,0) / 30) : 0

  // Distribution
  const taskMap = new Map<string, number>()
  history.forEach(h => { const t = tasks.find(x => x.id === h.taskId)?.title || '已删除'; taskMap.set(t, (taskMap.get(t)||0) + h.duration) })

  // Heatmap
  const heatmap: {date: string, count: number, level: number}[] = []; const start = new Date(); start.setFullYear(start.getFullYear()-1);
  const dailyMap = new Map(); history.forEach(h => dailyMap.set(h.date, (dailyMap.get(h.date)||0)+h.duration));
  for(let d=new Date(start); d<=new Date(); d.setDate(d.getDate()+1)) {
    const k = d.toISOString().split('T')[0]; const v = dailyMap.get(k)||0;
    heatmap.push({ date: k, count: v, level: v>7200?4:v>3600?3:v>1800?2:v>0?1:0 })
  }

  // 学习天数统计
  const totalDays = dates.length
  const thisMonthDays = dates.filter(d => new Date(d) >= monthStart).length

  return { 
    totalSec, todaySec, weekSec, monthSec, weekGrowth, lastWeekSec,
    streak, maxStreak, totalDays, thisMonthDays,
    efficiencyScore, efficiencyGrade, consistencyScore, intensityScore, avgDailyMin,
    peakHour, peakPeriod, hourDist,
    last7DaysLabels, last7DaysData, last30DaysData, avg30Days,
    taskMap, heatmap 
  }
}

// --- Modal Component ---
const Modal = ({ isOpen, title, onClose, children }: any) => {
  if (!isOpen) return null;
  return <div className="modal-overlay" onClick={onClose}><div className="modal-box" onClick={e=>e.stopPropagation()}><div className="modal-title">{title} <X size={18} cursor="pointer" onClick={onClose}/></div>{children}</div></div>
}

function App(): JSX.Element {
  // Data
  const [tasks, setTasks] = useState<Task[]>([])
  const [history, setHistory] = useState<StudySession[]>([])
  const [unlocked, setUnlocked] = useState<string[]>([])
  const unlockedRef = useRef<string[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  
  // Notes
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [notePages, setNotePages] = useState<NotePage[]>([])
  const [noteWindows, setNoteWindows] = useState<NoteWindow[]>([])
  const [selectedNotebook, setSelectedNotebook] = useState<number | null>(null)

  // UI
  const [view, setView] = useState<'browser'|'stats'|'achievements'|'notes'>('browser')
  const [currentTask, setCurrentTask] = useState<number>(0)
  const [activeUrl, setActiveUrl] = useState('https://www.google.com')
  const [urlInput, setUrlInput] = useState('https://www.google.com')
  const HOME_URL = 'https://www.google.com'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [expanded, setExpanded] = useState<number[]>([])
  const webviewRef = useRef<any>(null)

  // Drag & Drop
  const [draggedTask, setDraggedTask] = useState<number | null>(null)
  const [dragOverTask, setDragOverTask] = useState<number | null>(null)
  const [draggedLink, setDraggedLink] = useState<{taskId: number, linkIdx: number} | null>(null)
  const [dragOverLink, setDragOverLink] = useState<{taskId: number, linkIdx: number} | null>(null)

  // Timer
  const [pomoMode, setPomoMode] = useState<'work'|'short'|'long'>('work')
  const [timeLeft, setTimeLeft] = useState(25*60)
  const [isRunning, setIsRunning] = useState(false)
  const [waterTimer, setWaterTimer] = useState(0)

  // Modals
  const [modalType, setModalType] = useState<'task'|'link'|'settings'|'reset'|'notebook'|'renamePage'|null>(null)
  const [editTask, setEditTask] = useState<Task|null>(null)
  const [editLink, setEditLink] = useState<{tid:number, idx:number|null, name:string, url:string}|null>(null)
  const [formInput, setFormInput] = useState({ f1: '', f2: '' })
  const [editingPageId, setEditingPageId] = useState<number | null>(null)

  // Toast & Alert
  const [toast, setToast] = useState<Achievement|null>(null)
  const [alertMsg, setAlertMsg] = useState<{title:string, icon:any}|null>(null)

  // Init
  useEffect(() => {
    const sTasks = localStorage.getItem('study_tasks'); if(sTasks) { const p=JSON.parse(sTasks); setTasks(p); if(p.length) setCurrentTask(p[0].id); } else { setTasks(DEFAULT_TASKS); setCurrentTask(DEFAULT_TASKS[0].id); }
    const sHist = localStorage.getItem('study_history'); if(sHist) setHistory(JSON.parse(sHist));
    const sAch = localStorage.getItem('study_achievements'); if(sAch) { setUnlocked(JSON.parse(sAch)); unlockedRef.current=JSON.parse(sAch); }
    const sSet = localStorage.getItem('study_settings'); if(sSet) setSettings(JSON.parse(sSet));
    
    // 加载笔记本和笔记页
    const sNotebooks = localStorage.getItem('study_notebooks'); 
    if(sNotebooks) {
      const nb = JSON.parse(sNotebooks)
      setNotebooks(nb)
      if(nb.length > 0) setSelectedNotebook(nb[0].id)
    }
    const sNotePages = localStorage.getItem('study_note_pages'); if(sNotePages) setNotePages(JSON.parse(sNotePages));
    const sNoteWins = localStorage.getItem('study_note_windows'); if(sNoteWins) setNoteWindows(JSON.parse(sNoteWins));
  }, [])

  // 主题切换效果
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  // Webview new-window handler
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const handleNewWindow = (e: any) => { e.preventDefault(); setActiveUrl(e.url); setUrlInput(e.url) }
    const handleNavigate = (e: any) => { setUrlInput(e.url) }
    const handleWillNavigate = (e: any) => { 
      // 允许 webview 内部导航，同时更新地址栏
      setActiveUrl(e.url); 
      setUrlInput(e.url) 
    }
    wv.addEventListener('new-window', handleNewWindow)
    wv.addEventListener('did-navigate', handleNavigate)
    wv.addEventListener('did-navigate-in-page', handleNavigate)
    wv.addEventListener('will-navigate', handleWillNavigate)
    return () => {
      wv.removeEventListener('new-window', handleNewWindow)
      wv.removeEventListener('did-navigate', handleNavigate)
      wv.removeEventListener('did-navigate-in-page', handleNavigate)
      wv.removeEventListener('will-navigate', handleWillNavigate)
    }
  }, [])

  // Timer Loop
  useEffect(() => {
    let t: NodeJS.Timeout
    if (isRunning) {
      t = setInterval(() => {
        setTimeLeft(p => { if (p <= 1) { handleTimerEnd(); return 0 } return p - 1 })
        if (pomoMode === 'work') {
          if (timeLeft % 5 === 0) recordHistory(5)
          if (settings.waterReminder) setWaterTimer(w => { if(w >= 45*60) { triggerAlert('记得喝水', <GlassWater size={40}/>); return 0 } return w+1 })
        }
      }, 1000)
    }
    return () => clearInterval(t)
  }, [isRunning, pomoMode, currentTask, timeLeft, settings])

  // Logic
  const recordHistory = (dur: number) => {
    if (!currentTask) return
    const rec = { date: new Date().toISOString().split('T')[0], timestamp: Date.now(), duration: dur, taskId: currentTask }
    setHistory(prev => {
      const next = [...prev, rec]; localStorage.setItem('study_history', JSON.stringify(next));
      checkAch(next); return next
    })
  }
  const checkAch = (hist: StudySession[]) => {
    const total = hist.reduce((a,b)=>a+b.duration, 0)
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedRef.current.includes(ach.id) && ach.condition(total, hist, 25*60)) {
        unlockedRef.current.push(ach.id); setUnlocked([...unlockedRef.current]);
        localStorage.setItem('study_achievements', JSON.stringify(unlockedRef.current));
        triggerToast(ach);
      }
    })
  }
  const handleTimerEnd = () => {
    setIsRunning(false); new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3').play().catch(()=>{})
    if (pomoMode === 'work') { setPomoMode('short'); setTimeLeft(settings.pomoShort*60); confetti(); }
    else { setPomoMode('work'); setTimeLeft(settings.pomoWork*60); }
  }
  const triggerToast = (ach: Achievement) => { 
    setToast(ach); 
    setTimeout(()=>setToast(null), 5000); 
    confetti();
    
    // 播放成就音效
    const audio = new Audio(achievementSound);
    audio.volume = 0.5;
    audio.play().catch(err => console.log('音频播放失败:', err));
  }
  const triggerAlert = (t: string, i: any) => { setAlertMsg({title:t, icon:i}); setTimeout(()=>setAlertMsg(null), 10000) }

  // CRUD
  const saveTasks = (nt: Task[]) => { setTasks(nt); localStorage.setItem('study_tasks', JSON.stringify(nt)); }
  const handleSaveTask = () => {
    if (!formInput.f1) return
    const nt = editTask ? tasks.map(t=>t.id===editTask.id?{...t, title:formInput.f1}:t) : [...tasks, {id:Date.now(), title:formInput.f1, links:[]}]
    saveTasks(nt); setModalType(null)
  }
  const handleSaveLink = () => {
    if (!editLink || !formInput.f1) return
    const nt = tasks.map(t => {
      if (t.id === editLink.tid) {
        const l = [...t.links]; editLink.idx!==null ? l[editLink.idx]={name:formInput.f1, url:formInput.f2} : l.push({name:formInput.f1, url:formInput.f2})
        return {...t, links:l}
      } return t
    })
    saveTasks(nt); setModalType(null)
  }

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent, taskId: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedTask === null || draggedTask === taskId) return
    setDragOverTask(taskId)
  }
  
  const handleDrop = (e: React.DragEvent, targetTaskId: number) => {
    e.preventDefault()
    
    if (draggedTask === null || draggedTask === targetTaskId) return
    
    const draggedIdx = tasks.findIndex(t => t.id === draggedTask)
    const targetIdx = tasks.findIndex(t => t.id === targetTaskId)
    
    const newTasks = [...tasks]
    const [removed] = newTasks.splice(draggedIdx, 1)
    newTasks.splice(targetIdx, 0, removed)
    
    saveTasks(newTasks)
    setDraggedTask(null)
    setDragOverTask(null)
  }
  
  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverTask(null)
  }

  // Link Drag & Drop handlers
  const handleLinkDragStart = (e: React.DragEvent, taskId: number, linkIdx: number) => {
    e.stopPropagation()
    setDraggedLink({ taskId, linkIdx })
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleLinkDragOver = (e: React.DragEvent, taskId: number, linkIdx: number) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    if (!draggedLink || (draggedLink.taskId === taskId && draggedLink.linkIdx === linkIdx)) return
    setDragOverLink({ taskId, linkIdx })
  }
  
  const handleLinkDrop = (e: React.DragEvent, targetTaskId: number, targetLinkIdx: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedLink) return
    
    // 只支持同一个任务内的链接拖拽
    if (draggedLink.taskId !== targetTaskId) {
      setDraggedLink(null)
      setDragOverLink(null)
      return
    }
    
    const newTasks = tasks.map(t => {
      if (t.id === targetTaskId) {
        const newLinks = [...t.links]
        const [removed] = newLinks.splice(draggedLink.linkIdx, 1)
        newLinks.splice(targetLinkIdx, 0, removed)
        return { ...t, links: newLinks }
      }
      return t
    })
    
    saveTasks(newTasks)
    setDraggedLink(null)
    setDragOverLink(null)
  }
  
  const handleLinkDragEnd = () => {
    setDraggedLink(null)
    setDragOverLink(null)
  }

  // 翻译功能 - 使用 Bing 翻译（无域名限制）
  const handleTranslate = () => {
    const wv = webviewRef.current
    if (!wv) return
    
    try {
      const currentUrl = wv.getURL()
      // 使用 Bing 翻译
      const translateUrl = `https://www.bing.com/translator?from=en&to=zh-Hans&text=${encodeURIComponent(currentUrl)}`
      
      // 或者使用有道翻译
      // const translateUrl = `https://fanyi.youdao.com/translate?&doctype=json&type=AUTO&i=${encodeURIComponent(currentUrl)}`
      
      setActiveUrl(translateUrl)
      setUrlInput(translateUrl)
    } catch (err) {
      console.error('Translation failed:', err)
    }
  }

  // 笔记本功能
  const saveNotebooks = (newNotebooks: Notebook[]) => {
    setNotebooks(newNotebooks)
    localStorage.setItem('study_notebooks', JSON.stringify(newNotebooks))
  }
  
  const saveNotePages = (newPages: NotePage[]) => {
    setNotePages(newPages)
    localStorage.setItem('study_note_pages', JSON.stringify(newPages))
  }
  
  const saveNoteWindows = (newWindows: NoteWindow[]) => {
    setNoteWindows(newWindows)
    localStorage.setItem('study_note_windows', JSON.stringify(newWindows))
  }
  
  const createNotebook = () => {
    setFormInput({ f1: '新笔记本', f2: '' })
    setModalType('notebook')
  }
  
  const handleSaveNotebook = () => {
    if (!formInput.f1 || !formInput.f1.trim()) return
    
    const newNotebook: Notebook = {
      id: Date.now(),
      name: formInput.f1.trim(),
      createdAt: Date.now()
    }
    saveNotebooks([...notebooks, newNotebook])
    setSelectedNotebook(newNotebook.id)
    setModalType(null)
  }
  
  const createNotePage = (notebookId: number) => {
    const newPage: NotePage = {
      id: Date.now(),
      notebookId,
      title: '新笔记',
      content: '# 新笔记\n\n开始写点什么...',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    saveNotePages([...notePages, newPage])
    openNoteWindow(newPage.id)
  }
  
  const openNoteWindow = (pageId: number) => {
    console.log('Opening note window for page:', pageId)
    // 检查是否已经打开
    if (noteWindows.some(w => w.pageId === pageId)) {
      console.log('Window already open for this page')
      return
    }
    
    const newWindow: NoteWindow = {
      id: Date.now(),
      pageId,
      x: 100 + noteWindows.length * 30,
      y: 100 + noteWindows.length * 30,
      width: 600,
      height: 500,
      opacity: 0.95,
      alwaysOnTop: false,
      viewMode: 'split'
    }
    
    saveNoteWindows([...noteWindows, newWindow])
  }
  
  const closeNoteWindow = (windowId: number) => {
    saveNoteWindows(noteWindows.filter(w => w.id !== windowId))
  }
  
  const updateNoteWindow = (windowId: number, updates: Partial<NoteWindow>) => {
    const newWindows = noteWindows.map(w => 
      w.id === windowId ? { ...w, ...updates } : w
    )
    saveNoteWindows(newWindows)
  }
  
  const updateNotePage = (pageId: number, updates: Partial<NotePage>) => {
    const newPages = notePages.map(p => 
      p.id === pageId ? { ...p, ...updates, updatedAt: Date.now() } : p
    )
    saveNotePages(newPages)
  }
  
  // 移除 IPC 监听
  /*
  useEffect(() => {
    const { ipcRenderer } = window.require('electron')
    
    ipcRenderer.on('note-window-closed', (_, windowId) => {
      console.log('Main app: note window closed', windowId)
      saveNoteWindows(noteWindows.filter(w => w.id !== windowId))
    })
    
    // 响应笔记窗口的数据请求
    ipcRenderer.on('request-note-data', (_, windowId) => {
      console.log('Main app: received request for note data', windowId)
      const win = noteWindows.find(w => w.id === windowId)
      console.log('Found window:', win)
      if (win) {
        const page = notePages.find(p => p.id === win.pageId)
        console.log('Found page:', page)
        if (page) {
          console.log('Sending note data to window', windowId)
          ipcRenderer.send('update-note-data', {
            windowId: win.id,
            page,
            window: win
          })
        }
      }
    })
    
    // 接收来自笔记窗口的页面更新
    ipcRenderer.on('update-note-page-from-window', (_, page) => {
      console.log('Main app: received page update from window', page)
      const newPages = notePages.map(p => 
        p.id === page.id ? page : p
      )
      saveNotePages(newPages)
    })
    
    return () => {
      ipcRenderer.removeAllListeners('note-window-closed')
      ipcRenderer.removeAllListeners('request-note-data')
      ipcRenderer.removeAllListeners('update-note-page-from-window')
    }
  */
  
  const deleteNotebook = (notebookId: number) => {
    if (!confirm('确定删除这个笔记本吗？其中的所有笔记也会被删除。')) return
    saveNotebooks(notebooks.filter(n => n.id !== notebookId))
    saveNotePages(notePages.filter(p => p.notebookId !== notebookId))
    saveNoteWindows(noteWindows.filter(w => {
      const page = notePages.find(p => p.id === w.pageId)
      return page && page.notebookId !== notebookId
    }))
    if (selectedNotebook === notebookId) {
      setSelectedNotebook(notebooks.length > 1 ? notebooks.find(n => n.id !== notebookId)?.id || null : null)
    }
  }
  
  const deleteNotePage = (pageId: number) => {
    if (!confirm('确定删除这个笔记吗？')) return
    saveNotePages(notePages.filter(p => p.id !== pageId))
    saveNoteWindows(noteWindows.filter(w => w.pageId !== pageId))
  }

  const stats = calculateStats(history, tasks)
  const chartOpts = { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{display:false}} }

  return (
    <div className="app-container">
      <canvas id="confetti-canvas"></canvas>

      {/* Sidebar */}
      <div className={`sidebar ${!isSidebarOpen?'collapsed':''}`} style={{width:isSidebarOpen?320:0}}>
        <div className="logo-area">
          <div style={{display:'flex', alignItems:'center', gap:8}}><BrainCircuit /> STUDY OS <span style={{fontSize:10, opacity:0.5}}>ULTIMATE</span></div>
          <button className="collapse-btn" onClick={()=>setIsSidebarOpen(false)}><ChevronRight size={16} style={{transform:'rotate(180deg)'}}/></button>
        </div>

        {/* Pomo Card */}
        <div className={`pomo-card mode-${pomoMode}`}>
          <div style={{fontSize:12, letterSpacing:2, color:'#94a3b8'}}>{pomoMode==='work'?'FOCUS':'BREAK'}</div>
          <div className="pomo-timer">{Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}</div>
          <div className="pomo-progress-bg"><div className="pomo-bar" style={{width:`${(timeLeft/((pomoMode==='work'?settings.pomoWork:settings.pomoShort)*60))*100}%`, background:pomoMode==='work'?'#38bdf8':'#22c55e'}}></div></div>
          <div className="pomo-controls">
            <button className="control-btn" onClick={()=>setIsRunning(!isRunning)}>{isRunning?<Pause size={18}/>:<Play size={18}/>}</button>
            <button className="control-btn" onClick={handleTimerEnd}><SkipForward size={18}/></button>
          </div>
        </div>

        {/* Task List (With CRUD) */}
        <div className="task-list-container">
          {tasks.map(t => (
            <div 
              key={t.id} 
              className={`task-card ${currentTask===t.id?'active':''} ${draggedTask===t.id?'dragging':''} ${dragOverTask===t.id?'drag-over':''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, t.id)}
              onDragOver={(e) => handleDragOver(e, t.id)}
              onDrop={(e) => handleDrop(e, t.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="task-header" onClick={() => setExpanded(p=>p.includes(t.id)?p.filter(x=>x!==t.id):[...p,t.id])}>
                <span style={{maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.title}</span>
                <div className="task-actions" onClick={e=>e.stopPropagation()}>
                  <div className="icon-btn" onClick={()=>{setEditTask(t); setFormInput({f1:t.title, f2:''}); setModalType('task')}}><Edit2 size={12}/></div>
                  <div className="icon-btn danger" onClick={()=>{if(confirm('删除?')) saveTasks(tasks.filter(x=>x.id!==t.id))}}><Trash2 size={12}/></div>
                  {expanded.includes(t.id)?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
                </div>
              </div>
              <div className={`task-body ${expanded.includes(t.id)?'expanded':''}`} onClick={e=>e.stopPropagation()}>
                <div className="links-grid">
                  {t.links.map((l,i) => (
                    <div 
                      key={i} 
                      className={`link-item ${draggedLink?.taskId===t.id && draggedLink?.linkIdx===i?'dragging':''} ${dragOverLink?.taskId===t.id && dragOverLink?.linkIdx===i?'drag-over':''}`}
                      draggable
                      onDragStart={(e) => handleLinkDragStart(e, t.id, i)}
                      onDragOver={(e) => handleLinkDragOver(e, t.id, i)}
                      onDrop={(e) => handleLinkDrop(e, t.id, i)}
                      onDragEnd={handleLinkDragEnd}
                    >
                      <button className="nav-btn" onClick={()=>{setActiveUrl(l.url); setCurrentTask(t.id); setView('browser')}}>{l.name}</button>
                      <div className="link-actions">
                        <div className="icon-btn" onClick={()=>{setEditLink({tid:t.id, idx:i, name:l.name, url:l.url}); setFormInput({f1:l.name, f2:l.url}); setModalType('link')}}><Edit2 size={10}/></div>
                        <div className="icon-btn danger" onClick={()=>{const nt=tasks.map(x=>{if(x.id===t.id) x.links.splice(i,1); return x}); saveTasks(nt)}}><X size={10}/></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="add-btn" onClick={()=>{setEditLink({tid:t.id, idx:null, name:'', url:''}); setFormInput({f1:'', f2:''}); setModalType('link')}}><Plus size={12}/> Add Link</button>
              </div>
            </div>
          ))}
          <button className="add-btn" style={{borderStyle:'solid', padding:12}} onClick={()=>{setEditTask(null); setFormInput({f1:'', f2:''}); setModalType('task')}}><Plus size={14}/> New Task</button>
        </div>

        <div className="bottom-bar">
          <button className="action-btn" onClick={()=>setView('stats')}><Activity size={16}/> 数据</button>
          <button className="action-btn" onClick={()=>setView('achievements')}><Trophy size={16}/> 成就</button>
          <button className="action-btn" onClick={()=>setView('notes')}><StickyNote size={16}/> 笔记</button>
          <button className="action-btn" onClick={()=>{setModalType('settings')}}><Settings size={16}/> 设置</button>
          <button className="action-btn" onClick={()=>setModalType('reset')}><RotateCcw size={16}/></button>
        </div>
      </div>

      <div className="main-area">
        {view === 'browser' && (
          <div className="browser-toolbar">
            {!isSidebarOpen && <button className="toolbar-btn" onClick={()=>setIsSidebarOpen(true)}><Menu size={16}/></button>}
            <button className="toolbar-btn" onClick={()=>webviewRef.current?.goBack()}><ArrowLeft size={16}/></button>
            <button className="toolbar-btn" onClick={()=>webviewRef.current?.goForward()}><ArrowRight size={16}/></button>
            <button className="toolbar-btn" onClick={()=>webviewRef.current?.reload()}><RotateCw size={16}/></button>
            <button className="toolbar-btn" onClick={()=>{setActiveUrl(HOME_URL); setUrlInput(HOME_URL)}}><Home size={16}/></button>
            <button className="toolbar-btn translate-btn" onClick={handleTranslate} title="翻译此页面（Bing）"><Languages size={16}/></button>
            <form className="url-form" onSubmit={(e)=>{e.preventDefault(); const url = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`; setActiveUrl(url); setUrlInput(url)}}>
              <Search size={14} className="search-icon"/>
              <input className="url-input" value={urlInput} onChange={e=>setUrlInput(e.target.value)} placeholder="输入网址或搜索"/>
            </form>
          </div>
        )}
        {!isSidebarOpen && view !== 'browser' && <button className="expand-btn" onClick={()=>setIsSidebarOpen(true)}><Menu size={16}/></button>}

        <webview 
          ref={webviewRef} 
          src={activeUrl} 
          style={{display: view==='browser'?'flex':'none', flex:1}}
          allowpopups="true"
        />

        {view === 'stats' && (
          <div className="dashboard-layer">
            <div className="dash-header">
              <div className="dash-title"><Target /> 学习数据中心</div>
              <button className="close-btn" onClick={()=>setView('browser')}><X size={16}/> 关闭</button>
            </div>

            {/* 效率评分卡片 */}
            <div className="score-card">
              <div className="score-main">
                <div className="score-ring">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8"/>
                    <circle cx="50" cy="50" r="45" fill="none" stroke={stats.efficiencyScore>=80?'#22c55e':stats.efficiencyScore>=60?'#38bdf8':'#f59e0b'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${stats.efficiencyScore * 2.83} 283`} transform="rotate(-90 50 50)"/>
                  </svg>
                  <div className="score-value">{stats.efficiencyGrade}</div>
                </div>
                <div className="score-info">
                  <div className="score-title">学习效率评分</div>
                  <div className="score-num">{stats.efficiencyScore}<span>/100</span></div>
                  <div className="score-bars">
                    <div className="score-bar-item"><span>坚持度</span><div className="score-bar-bg"><div className="score-bar-fill" style={{width:`${stats.consistencyScore}%`, background:'#38bdf8'}}></div></div><span>{stats.consistencyScore}</span></div>
                    <div className="score-bar-item"><span>强度</span><div className="score-bar-bg"><div className="score-bar-fill" style={{width:`${stats.intensityScore}%`, background:'#a78bfa'}}></div></div><span>{stats.intensityScore}</span></div>
                  </div>
                </div>
              </div>
              <div className="score-tips">
                <div className="tip-item"><Sun size={14}/> 最佳时段：<strong>{stats.peakPeriod} {stats.peakHour}:00</strong></div>
                <div className="tip-item"><BarChart3 size={14}/> 日均学习：<strong>{stats.avgDailyMin} 分钟</strong></div>
              </div>
            </div>

            {/* 核心指标 */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon" style={{background:'rgba(56,189,248,0.1)'}}><Clock size={20} color="#38bdf8"/></div>
                <div className="metric-content">
                  <div className="metric-label">今日投入</div>
                  <div className="metric-value">{Math.floor(stats.todaySec/60)}<span>分钟</span></div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{background:'rgba(251,191,36,0.1)'}}><Flame size={20} color="#fbbf24"/></div>
                <div className="metric-content">
                  <div className="metric-label">连续学习</div>
                  <div className="metric-value">{stats.streak}<span>天</span></div>
                  <div className="metric-sub">最长 {stats.maxStreak} 天</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{background:'rgba(34,197,94,0.1)'}}><Zap size={20} color="#22c55e"/></div>
                <div className="metric-content">
                  <div className="metric-label">本周学习</div>
                  <div className="metric-value">{(stats.weekSec/3600).toFixed(1)}<span>小时</span></div>
                  <div className={`metric-sub ${stats.weekGrowth>=0?'up':'down'}`}>{stats.weekGrowth>=0?'↑':'↓'} {Math.abs(stats.weekGrowth)}% vs上周</div>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon" style={{background:'rgba(167,139,250,0.1)'}}><Award size={20} color="#a78bfa"/></div>
                <div className="metric-content">
                  <div className="metric-label">累计学习</div>
                  <div className="metric-value">{(stats.totalSec/3600).toFixed(1)}<span>小时</span></div>
                  <div className="metric-sub">{stats.totalDays} 天</div>
                </div>
              </div>
            </div>

            {/* 图表区域 */}
            <div className="charts-split">
              <div className="chart-container">
                <div className="chart-header">
                  <span>📈 近7天趋势</span>
                  <span className="chart-avg">日均 {Math.round(stats.last7DaysData.reduce((a,b)=>a+b,0)/7)} 分钟</span>
                </div>
                <div style={{flex:1}}><Line data={{labels:stats.last7DaysLabels, datasets:[{data:stats.last7DaysData, borderColor:'#38bdf8', fill:true, backgroundColor:'rgba(56,189,248,0.1)', tension:0.4, pointRadius:4, pointBackgroundColor:'#38bdf8'}]}} options={chartOpts} /></div>
              </div>
              <div className="chart-container">
                <div className="chart-header">🎯 任务分布</div>
                <div style={{flex:1}}><Doughnut data={{labels:Array.from(stats.taskMap.keys()), datasets:[{data:Array.from(stats.taskMap.values()).map(v=>Math.floor(v/60)), backgroundColor:['#38bdf8','#f472b6','#fbbf24','#a78bfa','#22c55e'], borderWidth:0, hoverOffset:8}]}} options={{plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',boxWidth:10,padding:15}}}}} /></div>
              </div>
            </div>

            <div className="charts-split">
              <div className="chart-container">
                <div className="chart-header">
                  <span>⏰ 24小时活跃分布</span>
                  <span className="chart-avg">高峰 {stats.peakHour}:00</span>
                </div>
                <div style={{flex:1}}><Bar data={{labels:Array.from({length:24},(_,i)=>`${i}时`), datasets:[{data:stats.hourDist.map(v=>Math.floor(v/60)), backgroundColor:stats.hourDist.map((_,i)=>i===stats.peakHour?'#38bdf8':'#334155'), borderRadius:4, hoverBackgroundColor:'#38bdf8'}]}} options={chartOpts} /></div>
              </div>
              <div className="heatmap-container">
                <div className="chart-header">
                  <span><Calendar size={14}/> 年度热力图</span>
                  <div className="heatmap-legend"><span>少</span><div className="hm-cell l-1"></div><div className="hm-cell l-2"></div><div className="hm-cell l-3"></div><div className="hm-cell l-4"></div><span>多</span></div>
                </div>
                <div className="heatmap-grid">{stats.heatmap.map((d,i)=><div key={i} className={`hm-cell l-${d.level}`} title={`${d.date}: ${Math.floor(d.count/60)}分钟`}></div>)}</div>
              </div>
            </div>
          </div>
        )}

        {view === 'achievements' && (
          <div className="dashboard-layer">
            <div className="dash-header"><div className="dash-title"><Trophy size={24}/> 荣誉殿堂</div><button className="close-btn" onClick={()=>setView('browser')}><X size={16}/> 关闭</button></div>
            <div className="ach-grid">
              {ACHIEVEMENTS.map(a => {
                const un = unlocked.includes(a.id);
                return <div key={a.id} className={`ach-item ${a.rarity} ${un?'unlocked':''}`}>
                  <div style={{fontSize:30}}>{a.icon}</div><div><div style={{fontWeight:'bold', color:'white'}}>{a.title}</div><div style={{fontSize:12, color:'#94a3b8'}}>{a.desc}</div></div>
                </div>
              })}
            </div>
          </div>
        )}

        {view === 'notes' && (
          <div className="dashboard-layer">
            <div className="dash-header">
              <div className="dash-title"><Book size={24}/> 笔记本管理</div>
              <button className="close-btn" onClick={()=>setView('browser')}><X size={16}/> 关闭</button>
            </div>
            <div style={{display:'flex', gap:20, height:'calc(100% - 80px)'}}>
              {/* 左侧：笔记本列表 */}
              <div style={{width:250, display:'flex', flexDirection:'column', background:'var(--card-bg)', borderRadius:12, padding:20, border:'1px solid var(--border)'}}>
                <div style={{marginBottom:15}}>
                  <button className="btn btn-primary" style={{width:'100%'}} onClick={createNotebook}>
                    <Book size={14}/> 新建笔记本
                  </button>
                </div>
                <div style={{flex:1, overflowY:'auto'}}>
                  {notebooks.length === 0 ? (
                    <div style={{textAlign:'center', padding:40, color:'var(--text-secondary)'}}>
                      <Book size={48} style={{opacity:0.3, marginBottom:10}}/>
                      <div style={{fontSize:12}}>还没有笔记本</div>
                    </div>
                  ) : (
                    notebooks.map(nb => (
                      <div 
                        key={nb.id} 
                        className={`notebook-item ${selectedNotebook===nb.id?'active':''}`}
                        onClick={()=>setSelectedNotebook(nb.id)}
                      >
                        <Book size={16}/>
                        <span style={{flex:1}}>{nb.name}</span>
                        <button 
                          className="icon-btn danger" 
                          onClick={(e)=>{e.stopPropagation(); deleteNotebook(nb.id)}}
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* 右侧：笔记页列表 */}
              <div style={{flex:1, display:'flex', flexDirection:'column', background:'var(--card-bg)', borderRadius:12, padding:20, border:'1px solid var(--border)', minWidth:0}}>
                {selectedNotebook ? (
                  <>
                    <div style={{marginBottom:15, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <h3 style={{margin:0, fontSize:16, color:'var(--text-primary)'}}>
                        {notebooks.find(n => n.id === selectedNotebook)?.name}
                      </h3>
                      <button 
                        className="btn btn-primary" 
                        onClick={()=>createNotePage(selectedNotebook)}
                      >
                        <Plus size={14}/> 新建笔记页
                      </button>
                    </div>
                    <div style={{flex:1, overflowY:'auto'}}>
                      {notePages.filter(p => p.notebookId === selectedNotebook).length === 0 ? (
                        <div style={{textAlign:'center', padding:60, color:'var(--text-secondary)'}}>
                          <FileText size={64} style={{opacity:0.3, marginBottom:15}}/>
                          <div style={{fontSize:14}}>这个笔记本还没有笔记页</div>
                          <div style={{fontSize:12, marginTop:8}}>点击上方按钮创建第一个笔记</div>
                        </div>
                      ) : (
                        <div className="note-pages-list">
                          {notePages.filter(p => p.notebookId === selectedNotebook).map(page => {
                            const isOpen = noteWindows.some(w => w.pageId === page.id)
                            return (
                              <div key={page.id} className="note-page-item">
                                <div className="note-page-info" onClick={()=>{
                                  console.log('Clicked on note page:', page.id)
                                  openNoteWindow(page.id)
                                }}>
                                  <FileText size={16}/>
                                  <div style={{flex:1, minWidth:0}}>
                                    <div className="note-page-title">{page.title}</div>
                                    <div className="note-page-preview">{page.content.substring(0, 80)}{page.content.length > 80 ? '...' : ''}</div>
                                    <div className="note-page-time">
                                      {new Date(page.updatedAt).toLocaleString('zh-CN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </div>
                                  {isOpen && <span className="note-status-badge">已打开</span>}
                                </div>
                                <div className="note-page-actions">
                                  <button 
                                    className="icon-btn" 
                                    onClick={()=>{
                                      setEditingPageId(page.id)
                                      setFormInput({ f1: page.title, f2: '' })
                                      setModalType('renamePage')
                                    }}
                                  >
                                    <Edit2 size={12}/>
                                  </button>
                                  <button className="icon-btn danger" onClick={()=>deleteNotePage(page.id)}>
                                    <Trash2 size={12}/>
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)'}}>
                    <div style={{textAlign:'center'}}>
                      <Book size={64} style={{opacity:0.3, marginBottom:15}}/>
                      <div style={{fontSize:16, marginBottom:8}}>请先创建或选择一个笔记本</div>
                      <div style={{fontSize:13}}>笔记本可以帮助你分类管理笔记</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={modalType==='task'} title={editTask?'编辑任务':'新建任务'} onClose={()=>setModalType(null)}>
         <input className="form-input" value={formInput.f1} onChange={e=>setFormInput({...formInput, f1:e.target.value})} autoFocus placeholder="任务名称"/>
         <div className="modal-actions"><button className="btn btn-primary" onClick={handleSaveTask}>保存</button></div>
      </Modal>
      <Modal isOpen={modalType==='link'} title="网页链接" onClose={()=>setModalType(null)}>
         <div className="form-group"><input className="form-input" value={formInput.f1} onChange={e=>setFormInput({...formInput, f1:e.target.value})} placeholder="名称"/></div>
         <div className="form-group"><input className="form-input" value={formInput.f2} onChange={e=>setFormInput({...formInput, f2:e.target.value})} placeholder="URL"/></div>
         <div className="modal-actions"><button className="btn btn-primary" onClick={handleSaveLink}>保存</button></div>
      </Modal>
      <Modal isOpen={modalType==='settings'} title="设置" onClose={()=>setModalType(null)}>
         <div className="form-group">
           <label className="form-label">主题模式</label>
           <select className="form-input" value={settings.theme} onChange={e=>setSettings({...settings, theme:e.target.value as 'dark'|'light'})}>
             <option value="dark">暗夜模式</option>
             <option value="light">白天模式</option>
           </select>
         </div>
         <div className="form-group"><label className="form-label">专注时长 (分)</label><input type="number" className="form-input" value={settings.pomoWork} onChange={e=>setSettings({...settings, pomoWork:parseInt(e.target.value)})}/></div>
         <div className="form-group"><label className="form-label">短休息 (分)</label><input type="number" className="form-input" value={settings.pomoShort} onChange={e=>setSettings({...settings, pomoShort:parseInt(e.target.value)})}/></div>
         <div className="form-group"><label className="form-label">长休息 (分)</label><input type="number" className="form-input" value={settings.pomoLong} onChange={e=>setSettings({...settings, pomoLong:parseInt(e.target.value)})}/></div>
         <div className="modal-actions"><button className="btn btn-primary" onClick={()=>{localStorage.setItem('study_settings', JSON.stringify(settings)); setModalType(null)}}>保存</button></div>
      </Modal>
      <Modal isOpen={modalType==='reset'} title="重置数据" onClose={()=>setModalType(null)}>
         <div style={{color:'#94a3b8', marginBottom:20}}>确定要重置所有数据吗？这将清除所有任务、学习记录和成就，此操作不可撤销。</div>
         <div className="modal-actions">
           <button className="btn btn-secondary" onClick={()=>setModalType(null)}>取消</button>
           <button className="btn" style={{background:'#ef4444', color:'white'}} onClick={()=>{localStorage.clear();window.location.reload()}}>确定重置</button>
         </div>
      </Modal>
      
      <Modal isOpen={modalType==='notebook'} title="新建笔记本" onClose={()=>setModalType(null)}>
         <div className="form-group">
           <label className="form-label">笔记本名称</label>
           <input 
             className="form-input" 
             value={formInput.f1} 
             onChange={e=>setFormInput({...formInput, f1:e.target.value})} 
             autoFocus 
             placeholder="输入笔记本名称"
             onKeyPress={e => e.key === 'Enter' && handleSaveNotebook()}
           />
         </div>
         <div className="modal-actions">
           <button className="btn btn-secondary" onClick={()=>setModalType(null)}>取消</button>
           <button className="btn btn-primary" onClick={handleSaveNotebook}>创建</button>
         </div>
      </Modal>
      
      <Modal isOpen={modalType==='renamePage'} title="重命名笔记" onClose={()=>setModalType(null)}>
         <div className="form-group">
           <label className="form-label">笔记名称</label>
           <input 
             className="form-input" 
             value={formInput.f1} 
             onChange={e=>setFormInput({...formInput, f1:e.target.value})} 
             autoFocus 
             placeholder="输入笔记名称"
             onKeyPress={e => {
               if (e.key === 'Enter' && editingPageId) {
                 updateNotePage(editingPageId, {title: formInput.f1.trim()})
                 setModalType(null)
               }
             }}
           />
         </div>
         <div className="modal-actions">
           <button className="btn btn-secondary" onClick={()=>setModalType(null)}>取消</button>
           <button className="btn btn-primary" onClick={()=>{
             if (editingPageId && formInput.f1.trim()) {
               updateNotePage(editingPageId, {title: formInput.f1.trim()})
               setModalType(null)
             }
           }}>保存</button>
         </div>
      </Modal>
      
      {/* 笔记窗口 */}
      {noteWindows.map(win => {
        const page = notePages.find(p => p.id === win.pageId)
        if (!page) return null
        
        const renderMarkdown = (content: string) => {
          try {
            return { __html: marked(content) }
          } catch {
            return { __html: content }
          }
        }
        
        return (
          <div
            key={win.id}
            className="note-window"
            style={{
              left: win.x,
              top: win.y,
              width: win.width,
              height: win.height,
              zIndex: win.alwaysOnTop ? 10000 : 100
            }}
          >
            <div className="note-window-bg" style={{opacity: win.opacity}}></div>
            <div className="note-header">
              <div 
                className="note-drag-handle"
                onMouseDown={e => {
                  if ((e.target as HTMLElement).closest('button')) return
                  e.preventDefault()
                  
                  const startX = e.clientX
                  const startY = e.clientY
                  const startWinX = win.x
                  const startWinY = win.y
                  
                  const handleMove = (e: MouseEvent) => {
                    const deltaX = e.clientX - startX
                    const deltaY = e.clientY - startY
                    updateNoteWindow(win.id, {
                      x: startWinX + deltaX,
                      y: startWinY + deltaY
                    })
                  }
                  
                  const handleUp = () => {
                    document.removeEventListener('mousemove', handleMove)
                    document.removeEventListener('mouseup', handleUp)
                  }
                  
                  document.addEventListener('mousemove', handleMove)
                  document.addEventListener('mouseup', handleUp)
                }}
                onDoubleClick={() => {
                  const input = document.querySelector(`[data-window-id="${win.id}"] .note-title-input`) as HTMLInputElement
                  if (input) {
                    input.removeAttribute('readonly')
                    input.focus()
                    input.select()
                  }
                }}
              >
                <input
                  className="note-title-input"
                  data-window-id={win.id}
                  value={page.title}
                  onChange={e => updateNotePage(page.id, {title: e.target.value})}
                  onBlur={e => e.target.setAttribute('readonly', 'true')}
                  readOnly
                />
              </div>
              <div className="note-controls">
                <button 
                  className={`note-control-btn ${win.viewMode==='edit'?'active':''}`}
                  onClick={()=>updateNoteWindow(win.id, {viewMode: 'edit'})}
                  title="编辑模式"
                >
                  <Code size={14}/>
                </button>
                <button 
                  className={`note-control-btn ${win.viewMode==='preview'?'active':''}`}
                  onClick={()=>updateNoteWindow(win.id, {viewMode: 'preview'})}
                  title="预览模式"
                >
                  <Eye size={14}/>
                </button>
                <button 
                  className={`note-control-btn ${win.viewMode==='split'?'active':''}`}
                  onClick={()=>updateNoteWindow(win.id, {viewMode: 'split'})}
                  title="分屏模式"
                >
                  <FileText size={14}/>
                </button>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={win.opacity}
                  onChange={e=>updateNoteWindow(win.id, {opacity: parseFloat(e.target.value)})}
                  className="opacity-slider"
                  title="透明度"
                />
                <button className="note-control-btn" onClick={()=>closeNoteWindow(win.id)}><X size={14}/></button>
              </div>
            </div>
            <div className="note-body">
              {(win.viewMode === 'edit' || win.viewMode === 'split') && (
                <textarea
                  className={`note-content ${win.viewMode === 'split' ? 'split-view' : ''}`}
                  value={page.content}
                  onChange={e=>updateNotePage(page.id, {content: e.target.value})}
                  placeholder="支持 Markdown 格式..."
                />
              )}
              {(win.viewMode === 'preview' || win.viewMode === 'split') && (
                <div 
                  className={`note-preview ${win.viewMode === 'split' ? 'split-view' : ''}`}
                  dangerouslySetInnerHTML={renderMarkdown(page.content)}
                />
              )}
            </div>
            <div 
              className="note-resize-handle"
              onMouseDown={e => {
                e.preventDefault()
                e.stopPropagation()
                
                const startX = e.clientX
                const startY = e.clientY
                const startW = win.width
                const startH = win.height
                
                const handleMove = (e: MouseEvent) => {
                  e.preventDefault()
                  const deltaX = e.clientX - startX
                  const deltaY = e.clientY - startY
                  const newWidth = Math.max(400, startW + deltaX)
                  const newHeight = Math.max(300, startH + deltaY)
                  
                  updateNoteWindow(win.id, {
                    width: newWidth,
                    height: newHeight
                  })
                }
                
                const handleUp = (e: MouseEvent) => {
                  e.preventDefault()
                  document.removeEventListener('mousemove', handleMove)
                  document.removeEventListener('mouseup', handleUp)
                  document.body.style.cursor = ''
                  document.body.style.userSelect = ''
                }
                
                document.body.style.cursor = 'nwse-resize'
                document.body.style.userSelect = 'none'
                document.addEventListener('mousemove', handleMove)
                document.addEventListener('mouseup', handleUp)
              }}
            />
          </div>
        )
      })}

      {/* Alerts & Toasts */}
      {(alertMsg || (settings.forceLock && pomoMode!=='work' && isRunning)) && (
        <div className="lock-screen" style={{pointerEvents:(settings.forceLock&&pomoMode!=='work')?'all':'none', background:(settings.forceLock&&pomoMode!=='work')?'rgba(11,17,32,0.98)':'transparent'}}>
           {alertMsg ? <div style={{background:'#1e293b', padding:30, borderRadius:12, border:'1px solid #38bdf8', textAlign:'center'}}>{alertMsg.icon}<div style={{fontSize:20, marginTop:10, color:'white'}}>{alertMsg.title}</div></div> : <><Coffee size={80} color="#f59e0b"/><div style={{fontSize:40, color:'white', margin:'20px 0'}}>{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</div><div style={{color:'#94a3b8'}}>休息一下</div></>}
        </div>
      )}
      <div className={`steam-toast ${toast?'show':''}`}><div style={{fontSize:30}}>🏆</div><div><div style={{fontSize:10,color:'#94a3b8'}}>UNLOCKED</div><div style={{fontWeight:'bold',color:'white'}}>{toast?.title}</div></div></div>
    </div>
  )
}
export default App
