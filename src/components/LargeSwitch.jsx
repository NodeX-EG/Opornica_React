// LargeSwitch.jsx
import React, { useState, useEffect } from 'react';

const LargeSwitch = ({ id, label, onToggle }) => {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem(`switch_${id}`);
    if (savedState !== null) {
      const parsed = savedState === 'true';
      setIsOn(parsed);
      onToggle(id, parsed);
    }
  }, [id, onToggle]);

  const handleChange = () => {
    const newState = !isOn;
    setIsOn(newState);
    localStorage.setItem(`switch_${id}`, newState);
    onToggle(id, newState);
  };

  return (
    <div className={`large-switch ${isOn ? 'on' : 'off'}`} onClick={handleChange}>
      <label>{label}</label>
      <div className="toggle large">
        <div className="slider" />
      </div>
    </div>
  );
};

export default LargeSwitch;