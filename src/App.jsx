import React from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import ContextPage from './components/ContextPage'
import VersePage from './components/VersePage'
import VerseRedirect from './components/VerseRedirect'
import './App.css'

function AppContent() {
  const navigate = useNavigate()

  const handleNext = () => {
    navigate('/verse/2/47')
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<ContextPage onNext={handleNext} />} />
        <Route path="/verse/:chapter/:verse" element={<VersePage />} />
        <Route path="/verse/:chapter" element={<VerseRedirect />} />
        <Route path="/verse" element={<VerseRedirect />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
