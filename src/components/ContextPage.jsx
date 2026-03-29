'use client'

import React, { useEffect, useState } from 'react'
import DivineEffects from './DivineEffects'
import './ContextPage.css'

const ContextPage = ({ onNext }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="context-page">
      <DivineEffects animationsComplete={true} starDensity={0.7} />
      <div className="context-background"></div>
      
      <div className={`context-container ${isLoaded ? 'loaded' : ''}`}>
        <div className="context-header">
          <div className="context-title-wrapper">
            <h1 className="context-title">भगवद्गीता</h1>
            <div className="title-glow"></div>
          </div>
          <p className="context-subtitle">The Divine Song of God</p>
        </div>
        
        <div className="context-content">
          <div className="context-glass-overlay"></div>
          <div className="context-inner-content">
            <div className="context-text">
              <p className="context-intro">
                In the great epic Mahabharata, on the battlefield of Kurukshetra, 
                a moment of profound crisis unfolds. Prince Arjuna stands between 
                two armies, his mind torn by doubt and despair.
              </p>
              <p className="context-body">
                Seeing his own teachers, relatives, and friends ready for battle, 
                Arjuna&apos;s heart sinks. His bow slips from his hands. Overwhelmed by 
                compassion and confusion, he questions the righteousness of war.
              </p>
              <p className="context-climax">
                In this moment of inner turmoil, Lord Krishna, his friend and guide, 
                reveals His divine form and begins to impart the eternal wisdom of 
                the Bhagavad Gita. The teachings that follow transform not just 
                Arjuna&apos;s understanding, but resonate through the ages as a guide 
                for all humanity.
              </p>
            </div>
            
            <div className="context-divider">
              <div className="divider-diamond"></div>
            </div>
            
            <button className="next-button" onClick={onNext}>
              <span className="button-text">Enter the Wisdom</span>
              <div className="button-glow"></div>
              <svg className="button-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="context-footer">
          <p className="footer-copyright">© 2026 Bhagavad Gita Experience</p>
        </div>
      </div>
    </div>
  )
}

export default ContextPage
