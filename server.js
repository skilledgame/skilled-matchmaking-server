const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

console.log("Starting Skilled matchmaking server...");

// Simple health check endpoint
app.get('/', (req, res) => {
  res.send('Skilled Matchmaking Server is running');
});

// Basic matchmaking queue
let waitingPlayer = null;

wss.on('connection', (ws) => {
  console.log('New player connected');

  ws.on('message', (message) => {
    console.log('Received:', message);

    if (message === 'find_match') {
      if (waitingPlayer === null) {
        waitingPlayer = ws;
        ws.send('waiting_for_opponent');
      } else {
        // Match found
        waitingPlayer.send('match_found');
        ws.send('match_found');
        waitingPlayer = null;
      }
    }
  });

  ws.on('close', () => {
    console.log('Player disconnected');
    if (waitingPlayer === ws) {
      waitingPlayer = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Matchmaking server running on port ${PORT}`);
});
