import mqtt from 'mqtt';

const MQTT_BROKER = 'ws://192.168.1.101:9001';
const TOPIC = 'sensors-NodeRed/raw';
const STORAGE_KEY = 'mqttSensorData';

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = new Set();
    
    // Initialize with renamed sensors
    const storedData = localStorage.getItem(STORAGE_KEY);
    this.sensorData = storedData ? JSON.parse(storedData) : {
      11: { name: "Dnevna soba", temperature: 0, humidity: 0, pressure: 0, lastUpdate: "Nikad" },
      15: { name: "Spavaća soba", temperature: 0, humidity: 0, pressure: 0, lastUpdate: "Nikad" },
      25: { name: "Kuhinja", temperature: 0, humidity: 0, lastUpdate: "Nikad" },
      12: { name: "Sprat", motion: false, lastUpdate: "Nikad" },  // Changed from "Front Door"
      26: { name: "Prizemlje", motion: false, lastUpdate: "Nikad" }  // Changed from "Back Door"
    };
  }

  connect() {
    this.client = mqtt.connect(MQTT_BROKER, {
      reconnectPeriod: 5000,
      connectTimeout: 3000
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');
      this.client.subscribe(TOPIC, (err) => {
        if (err) console.error('Subscription error:', err);
        else console.log(`Subscribed to ${TOPIC}`);
      });
    });

    this.client.on('message', (topic, message) => {
      console.log('📡 Received:', message.toString());
      const data = this.parseMessage(message.toString());
      if (data) {
        const now = new Date().toLocaleTimeString();
        this.sensorData[data.nodeId] = {
          ...this.sensorData[data.nodeId],
          ...data,
          lastUpdate: now
        };
        console.log('🔄 Updated:', data.nodeId, this.sensorData[data.nodeId]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sensorData));
        this.notifySubscribers();
      }
    });

    this.client.on('error', (err) => console.error('MQTT Error:', err));
  }

  parseMessage(rawMessage) {
    const parts = rawMessage.split(';');
    if (parts.length < 6) return null;

    const nodeId = parseInt(parts[0]);
    const childId = parseInt(parts[1]);
    const payload = parts[5];

    // Motion sensors (nodes 12 and 26)
    if (nodeId === 12 || nodeId === 26) {
      return {
        nodeId,
        motion: payload === '1',
        lastUpdate: new Date().toLocaleTimeString()
      };
    }

    // Environment sensors
    if ([0, 1, 2].includes(childId)) {
      const value = parseFloat(payload);
      if (isNaN(value)) return null;

      const data = { nodeId };
      if (childId === 0) data.temperature = value;
      else if (childId === 1) data.pressure = value;
      else if (childId === 2) data.humidity = value;

      return data;
    }

    return null;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback({ sensorData: this.sensorData });
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    console.log('🔔 Notifying', this.subscribers.size, 'subscribers');
    this.subscribers.forEach(callback => callback({ sensorData: this.sensorData }));
  }

  getInitialData() {
    return this.sensorData;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🔌 Disconnected from MQTT');
    }
  }
}

export default new MQTTService();