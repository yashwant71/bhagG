'use client'

import React, { useState, useEffect, useRef } from 'react'
import './CinematicIntro.css'

const scenes = [
  {
    theme: 'theme-cosmic',
    fx: 'stars', geom: 'infinity',
    era: 'The eternal question · Before time began',
    headline: 'Why does suffering exist\nif the universe is divine?',
    body: 'Long before the Gita was spoken, humanity wrestled with one question that no philosophy, no ritual, no king could answer — why do good people suffer? Why does duty sometimes demand the impossible?',
    sanskrit: '', sktrans: '', cta: false
  },
  {
    theme: 'theme-war',
    fx: 'embers', geom: 'tension',
    era: 'The Mahabharata · ~3100 BCE',
    headline: 'The greatest war in history\nwas about to begin',
    body: 'The Kuru dynasty had fractured. For thirteen years, the five Pandava princes lived in exile. Every attempt at peace failed. Now, eighteen Akshauhinis — over four million warriors — stood on the plain of Kurukshetra.',
    sanskrit: '', sktrans: '', cta: false
  },
  {
    theme: 'theme-despair',
    fx: 'mist', geom: 'falling',
    era: 'Dawn of the 1st Day · Kurukshetra',
    headline: 'Arjuna looked across\nand saw his own people',
    body: 'Before the war could begin, Prince Arjuna rode his chariot between the two armies. What he saw broke him. Teachers who had held his hand as a child. Uncles. Friends. All of them — armed, ready to kill or be killed.',
    sanskrit: 'सीदन्ति मम गात्राणि',
    sktrans: 'sidanti mama gatrani — "my limbs fail me"', cta: false
  },
  {
    theme: 'theme-collapse',
    fx: 'none', geom: 'shatter',
    era: 'The crisis · Arjuna\'s collapse',
    headline: 'He dropped his bow.\nHe could not fight.',
    body: 'Arjuna — the greatest archer of his age, a man who had never shown fear — collapsed. His hands trembled. "I see no good in killing my own kinsmen in battle." He sank into the chariot, refusing to rise.',
    sanskrit: 'न योत्स्य इति गोविन्दम्',
    sktrans: 'na yotsya iti govindam — "I will not fight," he told Krishna', cta: false
  },
  {
    theme: 'theme-divine',
    fx: 'rays', geom: 'lotus',
    era: 'The turning point',
    headline: 'And so a charioteer\nbegan to speak eternity',
    body: 'Krishna had agreed not to bear arms, choosing only to be a charioteer. But he had not agreed to be silent. In this moment of total paralysis, he began to speak. What followed was 700 verses of ultimate truth.',
    sanskrit: 'अशोच्यानन्वशोचस्त्वम्',
    sktrans: '"You grieve for those who need no grief" — BG 2.11', cta: false
  },
  {
    theme: 'theme-time',
    fx: 'dust', geom: 'timeline',
    era: '5000 years of study',
    headline: 'Every century since,\nhumanity has returned to it',
    body: 'Adi Shankara commented on it. Jnaneshwar sang it. Gandhi carried it to prison. Oppenheimer quoted it at the atomic bomb test. Every generation finds its own crisis — and finds the Gita waiting.',
    sanskrit: '', sktrans: '', cta: false
  },
  {
    theme: 'theme-you',
    fx: 'stars', geom: 'core',
    era: 'Now · You, today',
    headline: 'You are Arjuna.\nThis is your battlefield.',
    body: 'The Gita was not written for a historical war. It was written for every moment when you must act, but cannot see clearly. Every chapter is a different lens. The chariot waits.',
    sanskrit: 'योगस्थः कुरु कर्माणि',
    sktrans: '"Established in yoga, perform your actions" — BG 2.48', cta: true
  }
]

