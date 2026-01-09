const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

let waitingPlayer = null;

wss.on('connection', (ws) => {
  console.log('Player connected');

  ws.on('message', (message) => {
    console.log('Received:', message);

    if (message === 'find_match') {
      if (waitingPlayer === null) {
        waitingPlayer = ws;
        ws.send('waiting_for_opponent');
      } else if (waitingPlayer !== ws) {
        waitingPlayer.send('match_found');
        ws.send('match_found');
        waitingPlayer = null;
      }
    }
  });

  ws.on('close', () => {
    if (waitingPlayer === ws) {
      waitingPlayer = null;
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Matchmaking server listening on port ${PORT}`);
});
