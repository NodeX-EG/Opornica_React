const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'sensorData.json');

// Initialize with defaults if file doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  const defaults = {
    "11": { "name": "Dnevna soba", "temperature": 22.0, "humidity": 45, "pressure": 1013, "lastUpdate": "Nikad" },
    "15": { "name": "Spavaća soba", "temperature": 20.5, "humidity": 50, "pressure": 1012, "lastUpdate": "Nikad" },
    "25": { "name": "Kuhinja", "temperature": 23.5, "humidity": 40, "lastUpdate": "Nikad" },
    "12": { "name": "Sprat", "motion": false, "lastUpdate": "Nikad" },
    "26": { "name": "Prizemlje", "motion": false, "lastUpdate": "Nikad" }
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(defaults));
}

// Get current sensor values
app.get('/api/sensor-values', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
  } catch (error) {
    console.error('Error reading sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sensor values
app.post('/api/sensor-values', (req, res) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body));
    res.sendStatus(200);
  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});