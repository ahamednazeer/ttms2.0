'use client';

import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface TicketUpdatedEvent {
  ticketId: string;
  status: string;
  action: 'created' | 'assigned' | 'started' | 'completed' | 'updated' | 'deleted';
  ticket: unknown;
}

class RealtimeClient {
  private socket: Socket | null = null;

  connect() {
    if (typeof window === 'undefined') return null;

    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.disconnect();

    this.socket = io(`${API_URL}/realtime`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      withCredentials: true,
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const realtimeClient = new RealtimeClient();
