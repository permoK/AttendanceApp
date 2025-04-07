import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import https from 'https';
import fs from 'fs';
import os from 'os';
import { setupAuth } from './auth';
import { registerRoutes } from './routes';
import { setupVite } from './vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define interface for network interface
interface NetworkInterface {
  address: string;
  family: string;
  internal: boolean;
}

async function createServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  
  // Load SSL certificates
  const certPath = resolve(__dirname, 'certs/cert.pem');
  const keyPath = resolve(__dirname, 'certs/key.pem');
  
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  // Set up Content Security Policy
  app.use((req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob:; " +
      "media-src 'self' blob:; " +
      "connect-src 'self' ws: wss:; " +
      "frame-ancestors 'none';"
    );
    next();
  });

  // Set up CORS for local network access
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
  });
  
  app.use(express.json()); // 👈 this is critical

  // Set up routes and middleware
  setupAuth(app);
  const server = await registerRoutes(app);

  if (!isProd) {
    await setupVite(app, server);
  } else {
    // Serve static files in production
    app.use(express.static(resolve(__dirname, '../client/dist')));
  }

  // Create HTTPS server
  const httpsServer = https.createServer(httpsOptions, app);
  
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  httpsServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running at https://localhost:${port}`);
    
    // Get local IP address
    const networkInterfaces = os.networkInterfaces();
    const localIp = Object.values(networkInterfaces)
      .flat()
      .find(iface => iface && iface.family === 'IPv4' && !iface.internal)?.address;
    
    console.log(`Local network access: https://${localIp || 'your-local-ip'}:${port}`);
  });
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
