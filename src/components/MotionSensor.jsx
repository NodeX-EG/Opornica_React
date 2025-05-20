// MotionSensor.jsx
import React from 'react';

const MotionSensor = ({ motion, lastUpdate }) => {
  return (
    <div className={`motion-sensor ${motion ? 'motion-detected' : 'no-motion'}`}>
      <div className="status-icon">
        {motion ? '🟢' : '⚪'}
      </div>
      <div className="sensor-info">
        <div className="status-text">
          {motion ? 'Kretanje detektovano' : 'Pokret'}
        </div>
        <div className="last-update">
          🕒 {lastUpdate || 'N/A'}
        </div>
      </div>
    </div>
  );
};

export default MotionSensor;
