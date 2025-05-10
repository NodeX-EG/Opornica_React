import mqtt from 'mqtt';
import defaults from './sensorDefaults.json';

const MQTT_BROKER = 'ws://192.168.1.101:9001';
const TOPIC = 'sensors-NodeRed/raw';
const STORAGE_KEY = 'mqttSensorData';
const API_URL = 'http://192.168.1.101:3001/api/sensor-values';

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = new Set();
    this.sensorData = JSON.parse(JSON.stringify(defaults)); // Deep clone defaults
    this.initialize();
  }

  async initialize() {
    try {
      // 1. Try to load from server
      const serverData = await this.fetchServerData();
      if (serverData) {
        this.mergeSensorData(serverData);
      }

      // 2. Try to load from localStorage
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        this.mergeSensorData(JSON.parse(localData));
      }

      console.log('Initialized sensor data:', this.sensorData);
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
    Object.keys(newData).forEach(nodeId => {
      if (this.sensorData[nodeId]) {
        this.sensorData[nodeId] = {
          ...this.sensorData[nodeId],
          ...newData[nodeId]
        };
      }
    });
  }

  connect() {
    this.client = mqtt.connect(MQTT_BROKER, {
      reconnectPeriod: 5000,
      connectTimeout: 3000
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');
      this.client.subscribe(TOPIC);
    });

    this.client.on('message', (topic, message) => {
      const data = this.parseMessage(message.toString());
      if (data) {
        this.updateSensor(data);
      }
    });
  }

  parseMessage(rawMessage) {
    const parts = rawMessage.split(';');
    if (parts.length < 6) return null;

    const nodeId = parts[0];
    const childId = parseInt(parts[1]);
    const payload = parts[5];
    const timestamp = new Date().toLocaleTimeString();

    // Motion sensors
    if (nodeId === '12' || nodeId === '26') {
      return {
        nodeId,
        motion: payload === '1',
        lastUpdate: timestamp
      };
    }

    // Environment sensors
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

    // Persist changes
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sensorData));
    this.notifySubscribers();
    this.syncWithServer();
  }

  async syncWithServer() {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.sensorData)
      });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback({ sensorData: this.sensorData });
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => callback({ sensorData: this.sensorData }));
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🔌 Disconnected from MQTT');
    }
  }
}

export default new MQTTService();