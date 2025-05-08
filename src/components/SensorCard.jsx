import React from 'react';
import { WiHumidity, WiBarometer, WiThermometer, WiTime8 } from 'react-icons/wi';

const SensorCard = ({ 
  name = "Sensor", 
  temperature = 0, 
  humidity = 0, 
  pressure, 
  lastUpdate = "Never",
  compact 
}) => {
  return (
    <div className={`sensor-card ${compact ? 'compact' : ''}`}>
      <h3>{name}</h3>
      
      {compact ? (
        <div className="compact-values">
          <div className="compact-metric">
            <WiThermometer size={18} />
            <span>{temperature.toFixed(1)}°C</span>
          </div>
          <div className="compact-metric">
            <WiHumidity size={18} />
            <span>{humidity.toFixed(0)}%</span>
          </div>
          {pressure !== undefined && (
            <div className="compact-metric">
              <WiBarometer size={18} />
              <span>{pressure.toFixed(0)}hPa</span>
            </div>
          )}
          <div className="compact-update">
            <WiTime8 size={14} />
            <span>{lastUpdate}</span>
          </div>
        </div>
      ) : (
        // Original detailed view would go here
        null
      )}
    </div>
  );
};

export default SensorCard;