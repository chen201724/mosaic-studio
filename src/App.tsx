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
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Image state
  const imageRef = useRef<HTMLImageElement | null>(null)

  // GIF state
  const [gifFrames, setGifFrames] = useState<GifFrame[]>([])

  const sourceCanvasRef = useRef<HTMLCanvasElement>(null)
  const resultCanvasRef = useRef<HTMLCanvasElement>(null)

  // Handle file upload
  const handleFile = useCallback(async (file: File) => {
    const type = file.type

    if (type === 'image/gif') {
      setFileType('gif')
      setFileName(file.name)
      const buffer = await file.arrayBuffer()
      const frames = parseGif(buffer)
      setGifFrames(frames)
      // Show first frame
      if (frames.length > 0) {
        const canvas = sourceCanvasRef.current!
        canvas.width = frames[0].imageData.width
        canvas.height = frames[0].imageData.height
        canvas.getContext('2d')!.putImageData(frames[0].imageData, 0, 0)
      }
    } else if (type.startsWith('image/')) {
      setFileType('image')
      setFileName(file.name)
      setGifFrames([])
      const img = new Image()
      img.onload = () => {
        imageRef.current = img
        const canvas = sourceCanvasRef.current!
        canvas.width = img.width
        canvas.height = img.height
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        // Trigger re-render
        setFileName(file.name)
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(file)
    } else {
      alert('请上传图片或 GIF 文件')
    }
  }, [])

  // Re-apply mosaic on settings change
  useEffect(() => {
    if (fileType === 'image' && imageRef.current) {
      applyMosaic(sourceCanvasRef.current!, resultCanvasRef.current!, {
        pixelSize, grayscale: true, levels,
      })
    } else if (fileType === 'gif' && gifFrames.length > 0) {
      // Preview first frame
      const tgt = resultCanvasRef.current!
      const frame = gifFrames[0]
      tgt.width = frame.imageData.width
      tgt.height = frame.imageData.height
      const processed = processFrame(frame.imageData, {
        pixelSize, grayscale: true, levels,
      })
      tgt.getContext('2d')!.putImageData(processed, 0, 0)
    }
  }, [fileType, pixelSize, levels, gifFrames])

  // Export
  const handleExport = useCallback(async () => {
    const baseName = fileName.replace(/\.[^.]+$/, '')

    if (fileType === 'image') {
      const canvas = resultCanvasRef.current!
      canvas.toBlob((blob) => {
        if (!blob) return
        downloadBlob(blob, `mosaic-${baseName}.png`)
      }, 'image/png')
    } else if (fileType === 'gif' && gifFrames.length > 0) {
      setProcessing(true)
      try {
        const width = gifFrames[0].imageData.width
        const height = gifFrames[0].imageData.height
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
      <div className="header">
        <h1>🎨 Mosaic Studio</h1>
        <p>像素风格转换器 — 支持图片 / GIF / 视频</p>
      </div>

      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="icon">📁</div>
        <div>{fileName || '点击或拖拽上传文件'}</div>
        <div className="hint">支持 JPG / PNG / GIF</div>
        <input type="file" accept="image/*" onChange={onFileChange} />
      </div>

      <div className="controls">
        <div className="control-row">
          <label>像素精度</label>
          <input type="range" min={2} max={50} value={pixelSize}
            onChange={e => setPixelSize(Number(e.target.value))} />
          <span className="value">{pixelSize}px</span>
        </div>
        <div className="control-row">
          <label>灰度层级</label>
          <input type="range" min={2} max={8} value={levels}
            onChange={e => setLevels(Number(e.target.value))} />
          <span className="value">{levels}</span>
        </div>
      </div>

      <div className="preview">
        <div className="preview-panel">
          <h3>原图{fileType === 'gif' ? '（第一帧）' : ''}</h3>
          <canvas ref={sourceCanvasRef} />
        </div>
        <div className="preview-panel">
          <h3>像素化{fileType === 'gif' ? '（预览第一帧）' : ''}</h3>
          <canvas ref={resultCanvasRef} />
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-primary" disabled={!fileType || processing} onClick={handleExport}>
          {processing ? '处理中...' : fileType === 'gif' ? '导出 GIF' : '导出 PNG'}
        </button>
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
