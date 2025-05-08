import mqtt from 'mqtt';

const MQTT_BROKER = 'ws://192.168.1.101:9001';
const TOPIC = 'sensors-NodeRed/raw';
const STORAGE_KEY = 'mqttSensorData';

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = new Set();
    this.reconnectAttempts = 0;
    this.MAX_RECONNECT_ATTEMPTS = 5;

    // Initialize all sensors with default values
    const storedData = localStorage.getItem(STORAGE_KEY);
    const defaultData = {
      // Environment sensors
      11: { name: "Living Room", temperature: 0, humidity: 0, pressure: 0, lastUpdate: "Never" },
      15: { name: "Bedroom", temperature: 0, humidity: 0, pressure: 0, lastUpdate: "Never" },
      25: { name: "Kitchen", temperature: 0, humidity: 0, lastUpdate: "Never" },
      
      // Motion sensors
      26: { name: "Prizemlje", motion: false, lastUpdate: "Never" },
      12: { name: "Sprat", motion: false, lastUpdate: "Never" }
    };

    // Merge stored data with defaults
    this.sensorData = storedData ? { ...defaultData, ...JSON.parse(storedData) } : defaultData;
  }

  connect() {
    this.client = mqtt.connect(MQTT_BROKER, {
      reconnectPeriod: 5000,
      connectTimeout: 3000
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');
      this.reconnectAttempts = 0;
      this.client.subscribe(TOPIC, (err) => {
        if (err) console.error('Subscription error:', err);
      });
    });

    this.client.on('message', (topic, message) => {
      const data = this.parseMessage(message.toString());
      if (data) {
        this.sensorData[data.nodeId] = {
          ...this.sensorData[data.nodeId],
          ...data,
          lastUpdate: new Date().toLocaleTimeString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sensorData));
        this.notifySubscribers(this.sensorData);
      }
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
    });

    this.client.on('offline', () => {
      console.log('🔌 MQTT Offline');
    });

    this.client.on('reconnect', () => {
      this.reconnectAttempts++;
      console.log(`Attempting reconnect (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
      if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
      }
    });
  }

  parseMessage(rawMessage) {
    console.log("Raw message:", rawMessage);
    const parts = rawMessage.split(';');
    if (parts.length < 6) return null;

    const nodeId = parseInt(parts[0]);
    const childId = parseInt(parts[1]);
    const payload = parts[5];

    // Handle motion sensors (nodes 12 and 26)
    if (nodeId === 12 || nodeId === 26) {
      return {
        nodeId,
        motion: payload === '1',
        lastUpdate: new Date().toLocaleTimeString()
      };
    }

    // Handle environment sensors
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

  notifySubscribers(data) {
    this.subscribers.forEach(callback => callback({ sensorData: data }));
  }

  getInitialData() {
    return this.sensorData;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🔌 Disconnected from MQTT broker');
    }
  }
}

export default new MQTTService();