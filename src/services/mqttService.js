import mqtt from 'mqtt';
import defaults from './sensorDefaults.json';

const MQTT_RECEIVE_BROKER = 'ws://192.168.1.101:9001';
const MQTT_PUBLISH_BROKER = 'ws://192.168.1.101:9001';
const RECEIVE_TOPIC = 'sensors-NodeRed/raw';
const PUBLISH_TOPIC = 'OPO-SEC-Link1';
const STORAGE_KEY = 'mqttSensorData';
const API_URL = 'http://192.168.1.101:3001/api/sensor-values';

class MQTTService {
  constructor() {
    this.client = null; // for receiving
    this.publishClient = null; // for sending
    this.subscribers = new Set();
    this.sensorData = JSON.parse(JSON.stringify(defaults)); // Deep clone defaults
    this.initialize();
  }

  async initialize() {
    try {
      const serverData = await this.fetchServerData();
      if (serverData) this.mergeSensorData(serverData);

      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) this.mergeSensorData(JSON.parse(localData));

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
    // Incoming messages
    this.client = mqtt.connect(MQTT_RECEIVE_BROKER, {
      reconnectPeriod: 5000,
      connectTimeout: 3000
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker for receiving');
      this.client.subscribe(RECEIVE_TOPIC);
    });

    this.client.on('message', (topic, message) => {
      const data = this.parseMessage(message.toString());
      if (data) this.updateSensor(data);
    });

    // Outgoing messages
    this.publishClient = mqtt.connect(MQTT_PUBLISH_BROKER, {
      reconnectPeriod: 5000,
      connectTimeout: 3000
    });

    this.publishClient.on('connect', () => {
      console.log('📤 Connected to MQTT Broker for publishing');
    });
  }

  /**
   * ✅ Use this to send control messages (e.g., switch toggles)
   */
  publishToControlBroker(message) {
    if (this.publishClient && this.publishClient.connected) {
      this.publishClient.publish(PUBLISH_TOPIC, message, {}, err => {
        if (err) {
          console.error('❌ Error publishing:', err);
        } else {
          console.log(`📤 Published to ${PUBLISH_TOPIC}:`, message);
        }
      });
    } else {
      console.warn('⚠️ Publish client not connected. Message not sent:', message);
    }
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
      console.log('🔌 Disconnected from receive broker');
    }
    if (this.publishClient) {
      this.publishClient.end();
      console.log('🔌 Disconnected from publish broker');
    }
  }
}

export default new MQTTService();
