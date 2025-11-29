import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageWsService } from './message-ws.service';
import { Server, Socket } from 'socket.io';

import { NewMessageDto } from './dto/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true }) // socket
export class MessageWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wsS: Server;

  constructor(
    private readonly messageWsService: MessageWsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authentication as string;
    console.log(token);

    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(token);
      await this.messageWsService.registerClient(client, payload.id);
    } catch (error) {
      console.log(error);
      client.disconnect();
      return;
    }

    console.log({ payload });

    // console.log(`Cliente conectado: ${client.id}`);

    console.log(`Conectados: ${this.messageWsService.getConnectedClients()}`);

    // client.join('ventas');
    // client.join('ventas');
    // client.join(user.id);
    // client.join(user.email);
    // this.wsS.to('ventas').emit();

    this.wsS.emit(
      'clients-updated',
      this.messageWsService.getConnetedClientsId(),
    );
  }

  handleDisconnect(client: Socket) {
    // console.log(`Cliente desconectado ${client.id}`);
    this.messageWsService.removeClient(client.id);
    console.log(`Conectados: ${this.messageWsService.getConnectedClients()}`);

    this.wsS.emit(
      'clients-updated',
      this.messageWsService.getConnetedClientsId(),
    );
  }

  //message-from-client
  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto) {
    console.log(client.id, payload);

    // message-from-server Emite unicamente al cliente, no a todos
    // client.emit('message-from-server', {
    //   fullName: 'Soy yo!',
    //   message: payload.message || 'no message!!',
    // });

    // Emitir a todos Meno, al cliente inicial
    // client.broadcast.emit('message-from-server', {
    //   fullName: 'Soy yo!',
    //   message: payload.message || 'no message!!',
    // });

    // A todos incluyendo el cliente
    this.wsS.emit('message-from-server', {
      fullName: this.messageWsService.getUserFullName(client.id),
      message: payload.message || 'no message!!',
    });
  }
}
