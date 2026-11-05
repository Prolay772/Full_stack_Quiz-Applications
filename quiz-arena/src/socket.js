import { io } from "socket.io-client";
import { getToken } from "./api.js";

let socket;

export function getSocket() {
  if (!socket) {
    socket = io({ auth: (cb) => cb({ token: getToken() }), autoConnect: true });
  }
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
