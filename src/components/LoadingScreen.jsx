import React from 'react'
import './LoadingScreen.css'

const LoadingScreen = () => {
  return (
    <div className="loading-screen-overlay">
      <div className="loading-content">
        <div className="loading-visual">
          <div className="dharmachakra">
            <svg viewBox="0 0 100 100" className="chakra-svg">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              {[...Array(8)].map((_, i) => (
                <line 
                  key={i}
                  x1="50" y1="50" 
                  x2={50 + 35 * Math.cos(i * Math.PI / 4)} 
                  y2={50 + 35 * Math.sin(i * Math.PI / 4)} 
                  stroke="currentColor" 
                  strokeWidth="2" 
                />
              ))}
            </svg>
          </div>
          <div className="loading-glow"></div>
        </div>
      </div>
      <div className="loading-particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle p${i}`}></div>
        ))}
      </div>
    </div>
  )
}

export default LoadingScreen
