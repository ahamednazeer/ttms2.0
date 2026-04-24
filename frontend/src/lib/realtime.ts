'use client';

import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TicketUpdatedEvent {
  ticketId: string;
  status: string;
  action: 'created' | 'assigned' | 'started' | 'completed' | 'updated';
  ticket: unknown;
}

class RealtimeClient {
  private socket: Socket | null = null;
  private activeToken: string | null = null;

  connect() {
    if (typeof window === 'undefined') return null;

    const token = window.localStorage.getItem('token');
    if (!token) {
      this.disconnect();
      return null;
    }

    if (this.socket && this.activeToken === token) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.disconnect();

    this.activeToken = token;
    this.socket = io(`${API_URL}/realtime`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: { token },
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeToken = null;
  }
}

export const realtimeClient = new RealtimeClient();
