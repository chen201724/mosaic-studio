/**
 * Core mosaic pixel engine
 * Supports grayscale and color modes with optional palette mapping
 */

export type ColorMode = 'grayscale' | 'color' | 'palette'

export interface Palette {
  name: string
  colors: [number, number, number][]
}

export interface MosaicOptions {
  /** Pixel block size in px (2-50) */
  pixelSize: number
  /** Color mode */
  colorMode: ColorMode
  /** Quantization levels for grayscale (2-8) */
  levels: number
  /** Palette for palette mode */
  palette?: Palette
}

const DEFAULT_OPTIONS: MosaicOptions = {
  pixelSize: 8,
  colorMode: 'grayscale',
  levels: 4,
}

/** Built-in palettes */
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

/** RGB to grayscale using luminance formula */
function toGray(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** Quantize a 0-255 value to N discrete levels */
function quantize(value: number, levels: number): number {
  const step = 255 / (levels - 1)
  return Math.round(Math.round(value / step) * step)
}

/** Find closest color in palette using Euclidean distance */
function closestPaletteColor(r: number, g: number, b: number, palette: [number, number, number][]): [number, number, number] {
  let minDist = Infinity
  let best = palette[0]
  for (const c of palette) {
    const dr = r - c[0], dg = g - c[1], db = b - c[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      best = c
    }
  }
  return best
}

/** Map pixel color based on mode */
function mapColor(r: number, g: number, b: number, opts: MosaicOptions): [number, number, number] {
  if (opts.colorMode === 'grayscale') {
    const gray = quantize(toGray(r, g, b), opts.levels)
    return [gray, gray, gray]
  } else if (opts.colorMode === 'palette' && opts.palette) {
    return closestPaletteColor(r, g, b, opts.palette.colors)
  }
  // color mode: quantize each channel
  const q = opts.levels
  return [quantize(r, q), quantize(g, q), quantize(b, q)]
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
  const { pixelSize } = opts

  const width = sourceCanvas.width
  const height = sourceCanvas.height
  targetCanvas.width = width
  targetCanvas.height = height

  const srcCtx = sourceCanvas.getContext('2d')!
  const tgtCtx = targetCanvas.getContext('2d')!
  const imageData = srcCtx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  tgtCtx.fillStyle = '#000'
  tgtCtx.fillRect(0, 0, width, height)

  for (let x = 0; x < width; x += pixelSize) {
    for (let y = 0; y < height; y += pixelSize) {
      const cx = Math.min(x + Math.floor(pixelSize / 2), width - 1)
      const cy = Math.min(y + Math.floor(pixelSize / 2), height - 1)
      const pos = (cy * width + cx) * 4

      const [r, g, b] = mapColor(pixels[pos], pixels[pos + 1], pixels[pos + 2], opts)

      tgtCtx.fillStyle = `rgb(${r},${g},${b})`
      tgtCtx.fillRect(x, y, pixelSize, pixelSize)
    }
  }
}

/**
 * Process a single frame's ImageData (for GIF/video frame processing)
 */
export function processFrame(
  imageData: ImageData,
  options: Partial<MosaicOptions> = {}
): ImageData {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { pixelSize } = opts
  const { width, height } = imageData
  const src = imageData.data
  const output = new ImageData(width, height)
  const dst = output.data

  for (let i = 0; i < dst.length; i += 4) {
    dst[i] = dst[i + 1] = dst[i + 2] = 0
    dst[i + 3] = 255
  }

  for (let bx = 0; bx < width; bx += pixelSize) {
    for (let by = 0; by < height; by += pixelSize) {
      const cx = Math.min(bx + Math.floor(pixelSize / 2), width - 1)
      const cy = Math.min(by + Math.floor(pixelSize / 2), height - 1)
      const pos = (cy * width + cx) * 4

      const [r, g, b] = mapColor(src[pos], src[pos + 1], src[pos + 2], opts)

      const maxX = Math.min(bx + pixelSize, width)
      const maxY = Math.min(by + pixelSize, height)
      for (let px = bx; px < maxX; px++) {
        for (let py = by; py < maxY; py++) {
          const idx = (py * width + px) * 4
          dst[idx] = r
          dst[idx + 1] = g
          dst[idx + 2] = b
          dst[idx + 3] = 255
        }
      }
    }
  }

  return output
}
