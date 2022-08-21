import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { onlineMap } from './online-map';

@WebSocketGateway({
  /**
   * namespace: websocket 관리 단위
   * 현 프로젝트하에서는 workspace와 같은 레벨의 단위
   * workspace의 이름을 미리 알 수 없기 때문에 정규표현식으로 설정
   */
  namespace: /\/ws-.+/,
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  logger = new Logger('WebSocket Gateway');

  @WebSocketServer() public server: Server;

  /**
   * 이벤트 리스닝(구독)
   * socket.on('login') 과 동일
   * @param data : socket 데이터 의존성 주입
   * @param socket
   */
  @SubscribeMessage('login')
  handleMessage(
    @MessageBody() data: { id: number; channels: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    const newNamespace = socket.nsp;
    this.logger.log('login', newNamespace);

    onlineMap[socket.nsp.name][socket.id] = data.id;
    newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));

    data.channels.forEach((channel) => {
      socket.join(`${socket.nsp.name}-${channel}`);
    });
  }

  afterInit(server: Server): any {
    this.logger.log('websocket server init...');
  }

  /**
   * connection 이벤트 핸들링
   * 내부는 socket.io와 동일하게 작성 가능
   * @param socket
   */
  handleConnection(@ConnectedSocket() socket: Socket): any {
    if (!onlineMap[socket.nsp.name]) {
      onlineMap[socket.nsp.name] = {};
    }
    socket.emit('hello', socket.nsp.name);
  }

  /**
   * disconnected 이벤트 핸들링
   * 내부는 socket.io와 동일하게 작성 가능
   * @param socket
   */
  handleDisconnect(@ConnectedSocket() socket: Socket): any {
    this.logger.log('disconnected, ', socket.nsp.name);
    const newNameSpace = socket.nsp;
    delete onlineMap[socket.nsp.name][socket.id];
    newNameSpace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
  }
}
