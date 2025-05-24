// services/sensor-values.js
import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const filePath = path.join(process.cwd(), 'services', 'sensorDefaults.json');

router.post('/', (req, res) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error saving sensor data:', err);
    res.status(500).json({ error: 'Save failed' });
  }
});

router.get('/', (req, res) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      res.status(200).json(JSON.parse(data));
    } else {
      res.status(404).json({ error: 'Defaults file not found' });
    }
  } catch (err) {
    console.error('❌ Error reading sensor data:', err);
    res.status(500).json({ error: 'Load failed' });
  }
});

export default router;
