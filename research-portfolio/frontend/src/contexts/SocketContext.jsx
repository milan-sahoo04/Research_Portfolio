// src/contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  // ✅ FIX: useState instead of useRef so context consumers re-render
  //    when the socket instance is created / destroyed.
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const s = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ✅ Store instance in state — triggers re-render so consumers get
    //    the live socket object instead of the stale null ref.
    setSocket(s);

    s.on("connect", () => {
      setConnected(true);
      s.emit("register", user.id);
    });

    s.on("disconnect", () => setConnected(false));

    s.on("online_users", (users) => setOnlineUsers(users));

    return () => {
      s.disconnect();
      setConnected(false);
      setSocket(null);
    };
  }, [isAuthenticated, user?.id]);

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, connected, isOnline }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
