import React from 'react';

const WordTooltipContent = ({ 
  words, 
  translation, 
  chapterData, 
  isTranslationMode = false, 
  toggledMeanings = {}, 
  onMeaningClick 
}) => {
  if (!words || words.length === 0) return null;

  return (
    <div className="tooltip-content-wrapper">
      <div className="tooltip-words-row">
        {words.map((word, idx) => {
          const wordId = word.id || word.key;
          const showTransliteration = toggledMeanings[wordId];
          
          if (isTranslationMode) {
            // Priority: showing what this term means
            return (
              <div key={wordId || idx} className="tooltip-word-data">
                {word.sanskrit && (
                  <div className="tooltip-word-sanskrit">{word.sanskrit}</div>
                )}
                {word.transliteration && (
                  <div className="tooltip-word-transliteration">({word.transliteration})</div>
                )}
                {word.sanskrit && <div className="tooltip-word-divider">—</div>}
                <div className="tooltip-word-translation">
                  {word[translation] || word.english}
                </div>
              </div>
            );
          }
          
          // Non-translation mode: usually Sanskrit word tooltips
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
          const hasExplanation = !!explanation;
          const wordDisplay = showTransliteration && word.transliteration 
            ? word.transliteration 
            : (word[translation] || word.english || '');

          return (
            <span key={wordId || idx}>
              <span 
                className={`tooltip-word ${hasExplanation ? 'has-explanation' : ''} clickable`}
                onClick={(e) => {
                  if (onMeaningClick) {
                    e.stopPropagation();
                    onMeaningClick(wordId, e);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {wordDisplay}
              </span>
              {idx < words.length - 1 && <span className="tooltip-separator"> • </span>}
            </span>
          );
        })}
      </div>
      
      {/* Explanations Row */}
      {words.some(word => {
        const wordId = word.id || word.key;
        return word.explanation || 
               chapterData?.explanations?.find(e => e.id === (word.explanationRef || wordId)) || 
               chapterData?.explanations?.find(e => e.term === (word[translation] || word.english));
      }) && (
        <div className="tooltip-explanations-row">
          {words.map((word, idx) => {
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
            if (!explanation) return null;
            
            return (
              <div key={wordId || idx} className="tooltip-explanation-item">
                <div className="tooltip-explanation-header">
                  <span className="tooltip-explanation-term">
                    {(translation === 'hindi' && explanation.termHindi) ? explanation.termHindi : explanation.term}
                  </span>
                  {/* If the clicked word was just the term, or the canonical term is different, show as translation */}
                  {(isTranslationMode && explanation.term && explanation.termHindi) && (
                    <span className="tooltip-explanation-sub-translation">
                      ({translation === 'hindi' ? explanation.term : explanation.termHindi})
                    </span>
                  )}
                </div>
                <div className="tooltip-explanation-text">
                  {translation === 'hindi' && explanation.descHindi ? explanation.descHindi : explanation.desc}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WordTooltipContent;
