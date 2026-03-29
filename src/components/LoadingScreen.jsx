import React, { useState, useEffect } from 'react'
import './LoadingScreen.css'

const LoadingScreen = () => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    setParticles([...Array(24)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${5 + Math.random() * 10}s`
    })))
  }, [])

  return (
    <div className="loading-screen-overlay" suppressHydrationWarning>
      <div className="loading-background"></div>
      
      <div className="loading-content">
        <div className="loading-visual-container">
          <div className="loading-glow-ring"></div>
          
          <div className="loading-visual">
            <div className="dharmachakra">
              <svg viewBox="0 0 100 100" className="chakra-svg">
                {/* Outer Ring with subtle notches */}
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.8" />
                
                {/* Inner decorative ring */}
                <circle cx="50" cy="50" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
                
                {/* Center Hub */}
                <circle cx="50" cy="50" r="5" fill="currentColor" />
                
                {/* The Eight Spokes - more ornate */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i * Math.PI) / 4;
                  const x1 = 50 + 14 * Math.cos(angle);
                  const y1 = 50 + 14 * Math.sin(angle);
                  const x2 = 50 + 45 * Math.cos(angle);
                  const y2 = 50 + 45 * Math.sin(angle);
                  return (
                    <g key={i} className="chakra-spoke">
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Accent tip */}
                      <circle cx={x2} cy={y2} r="2" fill="currentColor" />
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Pulsing Core */}
            <div className="loading-core"></div>
          </div>
        </div>
        
        <div className="loading-text-wrapper">
          <h2 className="loading-text">Loading Eternal Wisdom</h2>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
      
      <div className="loading-particles">
        {particles.map((p) => (
          <div 
            key={p.id} 
            className={`particle p${p.id}`} 
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}

export default LoadingScreen
