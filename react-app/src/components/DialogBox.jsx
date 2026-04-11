import React from 'react';

const DialogBox = ({ text, onNext, showArrow = true }) => {
  return (
    <div 
      className="gb-dialog" 
      onClick={onNext}
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        minHeight: '80px',
        cursor: onNext ? 'pointer' : 'default',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <p style={{ margin: 0, fontSize: '10px', lineHeight: '1.6' }}>
        {text}
      </p>
      {showArrow && onNext && <div className="dialog-arrow" />}
      <style>{`
        .dialog-arrow {
          position: absolute;
          bottom: 10px;
          right: 15px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #333;
          animation: bounce 1s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
};

export default DialogBox;
