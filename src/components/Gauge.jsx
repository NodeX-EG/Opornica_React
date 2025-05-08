import React from 'react';
import GaugeChart from 'react-gauge-chart';

const Gauge = ({ value, min = 0, max = 60, label, unit }) => {
  const displayUnit = unit === "°C" ? "\u00B0C" : unit;

  return (
    <div className="gauge-container">
      <GaugeChart
        id={`gauge-${label}`}
        percent={(value - min) / (max - min)}
        arcPadding={0.02}
        arcWidth={0.3}
        cornerRadius={3}
        colors={['#5BE12C', '#F5CD19', '#EA4228']} // Green ? Yellow ? Red
        needleColor="#464A4F"
        needleBaseColor="#464A4F"
        textColor="#000"
        hideText={true}
      />
      <div className="gauge-label">
        {label}: {value}{displayUnit}
      </div>
    </div>
  );
};

export default Gauge;
