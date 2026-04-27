import React from 'react';

const CalendarView = ({ history = {} }) => {
  // Generate days for the last 30 days
  const today = new Date();
  const days = [];
  
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      dayNum: d.getDate(),
      completed: history[dateStr] > 0
    });
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '4px',
      width: '100%',
      marginTop: '10px'
    }}>
      {days.map((day, idx) => (
        <div 
          key={idx}
          title={day.date}
          style={{
            aspectRatio: '1/1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '6px',
            background: day.completed ? '#40C040' : '#333',
            color: day.completed ? '#fff' : '#666',
            border: day.date === today.toISOString().split('T')[0] ? '1px solid #FFD700' : '1px solid transparent',
            borderRadius: '2px',
            imageRendering: 'pixelated'
          }}
        >
          {day.dayNum}
        </div>
      ))}
    </div>
  );
};

export default CalendarView;