export default function CinematicIntro({ onNext }) {
  const [cur, setCur] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hasCompletedIntro, setHasCompletedIntro] = useState(false)
  const [lastRead, setLastRead] = useState(null)
  const fxLayerRef = useRef(null)
  const geomCanvasRef = useRef(null)

  useEffect(() => {
    // Check local storage for intro completion and last read verse
    try {
      const completed = localStorage.getItem('bg-intro-completed') === 'true'
      const lastReadData = localStorage.getItem('bg-last-read')
      
      setHasCompletedIntro(completed)
      if (lastReadData) {
        setLastRead(JSON.parse(lastReadData))
      }
    } catch (err) {
      console.error('Failed to read local storage:', err)
    }

    buildScene(0)
  }, [])

  function buildScene(index) {
    if (isAnimating) return
    setIsAnimating(true)
    setIsActive(false)

    setTimeout(() => {
      setCur(index)
      const s = scenes[index]
      
      // Update FX and Geometry via direct DOM manipulation as in original script
      // to preserve the exact visual behavior.
      buildFX(s.fx)
      buildGeometry(s.geom)

      setTimeout(() => {
        setIsActive(true)
        setIsAnimating(false)
      }, 50)
    }, 800)
  }

  function buildFX(type) {
    if (!fxLayerRef.current) return
    const fxLayer = fxLayerRef.current
    fxLayer.innerHTML = ''
    if (type === 'none') return
    
    const count = type === 'mist' ? 60 : (type === 'rays' ? 6 : 40)
    
    for(let i=0; i<count; i++) {
      const p = document.createElement('div')
      
      if (type === 'rays') {
        p.className = 'divine-ray'
        p.style.animationDelay = `-${i * 5}s`
        p.style.transform = `translate(-50%, -50%) rotate(${i * 30}deg)`
      } else {
        p.className = 'fx-particle'
        p.style.left = Math.random() * 100 + 'vw'
        p.style.top = Math.random() * 100 + 'vh'
        
        if (type === 'embers') {
          p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px'
          p.style.background = Math.random() > 0.5 ? '#ff6a00' : '#ff2a00'
          p.style.boxShadow = '0 0 12px #ff0000'
          p.style.animation = `emberRise ${Math.random()*4 + 3}s ease-in infinite`
        } else if (type === 'mist') {
          p.style.width = '1px'; p.style.height = (Math.random() * 30 + 10) + 'px'
          p.style.background = 'rgba(150, 180, 220, 0.3)'
          p.style.animation = `mistFall ${Math.random()*2 + 1}s linear infinite`
        } else { // stars / dust
          p.style.width = p.style.height = (Math.random() * 2 + 1) + 'px'
          p.style.background = 'rgba(255,255,255,0.6)'
          p.style.animation = `emberRise ${Math.random()*15 + 10}s linear infinite`
        }
        p.style.animationDelay = `-${Math.random() * 5}s`
      }
      fxLayer.appendChild(p)
    }
  }

  function mkel(tag, ...attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
    for(let i=0; i<attrs.length; i+=2) el.setAttribute(attrs[i], attrs[i+1])
    return el
  }

  function buildGeometry(type) {
    if (!geomCanvasRef.current) return
    const geomCanvas = geomCanvasRef.current
    geomCanvas.innerHTML = ''
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '800'); svg.setAttribute('height', '800')
    svg.setAttribute('viewBox', '0 0 800 800')

    const strokeColor = 'rgba(255,255,255,0.08)'
    const strokeW = '1'

    if (type === 'infinity') {
      const c1 = mkel('circle','cx','400','cy','400','r','300','fill','none','stroke',strokeColor,'stroke-width',strokeW)
      const c2 = mkel('circle','cx','400','cy','400','r','250','fill','none','stroke',strokeColor,'stroke-width',strokeW)
      svg.appendChild(c1); svg.appendChild(c2)
    } else if (type === 'tension') {
      for(let i=0; i<12; i++) {
        const l = mkel('line','x1',0,'y1',i*66,'x2',800,'y2',800 - i*66,'stroke',strokeColor,'stroke-width',strokeW)
        svg.appendChild(l)
      }
    } else if (type === 'falling') {
      for(let i=1; i<=7; i++) {
        const p = mkel('path','d',`M 400 ${150 + i*60} L 400 ${250 + i*70}`,'stroke',strokeColor,'stroke-width',strokeW)
        svg.appendChild(p)
      }
    } else if (type === 'shatter') {
      const c = mkel('circle','cx','400','cy','400','r','200','fill','none','stroke',strokeColor,'stroke-width','2','stroke-dasharray','10 40')
      svg.appendChild(c)
    } else if (type === 'lotus') {
      for(let i=0; i<8; i++) {
        const angle = i * 45
        const g = mkel('g', 'transform', `rotate(${angle} 400 400)`)
        const ellipse = mkel('ellipse','cx','400','cy','250','rx','40','ry','180','fill','none','stroke','rgba(255,223,141,0.15)','stroke-width','1')
        g.appendChild(ellipse); svg.appendChild(g)
      }
    } else if (type === 'timeline') {
      const l = mkel('line','x1','100','y1','400','x2','700','y2','400','stroke',strokeColor,'stroke-width',strokeW)
      svg.appendChild(l)
    } else if (type === 'core') {
      const c = mkel('circle','cx','400','cy','400','r','250','fill','none','stroke',strokeColor,'stroke-width','1')
      const c2 = mkel('circle','cx','400','cy','400','r','150','fill','none','stroke',strokeColor,'stroke-width','1')
      svg.appendChild(c); svg.appendChild(c2)
    }
    
    geomCanvas.appendChild(svg)
  }

  function wrapWords(str) {
    if(!str) return ''
    return str.split('\n').map((line, lineIdx) => {
      const words = line.split(' ')
      const html = words.map((w, i) => {
        const delay = (lineIdx*0.1) + (i*0.06)
        return `<span class="anim-word" style="--delay: ${delay}s">${w}</span>`
      }).join(' ')
      return `<div class="anim-line">${html}</div>`
    }).join('')
  }

  const goTo = (i) => { if (i !== cur && !isAnimating) buildScene(i) }
  const next = () => { if(cur < scenes.length - 1) goTo(cur + 1) }
  const prev = () => { if(cur > 0) goTo(cur - 1) }

  const s = scenes[cur]

  return (
    <div className={`cinematic-stage ${s.theme} ${isActive ? 'active' : ''}`}>
      <div className="progress-bar" style={{ width: `${Math.round(((cur + 1) / scenes.length) * 100)}%` }}></div>
      
      <div className="bg-gradient"></div>
      <div className="film-grain"></div>
      
      <div id="fx-layer" ref={fxLayerRef}></div>
      <div className="geometry-canvas pulse-slow" ref={geomCanvasRef}></div>

      <div className="content-wrapper">
        <div className="content">
          <div className="era">{s.era}</div>
          <div className="sanskrit" style={{ display: s.sanskrit ? 'block' : 'none' }}>{s.sanskrit}</div>
          <div className="sanskrit-trans" style={{ display: s.sktrans ? 'block' : 'none' }}>{s.sktrans}</div>
          <div className="headline" dangerouslySetInnerHTML={{ __html: wrapWords(s.headline) }}></div>
          <div className="body">{s.body}</div>
          
          <div className="cta-row">
            {s.cta ? (
              <button className="btn-enter" onClick={() => onNext()}>
                Enter the wisdom
              </button>
            ) : cur === 0 && (
              <div className="intro-actions">
                {lastRead && (String(lastRead.chapter) !== '1' || String(lastRead.verse) !== '1') && (
                  <button className="btn-continue" onClick={() => onNext(`/verse/${lastRead.chapter}/${lastRead.verse}`)}>
                    Continue from {lastRead.chapter}:{lastRead.verse}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="nav-row">
        <button className="nav-btn" onClick={prev} disabled={cur === 0}>← Back</button>
        <div className="dots">
          {scenes.map((_, i) => (
            <div 
              key={i} 
              className={`dot ${i === cur ? 'on' : ''}`} 
              onClick={() => goTo(i)}
            ></div>
          ))}
        </div>
        <div className="nav-actions">
          {hasCompletedIntro && cur < scenes.length - 1 && (
            <button className="btn-skip-nav" onClick={() => onNext('/verse/1/1')}>Skip Intro</button>
          )}
          <button className="nav-btn" onClick={next} disabled={cur === scenes.length - 1} style={{ visibility: cur === scenes.length - 1 ? 'hidden' : 'visible' }}>Next →</button>
        </div>
      </div>
    </div>
  )
}
