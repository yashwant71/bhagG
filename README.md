# Bhagavad Gita Experience - Next.js

An immersive experience for reading the Bhagavad Gita, built with Next.js.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build the application for production:

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page (Context page)
│   └── verse/             # Verse routes
│       └── [...params]/   # Dynamic verse routes
│           └── page.js
├── src/
│   ├── components/        # React components
│   │   ├── ContextPage.jsx
│   │   └── VersePage.jsx
│   ├── data/             # Chapter data and utilities
│   └── index.css         # Global styles
└── public/               # Static assets
```

## Features

- **Server-Side Rendering**: Better SEO and performance
- **Verse Navigation**: Navigate between chapters and verses
- **Multi-language Support**: English and Hindi translations
- **Interactive Tooltips**: Click on Sanskrit words for meanings
- **Bookmarking**: Save favorite verses
- **Responsive Design**: Works on all devices

## Migration from Vite/React Router

This project was migrated from Vite + React Router to Next.js for:
- Better SEO
- Improved performance
- Server-side rendering
- Built-in optimizations

## Technologies

- Next.js 14
- React 18
- CSS3
