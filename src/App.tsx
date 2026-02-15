import { useState, useRef, useCallback, useEffect } from 'react'
import { applyMosaic, processFrame, PALETTES, type ColorMode } from './utils/mosaic'
import { parseGif, encodeGif, type GifFrame } from './utils/gif'
import './index.css'

type FileType = 'image' | 'gif' | null

export default function App() {
  const [pixelSize, setPixelSize] = useState(8)
  const [levels, setLevels] = useState(4)
  const [colorMode, setColorMode] = useState<ColorMode>('grayscale')
  const [paletteIndex, setPaletteIndex] = useState(0)
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

  const getMosaicOpts = useCallback(() => ({
    pixelSize,
    colorMode,
    levels,
    palette: colorMode === 'palette' ? PALETTES[paletteIndex] : undefined,
  }), [pixelSize, colorMode, levels, paletteIndex])

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
        setFileName(file.name)
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    } else {
      alert('请上传图片或 GIF 文件')
    }
  }, [])

  // Re-apply mosaic
  useEffect(() => {
    const opts = getMosaicOpts()
    if (fileType === 'image' && imageRef.current) {
      applyMosaic(sourceCanvasRef.current!, resultCanvasRef.current!, opts)
    } else if (fileType === 'gif' && gifFrames.length > 0) {
      const tgt = resultCanvasRef.current!
      const frame = gifFrames[0]
      tgt.width = frame.imageData.width
      tgt.height = frame.imageData.height
      tgt.getContext('2d')!.putImageData(processFrame(frame.imageData, opts), 0, 0)
    }
  }, [fileType, pixelSize, levels, colorMode, paletteIndex, gifFrames, getMosaicOpts])

  const handleExport = useCallback(async () => {
    const baseName = fileName.replace(/\.[^.]+$/, '')
    const opts = getMosaicOpts()
    if (fileType === 'image') {
      resultCanvasRef.current!.toBlob((blob) => {
        if (blob) downloadBlob(blob, `mosaic-${baseName}.png`)
      }, 'image/png')
    } else if (fileType === 'gif' && gifFrames.length > 0) {
      setProcessing(true)
      try {
        const { width, height } = gifFrames[0].imageData
        const processed = gifFrames.map(f => ({
          imageData: processFrame(f.imageData, opts),
          delay: f.delay,
        }))
        const blob = await encodeGif(processed, width, height)
        downloadBlob(blob, `mosaic-${baseName}.gif`)
      } finally {
        setProcessing(false)
      }
    }
  }, [fileType, fileName, getMosaicOpts, gifFrames])

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

        <aside className="sidebar">
          <div className="sidebar-section">
            <h2>参数调节</h2>

            <div className="control-item">
              <div className="control-header">
                <span className="control-label">像素精度</span>
                <span className="control-value">{pixelSize}px</span>
              </div>
              <input type="range" min={2} max={50} value={pixelSize}
                onChange={e => setPixelSize(Number(e.target.value))} />
              <span className="control-desc">值越大像素块越大，细节越少，像素风格越强</span>
            </div>

            {/* Color mode selector */}
            <div className="control-item">
              <div className="control-header">
                <span className="control-label">色彩模式</span>
              </div>
              <div className="mode-tabs">
                {([['grayscale', '黑白灰'], ['color', '彩色'], ['palette', '调色板']] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    className={`mode-tab ${colorMode === mode ? 'active' : ''}`}
                    onClick={() => setColorMode(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="control-desc">
                {colorMode === 'grayscale' && '经典黑白灰像素风格'}
                {colorMode === 'color' && '保留原始色彩，量化为像素色块'}
                {colorMode === 'palette' && '映射到经典调色板配色'}
              </span>
            </div>

            {/* Levels slider — for grayscale and color */}
            {colorMode !== 'palette' && (
              <div className="control-item">
                <div className="control-header">
                  <span className="control-label">{colorMode === 'grayscale' ? '灰度层级' : '色彩层级'}</span>
                  <span className="control-value">{levels}</span>
                </div>
                <input type="range" min={2} max={8} value={levels}
                  onChange={e => setLevels(Number(e.target.value))} />
                <span className="control-desc">
                  {colorMode === 'grayscale'
                    ? '2 = 纯黑白，数值越大灰度过渡越细腻'
                    : '数值越小色彩越少越复古，越大越接近原色'}
                </span>
              </div>
            )}

            {/* Palette picker */}
            {colorMode === 'palette' && (
              <div className="control-item">
                <div className="control-header">
                  <span className="control-label">调色板</span>
                </div>
                <div className="palette-list">
                  {PALETTES.map((p, i) => (
                    <button
                      key={p.name}
                      className={`palette-option ${paletteIndex === i ? 'active' : ''}`}
                      onClick={() => setPaletteIndex(i)}
                    >
                      <div className="palette-colors">
                        {p.colors.slice(0, 6).map((c, j) => (
                          <span key={j} className="palette-dot" style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }} />
                        ))}
                      </div>
                      <span className="palette-name">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
