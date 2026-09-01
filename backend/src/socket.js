const { Server } = require("socket.io");

let io = null;

/**
 * Initializes Socket.io with the given HTTP server instance.
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on("connection", (socket) => {
    // Join a specific hackathon room for targeted updates
    socket.on("join:hackathon", (hackathonId) => {
      if (hackathonId) {
        socket.join(`hackathon_${hackathonId}`);
      }
    });

    // Leave a hackathon room
    socket.on("leave:hackathon", (hackathonId) => {
      if (hackathonId) {
        socket.leave(`hackathon_${hackathonId}`);
      }
    });
  });

  return io;
}

/**
 * Returns the active Socket.io instance.
 * @returns {import('socket.io').Server|null}
 */
function getIO() {
  return io;
}

/**
 * Emits a real-time event to clients listening in a specific hackathon room.
 * @param {string} hackathonId
 * @param {string} event
 * @param {object} payload
 */
function emitToHackathon(hackathonId, event, payload) {
  if (io && hackathonId) {
    io.to(`hackathon_${hackathonId}`).emit(event, payload);
    // Also emit globally for dashboards
    io.emit(event, { ...payload, hackathonId });
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToHackathon
};
