import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ALLOWED_ORIGINS } from '../common/constants/allowed-origins';

export const REALTIME_EVENTS = {
  TICKET_CREATED: 'ticket.created',
  TICKET_UPDATED: 'ticket.updated',
  MESSAGE_CREATED: 'message.created',
};

@WebSocketGateway({
  cors: {
    origin: ALLOWED_ORIGINS,
  },
})
export class RealtimeGateway implements OnGatewayInit {
  @WebSocketServer()
  private server: Server;

  afterInit(server: Server) {
    this.server = server;
  }

  emitTicketCreated(payload: any) {
    this.server?.emit(REALTIME_EVENTS.TICKET_CREATED, payload);
  }

  emitTicketUpdated(payload: any) {
    this.server?.emit(REALTIME_EVENTS.TICKET_UPDATED, payload);
  }

  emitMessageCreated(payload: any) {
    this.server?.emit(REALTIME_EVENTS.MESSAGE_CREATED, payload);
  }
}
