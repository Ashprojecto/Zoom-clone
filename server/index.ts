import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // adjust for production
    methods: ["GET", "POST"],
  },
});

interface RoomPeers {
  [roomId: string]: string[]; // socket IDs
}

const rooms: RoomPeers = {};

let roomMembers:RoomPeers = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    if (!roomMembers[roomId]) roomMembers[roomId] = [];
    roomMembers[roomId].push(socket.id);

    if (roomMembers[roomId].length === 2) {
      // Notify both that they're ready
      roomMembers[roomId].forEach((id) =>
        io.to(id).emit("ready-for-call")
      );
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in roomMembers) {
      roomMembers[roomId] = roomMembers[roomId].filter((id) => id !== socket.id);
      if (roomMembers[roomId].length === 0) {
        delete roomMembers[roomId];
      }
    }
  });
});


const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
