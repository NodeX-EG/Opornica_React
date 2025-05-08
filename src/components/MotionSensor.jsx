import React from 'react';
import { WiTime8 } from 'react-icons/wi';

const MotionSensor = ({ name = "Motion Sensor", motion = false, lastUpdate = "Never" }) => {
  return (
    <div className={`motion-sensor ${motion ? 'active' : ''}`}>
      <div className="motion-indicator">
        <div className="motion-light" />
        <span>{name}</span>
      </div>
      <div className="motion-update">
        <WiTime8 size={14} />
        <span>{lastUpdate}</span>
      </div>
    </div>
  );
};

export default MotionSensor;