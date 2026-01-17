import '../src/index.css'

export const metadata = {
  title: 'Bhagavad Gita Experience - Divine Wisdom of Lord Krishna',
  description: 'An immersive experience reading the Bhagavad Gita with Sanskrit text, English and Hindi translations, interactive tooltips, and verse-by-verse navigation. Explore the eternal wisdom of Lord Krishna.',
  keywords: 'Bhagavad Gita, Gita, Krishna, Arjuna, Sanskrit, Hindu scripture, spiritual wisdom, Mahabharata, verse, translation, Hindi, English',
  authors: [{ name: 'Bhagavad Gita Experience' }],
  openGraph: {
    title: 'Bhagavad Gita Experience - Divine Wisdom',
    description: 'Read the Bhagavad Gita with interactive Sanskrit text, translations, and verse navigation',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bhagavad Gita Experience',
    description: 'An immersive experience reading the Bhagavad Gita',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, backgroundColor: '#000000', color: '#f5f5f5' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#000000', color: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>{children}</body>
    </html>
  )
}
