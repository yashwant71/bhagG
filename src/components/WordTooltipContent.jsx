import React, { useState, useCallback } from 'react';

const WordTooltipContent = ({ 
  words, 
  translation, 
  chapterData, 
  isTranslationMode = false, 
  toggledMeanings = {}, 
  onMeaningClick 
}) => {
  const [navStack, setNavStack] = useState([]);
  
  const handleNestedClick = useCallback((explanationId, e) => {
    e.stopPropagation();
    const targetExp = chapterData?.explanations?.find(e => e.id === explanationId);
    if (targetExp) {
      setNavStack(prev => [...prev, targetExp]);
    }
  }, [chapterData]);

  const handleBack = useCallback((e) => {
    e.stopPropagation();
    setNavStack(prev => prev.slice(0, -1));
  }, []);

  const activeView = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  const renderParsedDescription = (text) => {
    if (!text || typeof text !== 'string') return null;
    
    const parts = [];
    const regex = /\(([^)]+)\)\[([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const term = match[1];
      const id = match[2];
      
      parts.push(
        <span 
          key={`${id}-${match.index}`}
          className="tooltip-nested-link"
          onClick={(e) => handleNestedClick(id, e)}
        >
          {term}
        </span>
      );

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const getActiveDesc = (exp) => {
    if (!exp) return null;
    if (translation === 'hindi') return exp.descHindi || exp.desc;
    return exp.desc || exp.descHindi;
  };

  const getActiveTerm = (exp) => {
    if (!exp) return null;
    if (translation === 'hindi') return exp.termHindi || exp.term;
    return exp.term || exp.termHindi;
  };

  if (!words || words.length === 0) return null;

  // Pre-calculate which words have explanations to avoid empty sections
  const wordsWithExplanations = !activeView ? words.map((word, idx) => {
    const wordId = word.id || word.key;
    let explanation = word.explanation || chapterData?.explanations?.find(e => e.id === (word.explanationRef || wordId));
    if (!explanation) {
      const wordText = word[translation] || word.english || '';
      explanation = chapterData?.explanations?.find(e => 
        e.term === wordText || 
        wordText.includes(e.term) ||
        (word.english && (e.term === word.english || word.english.includes(e.term))) ||
        (word.hindi && (e.term === word.hindi || word.hindi.includes(e.term)))
      );
    }
    return { word, wordId, explanation };
  }).filter(item => item.explanation) : [];

  const hasAnyExplanation = wordsWithExplanations.length > 0;

  // Find if activeView matches any of our original words to show word header
  const matchedWord = (activeView && navStack.length === 1) ? words.find(w => {
    const wordId = w.id || w.key;
    return w.explanationRef === activeView.id || wordId === activeView.id || 
           w.english === activeView.term || w.hindi === activeView.termHindi;
  }) : null;

  return (
    <div className={`tooltip-content-wrapper ${!hasAnyExplanation && !activeView ? 'no-explanations' : ''}`}>
      {navStack.length > 0 && (
        <button className="tooltip-back-button" onClick={handleBack}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      )}

      {!activeView ? (
        <>
          <div className="tooltip-words-row">
            {words.map((word, idx) => {
              const wordId = word.id || word.key;
              const isToggled = toggledMeanings[wordId];
              
              return (
                <div key={wordId || idx} className="tooltip-word-item">
                  <button 
                    className="tooltip-word-box"
                    onClick={(e) => {
                      if (onMeaningClick) {
                        onMeaningClick(wordId, e);
                      }
                    }}
                    title="Click to toggle transliteration"
                  >
                    <div className="tooltip-word-meaning-text">
                      {isToggled ? word.transliteration : (word[translation] || word.english)}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
          
          {hasAnyExplanation && (
            <div className="tooltip-explanations-section">
              {wordsWithExplanations.map((item, idx) => (
                <div 
                  key={`${item.wordId || idx}-exp`} 
                  className="tooltip-explanation-item clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNavStack(prev => [...prev, item.explanation]);
                  }}
                >
                  <div className="tooltip-explanation-header">
                    <span className="tooltip-explanation-term">
                      {getActiveTerm(item.explanation)}
                    </span>
                  </div>
                  <div className="tooltip-explanation-text">
                    {renderParsedDescription(getActiveDesc(item.explanation))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div key={activeView.id} className="tooltip-explanation-item active-view">
          {/* Enhanced Word Header in Detail View */}
          {matchedWord && (
            <div className="tooltip-active-word-header">
              <span className="tooltip-word-sanskrit">{matchedWord.sanskrit}</span>
              <span className="tooltip-word-transliteration">({matchedWord.transliteration})</span>
              <span className="tooltip-word-translation">
                {matchedWord[translation] || matchedWord.english}
              </span>
            </div>
          )}

          <div className="tooltip-explanation-header">
            <span className="tooltip-explanation-term">
              {getActiveTerm(activeView)}
            </span>
          </div>
          <div className="tooltip-explanation-text">
            {renderParsedDescription(getActiveDesc(activeView))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordTooltipContent;
