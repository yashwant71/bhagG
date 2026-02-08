import React from 'react';

const TranslationTextRenderer = ({ parts, onReferenceClick, activeRefId }) => {
  if (!parts) return null;

  return (
    <>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <span key={idx}>{part.content}</span>;
        } else {
          const isClicked = activeRefId === part.refId;
          return (
            <span key={idx} className="reference-container" style={{ position: 'relative', display: 'inline-block' }}>
              <span
                className={`translation-word-reference ${isClicked ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onReferenceClick(part.refId, part.wordData, part.explanation, e);
                }}
              >
                <TranslationTextRenderer 
                  parts={part.wordText} 
                  onReferenceClick={onReferenceClick} 
                  activeRefId={activeRefId} 
                />
              </span>
            </span>
          );
        }
      })}
    </>
  );
};

export default TranslationTextRenderer;
