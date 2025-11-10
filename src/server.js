import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const API_BASE_URL = process.env.API_URL;

if (!API_KEY) {
    console.error('ERROR: API_KEY not set in .env file');
    console.error('Get your API key at https://squadcalc.app/api-access');
    process.exit(1);
}

app.use(express.json());

app.use(express.static(path.join(__dirname, '../dist')));


// Proxy API requests
app.use('/api', async (req, res) => {
  try {
    const url = `${API_BASE_URL}${req.url}`;
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        ...(req.get('origin') ? { Origin: req.get('origin') } : {}),
        ...(req.get('referer') ? { Referer: req.get('referer') } : {})
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: 'Failed to reach API' });
  }
});

// SPA fallback
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`SquadCalc running on http://localhost:${PORT}`);
    console.log(`  -> Using API URL: ${API_BASE_URL}`);
    console.log(`  -> Using API KEY: ${API_KEY}`);
});