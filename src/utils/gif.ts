/**
 * GIF parsing and encoding utilities
 */

import { GifReader } from 'omggif'

export interface GifFrame {
  imageData: ImageData
  delay: number // ms
}

/** Parse a GIF ArrayBuffer into individual frames */
export function parseGif(buffer: ArrayBuffer): GifFrame[] {
  const reader = new GifReader(new Uint8Array(buffer))
  const frames: GifFrame[] = []
  const width = reader.width
  const height = reader.height

  for (let i = 0; i < reader.numFrames(); i++) {
    const info = reader.frameInfo(i)
    const pixels = new Uint8Array(width * height * 4)
    reader.decodeAndBlitFrameRGBA(i, pixels)

    const imageData = new ImageData(
      new Uint8ClampedArray(pixels.buffer),
      width,
      height
    )
    frames.push({
      imageData,
      delay: (info.delay || 10) * 10, // centiseconds → ms
    })
  }

  return frames
}

/** Encode processed frames into a GIF blob */
export async function encodeGif(
  frames: { imageData: ImageData; delay: number }[],
  width: number,
  height: number
): Promise<Blob> {
  const { encode } = await import('modern-gif')

  const gifFrames = frames.map(f => ({
    data: f.imageData.data,
    delay: f.delay,
  }))

  const output = await encode({
    width,
    height,
    frames: gifFrames,
  })

  return new Blob([output], { type: 'image/gif' })
}
