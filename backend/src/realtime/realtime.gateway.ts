import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { RealtimeService, TicketRealtimeGatewayLike, TicketRealtimePayload } from './realtime.service';

interface SocketJwtPayload {
  sub: string;
  username: string;
  role: string;
  cityId?: string;
  vendorId?: string;
  transportId?: string;
}

interface SocketAuthPayload {
  token?: string;
}

interface SocketData {
  userId?: string;
  role?: string;
}

interface ServerToClientEvents {
  'realtime.connected': (payload: { userId: string; role: string }) => void;
  'realtime.error': (payload: { message: string }) => void;
  'ticket.updated': (payload: TicketRealtimePayload) => void;
}

type RealtimeSocket = Socket<Record<string, never>, ServerToClientEvents, Record<string, never>, SocketData>;
type RealtimeServer = Server<Record<string, never>, ServerToClientEvents, Record<string, never>, SocketData>;

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, TicketRealtimeGatewayLike
{
  @WebSocketServer()
  server!: RealtimeServer;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly realtimeService: RealtimeService,
  ) {}

  afterInit() {
    this.realtimeService.setGateway(this);
    this.logger.log('Realtime gateway initialized');
  }

  async handleConnection(@ConnectedSocket() client: RealtimeSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('Missing realtime token');
      }

      const payload = await this.jwtService.verifyAsync<SocketJwtPayload>(token);
      const user = await this.usersService.findOne(payload.sub);

      client.data.userId = String(user._id);
      client.data.role = user.role;

      await client.join(`user:${String(user._id)}`);
      await client.join(`role:${user.role}`);

      const vendorId = this.normalizeRefId(user.vendorId);
      if (vendorId) {
        await client.join(`vendor:${String(vendorId)}`);
      }

      const transportId = this.normalizeRefId(user.transportId);
      if (transportId) {
        await client.join(`transport:${String(transportId)}`);
      }

      client.emit('realtime.connected', {
        userId: String(user._id),
        role: user.role,
      });
    } catch (error) {
      this.logger.warn(`Socket auth failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      client.emit('realtime.error', { message: 'Unauthorized realtime connection' });
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: RealtimeSocket) {
    this.logger.debug(`Realtime client disconnected: ${client.id}`);
  }

  emitTicketUpdate(payload: TicketRealtimePayload) {
    const ticket = payload.ticket;
    const targetedRooms = new Set<string>(['role:SUPERADMIN']);

    const userId = this.normalizeRefId(ticket.userId);
    const vendorId =
      this.normalizeRefId(ticket.vendorId) ||
      this.normalizeRefId(this.getNestedVendorRef(ticket.transportId));
    const transportId = this.normalizeRefId(ticket.transportId);

    if (userId) targetedRooms.add(`user:${String(userId)}`);
    if (vendorId) targetedRooms.add(`vendor:${String(vendorId)}`);
    if (transportId) targetedRooms.add(`transport:${String(transportId)}`);

    for (const room of targetedRooms) {
      this.server.to(room).emit('ticket.updated', payload);
    }
  }

  private extractToken(client: RealtimeSocket) {
    const authToken = (client.handshake.auth as SocketAuthPayload | undefined)?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const authorizationHeader = client.handshake.headers.authorization;
    if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
      return authorizationHeader.slice(7);
    }

    return null;
  }

  private normalizeRefId(value?: { _id?: string } | string) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value._id || '';
  }

  private getNestedVendorRef(value?: { vendorId?: { _id?: string } | string } | string) {
    if (!value || typeof value === 'string') return undefined;
    return value.vendorId;
  }
}
