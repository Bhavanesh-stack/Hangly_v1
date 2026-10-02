<div align="center">

<img src="Assets/Icons/hangly-icon-256.png" width="128" alt="Hangly Logo">

# Hangly for Windows

**A tiny piece of motion for your desktop. Swings on a simulated rope.**

A physical charm hangs from your screen edge on a simulated rope. Nudge it and it swings, carries momentum, and settles — powered by real Verlet integration physics, not a looping animation.

<br>

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%2F%2011%20(64--bit)-blue?style=for-the-badge&logo=windows&logoColor=white)](#requirements)
[![Electron](https://img.shields.io/badge/Electron-34.x-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://electronjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br>

<img src="Assets/Screenshots/overlay-daruma.png" width="420" alt="Daruma charm hanging on desktop">

</div>

---

## 🌿 The Intention

Our screens are dominated by utilitarian rectangles, endless notification badges, and constant urgency. In optimizing our digital environments for pure productivity, we lost whimsy, tactile texture, and quiet warmth.

**Hangly was built with a singular intention: to bring a quiet piece of physical craft and tactile delight to your desktop.**

It is neither a widget that clamors for your attention nor a canned, looping animation cycling endlessly in the corner. Instead, it is a digital talisman governed by physical laws:

- **Newtonian, Not Scripted**: When you flick or drag it, a 240 Hz Verlet numerical solver computes tension, gravity, mass, and drag across a 20-segment cord. It swings with authentic momentum, reacts dynamically to release velocity, and settles naturally into stillness.
- **Respectful & Unobtrusive**: Hangly rests peacefully at the periphery of your display. With transparent click-through windowing, it never interrupts your workflow or steals clicks from underlying applications—engaging only when you intentionally interact with the charm.
- **Zero-Cost Sleep at Rest**: When the rope settles, the simulation completely sleeps. It draws 0% CPU, generates zero fan noise, and consumes no idle battery.
- **Cultural Folklore & Acoustic Soul**: Each charm is a handcrafted symbol rooted in heritage—a Turkish *Nazar* to ward off misfortune, a Japanese *Daruma* for unwavering perseverance, a radiant *Sunflower* for optimism, a protective Indian *Nimbu-mirchi*, or a welcoming *Maneki-neko*. Their contact acoustics are procedurally synthesized in real time from authentic material models (wood, bell brass, ceramic, glass, and fabric).
- **A Tactile Micro-Pause**: A gentle companion for deep work. When waiting for a build to finish, a video to export, or taking a moment to breathe and gather your thoughts, Hangly offers a grounding, satisfying physical touchstone right on your screen.

---

## 🌟 Features

Hangly puts a tactile, beautiful companion at the top of your desktop screen that obeys real gravity and momentum:

- **240 Hz Verlet Physics Engine**: 20-segment rope solver with Gauss-Seidel distance-constraint relaxation, inequality stretch clamping (`maxStretchRatio = 1.02`), and rest-sleep detection.
- **18 Unique Charms**:
  - **13 Collection Charms**: High-resolution vector SVG charms with threaded beads (`Ocean Wave 🌊`, `Sunflower`, `Daruma`, `Nazar boncuğu`, `Maneki-neko`, `Hamsa`, `Nimbu-mirchi`, `Ghanta`, `Drishti bommai`, `Pánchángjié`, `Horseshoe`, `Scarab`, `Himmeli`).
  - **5 Classic Geometric Charms**: Custom rendered geometric shapes with specular bloom, radial lighting, and edge rims (`Bead`, `Camera`, `Star`, `Heart`, `Diamond`).
- **Interactive Mouse Physics**: Click, pull, toss, and flick. Momentum is calculated from release velocity and fed into the Verlet historical step.
- **Click-Through Transparent Overlay**: Empty screen space ignores clicks and passes them directly to your underlying apps and desktop. Hovering over the charm automatically engages grab interactions.
- **Zero-Latency Audio Synthesizer**: Procedural Web Audio synthesizer generating authentic material acoustics for `wave` (ocean water swell & sea wash), `wood`, `glass`, `bell`, `metal`, and `soft` contacts.
- **System Tray Companion**: Right-click the system tray icon to switch charms, adjust settings, open the library, or toggle the overlay.
- **Charm Studio**: Import any custom PNG, JPEG, WebP, or SVG to create and hang your own custom charms with tailored mass, scale, and sounds.

---

## 🚀 Quick Start & Consumer Lifecycle

Hangly is engineered like a real-world product with an interactive control center, one-click Windows desktop installers, automated updaters, and complete clean-uninstallation.

### 🎮 Hangly Control Center (`Hangly.cmd`)

The easiest way to manage your entire Hangly installation is the unified interactive control center:

Simply double-click **`Hangly.cmd`** in the repository root:

```text
====================================================================
                  HANGLY DESKTOP COMPANION
       A tiny piece of motion for your desktop. 240Hz Verlet.
====================================================================

  [1] Launch Hangly (Start Desktop Companion)
  [2] Install Shortcuts (Create Desktop and Start Menu icons)
  [3] Update Hangly (Pull latest features and charms from GitHub)
  [4] Rebuild Standalone Executable (Compile Hangly-Portable.exe)
  [5] Uninstall and Delete (Completely remove app, data, and cache)
  [6] Exit

====================================================================
Please select an option (1-6):
```

---

## 📦 Installation & Setup

<a id="requirements"></a>
### 💻 System Requirements

| Requirement | Minimum Specification | Recommended |
|---|---|---|
| **Operating System** | Windows 10 (64-bit, build 19041+) | Windows 11 (64-bit) |
| **Processor** | Intel Core i3 / AMD Ryzen 3 (x64) | Any modern multi-core x64 CPU |
| **Graphics** | DirectX 11 / OpenGL 2.0 compatible | Hardware-accelerated GPU |
| **RAM** | ~150 MB free memory | 300 MB free memory |
| **Storage** | 100 MB free disk space | 200 MB free disk space |

---

### ⚡ Option 1: 1-Click Desktop Installer (Recommended)

1. Clone or download this repository:
   ```powershell
   git clone https://github.com/Bhavanesh-stack/Hangly_v1.git
   cd Hangly_v1
   ```
2. Double-click **`Install-Hangly.cmd`** (or choose Option 2 in `Hangly.cmd`).
   - Verifies the pre-built standalone executable.
   - Creates a **Desktop Shortcut** (`Hangly.lnk`) and a **Start Menu Shortcut**.
   - Initializes `%APPDATA%\Hangly\Charms` for custom charms and persistent preferences.
3. Launch Hangly anytime directly from your Desktop or Start Menu!

---

### 🔄 Option 2: Updating Hangly (1-Click)

Keep your charms, physics solver, and features up to date with the latest GitHub releases:

- **Via Control Center**: Run **`Hangly.cmd`** → select `[3] Update Hangly`.
- **Via Dedicated Script**: Double-click **`Update-Hangly.cmd`**.
- **Via In-App Settings**: Open **Settings** (`Ctrl+,`) → **About** tab → Click **Check for Updates**.
- **Via Terminal**:
  ```powershell
  npm run update:app
  ```

The updater fetches new commits from GitHub, updates dependencies, and automatically rebuilds `dist/Hangly-Portable.exe`.

---

### 🧹 Option 3: Clean Uninstallation & Data Deletion

To completely remove Hangly, remove shortcuts, wipe cached data, and unregister auto-start keys:

- **Via In-App Settings**: Open **Settings** (`Ctrl+,`) → **About** tab → Click **Completely Uninstall & Wipe Data**.
- **Via Script**: Double-click **`Uninstall-Hangly.cmd`**.
- **Via Control Center**: Run **`Hangly.cmd`** → select `[5] Uninstall and Delete`.
- **Via Terminal**:
  ```powershell
  npm run uninstall
  ```

---

### 🛠️ Developer Mode (Running from Source)

```powershell
# 1. Install dependencies
npm install

# 2. Run with live hot-reloading
npm start

# 3. Compile standalone portable executable
npm run build:portable
```

---

## 🎮 How to Use

### Interacting with the Charm
- **Grab & Swing**: Click and drag the charm to pull the cord.
- **Flick & Throw**: Release while moving your mouse cursor to impart velocity into the rope.
- **Click-Through**: Normal desktop clicks pass through transparent areas without interruption.

### System Tray Menu
Right-click the Hangly tray icon in the Windows notification area to:
- **Show / Hide Overlay**: Toggle desktop visibility (`Ctrl+Shift+O`).
- **Charm Picker**: Quickly switch between all 17 charms.
- **Charm Library**: Browse charm origins, regional lore, physical weights, and acoustic profiles (`Ctrl+L`).
- **Charm Studio**: Upload and hang custom images (`Ctrl+N`).
- **Settings**: Customize screen anchor (Top-Left, Top-Center, Top-Right), scale, opacity, sound volume, and launch at Windows startup (`Ctrl+,`).
- **Quit Hangly**: Exit the companion application (`Ctrl+Q`).

---

## 🧪 Testing & Verification

Hangly includes built-in test suites to verify physics, audio, and SVG rendering:

### 1. Test Verlet Physics Engine
Validates numerical stability, distance constraints, and drag dynamics:
```powershell
npm run test:physics
```

### 2. Verify All Catalog Charms
Verifies that all 17 charm assets, SVG viewBoxes, and physical configurations are present:
```powershell
node scripts/test-all-charms.js
```

### 3. Automated Electron Rendering & Charm Switching Test
Launches a test instance in Electron, executes dynamic charm switches across SVG collection and classic charms, and verifies active pixel rendering:
```powershell
npx electron scripts/test-switch-charms.js
```

---

## 📂 Project Structure

```text
Hangly/
├── assets/
│   ├── charms/             # Hand-drawn vector SVG charms (Sunflower, Daruma, Nazar, etc.)
│   ├── icons/              # Windows application icons (.ico, .png)
│   └── CharmLibrary.json   # Regional folklore, tags, descriptions, and catalog metadata
├── src/
│   ├── main/
│   │   ├── main.js         # Electron main process & multi-window lifecycle
│   │   ├── store.js        # Persistent settings manager (%APPDATA%/Hangly/settings.json)
│   │   └── tray.js         # Windows System Tray taskbar notification integration
│   ├── renderer/
│   │   ├── overlay/        # 240 Hz Verlet rope simulation & transparent desktop overlay
│   │   ├── library/        # Charm Library catalog browser & live preview
│   │   ├── studio/         # Custom charm importer & editor
│   │   └── settings/       # Settings configuration UI
│   └── shared/
│       ├── audio/          # Procedural Web Audio sound synthesizer (wood, glass, bell, etc.)
│       ├── charms/         # Charm catalog, custom store, classic geometric renderers, & SVG splitter
│       └── physics/        # Pure JS 240 Hz Verlet rope engine, spline interpolation, & beads
├── dist/                   # Packaged Windows standalone executables (Hangly-Portable.exe & Hangly.exe)
├── scripts/                # Automated verification and build utilities
├── Launch-Hangly.cmd       # Convenient one-click Windows launcher
└── package.json            # NPM project dependencies and build scripts
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Original concept & artwork by **sharancreatedthis**.
Windows port, 240 Hz Verlet physics engine, and architecture by **Bhavanesh-stack**.
