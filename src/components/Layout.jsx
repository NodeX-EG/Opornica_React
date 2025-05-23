// layout.jsx
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
    { id: "light1", label: "Sprat - Dnevna Soba", nodeId: 10, childId: 1 },
    { id: "light2", label: "Staza A", nodeId: 18, childId: 1 },
    { id: "light3", label: "Staza B", nodeId: 11, childId: 1 },
    { id: "fan1", label: "Shed", nodeId: 19, childId: 1 },
    { id: "fan2", label: "5", nodeId: 11, childId: 2 },
    { id: "ac", label: "6", nodeId: 12, childId: 1 },
    { id: "heater", label: "7", nodeId: 12, childId: 2 },
    { id: "tv", label: "8", nodeId: 13, childId: 1 },
    { id: "sound", label: "9", nodeId: 13, childId: 2 },
    { id: "router", label: "10", nodeId: 14, childId: 1 }
  ]);

  const [switchStates, setSwitchStates] = useState(
    () => mqttService.switchStates || switches.reduce((acc, sw) => ({ ...acc, [sw.id]: false }), {})
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

  useEffect(() => {
    mqttService.updateSwitchStates(switchStates);
  }, [switchStates]);

  const handleSwitchToggle = (id, newState) => {
    setSwitchStates(prev => {
      const updated = { ...prev, [id]: newState };
      mqttService.updateSwitchStates(updated);
      return updated;
    });

    const switchConfig = switches.find(sw => sw.id === id);
    if (switchConfig) {
      const message = `${switchConfig.nodeId};${switchConfig.childId};1;0;2;${newState ? '1' : '0'}`;
      mqttService.publishToControlBroker(message);
      console.log(`✉️ Sending MQTT: ${message}`);
    }
  };

  return (
    <div className="dashboard">
      <div className="connection-status" data-status={connectionStatus}>
        {connectionStatus}
      </div>

      <div className="sensor-row">
        <SensorCard compact label="Sprat" {...sensorData[11]} />
        <SensorCard compact label="Spolja" {...sensorData[15]} />
        <SensorCard compact label="Podrum" {...sensorData[25]} />
      </div>

      <div className="motion-sensors">
        <MotionSensor label="Sprat" {...sensorData[12]} />
        <MotionSensor label="Prizemlje" {...sensorData[26]} />
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
