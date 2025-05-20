// mqttService.js
import mqtt from 'mqtt';
import defaults from './sensorDefaults.json';

const MQTT_RECEIVE_BROKER = 'ws://192.168.1.101:9001';
const MQTT_PUBLISH_BROKER = 'ws://192.168.1.101:9001';
const RECEIVE_TOPIC = 'sensors-NodeRed/raw';
const PUBLISH_TOPIC = 'OPO-SEC-Link1';
const STORAGE_KEY = 'mqttSensorData';
const STORAGE_SWITCH_KEY = 'mqttSwitchStates';
const API_URL = 'http://192.168.1.101:3001/api/sensor-values';

class MQTTService {
  constructor() {
    this.client = null;
    this.publishClient = null;
    this.subscribers = new Set();
    this.sensorData = JSON.parse(JSON.stringify(defaults));
    this.switchStates = {}; // NEW
    this.initialize();
  }

  async initialize() {
    try {
      const serverData = await this.fetchServerData();
      if (serverData) this.mergeSensorData(serverData);

      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) this.mergeSensorData(JSON.parse(localData));

      const localSwitch = localStorage.getItem(STORAGE_SWITCH_KEY);
      if (localSwitch) {
        this.switchStates = JSON.parse(localSwitch);
      }

      console.log('Initialized sensor + switch data:', this.sensorData, this.switchStates);
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  async fetchServerData() {
    try {
      const response = await fetch(API_URL);
      if (response.ok) return await response.json();
    } catch (error) {
      console.log('Server unavailable, using local data');
    }
    return null;
  }

  mergeSensorData(newData) {
    Object.keys(newData).forEach(key => {
      if (key === 'switchStates') {
        this.switchStates = { ...this.switchStates, ...newData.switchStates };
      } else if (this.sensorData[key]) {
        this.sensorData[key] = {
          ...this.sensorData[key],
          ...newData[key]
        };
      }
    });
  }

  connect() {
    this.client = mqtt.connect(MQTT_RECEIVE_BROKER, {
      reconnectPeriod: 5000,
      connectTimeout: 3000
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker for receiving');
      this.client.subscribe(RECEIVE_TOPIC);

      // Re-send last known switch states
      Object.entries(this.switchStates).forEach(([id, state]) => {
        const config = this.getSwitchConfigById(id);
        if (config) {
          const message = `${config.nodeId};${config.childId};1;0;2;${state ? '1' : '0'}`;
          this.publishToControlBroker(message);
        }
      });
    });

    this.client.on('message', (topic, message) => {
      const data = this.parseMessage(message.toString());
      if (data) this.updateSensor(data);
    });

    this.publishClient = mqtt.connect(MQTT_PUBLISH_BROKER, {
      reconnectPeriod: 5000,
      connectTimeout: 3000
    });

    this.publishClient.on('connect', () => {
      console.log('📤 Connected to MQTT Broker for publishing');
    });
  }

  publishToControlBroker(message) {
    if (this.publishClient && this.publishClient.connected) {
      this.publishClient.publish(PUBLISH_TOPIC, message, {}, err => {
        if (err) console.error('❌ Error publishing:', err);
      });
    }
  }

  parseMessage(rawMessage) {
    const parts = rawMessage.split(';');
    if (parts.length < 6) return null;

    const nodeId = parts[0];
    const childId = parseInt(parts[1]);
    const payload = parts[5];
    const timestamp = new Date().toLocaleTimeString();

    if (nodeId === '12' || nodeId === '26') {
      return {
        nodeId,
        motion: payload === '1',
        lastUpdate: timestamp
      };
    }

    const value = parseFloat(payload);
    if (isNaN(value)) return null;

    const data = { nodeId, lastUpdate: timestamp };
    if (childId === 0) data.temperature = value;
    else if (childId === 1) data.pressure = value;
    else if (childId === 2) data.humidity = value;

    return data;
  }

  updateSensor(newData) {
    const nodeId = newData.nodeId;
    this.sensorData[nodeId] = {
      ...this.sensorData[nodeId],
      ...newData
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sensorData));
    this.notifySubscribers();
    this.syncWithServer();
  }

  updateSwitchStates(newStates) {
    this.switchStates = { ...this.switchStates, ...newStates };
    localStorage.setItem(STORAGE_SWITCH_KEY, JSON.stringify(this.switchStates));
    this.syncWithServer();
  }

  async syncWithServer() {
    try {
      const payload = {
        ...this.sensorData,
        switchStates: this.switchStates
      };
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  getSwitchConfigById(id) {
    // optional: map switch ID to config (hardcoded or imported)
    return null; // Implement if needed
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback({ sensorData: this.sensorData });
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb({ sensorData: this.sensorData }));
  }

  disconnect() {
    if (this.client) this.client.end();
    if (this.publishClient) this.publishClient.end();
  }
}

export default new MQTTService();
