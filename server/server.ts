/*
  Юзаем экспресс, потому что так проще :)
 */
import {CanvasDrawElement, Message, MessageType} from "./types";

const express = require('express');
const WS = require('ws');
const WebSocketServer = WS.Server;

const port = 8081;
const server = express().listen(port, () => {
  console.log(`Сервер слушает ${port} порт`)
});

/*
  Библиотека ws позволяет принимать в конструкторе сервера другой http.Server.
  Удобно! Используем!
 */
const wss = new WebSocketServer( { server: server });

/*
  Хранилище для состояния "Холста"
 */
const canvasElementsState: CanvasDrawElement[] = [];

wss.on('connection', (clientInitConnection) => {
  // ws - экземпляр соединения по WS конкретного клиента

  console.log('[WS] Клиент коннектнулся');

  const initMessage: Message = {
    type: MessageType.Init,
    data: canvasElementsState
  };

  clientInitConnection.send(JSON.stringify(initMessage));

  clientInitConnection.on('close', () => {
    console.log('[WS] Клиент нас покинул :( ');
  });

  clientInitConnection.on('message', (inputMessage: CanvasDrawElement) => {
    canvasElementsState.push(inputMessage);

    wss.clients.forEach((clientConnection: WebSocket) => {
      if (clientConnection !== clientInitConnection && clientConnection.readyState === WS.OPEN) {
        const outputMessage: Message = {
          type: MessageType.Update,
          data: inputMessage,
        }
        clientConnection.send(JSON.stringify(outputMessage));
      }
    });
  })
})

