import React from 'react';

const SensorCard = ({ label, temperature, pressure, humidity, lastUpdate, compact }) => {
  return (
    <div className={`sensor-card ${compact ? 'compact' : ''}`}>
      <div className="sensor-header">
        <h3 className="sensor-label">{label}</h3>
      </div>
      <div className="sensor-values">
        <div className="sensor-value">
          <span className="label">🌡 Temp:</span>
          <span className="value">{temperature ?? '--'}°C</span>
        </div>
        <div className="sensor-value">
          <span className="label">💨 Pressure:</span>
          <span className="value">{pressure ?? '--'} hPa</span>
        </div>
        <div className="sensor-value">
          <span className="label">💧 Humidity:</span>
          <span className="value">{humidity ?? '--'}%</span>
        </div>
      </div>
      <div className="last-update">🕒 {lastUpdate || 'N/A'}</div>
    </div>
  );
};

export default SensorCard;