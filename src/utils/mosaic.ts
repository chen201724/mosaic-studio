/**
 * Core mosaic pixel engine
 * Converts image data to grayscale pixelated version
 */

export interface MosaicOptions {
  /** Pixel block size in px (2-50) */
  pixelSize: number
  /** Convert to grayscale */
  grayscale: boolean
  /** Quantization levels: 2 = pure B&W, 3-8 = gray shades */
  levels: number
}

const DEFAULT_OPTIONS: MosaicOptions = {
  pixelSize: 8,
  grayscale: true,
  levels: 4,
}

/** RGB to grayscale using luminance formula */
function toGray(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** Quantize a 0-255 value to N discrete levels */
function quantize(value: number, levels: number): number {
  const step = 255 / (levels - 1)
  return Math.round(Math.round(value / step) * step)
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
  const { pixelSize, grayscale, levels } = opts

  const width = sourceCanvas.width
  const height = sourceCanvas.height
  targetCanvas.width = width
  targetCanvas.height = height

  const srcCtx = sourceCanvas.getContext('2d')!
  const tgtCtx = targetCanvas.getContext('2d')!
  const imageData = srcCtx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  tgtCtx.fillStyle = '#fff'
  tgtCtx.fillRect(0, 0, width, height)

  for (let x = 0; x < width; x += pixelSize) {
    for (let y = 0; y < height; y += pixelSize) {
      const cx = Math.min(x + Math.floor(pixelSize / 2), width - 1)
      const cy = Math.min(y + Math.floor(pixelSize / 2), height - 1)
      const pos = (cy * width + cx) * 4

      let r = pixels[pos]
      let g = pixels[pos + 1]
      let b = pixels[pos + 2]

      if (grayscale) {
        const gray = quantize(toGray(r, g, b), levels)
        r = g = b = gray
      }

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
  const { pixelSize, grayscale, levels } = opts
  const { width, height } = imageData
  const src = imageData.data
  const output = new ImageData(width, height)
  const dst = output.data

  // Fill white
  for (let i = 0; i < dst.length; i += 4) {
    dst[i] = dst[i + 1] = dst[i + 2] = 255
    dst[i + 3] = 255
  }

  for (let bx = 0; bx < width; bx += pixelSize) {
    for (let by = 0; by < height; by += pixelSize) {
      const cx = Math.min(bx + Math.floor(pixelSize / 2), width - 1)
      const cy = Math.min(by + Math.floor(pixelSize / 2), height - 1)
      const pos = (cy * width + cx) * 4

      let r = src[pos]
      let g = src[pos + 1]
      let b = src[pos + 2]

      if (grayscale) {
        const gray = quantize(toGray(r, g, b), levels)
        r = g = b = gray
      }

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
