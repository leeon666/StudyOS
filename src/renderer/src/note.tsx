import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Code, Eye, FileText, Pin, X } from 'lucide-react'
import { getStudyOSBridge } from './lib/studyOSRuntime'
import { renderMarkdownSafe } from './lib/markdown'
import type { NotePage, NoteWindow } from './lib/types'

function NoteWindowComponent() {
  const [page, setPage] = useState<NotePage | null>(null)
  const [windowData, setWindowData] = useState<NoteWindow | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = Number(params.get('id') || '0')
    const bridge = getStudyOSBridge()

    bridge.requestNoteData(id)

    const offData = bridge.onNoteDataUpdated((data) => {
      if (data.windowId === id) {
        setPage(data.page)
        setWindowData(data.window)
      }
    })

    return () => {
      offData()
    }
  }, [])

  if (!page || !windowData) {
    return <div style={{ color: '#fff', padding: 20 }}>加载中...</div>
  }

  const updateWindow = (updates: Partial<NoteWindow>) => {
    const bridge = getStudyOSBridge()
    bridge.updateNoteWindow({ id: windowData.id, ...updates })
    setWindowData({ ...windowData, ...updates })
  }

  const updatePage = (updates: Partial<NotePage>) => {
    const bridge = getStudyOSBridge()
    const nextPage = { ...page, ...updates, updatedAt: Date.now() }
    setPage(nextPage)
    bridge.updateNotePage(nextPage)
  }

  const closeWindow = () => {
    const bridge = getStudyOSBridge()
    bridge.closeNoteWindow(windowData.id)
  }

  return (
    <div className="note-window-standalone">
      <div className="note-window-bg" style={{ opacity: windowData.opacity }}></div>
      <div className="note-header">
        <div
          className="note-drag-handle"
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).closest('button')) return
            e.preventDefault()

            const startX = e.clientX
            const startY = e.clientY
            const startWinX = windowData.x
            const startWinY = windowData.y

            const handleMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX
              const deltaY = e.clientY - startY
              updateWindow({
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
            const input = document.querySelector('.note-title-input') as HTMLInputElement | null
            input?.removeAttribute('readonly')
            input?.focus()
            input?.select()
          }}
        >
          <input
            className="note-title-input"
            value={page.title}
            onChange={(e) => updatePage({ title: e.target.value })}
            onBlur={(e) => e.target.setAttribute('readonly', 'true')}
            readOnly
          />
        </div>

        <div className="note-controls">
          <button className={`note-control-btn ${windowData.viewMode === 'edit' ? 'active' : ''}`} onClick={() => updateWindow({ viewMode: 'edit' })} title="编辑模式">
            <Code size={14} />
          </button>
          <button className={`note-control-btn ${windowData.viewMode === 'preview' ? 'active' : ''}`} onClick={() => updateWindow({ viewMode: 'preview' })} title="预览模式">
            <Eye size={14} />
          </button>
          <button className={`note-control-btn ${windowData.viewMode === 'split' ? 'active' : ''}`} onClick={() => updateWindow({ viewMode: 'split' })} title="分屏模式">
            <FileText size={14} />
          </button>
          <button className={`note-control-btn ${windowData.alwaysOnTop ? 'active' : ''}`} onClick={() => updateWindow({ alwaysOnTop: !windowData.alwaysOnTop })} title="置顶">
            <Pin size={14} />
          </button>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={windowData.opacity}
            onChange={(e) => updateWindow({ opacity: Number.parseFloat(e.target.value) })}
            className="opacity-slider"
            title="透明度"
          />
          <button className="note-control-btn" onClick={closeWindow}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="note-body">
        {(windowData.viewMode === 'edit' || windowData.viewMode === 'split') && (
          <textarea
            className={`note-content ${windowData.viewMode === 'split' ? 'split-view' : ''}`}
            value={page.content}
            onChange={(e) => updatePage({ content: e.target.value })}
            placeholder="支持 Markdown 格式..."
          />
        )}
        {(windowData.viewMode === 'preview' || windowData.viewMode === 'split') && (
          <div
            className={`note-preview ${windowData.viewMode === 'split' ? 'split-view' : ''}`}
            dangerouslySetInnerHTML={{ __html: renderMarkdownSafe(page.content) }}
          />
        )}
      </div>
      <div
        className="note-resize-handle"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()

          const startX = e.clientX
          const startY = e.clientY
          const startW = windowData.width
          const startH = windowData.height

          const handleMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX
            const deltaY = e.clientY - startY
            updateWindow({
              width: Math.max(400, startW + deltaX),
              height: Math.max(300, startH + deltaY)
            })
          }

          const handleUp = () => {
            document.removeEventListener('mousemove', handleMove)
            document.removeEventListener('mouseup', handleUp)
          }

          document.addEventListener('mousemove', handleMove)
          document.addEventListener('mouseup', handleUp)
        }}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('note-root')!).render(
  <React.StrictMode>
    <NoteWindowComponent />
  </React.StrictMode>
)
