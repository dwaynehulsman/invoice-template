# Invoice Creator

A modern, simple invoice creator built with Vue.js and Electron. Create professional invoices without complicated tooling, accounts, or subscriptions.

## 🌐 Try it Online

**Web Version**: [simple-invoicer.dwayneh.nl](https://simple-invoicer.dwayneh.nl)

No installation required - just open and start creating invoices instantly.

## 📱 Desktop App

Download the desktop version for enhanced features like native file dialogs and offline usage.

### Downloads

- **Windows**: [Download Installer](https://github.com/dwaynehulsman/invoice-template/releases/latest)
- **macOS**: [Download DMG](https://github.com/dwaynehulsman/invoice-template/releases/latest) (Intel & Apple Silicon)
- **Linux**: [Download AppImage](https://github.com/dwaynehulsman/invoice-template/releases/latest) or [DEB Package](https://github.com/dwaynehulsman/invoice-template/releases/latest)

## ✨ Features

### 🎨 Modern Design

- Clean, flat design interface
- Responsive layout that works on all screen sizes
- Professional invoice preview

### 💰 Multi-Currency Support

- 10 supported currencies: EUR, USD, GBP, JPY, CAD, AUD, CHF, SEK, NOK, DKK
- Smart currency formatting (e.g., "75.00 €", "$75.00", "¥75")
- Default Euro (EUR) with easy switching

### 🌍 Multi-Language

- English and Dutch PDF export
- Automatic translation of invoice labels
- Easy language switching

### 🖼️ Logo Upload

- Support for PNG, JPG, JPEG, WebP, and SVG files
- Automatic resizing and optimization
- Replace default logo with your company branding

### 📊 Smart Calculations

- Automatic subtotal, tax, and total calculations
- Configurable tax rates (default 21% EU VAT)
- Editable amount fields for manual adjustments

### 💾 Data Management

- Save and load invoices locally
- Export/import all data as JSON backup
- No cloud storage - your data stays private

### 📄 PDF Export

- High-quality PDF generation
- Professional invoice layout
- Include company logo and branding

### 🖥️ Desktop Features (Electron App)

- Native file dialogs for save/load operations
- Offline functionality
- System integration
- Cross-platform compatibility

## 🚀 Why This Tool?

I created this invoice creator because I needed a **simple way to write invoices without complicated tooling or having to deal with accounts and subscriptions**. Most invoice tools are either:

- Too complex with unnecessary features
- Require monthly subscriptions
- Force you to create accounts and store data in the cloud
- Have poor user interfaces

This tool is different:

- ✅ **No accounts required** - just open and use
- ✅ **No subscriptions** - completely free
- ✅ **Simple and focused** - does one thing well
- ✅ **Privacy-first** - your data stays on your device
- ✅ **Modern interface** - clean and professional

## 🛠️ Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/dwaynehulsman/invoice-template.git
cd invoice-template

# Install dependencies
npm install
```

### Development Commands

```bash
# Start web development server
npm run dev

# Start Electron development (with hot reload)
npm run electron:dev

# Build for production
npm run build

# Build and run Electron app
npm run electron:build

# Build distributables
npm run electron:dist:linux    # Linux AppImage + DEB
npm run electron:dist:win      # Windows installer + portable
npm run electron:dist:mac      # macOS DMG + ZIP
```

### Tech Stack

- **Frontend**: Vue.js 3 with Composition API
- **Styling**: Tailwind CSS v4
- **Desktop**: Electron
- **PDF Generation**: jsPDF + html2canvas
- **Build Tool**: Vite
- **Package Manager**: npm

## 📋 Usage

1. **Fill in your company details** in the "From" section
2. **Add client information** in the "To" section
3. **Upload your logo** (optional) - supports PNG, JPG, WebP, SVG
4. **Add invoice items** with descriptions, quantities, and rates
5. **Set currency and tax rate** as needed
6. **Choose language** for PDF export (English/Dutch)
7. **Export to PDF** or save for later

## 🔧 Configuration

### Supported File Formats

- **Logo**: PNG, JPG, JPEG, WebP, SVG (max 5MB)
- **Data Export**: JSON format
- **PDF Export**: High-quality A4 format

### Default Settings

- **Currency**: Euro (EUR)
- **Tax Rate**: 21% (EU VAT standard rate)
- **Language**: English
- **Date Format**: YYYY-MM-DD

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](#license) file for details.

## 🙏 Acknowledgments

- Built with [Vue.js](https://vuejs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Desktop app powered by [Electron](https://electronjs.org/)
- PDF generation using [jsPDF](https://github.com/parallax/jsPDF)

---

## License

MIT License

Copyright (c) 2025 Dwayne Hulsman

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
