import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinHackathonRoom = useCallback((hackathonId) => {
    if (socketRef.current && hackathonId) {
      socketRef.current.emit("join:hackathon", hackathonId);
    }
  }, []);

  const leaveHackathonRoom = useCallback((hackathonId) => {
    if (socketRef.current && hackathonId) {
      socketRef.current.emit("leave:hackathon", hackathonId);
    }
  }, []);

  const subscribe = useCallback((eventName, handler) => {
    if (socketRef.current) {
      socketRef.current.on(eventName, handler);
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventName, handler);
        }
      };
    }
    return () => {};
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinHackathonRoom,
        leaveHackathonRoom,
        subscribe
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;
