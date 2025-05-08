import React, { useState, useEffect } from 'react';
import mqttService from '../services/mqttService';
import SensorCard from './SensorCard';
import MotionSensor from './MotionSensor';
import Switch from './Switch';
import LargeSwitch from './LargeSwitch';

const Layout = () => {
  const [sensorData, setSensorData] = useState(mqttService.getInitialData());
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  const [switches] = useState([
    { id: "light1", label: "Living Room Light", nodeId: 10, childId: 1 },
    { id: "light2", label: "Bedroom Light", nodeId: 10, childId: 2 },
    { id: "light3", label: "Kitchen Light", nodeId: 10, childId: 3 },
    { id: "fan1", label: "Living Room Fan", nodeId: 11, childId: 1 },
    { id: "fan2", label: "Bedroom Fan", nodeId: 11, childId: 2 },
    { id: "ac", label: "Air Conditioner", nodeId: 12, childId: 1 },
    { id: "heater", label: "Heater", nodeId: 12, childId: 2 },
    { id: "tv", label: "TV", nodeId: 13, childId: 1 },
    { id: "sound", label: "Sound System", nodeId: 13, childId: 2 },
    { id: "router", label: "Router", nodeId: 14, childId: 1 }
  ]);

  const [switchStates, setSwitchStates] = useState(
    switches.reduce((acc, sw) => ({ ...acc, [sw.id]: false }), {})
  );

  useEffect(() => {
    const handleDataUpdate = (data) => {
      if (data.sensorData) setSensorData(data.sensorData);
    };

    const unsubscribe = mqttService.subscribe(handleDataUpdate);
    mqttService.connect();

    mqttService.client.on('connect', () => setConnectionStatus('Connected'));
    mqttService.client.on('reconnect', () => setConnectionStatus('Reconnecting...'));
    mqttService.client.on('offline', () => setConnectionStatus('Disconnected'));

    return () => {
      unsubscribe();
      mqttService.disconnect();
    };
  }, []);

  const handleSwitchToggle = (id, newState) => {
    setSwitchStates(prev => ({ ...prev, [id]: newState }));
    const switchConfig = switches.find(sw => sw.id === id);
    if (switchConfig) {
      const message = `${switchConfig.nodeId};${switchConfig.childId};1;0;2;${newState ? '1' : '0'}`;
      console.log(`Sending MQTT command: ${message}`);
    }
  };

  return (
    <div className="dashboard">
      <div className="connection-status" data-status={connectionStatus}>
        {connectionStatus}
      </div>

      {/* Environment sensors row */}
      <div className="sensor-row">
        <SensorCard compact {...sensorData[11]} />
        <SensorCard compact {...sensorData[15]} />
        <SensorCard compact {...sensorData[25]} />
      </div>

      {/* Motion sensors row */}
      <div className="motion-sensors">
        <MotionSensor {...sensorData[12]} />
        <MotionSensor {...sensorData[26]} />
      </div>

      {/* Control panels */}
      <div className="switches-panel">
        <h2>Controls</h2>
        <div className="switch-grid">
          {switches.map(sw => (
            <Switch 
              key={sw.id}
              id={sw.id}
              label={sw.label}
              initialState={switchStates[sw.id]}
              onToggle={handleSwitchToggle}
            />
          ))}
        </div>
        <div className="main-switch-container">
          <LargeSwitch 
            id="main-power"
            label="MAIN POWER"
            onToggle={handleSwitchToggle}
          />
        </div>
      </div>
    </div>
  );
};

export default Layout;