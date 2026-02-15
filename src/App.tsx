import { useState, useRef, useCallback, useEffect } from 'react'
import { applyMosaic, processFrame } from './utils/mosaic'
import { parseGif, encodeGif, type GifFrame } from './utils/gif'
import './index.css'

type FileType = 'image' | 'gif' | null

export default function App() {
  const [pixelSize, setPixelSize] = useState(8)
  const [levels, setLevels] = useState(4)
  const [fileType, setFileType] = useState<FileType>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 })

  const imageRef = useRef<HTMLImageElement | null>(null)
  const [gifFrames, setGifFrames] = useState<GifFrame[]>([])
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null)
  const resultCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const type = file.type
    setFileName(file.name)
    setFileSize(formatSize(file.size))

    if (type === 'image/gif') {
      setFileType('gif')
      const buffer = await file.arrayBuffer()
      const frames = parseGif(buffer)
      setGifFrames(frames)
      if (frames.length > 0) {
        const canvas = sourceCanvasRef.current!
        canvas.width = frames[0].imageData.width
        canvas.height = frames[0].imageData.height
        canvas.getContext('2d')!.putImageData(frames[0].imageData, 0, 0)
        setDimensions({ w: frames[0].imageData.width, h: frames[0].imageData.height })
      }
    } else if (type.startsWith('image/')) {
      setFileType('image')
      setGifFrames([])
      const img = new Image()
      img.onload = () => {
        imageRef.current = img
        const canvas = sourceCanvasRef.current!
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        setDimensions({ w: img.width, h: img.height })
        setFileName(file.name) // trigger re-render
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    } else {
      alert('请上传图片或 GIF 文件')
    }
  }, [])

  // Re-apply mosaic
  useEffect(() => {
    if (fileType === 'image' && imageRef.current) {
      applyMosaic(sourceCanvasRef.current!, resultCanvasRef.current!, {
        pixelSize, grayscale: true, levels,
      })
    } else if (fileType === 'gif' && gifFrames.length > 0) {
      const tgt = resultCanvasRef.current!
      const frame = gifFrames[0]
      tgt.width = frame.imageData.width
      tgt.height = frame.imageData.height
      tgt.getContext('2d')!.putImageData(
        processFrame(frame.imageData, { pixelSize, grayscale: true, levels }),
        0, 0
      )
    }
  }, [fileType, pixelSize, levels, gifFrames])

  const handleExport = useCallback(async () => {
    const baseName = fileName.replace(/\.[^.]+$/, '')
    if (fileType === 'image') {
      resultCanvasRef.current!.toBlob((blob) => {
        if (blob) downloadBlob(blob, `mosaic-${baseName}.png`)
      }, 'image/png')
    } else if (fileType === 'gif' && gifFrames.length > 0) {
      setProcessing(true)
      try {
        const { width, height } = gifFrames[0].imageData
        const processed = gifFrames.map(f => ({
          imageData: processFrame(f.imageData, { pixelSize, grayscale: true, levels }),
          delay: f.delay,
        }))
        const blob = await encodeGif(processed, width, height)
        downloadBlob(blob, `mosaic-${baseName}.gif`)
      } finally {
        setProcessing(false)
      }
    }
  }, [fileType, fileName, pixelSize, levels, gifFrames])

  const handleReset = () => {
    setFileType(null)
    setFileName('')
    setFileSize('')
    setGifFrames([])
    setDimensions({ w: 0, h: 0 })
    imageRef.current = null
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>🎨 Mosaic Studio</h1>
          <span className="header-badge">v2.0</span>
        </div>
        <div className="header-right">
          {fileType && (
            <button className="btn btn-ghost" onClick={handleReset} style={{ width: 'auto', padding: '6px 16px' }}>
              重新上传
            </button>
          )}
        </div>
      </header>

      <div className="main">
        {/* Canvas area */}
        <div className="canvas-area">
          {!fileType ? (
            <div
              className={`upload-zone ${dragging ? 'dragging' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <div className="upload-icon">↑</div>
              <div className="upload-title">拖拽文件到这里，或点击上传</div>
              <div className="upload-hint">支持 JPG、PNG、GIF 格式</div>
              <input type="file" accept="image/*" onChange={onFileChange} />
            </div>
          ) : (
            <div className="preview-container">
              <div className="preview-side">
                <span className="preview-label">原图{fileType === 'gif' ? ' · 第1帧' : ''}</span>
                <canvas ref={sourceCanvasRef} />
              </div>
              <div className="preview-divider" />
              <div className="preview-side">
                <span className="preview-label">像素化</span>
                <canvas ref={resultCanvasRef} />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h2>参数调节</h2>

            <div className="control-item">
              <div className="control-header">
                <span className="control-label">像素块大小</span>
                <span className="control-value">{pixelSize}px</span>
              </div>
              <input type="range" min={2} max={50} value={pixelSize}
                onChange={e => setPixelSize(Number(e.target.value))} />
              <span className="control-desc">
                每个像素块的边长。数值越大，像素感越强，细节越少；数值越小，越接近原图。
              </span>
            </div>

            <div className="control-item">
              <div className="control-header">
                <span className="control-label">灰度层级</span>
                <span className="control-value">{levels} 级</span>
              </div>
              <input type="range" min={2} max={8} value={levels}
                onChange={e => setLevels(Number(e.target.value))} />
              <span className="control-desc">
                灰度的阶梯数量。2 级 = 纯黑白，4 级 = 黑·深灰·浅灰·白，数值越大过渡越细腻。
              </span>
            </div>
          </div>

          {fileType && (
            <div className="sidebar-section">
              <h2>文件信息</h2>
              <div className="file-info">
                {fileName}<br />
                {dimensions.w} × {dimensions.h}px · {fileSize}
                {fileType === 'gif' && ` · ${gifFrames.length} 帧`}
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <button className="btn btn-primary" disabled={!fileType || processing} onClick={handleExport}>
              {processing ? '处理中...' : fileType === 'gif' ? '导出像素 GIF' : '导出 PNG'}
            </button>
          </div>

          <div className="privacy-hint">
            🔒 所有处理均在浏览器本地完成，图片不会上传到任何服务器
          </div>
        </aside>
      </div>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
