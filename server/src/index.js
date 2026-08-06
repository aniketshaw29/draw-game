import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocket } from './socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// The HTTP server is shared by Express (static assets) and Socket.io (real-time).
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});
const PORT = process.env.PORT || 3001;

// In production, serve the built client bundle and SPA-fallback to index.html.
const dist = path.join(__dirname, '../../client/dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/socket.io')) return next();
  res.sendFile(path.join(dist, 'index.html'));
});

io.on('connection', (socket) => setupSocket(io, socket));

httpServer.listen(PORT, () => {
  console.log(`Draw Game server listening on http://localhost:${PORT}`);
});
