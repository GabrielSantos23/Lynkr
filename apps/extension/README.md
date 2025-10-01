# Lynkr Browser Extension

A modern bookmark manager built with React, TypeScript, and Tailwind CSS 4.0.

## Features

- 🚀 Modern React 18 with TypeScript
- 🎨 Tailwind CSS 4.0 for styling
- 📱 Responsive popup interface
- 🔖 Bookmark management with tags
- 💾 Local storage persistence
- 🎯 Auto-fill current page info

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

### Loading the Extension

1. Build the extension: `npm run build`
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx
│   ├── BookmarkList.tsx
│   ├── BookmarkItem.tsx
│   ├── AddBookmark.tsx
│   └── EmptyState.tsx
├── types/              # TypeScript type definitions
│   └── bookmark.ts
├── background.ts        # Extension background script
├── content.ts          # Content script
├── main.tsx           # React entry point
├── App.tsx            # Main app component
└── index.css          # Tailwind CSS imports
```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4.0** - Utility-first CSS
- **Vite** - Build tool
- **Chrome Extension API** - Browser extension functionality

