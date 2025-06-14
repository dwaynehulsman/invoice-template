# Build Instructions

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd invoice-template

# Install dependencies
npm install
```

## Development

```bash
# Start development server (web version)
npm run dev

# Start Electron development (with hot reload)
npm run electron:dev

# Build production version and run Electron
npm run electron:build
```

## Building for Distribution

### Linux (Current Platform)

```bash
# Build Linux AppImage and .deb package
npm run electron:dist:linux
```

**Output:**

- `dist-electron/Invoice Creator-1.0.0-linux-x86_64.AppImage` (128MB)
- `dist-electron/Invoice Creator-1.0.0-linux-amd64.deb` (83MB)

### Cross-Platform Builds

Due to platform-specific dependencies, cross-platform builds require specific environments:

#### Windows Builds

**From Linux (requires Wine):**

```bash
# Install Wine first
sudo apt update
sudo apt install wine

# Then build
npm run electron:dist:win
```

**From Windows:**

```bash
npm run electron:dist:win
```

#### macOS Builds

**From macOS only:**

```bash
npm run electron:dist:mac
```

### Automated Cross-Platform Builds

The repository includes GitHub Actions workflow (`.github/workflows/build.yml`) that automatically builds for all platforms:

1. **Manual Trigger:** Go to Actions tab → "Build Electron App" → "Run workflow"
2. **Tag Release:** Create a git tag starting with 'v' (e.g., `v1.0.0`)

```bash
# Create and push a release tag
git tag v1.0.0
git push origin v1.0.0
```

## Build Outputs

### Linux

- **AppImage**: Portable executable (no installation required)
- **DEB**: Debian package for Ubuntu/Debian systems

### Windows

- **NSIS Installer**: Traditional Windows installer
- **Portable**: Standalone executable

### macOS

- **DMG**: Disk image for installation
- **ZIP**: Compressed app bundle

## Build Configuration

The build configuration is in `package.json` under the `"build"` section:

- **App ID**: `com.invoicetemplate.app`
- **Product Name**: `Invoice Creator`
- **Output Directory**: `dist-electron/`
- **Supported Architectures**:
  - Linux: x64
  - Windows: x64, ia32
  - macOS: x64, arm64 (Apple Silicon)

## Troubleshooting

### Common Issues

1. **Port 5173 already in use**

   ```bash
   pkill -f "vite|node.*5173"
   ```

2. **Missing author in package.json**

   - Already configured with placeholder author information

3. **Wine required for Windows builds on Linux**

   ```bash
   sudo apt install wine
   ```

4. **macOS builds failing on non-Mac systems**
   - Use GitHub Actions or build on actual macOS system

### File Sizes

- Linux builds: ~83-128MB
- Windows builds: ~80-120MB (estimated)
- macOS builds: ~90-130MB (estimated)

## Features Included in Builds

- ✅ Logo upload (PNG, JPG, WebP, SVG)
- ✅ Multi-currency support (10 currencies)
- ✅ Multi-language PDF export (English/Dutch)
- ✅ Native file dialogs (save/load invoices)
- ✅ PDF export with native save dialog
- ✅ Data import/export functionality
- ✅ Modern flat design UI
- ✅ Cross-platform compatibility
