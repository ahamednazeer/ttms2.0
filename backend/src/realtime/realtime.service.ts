import { Injectable } from '@nestjs/common';

interface RealtimeRef {
  _id?: string;
  vendorId?: RealtimeRef | string;
}

export interface RealtimeTicketSnapshot {
  _id: string;
  status: string;
  userId?: RealtimeRef | string;
  vendorId?: RealtimeRef | string;
  transportId?: RealtimeRef | string;
}

export interface TicketRealtimePayload {
  ticketId: string;
  status: string;
  action: 'created' | 'assigned' | 'started' | 'completed' | 'updated';
  ticket: RealtimeTicketSnapshot;
}

export interface TicketRealtimeGatewayLike {
  emitTicketUpdate(payload: TicketRealtimePayload): void;
}

@Injectable()
export class RealtimeService {
  private gateway: TicketRealtimeGatewayLike | null = null;

  setGateway(gateway: TicketRealtimeGatewayLike) {
    this.gateway = gateway;
  }

  emitTicketUpdate(payload: TicketRealtimePayload) {
    this.gateway?.emitTicketUpdate(payload);
  }
}
