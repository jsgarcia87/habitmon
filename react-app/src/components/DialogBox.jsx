import React, { useState, useEffect } from 'react';
import './DialogBox.css';

/**
 * DialogBox Component
 * A high-fidelity RPG dialogue box for Habitmon.
 * Supports multi-page text, character names, and option buttons.
 */
const DialogBox = ({ 
  text, 
  name, 
  onComplete, 
  onOptionSelect,
  options = [] 
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const pages = Array.isArray(text) ? text : [text];
  const isLastPage = currentPage === pages.length - 1;
  const fullText = pages[currentPage];

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    setIsTyping(true);
    setDisplayedText('');
    
    const timer = setInterval(() => {
      index++;
      setDisplayedText(fullText.substring(0, index));
      if (index >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 30); // 30ms per char (Classic RPG speed)

    return () => clearInterval(timer);
  }, [fullText]);

  const handleNext = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (isTyping) {
      // Skip animation
      setDisplayedText(fullText);
      setIsTyping(false);
      return;
    }

    if (isLastPage) {
      if (options.length === 0 && onComplete) {
        onComplete();
      }
    } else {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'z' || e.key === 'a' || e.key === 'Enter' || e.key === ' ') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, isLastPage, options.length]);

  return (
    <div className="dialog-container" onClick={handleNext}>
      <div className="dialog-box">
        {name && <div className="dialog-name">{name}</div>}
        
        <p className="dialog-text">
          {displayedText}
        </p>

        {(!isLastPage || options.length === 0) && !isTyping ? (
          <div className="dialog-arrow">▼</div>
        ) : null}

        {isLastPage && options.length > 0 && (
          <div className="dialog-options">
            {options.map((opt, idx) => (
              <button 
                key={idx}
                className={`dialog-button ${opt.primary ? 'primary' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOptionSelect(opt.value);
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DialogBox;
