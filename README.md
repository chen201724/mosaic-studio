<div align="center">

# 🎨 Mosaic Studio

**Transform images into pixel art — in your browser.**

*Every pixel tells a story.*

[![Deploy](https://github.com/chen201724/mosaic-studio/actions/workflows/deploy.yml/badge.svg)](https://github.com/chen201724/mosaic-studio/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

[Live Demo](https://chen201724.github.io/mosaic-studio/) · [Report Bug](https://github.com/chen201724/mosaic-studio/issues) · [Request Feature](https://github.com/chen201724/mosaic-studio/issues)

</div>

---

Mosaic Studio is a browser-based pixel art converter with real-time preview, multiple pixel shapes, color palettes, and GIF animation support. Everything runs client-side — no uploads, no server, no tracking.

## Features

### Core
- **5 Pixel Shapes** — Square, Circle, Diamond, Cross-stitch, ASCII art
- **3 Color Modes** — Grayscale, Color (quantized RGB), Palette
- **4 Built-in Palettes** — Game Boy, NES, Cyberpunk, Retro Brown
- **GIF Support** — Parse animated GIFs frame-by-frame, export as pixel-art GIF
- **Comparison Slider** — Drag to compare original vs pixelated (Squoosh-style)
- **Copy to Clipboard** — One-click copy for PNG images

### Design & UX
- **Design Token System** — 3-layer architecture (Global → Semantic → Component)
- **Brand Color** — Cool gray palette with blue accent (#60A5FA)
- **Professional Typography** — Inter + JetBrains Mono (numeric display)
- **Micro-interactions** — Hover lift, pulse animations, toast feedback
- **Accessibility** — ARIA roles/labels, keyboard navigation, `prefers-reduced-motion`
- **Responsive** — Mobile-optimized with 44px touch targets
- **100% Client-Side** — All processing in your browser, privacy guaranteed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 5.9 |
| Build | Vite 7 |
| Rendering | Canvas API + OffscreenCanvas |
| GIF Decode | [omggif](https://github.com/deanm/omggif) |
| GIF Encode | [modern-gif](https://github.com/nichenqin/modern-gif) |
| Fonts | Inter, JetBrains Mono (Google Fonts) |
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
3. **Color Processing** — Grayscale conversion, RGB quantization, or palette mapping
4. **Shape Rendering** — Each block is rendered as the selected shape (square, circle, diamond, cross-stitch, or ASCII character)
5. **Comparison** — Original and processed images are composited on a single canvas with a draggable divider
6. **GIF Processing** — Each frame is decoded, processed via OffscreenCanvas, then re-encoded

## Project Structure

```
src/
├── main.tsx          # Entry point
├── App.tsx           # Main application component
├── index.css         # Design tokens + styles
└── utils/
    ├── mosaic.ts     # Core pixel engine (applyMosaic, processFrame)
    └── gif.ts        # GIF parse/encode utilities
```

## Roadmap

- [x] 5 pixel shapes (square, circle, diamond, cross-stitch, ASCII)
- [x] 3 color modes (grayscale, color, palette)
- [x] 4 built-in palettes (Game Boy, NES, Cyberpunk, Retro)
- [x] GIF animation preview with play/pause
- [x] Comparison slider (Squoosh-style)
- [x] Copy to clipboard
- [x] Design token system
- [x] Micro-interactions & toast feedback
- [x] Accessibility (ARIA, keyboard, reduced motion)
- [x] Responsive mobile layout
- [x] Open Graph & SEO meta tags
- [ ] Custom color palette editor
- [ ] Batch processing
- [ ] PWA support
- [ ] Favicon & brand logo
- [ ] OG preview image

## History

This project started as a simple [pixel mosaic experiment](./legacy/) in vanilla JS back in 2019. In 2025, it was rewritten from scratch as a full-featured React + TypeScript application with a professional design system.

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](./LICENSE)

---

<div align="center">
  <sub>Made by <a href="https://github.com/chen201724">chen201724</a></sub>
</div>
