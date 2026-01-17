import React from 'react'
import './ContextPage.css'

const ContextPage = ({ onNext }) => {
  return (
    <div className="context-page">
      <div className="context-container">
        <div className="context-header">
          <h1 className="context-title">भगवद्गीता</h1>
          <p className="context-subtitle">The Divine Song</p>
        </div>
        
        <div className="context-content">
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
          
          <div className="context-divider"></div>
          
          <button className="next-button" onClick={onNext}>
            <span>Enter the Wisdom</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="context-background"></div>
    </div>
  )
}

export default ContextPage
