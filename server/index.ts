import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import http from 'http';
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
  const httpServer = await registerRoutes(app);

  if (!isProd) {
    await setupVite(app, httpServer);
  } else {
    // Serve static files in production
    app.use(express.static(resolve(__dirname, '../client/dist')));
  }

  // Create HTTP server
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3005;
  const server = http.createServer(app);
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    
    // Get local IP address
    const networkInterfaces = os.networkInterfaces();
    const localIp = Object.values(networkInterfaces)
      .flat()
      .find(iface => iface && iface.family === 'IPv4' && !iface.internal)?.address;
    
    console.log(`Local network access: http://${localIp || 'your-local-ip'}:${port}`);
  });
  
  return server;
}

createServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
