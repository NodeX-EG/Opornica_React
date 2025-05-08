import React, { useState } from 'react';

const Switch = ({ id, label, initialState = false, onToggle }) => {
  const [isOn, setIsOn] = useState(initialState);

  const handleToggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    if (onToggle) onToggle(id, newState);
  };

  return (
    <div className="switch-container">
      <label htmlFor={id} className="switch-label">{label}</label>
      <button
        id={id}
        className={`switch ${isOn ? 'on' : 'off'}`}
        onClick={handleToggle}
        aria-label={`Toggle ${label}`}
      >
        <span className="switch-handle" />
      </button>
    </div>
  );
};

export default Switch;