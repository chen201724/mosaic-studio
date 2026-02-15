<div align="center">

# 🎨 Mosaic Studio

**Pixel art converter — turn images and GIFs into grayscale pixel art**

[![Deploy](https://github.com/chen201724/mosaic-studio/actions/workflows/deploy.yml/badge.svg)](https://github.com/chen201724/mosaic-studio/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[Live Demo](https://chen201724.github.io/mosaic-studio/) · [Report Bug](https://github.com/chen201724/mosaic-studio/issues) · [Request Feature](https://github.com/chen201724/mosaic-studio/issues)

</div>

---

Mosaic Studio is a browser-based tool that converts images and GIFs into grayscale pixel art. Everything runs client-side — no uploads, no server, no tracking.

## Features

- **Image → Pixel Art** — Upload JPG/PNG, preview in real-time, export as PNG
- **GIF → Pixel GIF** — Parse animated GIFs frame-by-frame, export as pixel-art GIF
- **Adjustable Precision** — Pixel block size from 2px to 50px
- **Grayscale Levels** — 2 (pure B&W) to 8 levels of gray
- **Drag & Drop** — Drop files directly onto the page
- **100% Client-Side** — All processing happens in your browser

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Build | Vite 7 |
| Rendering | Canvas API |
| GIF Decode | [omggif](https://github.com/deanm/omggif) |
| GIF Encode | [modern-gif](https://github.com/nichenqin/modern-gif) |
| Deploy | GitHub Pages |

## Getting Started

### Prerequisites

- Node.js >= 18

### Development

```bash
git clone https://github.com/chen201724/mosaic-studio.git
cd mosaic-studio
npm install
npm run dev
```

### Build

```bash
npm run build
npm run preview  # preview production build locally
```

## How It Works

1. **Image Upload** — File is read into an `HTMLCanvasElement` via `drawImage()`
2. **Pixel Sampling** — For each pixel block, the center pixel's RGB is sampled
3. **Grayscale Conversion** — RGB → luminance using `0.299R + 0.587G + 0.114B`
4. **Quantization** — Continuous grayscale is mapped to N discrete levels
5. **Block Fill** — Each block is filled with the quantized color
6. **GIF Processing** — Each frame is decoded individually, processed, then re-encoded

## Project Structure

```
src/
├── main.tsx          # Entry point
├── App.tsx           # Main application component
├── index.css         # Styles
└── utils/
    ├── mosaic.ts     # Core pixel engine (applyMosaic, processFrame)
    └── gif.ts        # GIF parse/encode utilities
```

## Roadmap

- [x] Color modes (grayscale, color, palette)
- [x] Built-in palettes (Game Boy, NES, Cyberpunk, Retro)
- [x] GIF animation preview with play/pause
- [ ] Comparison slider (drag to compare original vs pixel)
- [ ] Video input (MP4/WebM → pixel GIF)
- [ ] AI video generation (pixel art → animated video via img2video models)
- [ ] Custom color palette editor
- [ ] Batch processing
- [ ] PWA support
- [ ] Share / copy to clipboard

## History

This project started as a simple [pixel mosaic experiment](./legacy/) in vanilla JS back in 2019. It has since been rewritten as a full-featured React application.

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](./LICENSE)
