const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const rooms = {};

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("joinRoom", (roomId) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      currentRoom = roomId;
      socket.emit("syncState", rooms[roomId]);
    } else {
      socket.emit("error", "Room not found");
    }
  });

  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substring(2, 10);
    rooms[roomId] = { host: socket.id, state: "paused", time: 0 };
    socket.join(roomId);
    currentRoom = roomId;
    socket.emit("roomCreated", roomId);
  });

  socket.on("play", () => {
    if (currentRoom && rooms[currentRoom].host === socket.id) {
      rooms[currentRoom].state = "playing";
      io.to(currentRoom).emit("play");
    }
  });

  socket.on("pause", () => {
    if (currentRoom && rooms[currentRoom].host === socket.id) {
      rooms[currentRoom].state = "paused";
      io.to(currentRoom).emit("pause");
    }
  });

  socket.on("updatePosition", (position) => {
    if (currentRoom) {
      rooms[currentRoom].time = position;
      io.to(currentRoom).emit("syncPosition", position);
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom) {
      socket.leave(currentRoom);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
