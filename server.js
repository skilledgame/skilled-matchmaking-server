const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let queue = [];

wss.on("connection", (ws) => {
  console.log("Player connected");

  ws.on("message", (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error("Invalid JSON:", message);
      return;
    }

    if (data.type === "JOIN_QUEUE") {
      if (!queue.includes(ws)) {
        queue.push(ws);
        console.log("Player joined queue, queue length:", queue.length);

        if (queue.length >= 2) {
          const player1 = queue.shift();
          const player2 = queue.shift();

          const matchId = `${player1._socket.remoteAddress}_${player2._socket.remoteAddress}_${Date.now()}`;

          player1.send(JSON.stringify({ type: "MATCH_FOUND", matchId, role: "white" }));
          player2.send(JSON.stringify({ type: "MATCH_FOUND", matchId, role: "black" }));

          console.log("Match created:", matchId);
        } else {
          ws.send(JSON.stringify({ type: "SEARCHING" }));
        }
      }
    }
  });

  ws.on("close", () => {
    queue = queue.filter((p) => p !== ws);
    console.log("Player disconnected, queue length:", queue.length);
  });
});

// Use dynamic port for hosting platforms like Railway
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Matchmaking server running on port ${PORT}`);
});
