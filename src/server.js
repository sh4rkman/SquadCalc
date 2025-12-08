import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';
import httpProxy from 'http-proxy';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
const API_BASE_URL = process.env.API_URL;

if (!API_KEY) {
    console.error('ERROR: API_KEY not set in .env file');
    console.error('Get your API key at https://discord.com/invite/BNPAc5kEJP');
    process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// --- HTTP API Proxy ---
app.use('/api', async (req, res) => {
    const url = `${API_BASE_URL}${req.url}`;
    try {
        const body = req.method !== 'GET' ? JSON.stringify(req.body) : undefined;

        const response = await fetch(url, {
            method: req.method,
            headers: {
                ...req.headers,
                'Content-Length': body ? Buffer.byteLength(body) : 0,
                'X-API-Key': API_KEY,
                'X-Forwarded-For': req.headers['x-forwarded-for'] || req.ip,
            },
            body
        });

        console.log(`API Proxy: ${req.method} ${url} -> ${response.status}`);

        const contentType = response.headers.get("content-type") || "";

        // Forward all headers except compression/length
        response.headers.forEach((value, key) => {
            if (!['content-encoding', 'content-length'].includes(key)) {
                res.setHeader(key, value);
            }
        });

        res.status(response.status);

        if (contentType.includes("application/json")) {
            const text = await response.text();
            res.send(text);
        } else {
            const buffer = Buffer.from(await response.arrayBuffer());
            res.send(buffer);
        }

    } catch (error) {
        console.error('API proxy error:', error);
        console.error(`API Proxy: ${req.method} ${url}`);
        res.status(500).json({ error: 'Failed to reach API' });
    }
});

// --- SPA fallback ---
app.use((_, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// --- Create HTTP server wrapping Express ---
const server = http.createServer(app);

// --- WebSocket Proxy ---
const wsProxy = httpProxy.createProxyServer({
    target: API_BASE_URL,
    changeOrigin: true,
    ws: true
});

// Forward headers on WS connect
wsProxy.on("proxyReqWs", (proxyReq, req, socket, options, head) => {
    proxyReq.setHeader("X-API-Key", API_KEY);
    proxyReq.setHeader("X-Forwarded-For", req.headers['x-forwarded-for'] || req.socket.remoteAddress);
});

// Upgrade WS connections
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/api')) {
        wsProxy.ws(req, socket, head);
    } else {
        socket.destroy();
    }
});

// --- Start server ---
server.listen(PORT, () => {
    console.log("============================================")
    console.log("            STARTING SQUADCALC              ")
    console.log("============================================")
    console.log(`running on http://localhost:${PORT}`);
    console.log(`  -> Using API URL: ${API_BASE_URL}`);
    console.log(`  -> Using API KEY: ${API_KEY}`);
});