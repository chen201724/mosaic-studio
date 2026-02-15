/**
 * Core mosaic pixel engine
 * Supports grayscale/color/palette modes and multiple pixel shapes
 */

export type ColorMode = 'grayscale' | 'color' | 'palette'
export type PixelShape = 'square' | 'circle' | 'diamond' | 'cross' | 'ascii'

export interface Palette {
  name: string
  colors: [number, number, number][]
}

export interface MosaicOptions {
  pixelSize: number
  colorMode: ColorMode
  levels: number
  palette?: Palette
  shape: PixelShape
}

const DEFAULT_OPTIONS: MosaicOptions = {
  pixelSize: 8,
  colorMode: 'grayscale',
  levels: 4,
  shape: 'square',
}

export const PALETTES: Palette[] = [
  {
    name: 'Game Boy',
    colors: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
  },
  {
    name: 'NES',
    colors: [
      [0, 0, 0], [255, 255, 255], [124, 124, 124], [188, 188, 188],
      [0, 0, 252], [0, 120, 248], [104, 136, 252], [152, 120, 248],
      [216, 40, 0], [248, 56, 0], [248, 120, 88], [248, 184, 0],
      [0, 168, 0], [0, 184, 0], [88, 216, 84], [0, 168, 68],
    ],
  },
  {
    name: '赛博朋克',
    colors: [
      [10, 10, 20], [20, 10, 40], [60, 0, 80], [120, 0, 120],
      [200, 0, 200], [255, 0, 128], [0, 255, 255], [0, 200, 200],
      [255, 255, 0], [255, 100, 0], [255, 255, 255],
    ],
  },
  {
    name: '复古棕',
    colors: [
      [30, 20, 15], [60, 40, 25], [100, 70, 40], [140, 100, 60],
      [180, 140, 90], [210, 180, 130], [235, 215, 180], [250, 240, 220],
    ],
  },
]

export const SHAPES: { id: PixelShape; name: string; icon: string }[] = [
  { id: 'square', name: '方块', icon: '■' },
  { id: 'circle', name: '圆形', icon: '●' },
  { id: 'diamond', name: '菱形', icon: '◆' },
  { id: 'cross', name: '十字绣', icon: '✚' },
  { id: 'ascii', name: '字符画', icon: 'A' },
]

// ASCII density ramp (dark → light)
const ASCII_CHARS = '@%#*+=-:. '

function toGray(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function quantize(value: number, levels: number): number {
  const step = 255 / (levels - 1)
  return Math.round(Math.round(value / step) * step)
}

function closestPaletteColor(r: number, g: number, b: number, palette: [number, number, number][]): [number, number, number] {
  let minDist = Infinity
  let best = palette[0]
  for (const c of palette) {
    const dr = r - c[0], dg = g - c[1], db = b - c[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) { minDist = dist; best = c }
  }
  return best
}

function mapColor(r: number, g: number, b: number, opts: MosaicOptions): [number, number, number] {
  if (opts.colorMode === 'grayscale') {
    const gray = quantize(toGray(r, g, b), opts.levels)
    return [gray, gray, gray]
  } else if (opts.colorMode === 'palette' && opts.palette) {
    return closestPaletteColor(r, g, b, opts.palette.colors)
  }
  const q = opts.levels
  return [quantize(r, q), quantize(g, q), quantize(b, q)]
}

/** Draw a single pixel block with the given shape */
function drawShape(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  r: number, g: number, b: number,
  brightness: number, // 0-1 for ASCII
  shape: PixelShape
) {
  const half = size / 2
  const cx = x + half
  const cy = y + half
  const color = `rgb(${r},${g},${b})`

  switch (shape) {
    case 'square':
      ctx.fillStyle = color
      ctx.fillRect(x, y, size, size)
      break

    case 'circle':
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(cx, cy, half * 0.85, 0, Math.PI * 2)
      ctx.fill()
      break

    case 'diamond':
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(cx, y + 1)
      ctx.lineTo(x + size - 1, cy)
      ctx.lineTo(cx, y + size - 1)
      ctx.lineTo(x + 1, cy)
      ctx.closePath()
      ctx.fill()
      break

    case 'cross': {
      ctx.fillStyle = color
      const arm = Math.max(1, Math.floor(size * 0.3))
      // Horizontal bar
      ctx.fillRect(x, y + half - arm / 2, size, arm)
      // Vertical bar
      ctx.fillRect(x + half - arm / 2, y, arm, size)
      break
    }

    case 'ascii': {
      const charIdx = Math.floor((1 - brightness) * (ASCII_CHARS.length - 1))
      const ch = ASCII_CHARS[Math.max(0, Math.min(charIdx, ASCII_CHARS.length - 1))]
      ctx.fillStyle = color
      ctx.font = `${size}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ch, cx, cy)
      break
    }
  }
}

/**
 * Apply mosaic effect: read from sourceCanvas, write to targetCanvas
 */
export function applyMosaic(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  options: Partial<MosaicOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { pixelSize, shape } = opts

  const width = sourceCanvas.width
  const height = sourceCanvas.height
  targetCanvas.width = width
  targetCanvas.height = height

  const srcCtx = sourceCanvas.getContext('2d')!
  const tgtCtx = targetCanvas.getContext('2d')!
  const imageData = srcCtx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  // Background: black for most shapes, dark for ASCII
  tgtCtx.fillStyle = shape === 'ascii' ? '#111' : '#000'
  tgtCtx.fillRect(0, 0, width, height)

  for (let x = 0; x < width; x += pixelSize) {
    for (let y = 0; y < height; y += pixelSize) {
      const cx = Math.min(x + Math.floor(pixelSize / 2), width - 1)
      const cy = Math.min(y + Math.floor(pixelSize / 2), height - 1)
      const pos = (cy * width + cx) * 4

      const origR = pixels[pos], origG = pixels[pos + 1], origB = pixels[pos + 2]
      const [r, g, b] = mapColor(origR, origG, origB, opts)
      const brightness = toGray(origR, origG, origB) / 255

      drawShape(tgtCtx, x, y, pixelSize, r, g, b, brightness, shape)
    }
  }
}

/**
 * Process a single frame's ImageData (for GIF frame processing)
 * Uses an offscreen canvas for shape rendering
 */
export function processFrame(
  imageData: ImageData,
  options: Partial<MosaicOptions> = {}
): ImageData {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { width, height } = imageData

  // Use offscreen canvas for all shapes
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!

  // Put source data
  ctx.putImageData(imageData, 0, 0)

  // Create source canvas to read from
  const srcCanvas = new OffscreenCanvas(width, height)
  srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0)

  // Clear and draw
  const { pixelSize, shape } = opts
  ctx.fillStyle = shape === 'ascii' ? '#111' : '#000'
  ctx.fillRect(0, 0, width, height)

  const srcData = imageData.data

  for (let x = 0; x < width; x += pixelSize) {
    for (let y = 0; y < height; y += pixelSize) {
      const cx = Math.min(x + Math.floor(pixelSize / 2), width - 1)
      const cy = Math.min(y + Math.floor(pixelSize / 2), height - 1)
      const pos = (cy * width + cx) * 4

      const origR = srcData[pos], origG = srcData[pos + 1], origB = srcData[pos + 2]
      const [r, g, b] = mapColor(origR, origG, origB, opts)
      const brightness = toGray(origR, origG, origB) / 255

      drawShape(ctx as unknown as CanvasRenderingContext2D, x, y, pixelSize, r, g, b, brightness, shape)
    }
  }

  return ctx.getImageData(0, 0, width, height)
}
