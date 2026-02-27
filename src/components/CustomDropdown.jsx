'use client'

import React, { useState, useEffect, useRef } from 'react'
import './CustomDropdown.css'

const CustomDropdown = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = 'Select option',
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Find the selected option label
  const selectedOption = options.find(opt => String(opt.value) === String(value))
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`custom-dropdown-container ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      {label && <label className="dropdown-label">{label}</label>}
      <div 
        className={`dropdown-selected-area ${isOpen ? 'open' : ''}`} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="selected-value">{displayLabel}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`} 
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
      
      {isOpen && (
        <div className="dropdown-options-list">
          {options.map((option) => (
            <div 
              key={option.value} 
              className={`dropdown-option ${String(option.value) === String(value) ? 'active' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <span>{option.label}</span>
              {String(option.value) === String(value) && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomDropdown
