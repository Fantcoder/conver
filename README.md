# ConvertFlow — Universal File & PDF Studio

<div align="center">

![ConvertFlow Logo](https://img.shields.io/badge/ConvertFlow-Studio%20Pro-6366f1?style=for-the-badge&logo=electron&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Electron Forge](https://img.shields.io/badge/Electron%20Forge-8.0-47848F?style=for-the-badge&logo=electron)](https://www.electronforge.io/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**A premium, high-performance Windows desktop application combining universal file conversion with powerful PDF manipulation utilities, wrapped in an Apple-inspired glassmorphism experience.**

</div>

---

## ✨ Highlights & Features

### 🎡 Interactive Drag-to-Convert Radial Wheel

- **Energy Laser Tether**: Dynamic vector physics beam connects your cursor to the central file card during drag interactions.
- **Proximity Magnetic Snapping**: Nodes react dynamically with smooth scaling (`scale(1.28)`) and haptic audio cues when hovered.
- **Synthesized Audio Engine**: Built-in Web Audio API synthesizer providing futuristic sound effects on file import, magnetic hover, and conversion launch.
- **Celebratory Particle Canvas**: Confetti physics on conversion success.

### 🖼️ High-Performance Image Conversions

- Accelerated by **Sharp** with SIMD & multi-threading.
- Supported formats: **PNG, JPEG, WebP, AVIF, TIFF, GIF, BMP, ICO, and SVG**.
- Advanced processing: Auto-rotation, metadata stripping, grayscale filters, and proportional resizing.

### 📑 Comprehensive PDF Toolkit

- Powered locally by **pdf-lib** — 100% offline with zero cloud dependency.
- **Merge PDFs**: Reorder, drag-and-drop, and merge multiple documents with page counts and size inspection.
- **Split Pages**: Extract individual pages, page ranges, or split into single-page documents.
- **Rotate Pages**: Rotate documents clockwise, counter-clockwise, or 180 degrees.
- **Watermark Stamp**: Add custom diagonal watermarks with adjustable opacity, text, and styling.
- **PDF Compression & Encryption**: Password-protect and optimize document sizes.

### 📊 Structured Data & Document Conversions

- **Data Tables**: Bidirectional conversion between **JSON ↔ CSV ↔ YAML ↔ XML**.
- **Documents**: Seamlessly convert **Markdown (.md)**, **HTML**, and **Plain Text (.txt)** into paginated, styled PDF documents.

### 📦 Archive Utilities

- Compress files and directories into **ZIP** and **TAR.GZ** archives.
- Local high-speed extraction engine.

### 🎨 Apple-Inspired Desktop UI / UX

- Custom frameless Windows TitleBar with minimize, maximize, and close controls.
- Glassmorphic panels, dark/light theme engine, and animated status notifications.
- Complete offline privacy: all processing takes place locally on your PC.

---

## 🛠️ Technology Stack

| Layer                 | Technologies                                              |
| :-------------------- | :-------------------------------------------------------- |
| **Desktop Framework** | [Electron Forge](https://www.electronforge.io/) + Webpack |
| **UI Library**        | [React 19](https://react.dev/) + TypeScript               |
| **State Management**  | [Zustand](https://github.com/pmndrs/zustand)              |
| **Styling & Design**  | Vanilla CSS Design Tokens (Glassmorphism, CSS Variables)  |
| **Image Engine**      | [Sharp](https://sharp.pixelplumbing.com/) (Libvips, SIMD) |
| **PDF Engine**        | [pdf-lib](https://pdf-lib.js.org/)                        |
| **Data Parsers**      | `csv-parse`, `csv-stringify`, `js-yaml`, `xml2js`         |
| **Sound & Physics**   | Web Audio API Synthesizer, `canvas-confetti`              |
| **Code Quality**      | Oxlint, Oxfmt, TypeScript strict mode                     |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Fantcoder/conver.git
   cd conver
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start in Development Mode:**
   ```bash
   npm start
   ```

---

## 📦 Build & Package

- **Compile & Package Standalone Windows App:**

  ```bash
  npm run package
  ```

  Generates `out/ConvertFlow-win32-x64/ConvertFlow.exe`.

- **Create Distributable Installers (Squirrel / Setup.exe / ZIP):**
  ```bash
  npm run make
  ```
  Generates production installers inside `out/make/`.

---

## 🧪 Testing & Quality Assurance

- **Run Automated Test Suite (27/27 Passing):**
  ```bash
  npm test
  ```
- **Type Checking:**
  ```bash
  npm run typecheck
  ```
- **Linting:**
  ```bash
  npm run lint
  ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
