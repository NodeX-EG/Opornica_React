import React, { useState, useEffect } from 'react';
import mqttService from '../services/mqttService';
import SensorCard from './SensorCard';
import MotionSensor from './MotionSensor';
import Switch from './Switch';
import LargeSwitch from './LargeSwitch';

const Layout = () => {
  const [sensorData, setSensorData] = useState(mqttService.sensorData);
  const [connectionStatus, setConnectionStatus] = useState('Povezivanje...');
  
  const [switches] = useState([
    { id: "light1", label: "Svjetlo - Dnevna soba", nodeId: 10, childId: 1 },
    { id: "light2", label: "Svjetlo - Spavaća soba", nodeId: 10, childId: 2 },
    { id: "light3", label: "Svjetlo - Kuhinja", nodeId: 10, childId: 3 },
    { id: "fan1", label: "Ventilator - Dnevna", nodeId: 11, childId: 1 },
    { id: "fan2", label: "Ventilator - Spavaća", nodeId: 11, childId: 2 },
    { id: "ac", label: "Klima", nodeId: 12, childId: 1 },
    { id: "heater", label: "Grijač", nodeId: 12, childId: 2 },
    { id: "tv", label: "TV", nodeId: 13, childId: 1 },
    { id: "sound", label: "Zvučnici", nodeId: 13, childId: 2 },
    { id: "router", label: "Router", nodeId: 14, childId: 1 }
  ]);

  const [switchStates, setSwitchStates] = useState(
    switches.reduce((acc, sw) => ({ ...acc, [sw.id]: false }), {})
  );

  useEffect(() => {
    const handleDataUpdate = (data) => {
      setSensorData(prev => ({ ...prev, ...data.sensorData }));
    };

    const unsubscribe = mqttService.subscribe(handleDataUpdate);
    mqttService.connect();

    const statusHandlers = {
      connect: () => setConnectionStatus('Povezano'),
      reconnect: () => setConnectionStatus('Ponovno povezivanje...'),
      offline: () => setConnectionStatus('Diskonektovano')
    };

    Object.entries(statusHandlers).forEach(([event, handler]) => {
      mqttService.client?.on(event, handler);
    });

    return () => {
      unsubscribe();
      Object.entries(statusHandlers).forEach(([event, handler]) => {
        mqttService.client?.off(event, handler);
      });
      mqttService.disconnect();
    };
  }, []);

  const handleSwitchToggle = (id, newState) => {
    setSwitchStates(prev => ({ ...prev, [id]: newState }));
    const switchConfig = switches.find(sw => sw.id === id);
    if (switchConfig) {
      const message = `${switchConfig.nodeId};${switchConfig.childId};1;0;2;${newState ? '1' : '0'}`;
      console.log(`✉️ Sending MQTT: ${message}`);
    }
  };

  return (
    <div className="dashboard">
      <div className="connection-status" data-status={connectionStatus}>
        {connectionStatus}
      </div>

      <div className="sensor-row">
        <SensorCard compact {...sensorData[11]} />
        <SensorCard compact {...sensorData[15]} />
        <SensorCard compact {...sensorData[25]} />
      </div>

      <div className="motion-sensors">
        <MotionSensor {...sensorData[12]} />
        <MotionSensor {...sensorData[26]} />
      </div>

      <div className="switches-panel">
        <h2>Kontrole</h2>
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
            label="GLAVNI PREKIDAČ"
            onToggle={handleSwitchToggle}
          />
        </div>
      </div>
    </div>
  );
};

export default Layout;