import React, { useState } from 'react';

const LargeSwitch = ({ id, label, initialState = false, onToggle }) => {
  const [isOn, setIsOn] = useState(initialState);

  const handleToggle = () => {
    const newState = !isOn;
    setIsOn(newState);
    if (onToggle) onToggle(id, newState);
  };

  return (
    <div className="large-switch-container">
      <label htmlFor={id} className="large-switch-label">{label}</label>
      <button
        id={id}
        className={`large-switch ${isOn ? 'on' : 'off'}`}
        onClick={handleToggle}
        aria-label={`Toggle ${label}`}
      >
        <span className="large-switch-handle" />
      </button>
    </div>
  );
};

export default LargeSwitch;