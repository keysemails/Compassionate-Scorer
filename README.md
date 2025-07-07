# Compassionate Scorer Chrome Extension

Compassionate Scorer is a Chrome extension that evaluates websites for animal welfare and ethical practices using AI (Google Gemini). Instantly analyze any website for vegan, cruelty-free, and ethical standards with a beautiful, modern popup UI.

## Features
- **AI-Powered Analysis:** Uses Google Gemini AI to analyze website content for animal welfare, vegan, and ethical practices.
- **Instant Scoring:** Get a 1-100 score and 1-5 star rating for any website.
- **Breakdown & Findings:** See detailed breakdowns (animal products, testing, vegan offerings, etc.) and key findings.
- **Modern UI:** Clean, responsive, and easy-to-use popup interface.
- **No Inline Scripts:** Fully CSP-compliant for Chrome extension security.

## Screenshots
![Popup Screenshot](screenshot.png)

## Getting Started

### 1. Clone the Repository
```sh
git clone https://github.com/yourusername/compassionate-scorer-extension.git
cd compassionate-scorer-extension/Compassionate Scorer
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Add Your Gemini API Key
- Open the extension popup.
- Enter your Google Gemini API key in the settings section.

### 4. Build the Extension
```sh
npm run build
```
- The build output will be in the `dist/` folder.

### 5. Load in Chrome
- Go to `chrome://extensions/` in Chrome.
- Enable **Developer mode**.
- Click **Load unpacked** and select the `dist/` folder.

## Development
- Edit `index.html` and `main.js` for UI and logic changes.
- Static assets (icons, manifest, etc.) are in the `public/` folder.
- Run `npm run dev` for live-reload development (for web, not extension popup).

## Folder Structure
```
Compassionate Scorer/
  ├── public/           # Static assets (manifest, icons, etc.)
  ├── index.html        # Main popup HTML
  ├── main.js           # Main popup JS
  ├── vite.config.js    # Vite config
  ├── package.json      # NPM scripts and dependencies
  └── dist/             # Build output (after npm run build)
```

## License
MIT

---

**Made with ❤️ for animal welfare advocates!** 