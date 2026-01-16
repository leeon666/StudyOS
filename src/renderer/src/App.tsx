import React, { useState, useEffect, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { Trophy, Activity, BrainCircuit, ChevronDown, ChevronRight, Menu, Play, Pause, SkipForward, Settings, X, RotateCcw, Calendar, Clock, Flame, Target, TrendingUp, Plus, Edit2, Trash2, Lock, Coffee, GlassWater } from 'lucide-react'
import confetti from 'canvas-confetti'
import './assets/main.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

// --- Interfaces ---
interface TaskLink { name: string; url: string }
interface Task { id: number; title: string; links: TaskLink[] }
interface StudySession { date: string; timestamp: number; duration: number; taskId: number }
interface Achievement { id: string; title: string; desc: string; icon: string; rarity: 'common'|'rare'|'legendary'; condition: (t:number, s:StudySession[], c:number)=>boolean }
interface AppSettings { pomoWork: number; pomoShort: number; pomoLong: number; waterReminder: boolean; forceLock: boolean; }

const DEFAULT_TASKS: Task[] = [{ id: 1, title: '1. 计算机网络复习', links: [{ name: 'CS-Wiki', url: 'https://cs-wiki.cn/' }] }, { id: 2, title: '2. 英语阅读训练', links: [{ name: 'Economist', url: 'https://www.economist.com/' }] }]
const DEFAULT_SETTINGS: AppSettings = { pomoWork: 25, pomoShort: 5, pomoLong: 15, waterReminder: true, forceLock: true }

// --- 28 Achievements (Simplified for brevity but logic intact) ---
const ACHIEVEMENTS: Achievement[] = [
  { id: 'start', title: '初次见面', desc: '完成第一个番茄钟', icon: '🐣', rarity: 'common', condition: (_,__,c) => c >= 25*60 },
  { id: 'focus_2h', title: '心流状态', desc: '累计专注 2 小时', icon: '🌊', rarity: 'common', condition: (t) => t >= 7200 },
  { id: 'master_10h', title: '学识渊博', desc: '累计专注 10 小时', icon: '🎓', rarity: 'rare', condition: (t) => t >= 36000 },
  { id: 'god_100h', title: '登峰造极', desc: '累计专注 100 小时', icon: '👑', rarity: 'legendary', condition: (t) => t >= 360000 },
  { id: 'night', title: '守夜人', desc: '凌晨 2-5 点学习', icon: '🦉', rarity: 'rare', condition: (_,s) => s.some(x=>new Date(x.timestamp).getHours()>=2 && new Date(x.timestamp).getHours()<5) }
]

// --- Stats Logic ---
const calculateStats = (history: StudySession[], tasks: Task[]) => {
  const totalSec = history.reduce((a, b) => a + b.duration, 0)
  const todayStr = new Date().toISOString().split('T')[0]
  const todaySec = history.filter(h => h.date === todayStr).reduce((a, b) => a + b.duration, 0)

  // Streak
  const dates = Array.from(new Set(history.map(h => h.date))).sort()
  let streak = 0
  if (dates.length > 0) {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dates.includes(today) || dates.includes(yesterday)) {
      let d = new Date(dates.includes(today)?today:yesterday);
      while(true) {
        if(dates.includes(d.toISOString().split('T')[0])) { streak++; d.setDate(d.getDate()-1); } else break;
      }
    }
  }

  // Trend (7 days)
  const last7DaysLabels = [], last7DaysData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); const s = d.toISOString().split('T')[0]
    last7DaysLabels.push(s.slice(5))
    last7DaysData.push(Math.floor(history.filter(h => h.date === s).reduce((a, b) => a + b.duration, 0) / 60))
  }

  // Distribution
  const taskMap = new Map<string, number>()
  history.forEach(h => { const t = tasks.find(x => x.id === h.taskId)?.title || '已删除'; taskMap.set(t, (taskMap.get(t)||0) + h.duration) })

  // Heatmap
  const heatmap = []; const start = new Date(); start.setFullYear(start.getFullYear()-1);
  const dailyMap = new Map(); history.forEach(h => dailyMap.set(h.date, (dailyMap.get(h.date)||0)+h.duration));
  for(let d=new Date(start); d<=new Date(); d.setDate(d.getDate()+1)) {
    const k = d.toISOString().split('T')[0]; const v = dailyMap.get(k)||0;
    heatmap.push({ date: k, count: v, level: v>7200?4:v>3600?3:v>1800?2:v>0?1:0 })
  }

  // Hour Dist
  const hourDist = new Array(24).fill(0); history.forEach(h => hourDist[new Date(h.timestamp).getHours()] += h.duration);

  return { totalSec, todaySec, streak, last7DaysLabels, last7DaysData, taskMap, heatmap, hourDist }
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

  // UI
  const [view, setView] = useState<'browser'|'stats'|'achievements'>('browser')
  const [currentTask, setCurrentTask] = useState<number>(0)
  const [activeUrl, setActiveUrl] = useState('https://www.google.com')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [expanded, setExpanded] = useState<number[]>([])

  // Timer
  const [pomoMode, setPomoMode] = useState<'work'|'short'|'long'>('work')
  const [timeLeft, setTimeLeft] = useState(25*60)
  const [isRunning, setIsRunning] = useState(false)
  const [waterTimer, setWaterTimer] = useState(0)

  // Modals
  const [modalType, setModalType] = useState<'task'|'link'|'settings'|null>(null)
  const [editTask, setEditTask] = useState<Task|null>(null)
  const [editLink, setEditLink] = useState<{tid:number, idx:number|null, name:string, url:string}|null>(null)
  const [formInput, setFormInput] = useState({ f1: '', f2: '' })

  // Toast & Alert
  const [toast, setToast] = useState<Achievement|null>(null)
  const [alertMsg, setAlertMsg] = useState<{title:string, icon:any}|null>(null)

  // Init
  useEffect(() => {
    const sTasks = localStorage.getItem('study_tasks'); if(sTasks) { const p=JSON.parse(sTasks); setTasks(p); if(p.length) setCurrentTask(p[0].id); } else { setTasks(DEFAULT_TASKS); setCurrentTask(DEFAULT_TASKS[0].id); }
    const sHist = localStorage.getItem('study_history'); if(sHist) setHistory(JSON.parse(sHist));
    const sAch = localStorage.getItem('study_achievements'); if(sAch) { setUnlocked(JSON.parse(sAch)); unlockedRef.current=JSON.parse(sAch); }
    const sSet = localStorage.getItem('study_settings'); if(sSet) setSettings(JSON.parse(sSet));
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
  const triggerToast = (ach: Achievement) => { setToast(ach); setTimeout(()=>setToast(null), 5000); confetti() }
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

  const stats = calculateStats(history, tasks)
  const chartOpts = { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{display:false}} }

  return (
    <div className="app-container">
      <canvas id="confetti-canvas"></canvas>

      {/* Sidebar */}
      <div className={`sidebar ${!isSidebarOpen?'collapsed':''}`} style={{width:isSidebarOpen?320:0}}>
        <div className="logo-area"><BrainCircuit /> STUDY OS <span style={{fontSize:10, opacity:0.5}}>ULTIMATE</span></div>

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
            <div key={t.id} className={`task-card ${currentTask===t.id?'active':''}`}>
              <div className="task-header" onClick={() => setExpanded(p=>p.includes(t.id)?p.filter(x=>x!==t.id):[...p,t.id])}>
                <span style={{maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.title}</span>
                <div className="task-actions" onClick={e=>e.stopPropagation()}>
                  <div className="icon-btn" onClick={()=>{setEditTask(t); setFormInput({f1:t.title, f2:''}); setModalType('task')}}><Edit2 size={12}/></div>
                  <div className="icon-btn danger" onClick={()=>{if(confirm('删除?')) saveTasks(tasks.filter(x=>x.id!==t.id))}}><Trash2 size={12}/></div>
                  {expanded.includes(t.id)?<ChevronDown size={14}/>:<ChevronRight size={14}/>}
                </div>
              </div>
              <div className={`task-body ${expanded.includes(t.id)?'expanded':''}`}>
                {t.links.map((l,i) => (
                  <div key={i} className="link-item">
                    <button className="nav-btn" onClick={()=>{setActiveUrl(l.url); setCurrentTask(t.id); setView('browser')}}>{l.name}</button>
                    <div className="link-actions">
                      <div className="icon-btn" onClick={()=>{setEditLink({tid:t.id, idx:i, name:l.name, url:l.url}); setFormInput({f1:l.name, f2:l.url}); setModalType('link')}}><Edit2 size={10}/></div>
                      <div className="icon-btn danger" onClick={()=>{const nt=tasks.map(x=>{if(x.id===t.id) x.links.splice(i,1); return x}); saveTasks(nt)}}><X size={10}/></div>
                    </div>
                  </div>
                ))}
                <button className="add-btn" onClick={()=>{setEditLink({tid:t.id, idx:null, name:'', url:''}); setFormInput({f1:'', f2:''}); setModalType('link')}}><Plus size={12}/> Add Link</button>
              </div>
            </div>
          ))}
          <button className="add-btn" style={{borderStyle:'solid', padding:12}} onClick={()=>{setEditTask(null); setFormInput({f1:'', f2:''}); setModalType('task')}}><Plus size={14}/> New Task</button>
        </div>

        <div className="bottom-bar">
          <button className="action-btn" onClick={()=>setView('stats')}><Activity size={16}/> 数据</button>
          <button className="action-btn" onClick={()=>setView('achievements')}><Trophy size={16}/> 成就</button>
          <button className="action-btn" onClick={()=>{setModalType('settings')}}><Settings size={16}/> 设置</button>
          <button className="action-btn" onClick={()=>{if(confirm('Reset all data?')){localStorage.clear();window.location.reload()}}}><RotateCcw size={16}/></button>
        </div>
      </div>

      <div className="main-area">
        {!isSidebarOpen && <button style={{position:'absolute', top:20, left:20, zIndex:100, background:'#1e293b', color:'white', padding:8, borderRadius:6}} onClick={()=>setIsSidebarOpen(true)}><Menu/></button>}

        <webview src={activeUrl} style={{display: view==='browser'?'flex':'none'}} />

        {view === 'stats' && (
          <div className="dashboard-layer">
            <div className="dash-header"><div className="dash-title"><Target /> 指挥官数据中心</div><button className="action-btn" style={{width:'auto'}} onClick={()=>setView('browser')}><X/> 关闭</button></div>

            <div className="metrics-grid">
               <div className="metric-card"><div className="metric-label"><Clock size={14}/> 今日投入</div><div className="metric-value">{Math.floor(stats.todaySec/60)}m</div><div className="metric-sub">保持专注</div></div>
               <div className="metric-card"><div className="metric-label"><Flame size={14}/> 连续连胜</div><div className="metric-value">{stats.streak}天</div><div className="metric-sub">不要断掉!</div></div>
               <div className="metric-card"><div className="metric-label"><BrainCircuit size={14}/> 累计时长</div><div className="metric-value">{(stats.totalSec/3600).toFixed(1)}h</div><div className="metric-sub">积少成多</div></div>
               <div className="metric-card"><div className="metric-label"><TrendingUp size={14}/> 效率指数</div><div className="metric-value">A+</div></div>
            </div>

            <div className="charts-split">
               <div className="chart-container"><div className="chart-header">近7天趋势</div><div style={{flex:1}}><Line data={{labels:stats.last7DaysLabels, datasets:[{data:stats.last7DaysData, borderColor:'#38bdf8', fill:true, backgroundColor:'rgba(56,189,248,0.1)'}]}} options={chartOpts} /></div></div>
               <div className="chart-container"><div className="chart-header">投入占比</div><div style={{flex:1}}><Doughnut data={{labels:Array.from(stats.taskMap.keys()), datasets:[{data:Array.from(stats.taskMap.values()).map(v=>Math.floor(v/60)), backgroundColor:['#38bdf8','#f472b6','#fbbf24','#a78bfa'], borderWidth:0}]}} options={{plugins:{legend:{position:'bottom',labels:{color:'#94a3b8',boxWidth:10}}}}} /></div></div>
            </div>

            <div className="charts-split">
               <div className="chart-container"><div className="chart-header">24小时效率分布</div><div style={{flex:1}}><Bar data={{labels:Array.from({length:24},(_,i)=>i), datasets:[{data:stats.hourDist.map(v=>Math.floor(v/60)), backgroundColor:'#6366f1', borderRadius:4}]}} options={chartOpts} /></div></div>
               <div className="heatmap-container" style={{flex:1, marginBottom:0}}><div className="chart-header"><Calendar size={14}/> 年度热力图</div><div className="heatmap-grid">{stats.heatmap.map((d,i)=><div key={i} className={`hm-cell l-${d.level}`} title={`${d.date}: ${Math.floor(d.count/60)}m`}></div>)}</div></div>
            </div>
          </div>
        )}

        {view === 'achievements' && (
          <div className="dashboard-layer">
            <div className="dash-header"><div className="dash-title"><Trophy/> 荣誉殿堂</div><button className="action-btn" style={{width:'auto'}} onClick={()=>setView('browser')}><X/></button></div>
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
         <div className="form-group"><label className="form-label">专注时长 (分)</label><input type="number" className="form-input" value={settings.pomoWork} onChange={e=>setSettings({...settings, pomoWork:parseInt(e.target.value)})}/></div>
         <div className="modal-actions"><button className="btn btn-primary" onClick={()=>{localStorage.setItem('study_settings', JSON.stringify(settings)); setModalType(null)}}>保存</button></div>
      </Modal>

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
