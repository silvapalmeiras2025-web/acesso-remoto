import { io, Socket } from "socket.io-client";

class SignalingService {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io();
    }
    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const signalingService = new SignalingService();
