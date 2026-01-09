const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for testing; restrict in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("New player connected:", socket.id);

  socket.on("find_match", () => {
    console.log(`Player ${socket.id} is looking for a match...`);
    if (waitingPlayer === null) {
      waitingPlayer = socket;
      socket.emit("waiting", "Waiting for an opponent...");
    } else {
      // Pair them
      const player1 = waitingPlayer;
      const player2 = socket;
      waitingPlayer = null;

      const roomID = player1.id + "#" + player2.id;
      player1.join(roomID);
      player2.join(roomID);

      // Notify both players they've been matched
      player1.emit("match_found", { roomID, opponentID: player2.id });
      player2.emit("match_found", { roomID, opponentID: player1.id });

      console.log(`Match created: ${roomID} between ${player1.id} and ${player2.id}`);
    }
  });

  socket.on("make_move", (data) => {
    // data should contain { roomID, move }
    const { roomID, move } = data;
    socket.to(roomID).emit("opponent_move", move);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`Skilled matchmaking server running on port ${PORT}`);
});
